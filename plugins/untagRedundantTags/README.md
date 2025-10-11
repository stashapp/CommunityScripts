# Untag redundant tags

Removes parent tags from objects if a more specific child tag is also present.

## Install

After you installed the plugin, make sure you have the latest version of stashapi installed by running `pip install -r <path to your stash>/plugins/community/untagRedundantTags/requirements.txt`.

## Config

A few config settings control what kind of parent tags are allowed for removal if redundant. The defaults are the behavior being disabled for all objects and no tags are allowed to be removed.

Go into your Stash then under `Settings > Plugins` you'll find the config for Untag redundant tags

- `Enable for scenes`

> Enable the automatic tag removal behavior for scenes

- `Enable for images`

> Enable the automatic tag removal behavior for images

- `Enable for galleries`

> Enable the automatic tag removal behavior for galleries

- `Enable for performers`

> Enable the automatic tag removal behavior for performers

- `Exclude objects marked as organized`

> Disable automatic tag removal for items (scens / images / galleries) that are marked as organized

- `Allow removing all root tags (tags without parent)`

> If enabled, tags without a parent tag (root tags) are allowed to be removed. Useful if tag hierarchies are used to group thematically related tags, to prevent the group itself from being used.

- `Allow removing tags ignored for Auto-Tagging`

> If enabled, tags marked as "Ignore for Auto-Tag" are allowed to be removed. Useful for deeper tag hierarchies, gives selective control on a likely related attribute.

- `Allow removing all intermediate tags (tags with parent and child tag)`

> If enabled, all tags with a parent tag and a child tag are allowed to be removed. Useful for deeper tag hierarchies, but quite aggressive, will possibly remove parallel legitimate uses of less specialized and more spezialized tags.
