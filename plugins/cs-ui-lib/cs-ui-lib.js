function CommunityScriptsUILib() {
  const baseURL = document.querySelector("base")?.getAttribute("href") ?? "/";

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

  // wait for visible key elements
  function waitForElement(selector, callback) {
    var el = document.querySelector(selector);
    if (el) return callback(el);
    setTimeout(waitForElement, 100, selector, callback);
  }

  const PathElementListener = (path, element, callback) => {
    // startup location
    if (window.location.pathname.startsWith(path))
      waitForElement(element, callback);
    PluginApi.Event.addEventListener("stash:location", (e) => {
      console.log("location", e);
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
}
CommunityScriptsUILib();
