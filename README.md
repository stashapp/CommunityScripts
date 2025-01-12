# CommunityScripts repository

This repository contains plugins, themes, userscripts and other utility scripts created by the Stash community.

More extensive list of plugins and other projects for Stash is available [on our documentation site](https://docs.stashapp.cc/plugins).

## Plugins

> [!NOTE]
> More plugins are available at [https://docs.stashapp.cc/plugins](https://docs.stashapp.cc/plugins).

### Installing via manager

Plugins can be installed and managed from the **Settings** > **Plugins** page.

Plugins are installed using the **Available Plugins** section. The **Community (stable)** source is configured by default.  
Source is located at `https://stashapp.github.io/CommunityScripts/stable/index.yml`.

Installed plugins can be updated or uninstalled from the **Installed Plugins** section.

### Installing manually

By default, Stash looks for plugin configurations in the plugins sub-directory of the directory where the stash config.yml is read. This will either be the `%USERPROFILE%\.stash\plugins` on Windows or `/root/.stash/plugins` on Unix systems (Mac, Linux, etc.) or the current working directory.

Plugins are added by adding configuration yaml files (format: `pluginName.yml`) to the plugins directory.

Loaded plugins can be viewed in the **Settings** > **Plugins** page. After plugins are added, removed or edited while Stash is running, they can be reloaded by clicking **Reload plugins** button.

## Themes

> [!NOTE]
> More themes are available at [https://docs.stashapp.cc/themes](https://docs.stashapp.cc/themes).

### Installing via manager

Plugins can be installed and managed from the **Settings** > **Plugins** page.

Plugins are installed using the **Available Plugins** section. The **Community (stable)** source is configured by default.  
Source is located at `https://stashapp.github.io/CommunityScripts/stable/index.yml`.

Installed plugins can be updated or uninstalled from the **Installed Plugins** section.

### Installing via Custom CSS

1. Find a theme from the list and copy the content of .css file.
1. In Stash, go to **Settings** > **Interface** and scroll down to **Custom CSS** heading.
1. Make sure **Custom CSS enabled** is checked.
1. Click on **Edit** under **Custom CSS** and then paste the CSS code into the text box.
1. You will need to force-reload **Shift+F5** in order to see the theme.

## Userscripts

> [!NOTE]
> More userscripts are available at [https://docs.stashapp.cc/userscripts](https://docs.stashapp.cc/userscripts).

### Browser extension

To install the userscript you will need a browser extension such as:
 
- [Violentmonkey](https://violentmonkey.github.io)
- [Tampermonkey](https://www.tampermonkey.net)
- [Greasemonkey](https://www.greasespot.net)

### Installing

1. Go to [usersripts directory](https://github.com/stashapp/CommunityScripts/tree/main/userscripts).
2. Find the usersccript you want to install.
3. Select the `.user.js` file.
4. Click `Raw` button. It should either autoamtically prompt your browser extension or you will need to manually copy all the content and create new userscript in the extension yourself.  
![image](https://github.com/user-attachments/assets/62dd4258-a4fc-4610-8103-9a3fc7e396a9)

## Scripts

> [!NOTE]
> More scripts are available at [https://docs.stashapp.cc/scripts](https://docs.stashapp.cc/scripts).

To install/run a script follow the install instructions listed in individual README files.

## Contributing

### Formatting

Formatting is enforced on all files. Follow this setup guide:

1. **[Yarn](https://yarnpkg.com/en/docs/install)** and **its dependencies** must be installed to run the formatting tools.
    ```sh
    yarn install --frozen-lockfile
    ```

2. **Python dependencies** must also be installed to format `py` files.
    ```sh
    pip install -r requirements.txt
    ```

#### Formatting non-`py` files

```sh
yarn run format
```

#### Formatting `py` files

`py` files are formatted using [`black`](https://pypi.org/project/black/).

```sh
yarn run format-py
```

## Deprecation

14-day notice and associated issue with the appropriate label will be created once plugins, themes, userscripts and other utility scripts are marked for deprecation to allow time for someone to take over the development.

After the 14 days, if nobody takes up the development they will be moved to the [archive](./archive) directory. This will automatically remove plugins from the CommunityScripts source index.

Maintainers are expected to show commitment and demonstrate meaningful effort to maintain the code.
