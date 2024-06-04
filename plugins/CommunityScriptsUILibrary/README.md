# CommunityScripts UI Plugin library

This is a set of slimmed down functions from StashUserscriptLibrary, targeting CommunityScripts originally introduced in [#319](https://github.com/stashapp/CommunityScripts/pull/319)


## functions
All the following functions are exposed under `window.csLib` and `csLib`

## callGQL
```js
/**
   * This is a wrapped GraphQL (GQL) query caller
   * @param {...Object} reqData
   * @param {Object} reqData.query - GraphQL query
   * @param {Object}= reqData.variables - GraphQL variables
   * @returns {Object} - GQL response data with the `data` wrapper removed
   * 
   * @example
   *   // fetch the count of organized scenes
   *   const filter = { organized: true };
   *   const query = `query findScenes($filter: SceneFilter) { findScenes(filter: $filter) { count } }`;
   *   const variables = { filter };
   *   const response = await callGQL({ query, variables });
   *   // response = { findScenes: { count: 3 } }
   */
```

## getConfiguration
```js
/**
   * Get configuration of a plugin from the server via GraphQL
   * @param {string} pluginId - The ID of the plugin as it is registered in the server
   * @param {*}= fallback - Fallback value if the configuration is not found. Defaults to an empty object
   * @returns {Object} - The configuration object of the plugin as it is stored in the server
   * 
   * @example
   *    // set default config
   *    const defaultConfig = { enabled: true, theme: 'light' };
   *    // fetch config from the server
   *    const config = await getConfiguration('CommunityScriptsUIPlugin', defaultConfig);
   *    // config = { theme: 'dark' }
   *    // merge fetched with default config
   *    const pluginConfig = {
   *      ...defaultConfig
   *      ...config
   *    };
   *    // pluginConfig = { enabled: true, theme: 'dark' }
   * }
   */
```

## waitForElement
```js
  /**
   * Waits for an element to be available in the DOM and runs the callback function once it is
   * @param {string} selector - The CSS selector of the element to wait for
   * @param {function} callback - The function to be called once the element is available (with the element as an argument)
   * @returns 
   * 
   * @example
   *   // wait for the element with the class 'my-element' to be available
   *   // and change its color to red
   *   function myCallback(el) {
   *     el.style.color = 'red';
   *    };
   *    waitForElement('.my-element', myCallback);
   */
```

## pathElementListener