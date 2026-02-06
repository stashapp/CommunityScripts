"""
Text sanitization utilities for Plex API compatibility.

Provides functions to clean and normalize text fields before sending to Plex,
ensuring control characters, smart quotes, and excessive whitespace don't cause
API errors or display issues.
"""

import unicodedata
from typing import Optional
import logging

from validation.limits import MAX_TITLE_LENGTH


# Mapping for smart quote conversion to ASCII equivalents
# Unicode left/right double quotes -> straight double quote
# Unicode left/right single quotes -> straight apostrophe
# En/em dashes -> hyphen-minus
# Ellipsis -> three dots
QUOTE_MAP = str.maketrans({
    '\u201c': '"',  # Left double quotation mark
    '\u201d': '"',  # Right double quotation mark
    '\u2018': "'",  # Left single quotation mark
    '\u2019': "'",  # Right single quotation mark
    '\u2013': '-',  # En dash
    '\u2014': '-',  # Em dash
    '\u2026': '...',  # Horizontal ellipsis
})


def strip_emojis(text: str) -> str:
    """
    Remove emoji characters from text.

    Removes Unicode characters in the 'So' (Symbol, Other) category,
    which includes most emoji characters. This can help prevent potential
    display or encoding issues in Plex.

    Args:
        text: The text to process

    Returns:
        Text with emoji characters removed

    Example:
        >>> strip_emojis("Hello World")
        'Hello World'
        >>> strip_emojis("Test")
        'Test'
    """
    if not text:
        return ''

    # Remove characters in the 'So' (Symbol, Other) category
    # This category contains most emoji characters
    return ''.join(
        char for char in text
        if unicodedata.category(char) != 'So'
    )


def sanitize_for_plex(
    text: str,
    max_length: int = MAX_TITLE_LENGTH,
    logger: Optional[logging.Logger] = None,
    strip_emoji: bool = False
) -> str:
    """
    Sanitize text for safe use with Plex API.

    Performs the following transformations:
    1. Returns empty string if text is None or empty
    2. Normalizes Unicode to NFC form
    3. Removes control characters (Cc) and format characters (Cf)
    4. Optionally removes emoji characters (if strip_emoji=True)
    5. Converts smart quotes and dashes to ASCII equivalents
    6. Collapses multiple whitespace to single spaces
    7. Truncates at max_length, preferring word boundaries

    Args:
        text: The text to sanitize
        max_length: Maximum length (0 = no limit). Default 255.
        logger: Optional logger for debug output
        strip_emoji: If True, remove emoji characters. Default False.

    Returns:
        Sanitized text string
    """
    # Handle None or empty
    if not text:
        return ''

    original = text

    # Normalize Unicode to NFC (composed form)
    text = unicodedata.normalize('NFC', text)

    # Remove control characters (Cc) and format characters (Cf)
    # These include null bytes, escape sequences, zero-width chars, etc.
    text = ''.join(
        char for char in text
        if unicodedata.category(char) not in ('Cc', 'Cf')
    )

    # Optionally remove emoji characters (Symbol, Other category)
    if strip_emoji:
        text = strip_emojis(text)

    # Convert smart quotes and dashes to ASCII equivalents
    text = text.translate(QUOTE_MAP)

    # Collapse whitespace (split on any whitespace, rejoin with single space)
    text = ' '.join(text.split())

    # Truncate if needed, preferring word boundary
    if max_length > 0 and len(text) > max_length:
        # Find last space within limit
        truncated = text[:max_length]
        last_space = truncated.rfind(' ')

        # Only use word boundary if it's reasonably close to max_length (>80%)
        if last_space > max_length * 0.8:
            text = truncated[:last_space]
        else:
            text = truncated

    if logger and text != original:
        logger.debug(f"Sanitized text: {len(original)} -> {len(text)} chars")

    return text
