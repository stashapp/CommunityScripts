(function () {
  let running = false;
  const buttons = [];
  let maxCount = 0;

  function resolveToggle(el) {
    let button = null;
    if (el?.classList.contains("optional-field-content")) {
      button = el.previousElementSibling;
    } else if (el?.tagName === "SPAN" && el?.classList.contains("ml-auto")) {
      button = el.querySelector(".optional-field button");
    } else if (
      el?.parentElement?.classList.contains("optional-field-content")
    ) {
      button = el.parentElement.previousElementSibling;
    }
    const state = button?.classList.contains("text-success");
    return {
      button,
      state,
    };
  }

  function toggleSearchItem(searchItem, toggleMode) {
    const searchResultItem = searchItem.querySelector(
      "li.search-result.selected-result.active",
    );
    if (!searchResultItem) return;

    const {
      urlNode,
      url,
      id,
      data,
      nameNode,
      name,
      queryInput,
      performerNodes,
    } = stash.parseSearchItem(searchItem);

    const {
      remoteUrlNode,
      remoteId,
      remoteUrl,
      remoteData,
      urlNode: matchUrlNode,
      detailsNode,
      imageNode,
      titleNode,
      codeNode,
      dateNode,
      studioNode,
      performerNodes: matchPerformerNodes,
      matches,
    } = stash.parseSearchResultItem(searchResultItem);

    const studioMatchNode = matches.find(
      (o) => o.matchType === "studio",
    )?.matchNode;
    const performerMatchNodes = matches
      .filter((o) => o.matchType === "performer")
      .map((o) => o.matchNode);

    const includeTitle = document.getElementById("result-toggle-title").checked;
    const includeCode = document.getElementById("result-toggle-code").checked;
    const includeDate = document.getElementById("result-toggle-date").checked;
    const includeCover = document.getElementById("result-toggle-cover").checked;
    const includeStashID = document.getElementById(
      "result-toggle-stashid",
    ).checked;
    const includeURL = document.getElementById("result-toggle-url").checked;
    const includeDetails = document.getElementById(
      "result-toggle-details",
    ).checked;
    const includeStudio = document.getElementById(
      "result-toggle-studio",
    ).checked;
    const includePerformers = document.getElementById(
      "result-toggle-performers",
    ).checked;

    let options = [];

    options.push(["title", includeTitle, titleNode, resolveToggle(titleNode)]);
    options.push(["code", includeCode, codeNode, resolveToggle(codeNode)]);
    options.push(["date", includeDate, dateNode, resolveToggle(dateNode)]);
    options.push(["cover", includeCover, imageNode, resolveToggle(imageNode)]);
    options.push([
      "stashid",
      includeStashID,
      remoteUrlNode,
      resolveToggle(remoteUrlNode),
    ]);
    options.push([
      "url",
      includeURL,
      matchUrlNode,
      resolveToggle(matchUrlNode),
    ]);
    options.push([
      "details",
      includeDetails,
      detailsNode,
      resolveToggle(detailsNode),
    ]);
    options.push([
      "studio",
      includeStudio,
      studioMatchNode,
      resolveToggle(studioMatchNode),
    ]);
    options = options.concat(
      performerMatchNodes.map((o) => [
        "performer",
        includePerformers,
        o,
        resolveToggle(o),
      ]),
    );

    for (const [
      optionType,
      optionValue,
      optionNode,
      { button, state },
    ] of options) {
      let wantedState = optionValue;
      if (toggleMode === 1) {
        wantedState = true;
      } else if (toggleMode === -1) {
        wantedState = false;
      }
      if (optionNode && wantedState !== state) {
        button.click();
      }
    }
  }

  function run() {
    if (!running) return;
    const button = buttons.pop();
    stash.setProgress(((maxCount - buttons.length) / maxCount) * 100);
    if (button) {
      const searchItem = getClosestAncestor(button, ".search-item");
      let toggleMode = 0;
      if (btn === btnOn) {
        toggleMode = 1;
      } else if (btn === btnOff) {
        toggleMode = -1;
      } else if (btn === btnMixed) {
        toggleMode = 0;
      }
      toggleSearchItem(searchItem, toggleMode);
      setTimeout(run, 0);
    } else {
      stop();
    }
  }

  const btnGroup = document.createElement("div");
  const btnGroupId = "batch-result-toggle";
  btnGroup.setAttribute("id", btnGroupId);
  btnGroup.classList.add("btn-group", "ml-3");

  const checkLabel =
    '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="check" class="svg-inline--fa fa-check fa-w-16 fa-icon fa-fw" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path></svg>';
  const timesLabel =
    '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="times" class="svg-inline--fa fa-times fa-w-11 fa-icon fa-fw" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512"><path fill="currentColor" d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path></svg>';
  const startLabel =
    '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle" class="svg-inline--fa fa-circle fa-w-16 fa-icon fa-fw" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256zM256 48C141.1 48 48 141.1 48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48z"/></svg>';
  let btn;

  const btnOffId = "batch-result-toggle-off";
  const btnOff = document.createElement("button");
  btnOff.setAttribute("id", btnOffId);
  btnOff.title = "Result Toggle All Off";
  btnOff.classList.add("btn", "btn-primary");
  btnOff.innerHTML = timesLabel;
  btnOff.onclick = () => {
    if (running) {
      stop();
    } else {
      btn = btnOff;
      start();
    }
  };
  btnGroup.appendChild(btnOff);

  const btnMixedId = "batch-result-toggle-mixed";
  const btnMixed = document.createElement("button");
  btnMixed.setAttribute("id", btnMixedId);
  btnMixed.title = "Result Toggle All";
  btnMixed.classList.add("btn", "btn-primary");
  btnMixed.innerHTML = startLabel;
  btnMixed.onclick = () => {
    if (running) {
      stop();
    } else {
      btn = btnMixed;
      start();
    }
  };
  btnGroup.appendChild(btnMixed);

  const btnOnId = "batch-result-toggle-on";
  const btnOn = document.createElement("button");
  btnOn.setAttribute("id", btnOnId);
  btnOn.title = "Result Toggle All On";
  btnOn.classList.add("btn", "btn-primary");
  btnOn.innerHTML = checkLabel;
  btnOn.onclick = () => {
    if (running) {
      stop();
    } else {
      btn = btnOn;
      start();
    }
  };
  btnGroup.appendChild(btnOn);

  function start() {
    // btn.innerHTML = stopLabel;
    btn.classList.remove("btn-primary");
    btn.classList.add("btn-danger");
    btnMixed.disabled = true;
    btnOn.disabled = true;
    btnOff.disabled = true;
    btn.disabled = false;
    running = true;
    stash.setProgress(0);
    buttons.length = 0;
    for (const button of document.querySelectorAll(".btn.btn-primary")) {
      if (button.innerText === "Search") {
        buttons.push(button);
      }
    }
    maxCount = buttons.length;
    run();
  }

  function stop() {
    // btn.innerHTML = startLabel;
    btn.classList.remove("btn-danger");
    btn.classList.add("btn-primary");
    running = false;
    stash.setProgress(0);
    btnMixed.disabled = false;
    btnOn.disabled = false;
    btnOff.disabled = false;
  }

  stash.addEventListener("tagger:mutations:header", (evt) => {
    const el = getElementByXpath("//button[text()='Scrape All']");
    if (el && !document.getElementById(btnGroupId)) {
      const container = el.parentElement;
      container.appendChild(btnGroup);
      sortElementChildren(container);
      el.classList.add("ml-3");
    }
  });

  const resultToggleConfigId = "result-toggle-config";

  stash.addEventListener("tagger:configuration", (evt) => {
    const el = evt.detail;
    if (!document.getElementById(resultToggleConfigId)) {
      const configContainer = el.parentElement;
      const resultToggleConfig = createElementFromHTML(`
<div id="${resultToggleConfigId}" class="col-md-6 mt-4">
<h5>Result Toggle ${startLabel} Configuration</h5>
<div class="row">
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="result-toggle-title" class="form-check-input" data-default="true">
            <label title="" for="result-toggle-title" class="form-check-label">Title</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="result-toggle-code" class="form-check-input" data-default="true">
            <label title="" for="result-toggle-code" class="form-check-label">Code</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="result-toggle-date" class="form-check-input" data-default="true">
            <label title="" for="result-toggle-date" class="form-check-label">Date</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="result-toggle-cover" class="form-check-input" data-default="true">
            <label title="" for="result-toggle-cover" class="form-check-label">Cover</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="result-toggle-stashid" class="form-check-input" data-default="true">
            <label title="" for="result-toggle-stashid" class="form-check-label">Stash ID</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="result-toggle-url" class="form-check-input" data-default="true">
            <label title="" for="result-toggle-url" class="form-check-label">URL</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="result-toggle-details" class="form-check-input" data-default="true">
            <label title="" for="result-toggle-details" class="form-check-label">Details</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="result-toggle-studio" class="form-check-input" data-default="true">
            <label title="" for="result-toggle-studio" class="form-check-label">Studio</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="result-toggle-performers" class="form-check-input" data-default="true">
            <label title="" for="result-toggle-performers" class="form-check-label">Performers</label>
        </div>
    </div>
</div>
</div>
            `);
      configContainer.appendChild(resultToggleConfig);
      loadSettings();
    }
  });

  async function loadSettings() {
    for (const input of document.querySelectorAll(
      `#${resultToggleConfigId} input`,
    )) {
      input.checked = await sessionStorage.getItem(
        input.id,
        input.dataset.default === "true",
      );
      input.addEventListener("change", async () => {
        await sessionStorage.setItem(input.id, input.checked);
      });
    }
  }

  stash.addEventListener("tagger:mutation:add:remoteperformer", (evt) =>
    toggleSearchItem(getClosestAncestor(evt.detail.node, ".search-item"), 0),
  );
  stash.addEventListener("tagger:mutation:add:remotestudio", (evt) =>
    toggleSearchItem(getClosestAncestor(evt.detail.node, ".search-item"), 0),
  );
  stash.addEventListener("tagger:mutation:add:local", (evt) =>
    toggleSearchItem(getClosestAncestor(evt.detail.node, ".search-item"), 0),
  );
  stash.addEventListener("tagger:mutation:add:container", (evt) =>
    toggleSearchItem(getClosestAncestor(evt.detail.node, ".search-item"), 0),
  );
  stash.addEventListener("tagger:mutation:add:subcontainer", (evt) =>
    toggleSearchItem(getClosestAncestor(evt.detail.node, ".search-item"), 0),
  );

  function checkSaveButtonDisplay() {
    const taggerContainer = document.querySelector(".tagger-container");
    const saveButton = getElementByXpath(
      "//button[text()='Save']",
      taggerContainer,
    );
    btnGroup.style.display = saveButton ? "inline-block" : "none";
  }

  stash.addEventListener(
    "tagger:mutations:searchitems",
    checkSaveButtonDisplay,
  );
})();
