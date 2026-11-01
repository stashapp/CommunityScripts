"""Tag/marker whitelist-blacklist filtering helpers."""



def parse_tag_filter(value, prefix="AI: "):
    """Normalise a marker whitelist/blacklist -> sorted lower-case tag list.

    Entries are separated by commas or semicolons; whitespace is never a
    separator because tag names such as ``cowgirl position`` contain spaces. A
    leading ``prefix`` (the plugin's ``tag_prefix``) is stripped, so both
    ``AI: cowgirl position`` and ``cowgirl position`` work. The result is a
    JSON-serialisable list (it is echoed into the debug report's settings).
    """
    if isinstance(value, (list, tuple)):
        raw = [str(item) for item in value]
    else:
        raw = str(value or "").replace(";", ",").split(",")

    names = []
    for item in raw:
        name = str(item).strip()
        if prefix and name.lower().startswith(prefix.lower()):
            name = name[len(prefix):]
        name = name.strip().lower()
        if name and name not in names:
            names.append(name)
    return sorted(names)


def filter_marker_tags(tags, allow=None, deny=None):
    """Apply the marker whitelist/blacklist to a ``[(name, score)]`` list.

    ``allow`` (whitelist) restricts markers to the listed tags when it is not
    empty; ``deny`` (blacklist) always wins. Names are matched
    case-insensitively. Without any filter the list is returned unchanged.
    """
    if not allow and not deny:
        return list(tags)

    allowed = {str(name).lower() for name in (allow or [])}
    denied = {str(name).lower() for name in (deny or [])}

    kept = []
    for name, score in tags:
        lowered = str(name).lower()
        if lowered in denied:
            continue
        if allowed and lowered not in allowed:
            continue
        kept.append((name, score))
    return kept


def filter_tags(tags, allow=None, deny=None):
    """Apply the scene/image tag whitelist/blacklist to a ``[(name, score)]``.

    Unlike the marker filters this decides which tags are written to the item
    itself; the rules are otherwise identical (blacklist wins, case-insensitive
    names, an empty list means no filtering).
    """
    return filter_marker_tags(tags, allow, deny)
