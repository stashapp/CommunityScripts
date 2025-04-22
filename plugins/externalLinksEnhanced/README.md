# External Links Enhanced

Plugin that adds additional icons for external links.

## Supported Links

The following sites are supported out of the box:

* Bluesky (bsky.app) ~~ as custom icon
* Facebook (facebook.com)
* IMDB (imdb.com)
* Instagram (instagram.com)
* OnlyFans (onlyfans.com) ~~ as custom icon
* Patreon (patreon.com)
* Reddit (reddit.com)
* Telegram (telegram.com | t.me)
* TikTok (tiktok.com)
* Tumblr (tumblr.com)
* Twitch (twitch.tv)
* Twitter (twitter.com | x.com)
* VK (vk.com)
* Wordpress (wordpress.com)
* YouTube (youtube.com)

Want more icons? It's pretty simple to add your own; however, it's recommended to request an icon to be added the CommunityScripts repository. When you install the plugin from the CommunityScripts repository, it will come bundled with icons that the community has contributed.

## Creating a custom icon

First, you'll need to locate the `custom/` directory found in the plugin's directory. This houses `custom.json` along with the custom icons.

> NOTE: Images and SVGs are supported when using an icon.

In `custom.json`, you will find link definitions. Below is an example definition.

```js
{
    name: "sitename",
    icon: "myicon.png",
    addresses: ["mysitename.com"]
}
```

The `name` is a unique identifier. The `icon` can be an SVG or image. The `addresses` array will be used in conjunction with the `regex` property (not shown above since it's not required) for link detection to properly categorize the icons. The default/fallback regex is `https?:\/\/(?:www\.)?${addr}\/`

After you've created your definitions, simply toss your icons in the same directory as `custom.json`.


## Things to know

The plugin will fetch both the `custom.json` and icon files from the hard-coded plugin directory:

`./plugin/externalLinksEnhanced/assets/custom`

This means if you rename the `externalLinksEnhanced` directory, things will break. You would need to update `customAssetPath` in the `externalLinksEnhanced.js` file.

## Support

I (Qx) developed this plugin but I'm giving it to the community to change and update it as much as they like. The original source code can be found [here](https://github.com/QxxxGit/stash-plugins/tree/main/develop/external-links-enhanced).

If you're looking for a clean install of the plugin without the custom icons, you can add my plugin repo source to Stash and install it that way:

`https://qxxxgit.github.io/stash-plugins/index.yml`