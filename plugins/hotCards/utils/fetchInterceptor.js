(() => {
  if (window.stashListener) return;

  const { fetch: originalFetch } = window;
  const stashListener = new EventTarget();

  window.fetch = async (...args) => {
    let [resource, config] = args;
    const response = await originalFetch(resource, config);
    const contentType = response.headers.get("content-type");

    if (
      typeof resource === "string" &&
      contentType &&
      (contentType.indexOf('application/json') !== -1 || 
      contentType.indexOf('application/graphql-response+json') !== -1) &&
      resource.endsWith("/graphql")
    ) {
      try {
        const data = await response.clone().json();
        stashListener.dispatchEvent(
          new CustomEvent("response", { detail: data })
        );
      } catch (e) {
        console.error("Error parsing JSON:", e);
      }
    }
    return response;
  };

  window.stashListener = stashListener;
})();
