"""Centralized filename and path sanitization module."""

import re

import emoji
import unidecode

import log
import platform_utils


def _replace_text(text: str, replace_words: dict) -> str:
    """Replace words in text based on replace_words configuration.

    Args:
        text: Text to process
        replace_words: Dictionary mapping patterns to replacements
            Format: {"pattern": ["replacement", "system"]}
            system can be "regex", "word", or "any" (default: "word")

    Returns:
        Text with replacements applied
    """
    result = text
    for pattern, replacement_config in replace_words.items():
        # Normalize to list format
        if isinstance(replacement_config, str):
            replacement_config = [replacement_config]

        replacement = replacement_config[0]
        system = replacement_config[1] if len(replacement_config) > 1 else "word"

        # Apply replacement using structural pattern matching
        match system:
            case "regex":
                new_result = re.sub(pattern, replacement, result)
            case "word":
                escaped_pattern = re.escape(pattern)
                new_result = re.sub(
                    rf"([\s_-])({escaped_pattern})([\s_-])",
                    f"\\1{replacement}\\3",
                    result,
                )
            case "any":
                new_result = result.replace(pattern, replacement)
            case _:
                # Default to word matching
                escaped_pattern = re.escape(pattern)
                new_result = re.sub(
                    rf"([\s_-])({escaped_pattern})([\s_-])",
                    f"\\1{replacement}\\3",
                    result,
                )

        # Log if change occurred
        if new_result != result:
            pattern_display = "Regex" if system == "regex" else f"'{pattern}'"
            log.log_debug(f"{pattern_display} matched: {result} -> {new_result}")

        result = new_result
    return result


def remove_consecutive_nonword(text: str) -> str:
    """Remove consecutive non-word characters by collapsing them to a single occurrence.

    Args:
        text: Text to process

    Returns:
        Text with consecutive non-word characters reduced to single occurrence
    """
    for _ in range(0, 10):
        m = re.findall(r"(\W+)\1+", text)
        if m:
            text = re.sub(r"(\W+)\1+", r"\1", text)
        else:
            break
    return text


def _sanitize_illegal_chars(text: str, illegal_chars: str = '\\/:"*?<>|') -> str:
    """Remove illegal characters for filenames/paths.

    Args:
        text: Text to sanitize
        illegal_chars: String containing illegal characters to remove (default: Windows characters)

    Returns:
        Text with illegal characters removed
    """
    if not illegal_chars:
        return text
    # Use re.escape for the character class pattern
    escaped_chars = re.escape(illegal_chars)
    return re.sub(f"[{escaped_chars}]+", "", text)


def _sanitize_control_chars(text: str) -> str:
    """Remove ASCII control characters (0-31) from text.

    Args:
        text: Text to sanitize

    Returns:
        Text with control characters removed
    """
    # Remove ASCII control characters (0x00-0x1F)
    # These are not valid in filenames on any platform
    return "".join(char for char in text if ord(char) >= 32)


def _sanitize_ending_chars(
    text: str, remove_period: bool = False, remove_space: bool = False
) -> str:
    """Remove trailing periods and/or spaces from text (Windows requirement).

    Args:
        text: Text to sanitize
        remove_period: If True, remove trailing periods
        remove_space: If True, remove trailing spaces

    Returns:
        Text with trailing characters removed
    """
    if not remove_period and not remove_space:
        return text

    # Remove trailing periods and spaces
    while text:
        if remove_period and text.endswith(".") or remove_space and text.endswith(" "):
            text = text[:-1]
        else:
            break
    return text


def _sanitize_reserved_names(
    name: str,
    target_platform: platform_utils.Platform | None = None,
    reserved_names: list[str] | None = None,
) -> str:
    """Sanitize reserved names (Windows device names, special entries like . and ..).

    Args:
        name: Filename or path component name to sanitize
        target_platform: Platform to target ("windows", "linux", "macos", "freebsd", or None)
        reserved_names: Optional list of reserved names to check (Windows device names)

    Returns:
        Name with reserved names sanitized (prefixed with underscore)
    """
    if not name:
        return name

    # Handle special entries (. and ..) for all platforms
    match name:
        case ".":
            return "_."
        case "..":
            return "_.."
        case _:
            pass

    # Handle Windows reserved device names
    if target_platform == "windows" and reserved_names:
        # Check if the name (without extension) matches a reserved name
        name_without_ext = name.rsplit(".", 1)[0].upper()
        if name_without_ext in reserved_names:
            # Prefix with underscore to make it valid
            if "." in name:
                # Has extension
                ext = name.rsplit(".", 1)[1]
                return f"_{name.rsplit('.', 1)[0]}.{ext}"
            else:
                # No extension
                return f"_{name}"

    return name


def _sanitize_custom_chars(text: str, remove_chars: str) -> str:
    """Remove custom characters from text.

    Args:
        text: Text to sanitize
        remove_chars: String of characters to remove

    Returns:
        Text with specified characters removed
    """
    if not remove_chars:
        return text
    # Escape special regex characters in the character class
    escaped_chars = re.escape(remove_chars)
    return re.sub(f"[{escaped_chars}]+", "", text)


def _capitalize_words(s: str) -> str:
    r"""Converts a filename to title case.

    Capitalizes all words except for certain conjunctions, prepositions, and articles,
    unless they are the first or last word of a segment of the filename. Recognizes
    standard apostrophes, right single quotation marks (U+2019), and left single quotation
    marks (U+2018) within words.

    Ignores all caps words and abbreviations, e.g., MILF, BBW, VR, PAWGs.
    Ignores words with mixed case, e.g., LaSirena69, VRCosplayX, xHamster.
    Ignores resolutions, e.g., 1080p, 4k.

    Args:
        s (str): The string to capitalize.

    Returns:
        str: The capitalized string.

    Raises:
        ValueError: If the input is not a string.

    About the regex:
        The first \b marks the starting word boundary.
        [A-Z]? allows for an optional initial uppercase letter.
        [a-z\'\u2019\u2018]+ matches one or more lowercase letters, apostrophes, right single quotation marks, or left single quotation marks.
            If a word contains multiple uppercase letters, it does not match.
        The final \b marks the ending word boundary, ensuring the expression matches whole words.
    """
    if not isinstance(s, str):
        raise ValueError("Input must be a string.")

    # Function to capitalize words based on their position and value.
    def process_word(match: re.Match[str]) -> str:
        word = match.group(0)
        preceding_char, following_char = None, None

        # List of words to avoid capitalizing if found between other words.
        exceptions = {"and", "of", "the"}

        # Find the nearest non-space character before the current word
        if match.start() > 0:
            for i in range(match.start() - 1, -1, -1):
                if not match.string[i].isspace():
                    preceding_char = match.string[i]
                    break

        # Find the nearest non-space character after the current word
        if match.end() < len(s):
            for i in range(match.end(), len(s)):
                if not match.string[i].isspace():
                    following_char = match.string[i]
                    break

        # Determine capitalization based on the position and the exception rules
        if (
            match.start() == 0
            or match.end() == len(s)
            or word.lower() not in exceptions
            or (preceding_char and not preceding_char.isalnum())
            or (following_char and not following_char.isalnum())
        ):
            return word.capitalize()
        else:
            return word.lower()

    # Apply the regex pattern and the process_word function.
    return re.sub(r"\b[A-Z]?[a-z\'\u2019\u2018]+\b", process_word, s)


def _apply_unicode_conversion(text: str, use_ascii: bool) -> str:
    """Apply Unicode to ASCII conversion if enabled.

    Args:
        text: Text to convert
        use_ascii: Whether to use unidecode conversion

    Returns:
        Converted text
    """
    if use_ascii:
        result: str = unidecode.unidecode(text, errors="preserve")
        return result
    else:
        return text


def _replace_emojis_with_codes(
    text: str, language: str = "en", emoji_delimiter: str | None = None
) -> str:
    """Replace emojis with their code representations.

    Args:
        text: Text containing emojis
        language: Two-letter language code (e.g., "en", "de", "ja")
            Note: CONFIG.emoji_language is normalized and validated in initialize_emoji_language(),
            so this will always be a valid two-letter code.
        emoji_delimiter: Delimiter for emoji codes. If None, uses default colons.
            For example, with emoji_delimiter="_", :smile: becomes _smile_.
            Useful on Windows where colons are invalid path characters.

    Returns:
        Text with emojis replaced by their codes
    """
    # Use custom delimiter if specified
    if emoji_delimiter is not None:
        result_with_delim: str = emoji.demojize(
            text, delimiters=(emoji_delimiter, emoji_delimiter), language=language
        )
        return result_with_delim

    result_default: str = emoji.demojize(text, language=language)
    return result_default


def sanitize_filename(
    text: str,
    replace_words: dict | None = None,
    use_ascii: bool = False,
    lowercase: bool = False,
    titlecase: bool = False,
    replace_emoji: bool = False,
    emoji_language: str = "en",
    emoji_delimiter: str | None = None,
    skip_consecutive_nonword: bool = False,
    illegal_chars: str = '\\/:"*?<>|',
    target_platform: platform_utils.Platform | None = None,
    reserved_names: list[str] | None = None,
) -> str:
    """Sanitize a filename by applying all necessary transformations.

    Args:
        text: Filename text to sanitize
        replace_words: Dictionary of word replacements
        use_ascii: Whether to use unidecode conversion
        lowercase: Whether to convert to lowercase
        titlecase: Whether to convert to title case
        replace_emoji: Whether to replace emojis with codes
        emoji_language: Language code for emoji replacement
        emoji_delimiter: Delimiter for emoji codes
        skip_consecutive_nonword: If True, skip remove_consecutive_nonword step (useful when already called separately)
        illegal_chars: String containing illegal characters to remove (default: Windows characters)
        target_platform: Platform to target ("windows", "linux", "macos", "freebsd", or None)
        reserved_names: Optional list of reserved names to check (Windows device names)

    Returns:
        Sanitized filename text
    """
    # Step 1: Replace words if configured
    if replace_words:
        text = _replace_text(text, replace_words)

    # Step 2: Replace emojis (after word replacement, before cleanup)
    if replace_emoji:
        text = _replace_emojis_with_codes(text, emoji_language, emoji_delimiter)

    # Step 3: Remove consecutive non-word characters
    if not skip_consecutive_nonword:
        text = remove_consecutive_nonword(text)

    # Step 4: Remove illegal characters
    text = _sanitize_illegal_chars(text, illegal_chars)

    # Step 5: Remove ASCII control characters (Windows requirement, but safe for all platforms)
    text = _sanitize_control_chars(text)

    # Step 6: Apply Unicode conversion or apostrophe normalization
    text = _apply_unicode_conversion(text, use_ascii)

    # Step 7: Apply case transformations
    if lowercase:
        text = text.lower()
    elif titlecase:
        text = _capitalize_words(text)

    # Step 8: Handle reserved names (Windows device names, . and ..)
    text = _sanitize_reserved_names(text, target_platform, reserved_names)

    # Step 9: Remove trailing periods and spaces (Windows requirement)
    if target_platform == "windows":
        text = _sanitize_ending_chars(text, remove_period=True, remove_space=True)

    return text


def sanitize_path_part(
    text: str,
    replace_words: dict | None = None,
    use_ascii: bool = False,
    replace_emoji: bool = False,
    emoji_language: str = "en",
    emoji_delimiter: str | None = None,
    illegal_chars: str = '\\/:"*?<>|',
    target_platform: platform_utils.Platform | None = None,
    reserved_names: list[str] | None = None,
) -> str:
    """Sanitize a single path component.

    Args:
        text: Path component text to sanitize
        replace_words: Dictionary of word replacements (allows replacing illegal chars before removal)
        use_ascii: Whether to use unidecode conversion
        replace_emoji: Whether to replace emojis with codes
        emoji_language: Language code for emoji replacement
        emoji_delimiter: Delimiter for emoji codes
        illegal_chars: String containing illegal characters to remove (default: Windows characters)
        target_platform: Platform to target ("windows", "linux", "macos", "freebsd", or None)
        reserved_names: Optional list of reserved names to check (Windows device names)

    Returns:
        Sanitized path component
    """
    # Replace words if configured (allows replacing illegal chars before removal)
    if replace_words:
        text = _replace_text(text, replace_words)
    # Replace emojis if enabled
    if replace_emoji:
        text = _replace_emojis_with_codes(text, emoji_language, emoji_delimiter)
    # Remove illegal characters
    text = _sanitize_illegal_chars(text, illegal_chars)
    # Remove ASCII control characters (Windows requirement, but safe for all platforms)
    text = _sanitize_control_chars(text)
    # Apply Unicode conversion if enabled
    text = _apply_unicode_conversion(text, use_ascii)
    # Handle reserved names (Windows device names, . and ..)
    text = _sanitize_reserved_names(text, target_platform, reserved_names)
    # Remove trailing periods and spaces (Windows requirement)
    if target_platform == "windows":
        text = _sanitize_ending_chars(text, remove_period=True, remove_space=True)

    return text
