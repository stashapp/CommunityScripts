function registerPathChangeListener(pattern, callback) {
  const regex = new RegExp(pattern);

  function checkURL() {
    const currentPathName = window.location.pathname;
    if (regex.test(currentPathName)) callback();
  }

  // Listen to popstate event for back/forward navigation
  window.addEventListener("popstate", checkURL);

  // Hijack pushState and replaceState methods
  ["pushState", "replaceState"].forEach((method) => {
    const original = history[method];
    history[method] = function () {
      const result = original.apply(this, arguments);
      checkURL();
      return result;
    };
  });

  // Initial check
  checkURL();
}
