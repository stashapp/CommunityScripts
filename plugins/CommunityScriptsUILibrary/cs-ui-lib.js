// CommunityScripts UI Library
// cs-ui-lib.js
(function () {
  // get base URL for graphQL queries
  const baseURL = document.querySelector("base")?.getAttribute("href") ?? "/";

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
  const callGQL = (reqData) =>
    fetch(`${baseURL}graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqData),
    })
      .then((res) => res.json())
      .then((res) => res.data);

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
  const getConfiguration = async (pluginId, fallback = {}) => {
    const query = `query Configuration { configuration { plugins }}`;
    const response = await callGQL({ query });
    return response.configuration.plugins?.[pluginId] ?? fallback;
  };

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
  function waitForElement(selector, callback) {
    var el = document.querySelector(selector);
    if (el) return callback(el);
    setTimeout(waitForElement, 100, selector, callback);
  }

  /**
   * Wait for a specific element to be available on a specific path
   * This combines the `waitForElement` and `PluginApi.Event.addEventListener` functions to only trigger on certain pages
   *
   * @param {string} path - The path to listen for
   * @param {string} element - The CSS selector of the element to wait for
   * @param {function} callback - The function to be called once the element is available (with the element as an argument)
   *
   * @example
   *  // wait for the element with the class 'my-element' to be available, but only on the `/scene/#` path
   *  function myCallback(el) {
   *    el.style.color = 'red';
   *  };
   *  PathElementListener('/scene/', '.my-element', myCallback);
   *  // this will only trigger the callback function when the user is on the `/scene/` path AND the element is available
   */
  const PathElementListener = (path, element, callback) => {
    // startup location
    if (window.location.pathname.startsWith(path))
      waitForElement(element, callback);
    PluginApi.Event.addEventListener("stash:location", (e) => {
      if (e.detail.data.location.pathname.startsWith(path))
        waitForElement(element, callback);
    });
  };

  // export to window
  window.csLib = {
    baseURL,
    callGQL,
    getConfiguration,
    waitForElement,
    PathElementListener,
  };
})();
