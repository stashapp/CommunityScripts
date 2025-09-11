# Theme Switch

https://discourse.stashapp.cc/t/theme-switch/1414

## Information about plugin

Adds a button that shows a menu, allowing you to change CSS Themes and apply various CSS snippets for Stash App. The CSS isn't made by myself and in the CSS files authors where known are referenced.

Only the CSS of one theme can be applied at a time, and any amount of snippets can be applied.

Clicking on any radio/checkbox to apply the CSS, saves the CSS content of the Stylesheet in the browsers local storage, with an applied flag, eitehr true or false which allows the script upon page navigation and refresh to apply previously selected stylesheets

Under Change Order of Menu Bar, you can drag the elements to reorder the main menu and upon dropping it will generate the required CSS. It should work on touchscreens also, tested on Chrome IOS.

![Theme Plugin 1](https://github.com/elkorol/Stash-App-Theme-Switch-Plugin/blob/193f54fce3914991440027c4b98fd30aa9402d29/images/1.png)

![Theme Plugin 2](https://github.com/elkorol/Stash-App-Theme-Switch-Plugin/blob/193f54fce3914991440027c4b98fd30aa9402d29/images/2.png)

## Other Requirements

## Usage

1. Copy repository into Stash plugins folder.
2. Reload plugins from settings and enable

## Credit

The CSS code used is provided by [Stash Community Themes](https://docs.stashapp.cc/user-interface-ui/themes) and [Stash Community Custom CSS Snippets](https://docs.stashapp.cc/user-interface-ui/custom-css-snippets).

## Adding your own CSS

To add your own CSS open the themeSwitchCSS.js file. CSS is defined in const variables. They are ordered in categories. You can make your own categories too. Just define a variable to hold your css and put the css inbetween backticks ``.

Then look for the variable themeSwitchCSS at the bottom of the file. If adding to an existing category to just add a new number at the end. Or if you are reordering the CSS or themes. Be sure to update the numbering and there is no duplicate numbers within a theme or some won't render. It's stuctured like but can be seen better within the file itself.

const themeSwitchCSS = {
Theme: {
1: {
displayName: "Default",
styles: null,
key: "themeSwitchPlugin-theme-default",
version: null,
},
2: {
displayName: "Black Hole",
styles: blackHole,
key: "themeSwitchPlugin-theme-blackHole",
version: "2.0",
}
YourCategoryHere: {
1: {
displayName: "Your CSS Name Here",
styles: Your-CSS-Variable-Name-Here,
key: "themeSwitchPlugin-YourCategoryHere-AnIDforYourCSS",
version: VersionNumberOrNull,
}
}
}
}
