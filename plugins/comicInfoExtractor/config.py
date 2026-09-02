# ImportList maps ComicInfo.xml fields to Stash gallery fields.
# Fields that refer to different types of media are resolved by name and created if necessary.
# Fields that can contain multiple values are expected to be comma-separated strings.

ImportList = {
    "Genre": "tags",
    "Title": "title",
    "Writer": "studio",
    "Year": "date",
    "Summary": "details",
}