// CommunityScripts UI Library
// cs-ui-lib.js
(function () {
  // get base URL for graphQL queries
  const baseURL = document.querySelector("base")?.getAttribute("href") ?? "/";

  // call GQL query, returns data without `data` wrapper
  const callGQL = (reqData) =>
    fetch(`${baseURL}graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqData),
    })
      .then((res) => res.json())
      .then((res) => res.data);

  // get configuration via GQL
  const getConfiguration = async (pluginId, fallback) => {
    const query = `query Configuration { configuration { plugins }}`;
    const response = await callGQL({ query });
    return response.configuration.plugins?.[pluginId] ?? fallback;
  };

  // wait for key elements
  function waitForElement(selector, callback) {
    var el = document.querySelector(selector);
    if (el) return callback(el);
    setTimeout(waitForElement, 100, selector, callback);
  }

  // wait for a path match, then for key elements
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
    callGQL,
    getConfiguration,
    waitForElement,
    PathElementListener,
  };
})();
