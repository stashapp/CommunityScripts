(async function waitForStash() {
  while (!window.stash) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  function handlePageDivider() {
    waitForElementClass("scene-tabs order-xl-first order-last", function () {
      const pageDivider = document
        .querySelector(".scene-divider.d-none.d-xl-block")
        .querySelector("button");

      let isActive = localStorage.getItem("scene-page-divider");
      if (isActive === null) {
        localStorage.setItem("scene-page-divider", "false");
        isActive = false;
      } else {
        isActive = isActive === "true";
      }

      if (isActive === true) {
        pageDivider.click();
      }

      pageDivider.addEventListener("click", function () {
        isActive = !isActive;
        localStorage.setItem("scene-page-divider", isActive.toString());
      });
    });
  }

  function nav() {
    waitForElementClass("mr-auto nav nav-tabs", function () {
      const navMenuItems = [
        { name: "Details", key: "scene-details-panel" },
        { name: "Queue", key: "scene-queue-panel" },
        { name: "Markers", key: "scene-markers-panel" },
        { name: "Filters", key: "scene-filters-panel" },
        { name: "File Info", key: "scene-file-info-panel" },
        { name: "Edit", key: "scene-edit-panel" },
      ];

      const detailsNav = document.getElementsByClassName(
        "mr-auto nav nav-tabs"
      )[0];
      const hrefs = detailsNav.getElementsByTagName("a");

      // Check local storage for entries
      let activeKey = localStorage.getItem("detailsNavActive");

      // If no entry found, create default entry
      if (!activeKey) {
        navMenuItems.forEach((item) => {
          if (item.name === "Details") {
            localStorage.setItem("detailsNavActive", item.key);
          }
        });
        activeKey = "scene-details-panel";
      }

      // Remove active class from all hrefs
      Array.from(hrefs).forEach((href) => {
        href.classList.remove("active");
      });

      // Add active class to the one that matches activeKey
      Array.from(hrefs).forEach((href) => {
        if (href.dataset.rbEventKey === activeKey) {
          href.classList.add("active");
        }
      });

      // Simulate click on active tab
      const activeTab = detailsNav.querySelector(
        `a[data-rb-event-key="${activeKey}"]`
      );
      activeTab.click();

      // Add event listeners
      Array.from(hrefs).forEach((href) => {
        href.addEventListener("click", function () {
          // Remove active class from all hrefs
          Array.from(hrefs).forEach((href) => {
            href.classList.remove("active");
          });

          // Add active class to the clicked href
          this.classList.add("active");

          // Store active key in local storage
          const newActiveKey = this.dataset.rbEventKey;
          localStorage.setItem("detailsNavActive", newActiveKey);
        });
      });
    });
  }

  function main() {
    nav(), handlePageDivider();
  }
  stash.addEventListener("stash:page:scene", main());
})();
