"""
Plex API field length limits.

Conservative defaults based on practical testing and common usage patterns.
Plex does not officially document these limits, so we use safe values that
work reliably without causing UI issues or API errors.
"""

# Text field limits (characters)
MAX_TITLE_LENGTH = 255          # Scene/movie title
MAX_STUDIO_LENGTH = 255         # Studio name
MAX_SUMMARY_LENGTH = 10000      # Description/details
MAX_TAGLINE_LENGTH = 255        # Short tagline
MAX_PERFORMER_NAME_LENGTH = 255  # Individual performer name
MAX_TAG_NAME_LENGTH = 255       # Individual tag name

# List field limits (count)
MAX_PERFORMERS = 50             # Maximum performers per item
MAX_TAGS = 50                   # Maximum tags per item
MAX_COLLECTIONS = 20            # Maximum collections per item

# Convenience dict for programmatic access
PLEX_LIMITS = {
    'title': MAX_TITLE_LENGTH,
    'studio': MAX_STUDIO_LENGTH,
    'summary': MAX_SUMMARY_LENGTH,
    'tagline': MAX_TAGLINE_LENGTH,
    'performer_name': MAX_PERFORMER_NAME_LENGTH,
    'tag_name': MAX_TAG_NAME_LENGTH,
    'performers_count': MAX_PERFORMERS,
    'tags_count': MAX_TAGS,
    'collections_count': MAX_COLLECTIONS,
}
