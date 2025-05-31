# Tag Copy/Paste

https://discourse.stashapp.cc/t/tagcopypaste/1858

This plugin adds Copy and Paste buttons next to the Tags input field that allows for easier bulk adding and copying of tags, with the goal of making it easy to copy Tags between objects, bulk load manually created tag lists, or load tag lists copied from AI tagger output.

The Copy button will create a comma delimited list of all currently entered tags and put this on your clipboard.

The Paste button will check your current clipboard for a comma delimited string and add these as Tags, optionally creating any missing tags. Pasted tags will be checked against both primary Tag names and all aliases, comparisons are not case sensitive and allow "_" to be interpreted as a space.

**Note**: This plugin will prompt you to grant access to the clipboard. This must be granted in order for this plugin to work.

## Config Options:
- **Create If Not Exists**: If enabled, new tags will be created when pasted list contains entries that do not already exist. DEFAULT: Disabled
- **Require Confirmation**: If enabled, user needs to confirm paste before changes are saved. DEFAULT: Disabled

