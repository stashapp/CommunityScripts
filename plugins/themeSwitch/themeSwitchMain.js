(function () {
  const svgChevDN =
    '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-down" class="svg-inline--fa fa-chevron-down fa-icon collapse-icon fa-fw" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M201.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 338.7 54.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"></path></svg>';
  const svgChevUP =
    '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-right" class="svg-inline--fa fa-chevron-right fa-icon collapse-icon fa-fw" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"></path></svg>';
  const svgBTN =
    '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 102 123" width="20" height="20"><title>paint-icon-svg</title><style>  .s0 { fill: #fafafa }   .s1 { fill: #efaa3a }   .s2 { fill: #25a700 }   .s3 { fill: #e22952 }   .s4 { fill: #42a3cc } </style><path id="Layer" class="s0" d="m42.6 114.5q3 0.4 6.1 0.4 3 0 6-0.4 3-0.4 6-1.2 2.9-0.8 5.7-1.9 1.1-0.5 2.2-1 1.1-0.5 2.1-1 1.1-0.6 2.1-1.2 1-0.6 2-1.2l0.7 6.9q-0.8 0.5-1.6 0.9-0.9 0.4-1.7 0.8-0.8 0.5-1.7 0.8-0.9 0.4-1.7 0.8-3.2 1.3-6.5 2.2-3.4 0.9-6.8 1.3-3.4 0.5-6.9 0.5-3.4-0.1-6.8-0.5-3.7-0.5-7.2-1.7-3.6-1.1-6.9-2.8-3.3-1.6-6.3-3.8-3-2.2-5.6-4.9-2.8-2.8-5.1-6-2.3-3.1-4.2-6.6-1.8-3.4-3.2-7.1-1.3-3.7-2.1-7.6-1-4.7-1.2-9.5-0.1-4.8 0.6-9.5 0.8-4.7 2.3-9.3 1.6-4.5 4-8.7 2.3-4.2 5.4-7.9 3.1-3.8 6.8-6.9 3.7-3.1 7.9-5.6 4.1-2.4 8.7-4 1.5-0.6 3-1 1.5-0.4 3.1-0.7 1.6-0.2 3.2-0.2 1.5-0.1 3.1 0.1 1.4 0.2 2.7 0.6 1.3 0.4 2.6 1.1 1.2 0.7 2.2 1.6 1 1 1.9 2.1 0 0 0.1 0.1 0 0.1 0 0.2 0.1 0 0.1 0.1 0.1 0.1 0.1 0.2c2.9 6.6-0.6 10.8-4 14.8-2 2.3-3.8 4.5-2.7 6.6 0.4 0.9 1.6 1.5 3.2 2q1 0.2 2 0.3 1 0.1 2 0.1 1 0 2 0 1-0.1 2-0.3c2.5-0.4 5.2-1 7.8-1.5 1.5-0.4 3-0.7 4.5-1l-2 6.8-1.3 0.3c-2.5 0.5-5.1 1.1-8.1 1.6q-1.3 0.2-2.6 0.3-1.3 0.1-2.6 0.1-1.3 0-2.7-0.2-1.3-0.2-2.6-0.5c-3.3-0.8-5.9-2.6-7.2-5.1-3-5.9 0.1-9.6 3.5-13.6 2-2.4 4.2-5 3.2-7.9q-0.5-0.6-1-1-0.6-0.5-1.2-0.8-0.7-0.3-1.4-0.5-0.6-0.2-1.4-0.3-1.2-0.1-2.4-0.1-1.2 0.1-2.4 0.2-1.2 0.2-2.3 0.5-1.2 0.3-2.3 0.8-4 1.5-7.7 3.6-3.7 2.2-7 4.9-3.2 2.8-6 6.1-2.7 3.3-4.8 7-2 3.7-3.4 7.7-1.4 4-2 8.2-0.7 4.2-0.6 8.4 0.2 4.3 1 8.4 0.7 3.4 1.9 6.7 1.2 3.3 2.9 6.3 1.6 3.1 3.6 5.9 2.1 2.8 4.5 5.3 2.3 2.3 4.9 4.2 2.5 1.9 5.4 3.4 2.8 1.4 5.9 2.4 3 0.9 6.2 1.4z"/><path id="Layer" fill-rule="evenodd" class="s1" d="m22.1 55.7c1.3 3.4 4.6 5.6 8.2 5.7 3.6 0.1 6.9-2 8.4-5.3 1.5-3.4 0.8-7.2-1.7-9.9-2.5-2.6-6.3-3.5-9.7-2.2-1.1 0.4-2.2 1.1-3 1.9-0.9 0.8-1.6 1.8-2.1 2.9-0.4 1.1-0.7 2.2-0.7 3.4 0 1.2 0.2 2.4 0.6 3.5z"/><path id="Layer" fill-rule="evenodd" class="s2" d="m16.8 82.5c1.3 3.4 4.5 5.7 8.2 5.8 3.7 0.1 7.1-2 8.6-5.3 1.5-3.4 0.8-7.3-1.7-10-2.6-2.7-6.5-3.6-9.9-2.3-1.1 0.5-2.1 1.1-3 1.9-0.9 0.9-1.6 1.9-2 2.9-0.5 1.1-0.8 2.3-0.8 3.5-0.1 1.2 0.2 2.4 0.6 3.5z"/><path id="Layer" fill-rule="evenodd" class="s3" d="m62.1 81.7q0.6 1.6 1.7 2.9 1.1 1.3 2.6 2.2 1.4 0.9 3.1 1.3 1.7 0.3 3.4 0.2l-2.1-20.7q-0.4 0-0.7 0.1-0.4 0-0.7 0.1-0.4 0.1-0.7 0.2-0.3 0.1-0.7 0.2c-1.2 0.5-2.4 1.2-3.4 2.2-1 0.9-1.8 2-2.4 3.3-0.5 1.2-0.8 2.6-0.8 4-0.1 1.3 0.1 2.7 0.6 4z"/><path id="Layer" fill-rule="evenodd" class="s0" d="m100.3 17.7c2.4 7.9 1.5 18.1-6.8 21.8q-0.8 0.4-1.6 0.6-0.9 0.2-1.7 0.2-0.8 0.1-1.7 0-0.8-0.1-1.6-0.4-1.4-0.4-2.7-1.1-1.3-0.8-2.4-1.8-1-0.9-1.9-2.1-0.9-1.2-1.5-2.5c-5.6-12.7 10.4-20.2 11.1-32.4 3.6 4.2 8.5 10.5 10.8 17.7zm-0.1 45.2l-4 54.6q0 0.5-0.1 1-0.1 0.5-0.3 1-0.2 0.5-0.4 1-0.3 0.5-0.6 0.9c-0.7 0.6-1.4 1-2.3 1.3-0.8 0.2-1.7 0.2-2.6 0-0.8-0.2-1.6-0.6-2.3-1.2-0.6-0.6-1.1-1.3-1.4-2.1q-0.1-0.4-0.2-0.9-0.1-0.4-0.2-0.8 0-0.4-0.1-0.8 0-0.5 0-0.9l-5.4-52.9q2.4 0.5 4.9 0.7 2.5 0.3 5 0.3 2.5 0 5-0.3 2.5-0.3 5-0.9zm-5.5-17.8c2.5 7.5 2.8 8.2 6 14.5-6.5 1.8-13.4 1.5-20.4 0l4.3-14.5c3.2 1.6 7.7 1 10.2 0z"/><path id="Layer" fill-rule="evenodd" class="s4" d="m40.8 101.6c1.3 3.4 4.5 5.7 8.2 5.8 3.7 0.1 7.1-2 8.6-5.4 1.5-3.3 0.8-7.3-1.7-9.9-2.6-2.7-6.5-3.6-9.9-2.3-1.1 0.5-2.1 1.1-3 1.9-0.9 0.9-1.6 1.8-2 2.9-0.5 1.1-0.8 2.3-0.8 3.5-0.1 1.2 0.2 2.4 0.6 3.5z"/></svg>';

  let menuCreated = false;

  function menuOrderListReset(element) {
    const defaultOrder = [
      "Scenes",
      "Images",
      "Movies",
      "Markers",
      "Galleries",
      "Performers",
      "Studios",
      "Tags",
    ];
    const ul = element.querySelector("ul");
    const lis = Array.from(ul.querySelectorAll("li"));

    // Sort the li elements based on their text content
    lis.sort((a, b) => {
      const aIndex = defaultOrder.indexOf(a.textContent);
      const bIndex = defaultOrder.indexOf(b.textContent);
      return aIndex - bIndex;
    });

    // Append the sorted li elements to the ul in their new order
    lis.forEach((li) => ul.appendChild(li));
  }

  function menuOrderResetButton(elementToAppend) {
    if (!document.getElementById("themeSwitchPlugin-menuOrderReset")) {
      const resetButton = document.createElement("button");
      resetButton.id = "themeSwitchPlugin-menuOrderReset";
      resetButton.className = "btn btn-primary";
      resetButton.innerHTML = "Reset Menu Order";
      resetButton.addEventListener("click", function () {
        localStorage.removeItem(
          "themeSwitchPlugin-menu-changeOrderOfNavButtons"
        );
        document
          .getElementById("themeSwitchPlugin-menu-changeOrderOfNavButtons")
          .remove();
        menuOrderListReset(elementToAppend);
        resetButton.remove();
      });
      elementToAppend.appendChild(resetButton);
    }
  }

  function buldDragCSS(themename, key) {
    const container = document.querySelector(".draggable-ul-container");
    const list = container.querySelectorAll("li");
    let css = "";

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const key = item.getAttribute("data-rb-event-key");
      const order = i - list.length;
      css += `div.nav-link[data-rb-event-key="${key}"] { order: ${order}; }`;
    }

    const style = document.createElement("style");
    style.type = "text/css";
    style.id = key;
    style.innerHTML = `nav .navbar-nav:first-child {
      display: flex;
      flex-direction: row;
    }
    ${css}`;

    const existing = document.getElementById(key);
    if (existing) {
      existing.remove();
    }

    document.getElementsByTagName("head")[0].appendChild(style);

    const data = {
      name: themename,
      css: css,
      key: key,
      id: key,
      applied: "true",
    };

    localStorage.setItem(key, JSON.stringify(data));
    menuOrderResetButton(container.parentElement);
  }

  function enableDragSort(listClass) {
    const sortableLists = document.getElementsByClassName(listClass);
    Array.prototype.map.call(sortableLists, (list) => {
      enableDragList(list);
    });
  }

  function enableDragList(list) {
    Array.prototype.map.call(list.children, (item) => {
      enableDragItem(item);
    });
  }

  function enableDragItem(item) {
    item.setAttribute("draggable", true);
    item.addEventListener("touchstart", handleTouchStart, { passive: true });
    item.addEventListener("touchmove", handleTouchMove, { passive: true });
    item.addEventListener("touchend", handleTouchEnd, { passive: true });
    item.ondrag = handleDrag;
    item.ondragend = handleDrop;
  }

  let touchEndY = null;

  function handleTouchStart(event) {
    event.preventDefault();
    touchStartY = event.touches[0].clientY;
  }

  function handleTouchMove(event) {
    event.preventDefault();
    touchEndY = event.changedTouches[0].clientY;
    const selectedItem = event.target,
      list = selectedItem.parentNode;
    selectedItem.classList.add("drag-sort-active");
    let swapItem =
      document.elementFromPoint(
        selectedItem.getBoundingClientRect().x,
        touchEndY
      ) === null
        ? selectedItem
        : document.elementFromPoint(
            selectedItem.getBoundingClientRect().x,
            touchEndY
          );

    if (list === swapItem.parentNode) {
      swapItem =
        swapItem !== selectedItem.nextSibling ? swapItem : swapItem.nextSibling;
      list.insertBefore(selectedItem, swapItem);
    }
  }

  function handleTouchEnd(event) {
    event.preventDefault();
    touchEndY = event.changedTouches[0].clientY;
    handleDragTouch(event.target);
  }

  function handleDragTouch(item) {
    const selectedItem = item,
      list = selectedItem.parentNode;
    selectedItem.classList.remove("drag-sort-active");
    let swapItem =
      document.elementFromPoint(
        selectedItem.getBoundingClientRect().x,
        touchEndY
      ) === null
        ? selectedItem
        : document.elementFromPoint(
            selectedItem.getBoundingClientRect().x,
            touchEndY
          );

    if (list === swapItem.parentNode) {
      swapItem =
        swapItem !== selectedItem.nextSibling ? swapItem : swapItem.nextSibling;
      list.insertBefore(selectedItem, swapItem);
    }
    setTimeout(() => {
      buldDragCSS(
        "Change the order of navigation bar buttons",
        "themeSwitchPlugin-menu-changeOrderOfNavButtons"
      );
    }, 100);
  }

  function handleDrag(item) {
    const selectedItem = item.target,
      list = selectedItem.parentNode,
      x = event.clientX,
      y = event.clientY;

    selectedItem.classList.add("drag-sort-active");
    let swapItem =
      document.elementFromPoint(x, y) === null
        ? selectedItem
        : document.elementFromPoint(x, y);

    if (list === swapItem.parentNode) {
      swapItem =
        swapItem !== selectedItem.nextSibling ? swapItem : swapItem.nextSibling;
      list.insertBefore(selectedItem, swapItem);
    }
  }

  function handleDrop(item) {
    item.target.classList.remove("drag-sort-active");
    setTimeout(() => {
      buldDragCSS(
        "Change the order of navigation bar buttons",
        "themeSwitchPlugin-menu-changeOrderOfNavButtons"
      );
    }, 100);
  }

  (() => {
    enableDragSort("drag-sort-enable");
  })();

  waitForElementClass("draggable-ul-container", function () {
    enableDragSort("draggable-ul-container");
  });

  function setObject(key, category, active) {
    return new Promise((resolve, reject) => {
      try {
        localStorage.setItem(
          key,
          JSON.stringify({ category: category, active: active })
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  function checkActive(key) {
    let object = JSON.parse(localStorage.getItem(key));
    if (object && object.active === true) {
      return true;
    } else {
      return false;
    }
  }

  function applyStyleToHead(key, css) {
    const styleElement = document.createElement("style");
    styleElement.setAttribute("type", "text/css");
    const cssTextNode = document.createTextNode(css);
    styleElement.id = key;
    styleElement.appendChild(cssTextNode);
    document.getElementsByTagName("head")[0].appendChild(styleElement);
  }

  function applyCSS(category, key, css, set) {
    if (category === "Themes") {
      // Turn Off old Theme
      let regex = /(themeSwitchPlugin-theme-.*)/;

      for (let i = 0; i < localStorage.length; i++) {
        let storageKey = localStorage.key(i);
        let match = storageKey.match(regex);
        if (
          match &&
          storageKey !== key &&
          JSON.parse(localStorage.getItem(storageKey)).active === true
        ) {
          setObject(storageKey, category, false);
          let element = document.getElementById(storageKey);
          if (element) {
            element.remove();
          }
        }
      }

      const theme = JSON.parse(localStorage.getItem(key));

      if (!theme && key != "themeSwitchPlugin-theme-default") {
        setObject(key, category, true).then(() => {
          applyStyleToHead(key, css);
        });
      } else if (!theme && key === "themeSwitchPlugin-theme-default") {
        setObject(key, category, true);
      } else if (theme && key === "themeSwitchPlugin-theme-default") {
        setObject(key, category, true);
      } else if (theme && key !== "themeSwitchPlugin-theme-default") {
        setObject(key, category, true).then(() => {
          applyStyleToHead(key, css);
        });
      }
    } else {
      // CSS Other than themes
      const storageObject = JSON.parse(localStorage.getItem(key));
      if (!storageObject || storageObject.active === false) {
        setObject(key, category, true).then(() => {
          applyStyleToHead(key, css);
        });
      } else if (storageObject.active && !document.getElementById(key)) {
        applyStyleToHead(key, css);
      } else {
        setObject(key, category, false).then(() => {
          document.getElementById(key).remove();
        });
      }
    }
  }

  function expandCollapse(category, name, span, collapse) {
    let categorySpanClick = document.getElementById(span);
    let categoryCollapseClick = document.getElementById(collapse);
    let expanded =
      categoryCollapseClick.getAttribute("aria-expanded") === "true";

    if (expanded) {
      categoryCollapseClick.setAttribute("aria-expanded", "false");
      categoryCollapseClick.classList.add("expanding");
      setTimeout(function () {
        categoryCollapseClick.classList.remove("show");
        categoryCollapseClick.classList.remove("expanding");
        categorySpanClick.innerHTML = svgChevUP + category;
      }, 300);
    } else {
      categoryCollapseClick.setAttribute("aria-expanded", "true");
      categoryCollapseClick.classList.add("expanding");
      setTimeout(function () {
        categoryCollapseClick.classList.add("show");
        categoryCollapseClick.classList.remove("expanding");
        categorySpanClick.innerHTML = svgChevDN + category;
      }, 300);
    }
  }

  function createBTNMenu() {
    return new Promise(function (resolve, reject) {
      waitForElementClass("top-nav", function () {
        if (!document.getElementById("themeSwitchPlugin")) {
          const pluginDiv = document.createElement("div");
          pluginDiv.className = "mr-2 dropdown";
          pluginDiv.innerHTML =
            '<button id="themeSwitchPlugin" aria-haspopup="true" aria-expanded="false" type="button" class="dropdown-toggle minimal d-flex align-items-center h-100 btn btn-primary" title="Theme Switcher">' +
            svgBTN +
            "</button>";

          const themesDiv = document.createElement("div");
          themesDiv.className = "dropdown-menu theme-plugin-menu";

          document.addEventListener("click", function (event) {
            const isClickInside =
              pluginDiv.contains(event.target) ||
              themesDiv.contains(event.target);
            const isClickInsideThemesDiv = themesDiv.contains(event.target);
            const themeSwitchPlugin =
              document.getElementById("themeSwitchPlugin");
            const expanded =
              themeSwitchPlugin.getAttribute("aria-expanded") === "true";

            if (expanded && !isClickInsideThemesDiv) {
              themeSwitchPlugin.setAttribute("aria-expanded", "false");
              themesDiv.classList.remove("show");
              themesDiv.style =
                "position: absolute; to0px; left: 0px; margin: 0px; opacity: 0; pointer-events: none;";
            } else if (!expanded && isClickInside) {
              themeSwitchPlugin.setAttribute("aria-expanded", "true");
              themesDiv.classList.add("show");
              themesDiv.style =
                "position: absolute; top: 133%; left: 0px; margin: 0px; opacity: 1; pointer-events: auto; width: max-content; min-width: 20rem; left: -575%;";
            } else if (!isClickInside && !isClickInsideThemesDiv) {
              themeSwitchPlugin.setAttribute("aria-expanded", "false");
              themesDiv.classList.remove("show");
              themesDiv.style =
                "position: absolute; top: 0px; left: 0px; margin: 0px; opacity: 0; pointer-events: none;";
            }
          });

          const accordion = document.createElement("div");
          accordion.className = "criterion-list accordion";
          accordion.style = "max-width: 20rem !important;";
          const header = document.createElement("div");
          header.innerHTML = "Theme/CSS Switcher";
          header.className = "modal-header";
          accordion.append(header);

          Object.entries(themeSwitchCSS).forEach(
            ([category, themesInCategory], i) => {
              const categoryDiv = document.createElement("div");
              categoryDiv.className = "card";
              categoryDiv.setAttribute("data-type", category);
              categoryDiv.setAttribute(
                "id",
                "themeSwitchPlugin-card-" + category
              );
              categoryDiv.style = "padding: 2px !important;";
              const categoryHeader = document.createElement("div");
              categoryHeader.className = "card-header";
              categoryHeader.style = "padding: 0.375rem 0.625rem !important;";
              const categorySpan = document.createElement("span");
              categorySpan.innerHTML = svgChevUP + category;
              categorySpan.setAttribute(
                "id",
                "themeSwitchPlugin-span-" + category
              );
              const collapseDiv = document.createElement("div");
              collapseDiv.className = "collapse";
              collapseDiv.setAttribute("aria-expanded", "false");
              collapseDiv.setAttribute(
                "id",
                "themeSwitchPlugin-collapse-" + category
              );
              categoryDiv.addEventListener(
                "click",
                (function () {
                  return function (event) {
                    if (!event.target.closest(".collapse")) {
                      expandCollapse(
                        category,
                        "themeSwitchPlugin-card-" + category,
                        "themeSwitchPlugin-span-" + category,
                        "themeSwitchPlugin-collapse-" + category
                      );
                    }
                  };
                })(i),
                { capture: true }
              );

              const cardBody = document.createElement("div");
              cardBody.className = "card-body";
              const editorDiv = document.createElement("div");
              editorDiv.className = "criterion-editor";
              const blankDiv = document.createElement("div");
              const optionListFilter = document.createElement("div");
              optionListFilter.className = "option-list-filter";
              blankDiv.append(optionListFilter);
              editorDiv.append(blankDiv);
              cardBody.append(editorDiv);
              collapseDiv.append(cardBody);
              categoryHeader.append(categorySpan, collapseDiv);
              const fieldset = document.createElement("fieldset");
              fieldset.className = "checkbox-switch";

              // Loop over themes in each category
              Object.entries(themesInCategory).forEach(([theme]) => {
                  const forRow = document.createElement("div");
                  forRow.className = "checkbox-switch-form-row";
                  const legend = document.createElement("legend");
                  legend.innerHTML = theme.displayName;
                  legend.className = "legend-right";
                  const input = document.createElement("input");

                  if (category === "Themes") {
                    input.type = "radio";
                    input.name = "themeGroup";
                    const active = checkActive(theme.key);
                    input.checked = active;
                  } else {
                    input.type = "checkbox";
                    const active = checkActive(theme.key);
                    input.checked = active;
                  }
                  const themeData = {
                    category: category,
                    key: theme.key,
                    css: theme.styles,
                  };

                  input.setAttribute("id", category + "-" + theme.key);
                  input.addEventListener(
                    "click",
                    (function (category, key, css) {
                      return function () {
                        applyCSS(category, key, css);
                      };
                    })(themeData.category, themeData.key, themeData.css),
                    false
                  );

                  const label = document.createElement("label");
                  label.setAttribute("for", category + "-" + theme.key);
                  label.title = "Turn " + theme.displayName + " on/off";
                  label.className = "checkbox-right";

                  // Append the legend, input, and label elements to the fieldset element
                  forRow.appendChild(legend);
                  forRow.appendChild(input);
                  forRow.appendChild(label);
                  fieldset.appendChild(forRow);
                  optionListFilter.appendChild(fieldset);
                  categoryDiv.append(categoryHeader);
                  accordion.append(categoryDiv);
              });

              Object.entries(themesInCategory).forEach(([themeId, theme]) => {
                if (category === "Navigation") {
                  const forRow = document.createElement("div");
                  forRow.className = "switch-form-row";
                  const legend = document.createElement("legend");
                  legend.innerHTML = theme.displayName;
                  legend.className = "legend-left";

                  const draggableStylesheetContent = localStorage.getItem(
                    "themeSwitchPlugin-menu-changeOrderOfNavButtons"
                  );
                  if (draggableStylesheetContent) {
                    // Read the stylesheet content and create an array called "elements"
                    var reset = true;
                    var navMenuItems = [];
                    const css = JSON.parse(draggableStylesheetContent).css;
                    const regex = /data-rb-event-key="\/([^"]+)"/g;
                    let match;
                    while ((match = regex.exec(css))) {
                      const key = match[1];
                      if (match[1] === "scenes/markers") {
                        const name = "Markers";
                        navMenuItems.push({ name, key });
                      } else {
                        const name =
                          match[1].charAt(0).toUpperCase() + match[1].slice(1);
                        navMenuItems.push({ name, key });
                      }
                    }
                    navMenuItems.sort((a, b) => a.order - b.order);
                  } else {
                    var navMenuItems = [
                      { name: "Scenes", key: "scenes" },
                      { name: "Images", key: "images" },
                      { name: "Movies", key: "movies" },
                      { name: "Markers", key: "scenes/markers" },
                      { name: "Galleries", key: "galleries" },
                      { name: "Performers", key: "performers" },
                      { name: "Studios", key: "studios" },
                      { name: "Tags", key: "tags" },
                    ];
                  }
                  //  const label = document.createElement("label");
                  legend.setAttribute("for", category + "-" + theme.key);
                  optionListFilter.appendChild(legend);
                  const formCheck = document.createElement("ul");
                  formCheck.className = "draggable-ul-container";
                  for (let i = 0; i < navMenuItems.length; i++) {
                    const li = document.createElement("li");
                    li.className = "draggable-li";
                    li.setAttribute(
                      "data-rb-event-key",
                      "/" + navMenuItems[i].key
                    );
                    li.setAttribute("draggable", true);
                    const newSpan = document.createElement("span");
                    newSpan.className = "grippy";
                    li.appendChild(newSpan);
                    const textNode = document.createTextNode(
                      navMenuItems[i].name
                    );
                    li.appendChild(textNode);
                    formCheck.appendChild(li);
                  }

                  optionListFilter.appendChild(formCheck);

                  if (reset) {
                    menuOrderResetButton(optionListFilter);
                  }
                  fieldset.appendChild(forRow);
                  optionListFilter.appendChild(fieldset);
                  categoryDiv.append(categoryHeader);
                  accordion.append(categoryDiv);
                }
              });
            }
          );
          themesDiv.append(accordion);
          pluginDiv.append(themesDiv);

          waitForElementClass("navbar-buttons", function () {
            const mainDiv =
              document.getElementsByClassName("navbar-buttons")[0];
            const secondLastChild =
              mainDiv.childNodes[mainDiv.childNodes.length - 4];
            mainDiv.insertBefore(pluginDiv, secondLastChild);

            // Resolving the promise once everything is set up
            menuCreated = true;
            resolve();
          });
        } else {
          // Rejecting the promise if the element already exists
          reject(new Error("Element already exists"));
        }
      });
    });
  }

  function returnCSS(key) {
    for (const [, categoryThemes] of Object.entries(themeSwitchCSS)) {
      for (const [, theme] of Object.entries(categoryThemes)) {
        if (key === theme.key) {
          return theme.styles;
        }
      }
    }
  }

  function init() {
    // Apply active Themes and stylesheets
    let selectedTheme;

    const regex = /(themeSwitchPlugin(?!-theme-default).*)/;
    const defaultRegex = /(themeSwitchPlugin-theme-default)/;
    let defaultFound = false;
    let appliedThemeOtherThanDefault = [];

    for (let i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i);
      let defaultMatch = key.match(defaultRegex);
      if (defaultMatch) {
        defaultFound = true;
      }

      let match = key.match(regex);
      if (match) {
        selectedTheme = JSON.parse(localStorage.getItem(key));
        if (selectedTheme.active === true) {
          appliedThemeOtherThanDefault.push("True");
          const css = returnCSS(key);
          applyCSS(selectedTheme.category, key, css, true);
        }
      }
    }

    if (!defaultFound) {
      let setDefaultActive;
      if (appliedThemeOtherThanDefault.length > 0) {
        setDefaultActive = false;
      } else {
        setDefaultActive = true;
      }
      setObject("themeSwitchPlugin-theme-default", "Themes", setDefaultActive);
    }
  }

  const StashPages = [
    "stash:page:scenes",
    "stash:page:scene",
    "stash:page:images",
    "stash:page:image",
    "stash:page:movies",
    "stash:page:movie",
    "stash:page:markers",
    "stash:page:galleries",
    "stash:page:performers",
    "stash:page:performer",
    "stash:page:studios",
    "stash:page:studio",
    "stash:page:tags",
    "stash:page:tag",
    "stash:page:settings",
    "stash:page:stats",
    "stash:page:home",
  ];

  function createMenuAndInit() {
    if (!menuCreated) {
      createBTNMenu()
        .then(function () {
          console.log("Theme Plugin: Menu created successfully");
        })
        .catch(function (error) {
          console.error("Theme Plugin: Error creating menu:", error.message);
        });
      menuCreated = true;
    }
    init();
  }

  for (var i = 0; i < StashPages.length; i++) {
    const page = StashPages[i];
    stash.addEventListener(page, createMenuAndInit);
  }

  // Reset menuCreated flag on hard refresh
  window.addEventListener("beforeunload", function () {
    menuCreated = false;
  });
})();
