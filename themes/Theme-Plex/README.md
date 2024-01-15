![plex theme logo](https://user-images.githubusercontent.com/63812189/79496351-dddbf780-7fda-11ea-9e68-46d0eeb4e92f.png)

![plex theme preview](https://user-images.githubusercontent.com/1358708/178891502-c71e4278-0378-4154-91a6-07e1a8eaa1df.png)

This is a community created theme for Stash inspired by the popular Plex Interface. Installation is quick and easy so you should be ready to install it in just a few simple steps.

Feel free to experiment with CSS and modify it to fit your needs. In case you have any issues or improvements we will be happy to hear from you on our [Discord server](https://discord.gg/2TsNFKt)! You can also submit a PR to share improvements with others!

The Plex Theme will only change the look and feel of the Stash interface. It will not affect any other data, so you are all safe and sound! :heart:

## Install

1. Open User Interface Configuration panel in settings. (http://localhost:9999/settings?tab=plugins)

2. Find the Theme in the listing, in the default Community repo

3. Click Install

### Optional - Host Backgrounds Locally

_These steps are optional, by default this theme uses the Github hosted image links._

1. Download [background.png](https://user-images.githubusercontent.com/63812189/79506691-4af78900-7feb-11ea-883e-87b8e05ceb1c.png) and [noise.png](https://user-images.githubusercontent.com/63812189/79506696-4c28b600-7feb-11ea-8176-12a46454d87a.png)

2. Place `background.png` and `noise.png` in `~/.stash` on macOS / Linux or `C:\Users\YourUsername\.stash` on Windows. Then edit the `background-image: url("")` attributes like below:  

The [body](https://github.com/stashapp/CommunityScripts/blob/main/themes/Theme-Plex/Theme-Plex.css#L7) one `background-image: url("./background.png");`

The [root](https://github.com/stashapp/CommunityScripts/blob/main/themes/Theme-Plex/Theme-Plex.css#L18) one `background: rgba(0, 0, 0, 0) url("./noise.png") repeat scroll 0% 0%;`
