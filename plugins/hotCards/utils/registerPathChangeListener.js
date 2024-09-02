function registerPathChangeListener(pattern, callback) {
  const regex = new RegExp(pattern);

  function checkURL() {
    const currentPathName = window.location.pathname;
    if (regex.test(currentPathName)) callback();
  }

  // Listen to popstate event for back/forward navigation
  window.addEventListener("popstate", checkURL);

  // Hijack pushState and replaceState methods
  overrideHistoryMethods(checkURL);

  // Initial check
  checkURL();
}
