function sceneDivider(tabs) {
  const dividerBtn = document.querySelector(".scene-divider > button");

  // check if tab is currently collapsed, and if it should be
  const isCollapsed = () => tabs.classList.contains("collapsed")
  const storedCollapse = localStorage.getItem("remember-state-divider") == "true"
  // if it should be, but is not, collapse
  if (storedCollapse && !isCollapsed()) dividerBtn.click()

  // add listener to change desired state based on current collapsed state
  dividerBtn.addEventListener("click", () => {
    // isCollapsed does not update in time
    const newState = !isCollapsed()
    localStorage.setItem("remember-state-divider", newState)
  })
}

function navTab() {
  const detailsNav = document.querySelector(".nav-tabs")

  // Check local storage for entries
  let activeKey = localStorage.getItem("remember-state-navtab");

  // click on desired active key if defined
  if (activeKey) {
    detailsNav.querySelector(`a[data-rb-event-key="${activeKey}"]`).click()
  }

  // add event listener
  detailsNav.querySelectorAll("a").forEach(href => {
    href.addEventListener("click", function() {
      localStorage.setItem("remember-state-navtab", this.dataset.rbEventKey)
    })
  })
}

csLib.PathElementListener("/scenes/", ".nav-tabs", navTab)
csLib.PathElementListener("/scenes/", ".scene-tabs", sceneDivider)