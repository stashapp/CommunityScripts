const stashListener = new EventTarget();

const { fetch: originalFetch } = window;

const baseURL = document.querySelector("base")?.getAttribute("href") ?? "/";

window.fetch = async (...args) => {
  let [resource, config] = args;
  // request interceptor here
  const response = await originalFetch(resource, config);
  // response interceptor here
  const contentType = response.headers.get("content-type");
  if (
    contentType &&
    contentType.indexOf("application/json") !== -1 &&
    resource.endsWith("/graphql")
  ) {
    try {
      const data = await response.clone().json();
      stashListener.dispatchEvent(
        new CustomEvent("response", {
          detail: data,
        }),
      );
    } catch (e) {}
  }
  return response;
};

class Logger {
  constructor(enabled) {
    this.enabled = enabled;
  }
  debug() {
    if (!this.enabled) return;
    console.debug(...arguments);
  }
}

class Stash extends EventTarget {
  constructor({
    pageUrlCheckInterval = 100,
    detectReRenders = true,
    logging = false,
  } = {}) {
    super();
    this.log = new Logger(logging);
    this._pageUrlCheckInterval = pageUrlCheckInterval;
    this._detectReRenders = detectReRenders;
    this._lastPathStr = "";
    this._lastQueryStr = "";
    this._lastHref = "";
    this._lastStashPageEvent = "";
    this.waitForElement(this._detectReRenders ? ".main > div" : "html").then(
      () => {
        this._pageURLCheckTimerId = setInterval(() => {
          // Loop every 100 ms
          if (
            this._lastPathStr !== location.pathname ||
            this._lastHref !== location.href ||
            this._lastQueryStr !== location.search ||
            (!document.querySelector(".main > div[stashUserscriptLibrary]") &&
              this._detectReRenders)
          ) {
            this._dispatchPageEvent("stash:page", false);

            this._handlePageChange({
              lastPathStr: this._lastPathStr,
              lastQueryStr: this._lastQueryStr,
              lastHref: this._lastHref,
              lastStashPageEvent: this._lastStashPageEvent,
            });

            this._lastPathStr = location.pathname;
            this._lastQueryStr = location.search;
            this._lastHref = location.href;

            if (this._detectReRenders) {
              this.waitForElement(".main > div", 10000).then((element) => {
                if (element) element.setAttribute("stashUserscriptLibrary", "");
              });
            }
          }
        }, this._pageUrlCheckInterval);
      },
    );
    stashListener.addEventListener("response", (evt) => {
      if (evt.detail.data?.plugins) {
        this.getPluginVersion(evt.detail);
      }
      this.processRemoteScenes(evt.detail);
      this.processScene(evt.detail);
      this.processScenes(evt.detail);
      this.processStudios(evt.detail);
      this.processPerformers(evt.detail);
      this.processApiKey(evt.detail);
      this.dispatchEvent(
        new CustomEvent("stash:response", {
          detail: evt.detail,
        }),
      );
    });
    stashListener.addEventListener("pluginVersion", (evt) => {
      if (this.pluginVersion !== evt.detail) {
        this.pluginVersion = evt.detail;
        this.dispatchEvent(
          new CustomEvent("stash:pluginVersion", {
            detail: evt.detail,
          }),
        );
      }
    });
    this.version = [0, 0, 0];
    this.getVersion();
    this.pluginVersion = null;
    this.getPlugins().then((plugins) => this.getPluginVersion(plugins));
    this.visiblePluginTasks = ["Userscript Functions"];
    this.settingsCallbacks = [];
    this.settingsId = "userscript-settings";
    this.remoteScenes = {};
    this.scenes = {};
    this.studios = {};
    this.performers = {};
    this.userscripts = [];
    this._pageListeners = {};
    this._initDefaultPageListeners();
  }
  async getVersion() {
    const reqData = {
      operationName: "",
      variables: {},
      query: `query version {
                version {
                    version
                }
            }`,
    };
    const data = await this.callGQL(reqData);
    const versionString = data.data.version.version;
    this.version = versionString
      .substring(1)
      .split(".")
      .map((o) => parseInt(o));
  }
  compareVersion(minVersion) {
    let [currMajor, currMinor, currPatch = 0] = this.version;
    let [minMajor, minMinor, minPatch = 0] = minVersion
      .split(".")
      .map((i) => parseInt(i));
    if (currMajor > minMajor) return 1;
    if (currMajor < minMajor) return -1;
    if (currMinor > minMinor) return 1;
    if (currMinor < minMinor) return -1;
    return 0;
  }
  comparePluginVersion(minPluginVersion) {
    if (!this.pluginVersion) return -1;
    let [currMajor, currMinor, currPatch = 0] = this.pluginVersion
      .split(".")
      .map((i) => parseInt(i));
    let [minMajor, minMinor, minPatch = 0] = minPluginVersion
      .split(".")
      .map((i) => parseInt(i));
    if (currMajor > minMajor) return 1;
    if (currMajor < minMajor) return -1;
    if (currMinor > minMinor) return 1;
    if (currMinor < minMinor) return -1;
    return 0;
  }
  async runPluginTask(pluginId, taskName, args = []) {
    const reqData = {
      operationName: "RunPluginTask",
      variables: {
        plugin_id: pluginId,
        task_name: taskName,
        args: args,
      },
      query:
        "mutation RunPluginTask($plugin_id: ID!, $task_name: String!, $args: [PluginArgInput!]) {\n  runPluginTask(plugin_id: $plugin_id, task_name: $task_name, args: $args)\n}\n",
    };
    return this.callGQL(reqData);
  }
  async callGQL(reqData) {
    const options = {
      method: "POST",
      body: JSON.stringify(reqData),
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      const res = await window.fetch(baseURL + "graphql", options);
      this.log.debug(res);
      return res.json();
    } catch (err) {
      console.error(err);
    }
  }
  async getFreeOnesStats(link) {
    try {
      const doc = await fetch(link)
        .then(function (response) {
          // When the page is loaded convert it to text
          return response.text();
        })
        .then(function (html) {
          // Initialize the DOM parser
          var parser = new DOMParser();

          // Parse the text
          var doc = parser.parseFromString(html, "text/html");

          // You can now even select part of that html as you would in the regular DOM
          // Example:
          // var docArticle = doc.querySelector('article').innerHTML;

          console.log(doc);
          return doc;
        })
        .catch(function (err) {
          console.log("Failed to fetch page: ", err);
        });

      var data = new Object();
      data.rank = doc.querySelector("rank-chart-button");
      console.log(data.rank);
      data.views = doc.querySelector(
        ".d-none.d-m-flex.flex-column.align-items-center.global-header > div.font-weight-bold",
      ).textContent;
      data.votes = "0";
      return JSON.stringify(data);
    } catch (err) {
      console.error(err);
    }
  }
  async getPlugins() {
    const reqData = {
      operationName: "Plugins",
      variables: {},
      query: `query Plugins {
              plugins {
                id
                name
                description
                url
                version
                tasks {
                  name
                  description
                  __typename
                }
                hooks {
                  name
                  description
                  hooks
                }
              }
            }
            `,
    };
    return this.callGQL(reqData);
  }
  async getPluginVersion(plugins) {
    let version = null;
    for (const plugin of plugins?.data?.plugins || []) {
      if (plugin.id === "userscript_functions") {
        version = plugin.version;
      }
    }
    stashListener.dispatchEvent(
      new CustomEvent("pluginVersion", {
        detail: version,
      }),
    );
  }
  async getStashBoxes() {
    const reqData = {
      operationName: "Configuration",
      variables: {},
      query: `query Configuration {
                        configuration {
                          general {
                            stashBoxes {
                              endpoint
                              api_key
                              name
                            }
                          }
                        }
                      }`,
    };
    return this.callGQL(reqData);
  }
  async getApiKey() {
    const reqData = {
      operationName: "Configuration",
      variables: {},
      query: `query Configuration {
                        configuration {
                          general {
                            apiKey
                          }
                        }
                      }`,
    };
    return this.callGQL(reqData);
  }
  matchUrl(href, fragment) {
    const regexp = concatRegexp(
      new RegExp(window.location.origin + baseURL),
      fragment,
    );
    return href.match(regexp) != null;
  }
  createSettings() {
    waitForElementId(
      "configuration-tabs-tabpane-system",
      async (elementId, el) => {
        let section;
        if (!document.getElementById(this.settingsId)) {
          section = document.createElement("div");
          section.setAttribute("id", this.settingsId);
          section.classList.add("setting-section");
          section.innerHTML = `<h1>Userscript Settings</h1>`;
          el.appendChild(section);

          const expectedApiKey =
            (await this.getApiKey())?.data?.configuration?.general?.apiKey ||
            "";
          const expectedUrl = window.location.origin;

          const serverUrlInput = await this.createSystemSettingTextbox(
            section,
            "userscript-section-server-url",
            "userscript-server-url",
            "Stash Server URL",
            "",
            "Server URL…",
            true,
          );
          serverUrlInput.addEventListener("change", () => {
            const value = serverUrlInput.value || "";
            if (value) {
              this.updateConfigValueTask("STASH", "url", value);
              alert(`Userscripts plugin server URL set to ${value}`);
            } else {
              this.getConfigValueTask("STASH", "url").then((value) => {
                serverUrlInput.value = value;
              });
            }
          });
          serverUrlInput.disabled = true;
          serverUrlInput.value = expectedUrl;
          this.getConfigValueTask("STASH", "url").then((value) => {
            if (value !== expectedUrl) {
              return this.updateConfigValueTask("STASH", "url", expectedUrl);
            }
          });

          const apiKeyInput = await this.createSystemSettingTextbox(
            section,
            "userscript-section-server-apikey",
            "userscript-server-apikey",
            "Stash API Key",
            "",
            "API Key…",
            true,
          );
          apiKeyInput.addEventListener("change", () => {
            const value = apiKeyInput.value || "";
            this.updateConfigValueTask("STASH", "api_key", value);
            if (value) {
              alert(`Userscripts plugin server api key set to ${value}`);
            } else {
              alert(`Userscripts plugin server api key value cleared`);
            }
          });
          apiKeyInput.disabled = true;
          apiKeyInput.value = expectedApiKey;
          this.getConfigValueTask("STASH", "api_key").then((value) => {
            if (value !== expectedApiKey) {
              return this.updateConfigValueTask(
                "STASH",
                "api_key",
                expectedApiKey,
              );
            }
          });
        } else {
          section = document.getElementById(this.settingsId);
        }

        for (const callback of this.settingsCallbacks) {
          callback(this.settingsId, section);
        }

        if (this.pluginVersion) {
          this.dispatchEvent(
            new CustomEvent("stash:pluginVersion", {
              detail: this.pluginVersion,
            }),
          );
        }
      },
    );
  }
  addSystemSetting(callback) {
    const section = document.getElementById(this.settingsId);
    if (section) {
      callback(this.settingsId, section);
    }
    this.settingsCallbacks.push(callback);
  }
  async createSystemSettingCheckbox(
    containerEl,
    settingsId,
    inputId,
    settingsHeader,
    settingsSubheader,
  ) {
    const section = document.createElement("div");
    section.setAttribute("id", settingsId);
    section.classList.add("card");
    section.style.display = "none";
    section.innerHTML = `<div class="setting">
        <div>
        <h3>${settingsHeader}</h3>
        <div class="sub-heading">${settingsSubheader}</div>
        </div>
        <div>
        <div class="custom-control custom-switch">
        <input type="checkbox" id="${inputId}" class="custom-control-input">
        <label title="" for="${inputId}" class="custom-control-label"></label>
        </div>
        </div>
        </div>`;
    containerEl.appendChild(section);
    return document.getElementById(inputId);
  }
  async createSystemSettingTextbox(
    containerEl,
    settingsId,
    inputId,
    settingsHeader,
    settingsSubheader,
    placeholder,
    visible,
  ) {
    const section = document.createElement("div");
    section.setAttribute("id", settingsId);
    section.classList.add("card");
    section.style.display = visible ? "flex" : "none";
    section.innerHTML = `<div class="setting">
        <div>
        <h3>${settingsHeader}</h3>
        <div class="sub-heading">${settingsSubheader}</div>
        </div>
        <div>
        <div class="flex-grow-1 query-text-field-group">
        <input id="${inputId}" class="bg-secondary text-white border-secondary form-control" placeholder="${placeholder}">
        </div>
        </div>
        </div>`;
    containerEl.appendChild(section);
    return document.getElementById(inputId);
  }
  get serverUrl() {
    return window.location.origin + baseURL;
  }
  async waitForElement(
    selector,
    timeout = null,
    location = document.body,
    disconnectOnPageChange = false,
  ) {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver(async () => {
        if (document.querySelector(selector)) {
          resolve(document.querySelector(selector));
          observer.disconnect();
        } else {
          if (timeout) {
            async function timeOver() {
              return new Promise((resolve) => {
                setTimeout(() => {
                  observer.disconnect();
                  resolve(false);
                }, timeout);
              });
            }
            resolve(await timeOver());
          }
        }
      });

      observer.observe(location, {
        childList: true,
        subtree: true,
      });

      if (disconnectOnPageChange) {
        const stash = this;
        function disconnect() {
          resolve(false);
          observer.disconnect();
          stash.removeEventListener("stash:page", disconnect);
        }
        stash.addEventListener("stash:page", disconnect);
      }
    });
  }
  async waitForElementDeath(
    selector,
    location = document.body,
    disconnectOnPageChange = false,
  ) {
    return new Promise((resolve) => {
      const observer = new MutationObserver(async () => {
        if (!document.querySelector(selector)) {
          resolve(true);
          observer.disconnect();
        }
      });

      observer.observe(location, {
        childList: true,
        subtree: true,
      });

      if (disconnectOnPageChange) {
        const stash = this;
        function disconnect() {
          resolve(false);
          observer.disconnect();
          stash.removeEventListener("stash:page", disconnect);
        }
        stash.addEventListener("stash:page", disconnect);
      }
    });
  }
  async _listenForNonPageChanges({
    selector = "",
    location = document.body,
    listenType = "",
    event = "",
    recursive = false,
    reRunHandlePageChange = false,
    listenDefaultTab = true,
    callback = () => {},
  } = {}) {
    if (recursive) return;

    if (listenType === "tabs") {
      const tabsContainer = await this.waitForElement(
        selector,
        10000,
        location,
        true,
      );
      const stash = this;
      let previousEvent = "";

      function listenForTabClicks(domEvent) {
        const clickedChild = domEvent.target ? domEvent.target : domEvent;

        if (!clickedChild.classList?.contains("nav-link")) return;

        const tagName = clickedChild.getAttribute("data-rb-event-key");
        const parentEvent = tagName.split("-")[0];
        const childEvent = tagName.split("-").slice(1, -1).join("-");

        event = `stash:page:${parentEvent}:${childEvent}`;

        if (previousEvent === event) return;
        previousEvent = event;

        stash._dispatchPageEvent(`stash:page:any:${childEvent}`, false);
        stash._dispatchPageEvent(event);
      }

      if (listenDefaultTab)
        listenForTabClicks(tabsContainer.querySelector(".nav-link.active"));

      tabsContainer.addEventListener("click", listenForTabClicks);

      function removeEventListenerOnPageChange() {
        tabsContainer.removeEventListener("click", listenForTabClicks);
        stash.removeEventListener(
          "stash:page",
          removeEventListenerOnPageChange,
        );
      }
      stash.addEventListener("stash:page", removeEventListenerOnPageChange);
    } else if (await this.waitForElement(selector, null, location, true)) {
      this._dispatchPageEvent(event);

      if (await this.waitForElementDeath(selector, location, true)) {
        if (
          this._lastPathStr === window.location.pathname &&
          reRunHandlePageChange
        ) {
          // triggered after home, performer, studio, tag's edit page close
          this._handlePageChange({
            recursive: true,
            lastPathStr: this._lastPathStr,
            lastQueryStr: this._lastQueryStr,
            lastHref: this._lastHref,
            lastStashPageEvent: this._lastStashPageEvent,
          });
        }
      }
    }

    callback();
  }
  _dispatchPageEvent(event, addToHistory = true) {
    this.dispatchEvent(
      new CustomEvent(event, {
        detail: {
          event: event,
          lastEventState: {
            lastPathStr: this._lastPathStr,
            lastQueryStr: this._lastQueryStr,
            lastHref: this._lastHref,
            lastStashPageEvent: this._lastStashPageEvent,
          },
        },
      }),
    );

    if (addToHistory) {
      this.log.debug(`[Navigation] ${event}`);
      if (event.startsWith("stash:")) {
        this._lastStashPageEvent = event;
      }
    }

    // if (event!=="stash:page" && !addToHistory) this.log.debug(`[Navigation] ${event}`); // log ":any:" events
  }
  addPageListener(eventData) {
    const {
      event,
      regex,
      callback = () => {},
      manuallyHandleDispatchEvent = false,
    } = eventData;
    if (
      event &&
      !event?.startsWith("stash:") &&
      regex &&
      this._pageListeners[event] === undefined
    ) {
      this._pageListeners[event] = {
        regex: regex,
        callback: callback,
        manuallyHandleDispatchEvent: manuallyHandleDispatchEvent,
      };

      return event;
    } else {
      if (this._pageListeners[event] !== undefined) {
        console.error(`Can't add page listener: Event ${event} already exists`);
      } else if (event?.startsWith("stash:")) {
        console.error(
          `Can't add page listener: Event name can't start with "stash:"`,
        );
      } else {
        console.error(
          `Can't add page listener: Missing required argument(s) "event", "regex"`,
        );
      }

      return false;
    }
  }
  removePageListener(event) {
    if (event && !event?.startsWith("stash:") && this._pageListeners[event]) {
      delete this._pageListeners[event];
      return event;
    } else {
      if (this._pageListeners[event] === undefined && event) {
        console.error(
          `Can't remove page listener: Event ${event} doesn't exists`,
        );
      } else if (event?.startsWith("stash:")) {
        console.error(
          `Can't remove page listener: Event ${event} is a built in event`,
        );
      } else {
        console.error(`Can't remove page listener: Missing "event" argument`);
      }

      return false;
    }
  }
  stopPageListener() {
    clearInterval(this._pageURLCheckTimerId);
  }
  _initDefaultPageListeners() {
    this._pageListeners = {
      // scenes tab
      "stash:page:scenes": {
        regex: /scenes\?/,
        manuallyHandleDispatchEvent: true,
        handleDisplayView: "ignoreDisplayViewCondition",
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
            this.processTagger();
          }
        },
      },
      "stash:page:scene:new": {
        regex: /scenes\/new/,
      },
      "stash:page:scene": {
        regex: /scenes\/\d+\?/,
        callback: ({ recursive = false }) =>
          this._listenForNonPageChanges({
            selector: ".scene-tabs .nav-tabs",
            listenType: "tabs",
            recursive: recursive,
          }),
      },

      // images tab
      "stash:page:images": {
        regex: /images\?/,
        handleDisplayView: true,
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
          }
        },
      },
      "stash:page:image": {
        regex: /images\/\d+/,
        callback: ({ recursive = false }) =>
          this._listenForNonPageChanges({
            selector: ".image-tabs .nav-tabs",
            listenType: "tabs",
            recursive: recursive,
          }),
      },

      // movies tab
      "stash:page:movies": {
        regex: /movies\?/,
      },
      "stash:page:movie": {
        regex: /movies\/\d+/,
      },
      "stash:page:movie:scenes": {
        regex: /movies\/\d+\?/,
        callback: () => this.processTagger(),
      },

      // markers tab
      "stash:page:markers": {
        regex: /scenes\/markers/,
      },

      // galleries tab
      "stash:page:galleries": {
        regex: /galleries\?/,
        handleDisplayView: "ignoreDisplayViewCondition",
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
          }
        },
      },
      "stash:page:gallery:new": {
        regex: /galleries\/new/,
      },
      "stash:page:gallery:images": {
        regex: /galleries\/\d+\?/,
        manuallyHandleDispatchEvent: true,
        handleDisplayView: "ignoreDisplayViewCondition",
        callback: ({ lastHref, lastPathStr, recursive = false, event }) => {
          if (
            !this.matchUrl(lastHref, /\/galleries\/\d+\//) &&
            lastPathStr !== window.location.pathname
          ) {
            this._dispatchPageEvent("stash:page:gallery");
            this._listenForNonPageChanges({
              selector: ".gallery-tabs .nav-tabs .nav-link.active",
              event: "stash:page:gallery:details",
              recursive: recursive,
            });
          }

          this._dispatchPageEvent(event);

          this._listenForNonPageChanges({
            selector: ".gallery-tabs .nav-tabs",
            listenType: "tabs",
            recursive: recursive,
            listenDefaultTab: false,
          });
        },
      },
      "stash:page:gallery:add": {
        regex: /galleries\/\d+\/add/,
        manuallyHandleDispatchEvent: true,
        handleDisplayView: "ignoreDisplayViewCondition",
        callback: ({ lastHref, lastPathStr, recursive = false, event }) => {
          if (
            !this.matchUrl(lastHref, /\/galleries\/\d+/) &&
            lastPathStr !== window.location.pathname
          ) {
            this._dispatchPageEvent("stash:page:gallery");
            this._listenForNonPageChanges({
              selector: ".gallery-tabs .nav-tabs .nav-link.active",
              event: "stash:page:gallery:details",
              recursive: recursive,
            });
          }

          this._dispatchPageEvent(event);

          this._listenForNonPageChanges({
            selector: ".gallery-tabs .nav-tabs",
            listenType: "tabs",
            recursive: recursive,
            listenDefaultTab: false,
          });
        },
      },

      // performers tab
      "stash:page:performers": {
        regex: /performers\?/,
        handleDisplayView: "ignoreDisplayViewCondition",
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex) || this._detectReRenders) {
            this._dispatchPageEvent(event);
          }
        },
      },
      "stash:page:performer:new": {
        regex: /performers\/new/,
      },
      "stash:page:performer": {
        regex: /performers\/\d+/,
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
            this.processTagger();
          }

          this._listenForNonPageChanges({
            selector: "#performer-edit",
            event: "stash:page:performer:edit",
            reRunHandlePageChange: true,
            callback: () =>
              this._detectReRenders ? this._dispatchPageEvent(event) : null,
          });
        },
      },
      "stash:page:performer:scenes": {
        regex: /performers\/\d+\?/,
        handleDisplayView: "ignoreDisplayViewCondition",
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
          }
        },
      },
      "stash:page:performer:galleries": {
        regex: /performers\/\d+\/galleries/,
        handleDisplayView: "ignoreDisplayViewCondition",
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
          }
        },
      },
      "stash:page:performer:images": {
        regex: /performers\/\d+\/images/,
        handleDisplayView: "ignoreDisplayViewCondition",
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
          }
        },
      },
      "stash:page:performer:movies": {
        regex: /performers\/\d+\/movies/,
      },
      "stash:page:performer:appearswith": {
        regex: /performers\/\d+\/appearswith/,
        handleDisplayView: "ignoreDisplayViewCondition",
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
            this.processTagger();
          }
        },
      },

      // studios tab
      "stash:page:studios": {
        regex: /studios\?/,
        handleDisplayView: "ignoreDisplayViewCondition",
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
          }
        },
      },
      "stash:page:studio:new": {
        regex: /studios\/new/,
      },
      "stash:page:studio": {
        regex: /studios\/\d+/,
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
            this.processTagger();
          }

          this._listenForNonPageChanges({
            selector: "#studio-edit",
            event: "stash:page:studio:edit",
            reRunHandlePageChange: true,
            callback: () =>
              this._detectReRenders ? this._dispatchPageEvent(event) : null,
          });
        },
      },
      "stash:page:studio:scenes": {
        regex: /studios\/\d+\?/,
        handleDisplayView: "ignoreDisplayViewCondition",
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
          }
        },
      },
      "stash:page:studio:galleries": {
        regex: /studios\/\d+\/galleries/,
        handleDisplayView: "ignoreDisplayViewCondition",
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
          }
        },
      },
      "stash:page:studio:images": {
        regex: /studios\/\d+\/images/,
        handleDisplayView: "ignoreDisplayViewCondition",
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
          }
        },
      },
      "stash:page:studio:performers": {
        regex: /studios\/\d+\/performers/,
        handleDisplayView: "ignoreDisplayViewCondition",
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
          }
        },
      },
      "stash:page:studio:movies": {
        regex: /studios\/\d+\/movies/,
      },
      "stash:page:studio:childstudios": {
        regex: /studios\/\d+\/childstudios/,
        handleDisplayView: "ignoreDisplayViewCondition",
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
          }
        },
      },

      // tags tab
      "stash:page:tags": {
        regex: /tags\?/,
        handleDisplayView: "ignoreDisplayViewCondition",
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
          }
        },
      },
      "stash:page:tag:new": {
        regex: /tags\/new/,
      },
      "stash:page:tag": {
        regex: /tags\/\d+/,
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
            this.processTagger();
          }

          this._listenForNonPageChanges({
            selector: "#tag-edit",
            event: "stash:page:tag:edit",
            reRunHandlePageChange: true,
            callback: () =>
              this._detectReRenders ? this._dispatchPageEvent(event) : null,
          });
        },
      },
      "stash:page:tag:scenes": {
        regex: /tags\/\d+\?/,
        handleDisplayView: "ignoreDisplayViewCondition",
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
          }
        },
      },
      "stash:page:tag:galleries": {
        regex: /tags\/\d+\/galleries/,
        handleDisplayView: "ignoreDisplayViewCondition",
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
          }
        },
      },
      "stash:page:tag:images": {
        regex: /tags\/\d+\/images/,
        handleDisplayView: "ignoreDisplayViewCondition",
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
          }
        },
      },
      "stash:page:tag:markers": {
        regex: /tags\/\d+\/markers/,
      },
      "stash:page:tag:performers": {
        regex: /tags\/\d+\/performers/,
        handleDisplayView: "ignoreDisplayViewCondition",
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
          }
        },
      },

      // settings page
      "stash:page:settings": {
        regex: /settings/,
        manuallyHandleDispatchEvent: true,
        callback: ({ lastHref, event, regex }) => {
          if (!this.matchUrl(lastHref, regex)) {
            this._dispatchPageEvent(event);
          }
        },
      },
      "stash:page:settings:tasks": {
        regex: /settings\?tab=tasks/,
        callback: () => this.hidePluginTasks(),
      },
      "stash:page:settings:library": {
        regex: /settings\?tab=library/,
      },
      "stash:page:settings:interface": {
        regex: /settings\?tab=interface/,
      },
      "stash:page:settings:security": {
        regex: /settings\?tab=security/,
      },
      "stash:page:settings:metadata-providers": {
        regex: /settings\?tab=metadata-providers/,
      },
      "stash:page:settings:services": {
        regex: /settings\?tab=services/,
      },
      "stash:page:settings:system": {
        regex: /settings\?tab=system/,
        callback: () => this.createSettings(),
      },
      "stash:page:settings:plugins": {
        regex: /settings\?tab=plugins/,
      },
      "stash:page:settings:logs": {
        regex: /settings\?tab=logs/,
      },
      "stash:page:settings:tools": {
        regex: /settings\?tab=tools/,
      },
      "stash:page:settings:changelog": {
        regex: /settings\?tab=changelog/,
      },
      "stash:page:settings:about": {
        regex: /settings\?tab=about/,
      },

      // stats page
      "stash:page:stats": {
        regex: /stats/,
      },

      // home page
      "stash:page:home": {
        regex: /$/,
        callback: () =>
          this._listenForNonPageChanges({
            selector: ".recommendations-container-edit",
            event: "stash:page:home:edit",
            reRunHandlePageChange: true,
          }),
      },
    };
  }
  _handlePageChange(args) {
    const events = Object.keys(this._pageListeners);

    for (const event of events) {
      const {
        regex,
        callback = () => {},
        manuallyHandleDispatchEvent = false,
        handleDisplayView = false,
      } = this._pageListeners[event];

      let isDisplayViewPage = false;
      let isGridPage, isListPage, isWallPage, isTaggerPage;

      const splitEvent = event.split(":");
      const tabPage = { page: "", tab: "" };
      let childAnyEventCondition = false;

      if (splitEvent.length === 4) {
        childAnyEventCondition = true;
        tabPage.page = splitEvent[2];
        tabPage.tab = splitEvent[3];
      }

      splitEvent.pop();

      if (handleDisplayView) {
        isGridPage = this.matchUrl(
          window.location.href,
          concatRegexp(regex, /(?!.*disp=)/),
        );
        isListPage = this.matchUrl(
          window.location.href,
          concatRegexp(regex, /.*disp=1/),
        );
        isWallPage = this.matchUrl(
          window.location.href,
          concatRegexp(regex, /.*disp=2/),
        );
        isTaggerPage = this.matchUrl(
          window.location.href,
          concatRegexp(regex, /.*disp=3/),
        );

        if (isListPage || isWallPage || isTaggerPage) isDisplayViewPage = true;
      }

      function dispatchViewEvent(view, stash) {
        stash._dispatchPageEvent(event + `:${view}`);
        if (childAnyEventCondition) {
          stash._dispatchPageEvent(
            "stash:page:" + tabPage.page + `:any:${view}`,
            false,
          );
          stash._dispatchPageEvent(
            "stash:page:any:" + tabPage.tab + `:${view}`,
            false,
          );
        } else {
          stash._dispatchPageEvent(`stash:page:any:${view}`, false);
        }
      }

      const handleDisplayViewCondition =
        handleDisplayView !== true ||
        (handleDisplayView && (!isDisplayViewPage || args.lastHref === ""));

      if (
        this.matchUrl(window.location.href, regex) &&
        handleDisplayViewCondition
      ) {
        if (!manuallyHandleDispatchEvent) this._dispatchPageEvent(event);
        callback({
          ...args,
          location: window.location,
          event: event,
          regex: regex,
        });

        if (isGridPage) dispatchViewEvent("grid", this);
      }

      if (handleDisplayView) {
        let view = "";
        switch (true) {
          case isListPage:
            view = "list";
            break;
          case isWallPage:
            view = "wall";
            break;
          case isTaggerPage:
            view = "tagger";
            break;
        }
        if (view) dispatchViewEvent(view, this);
      }
    }
  }
  addEventListeners(events, callback, ...options) {
    events.forEach((event) => {
      this.addEventListener(event, callback, ...options);
    });
  }
  hidePluginTasks() {
    // hide userscript functions plugin tasks
    waitForElementByXpath(
      "//div[@id='tasks-panel']//h3[text()='Userscript Functions']/ancestor::div[contains(@class, 'setting-group')]",
      (elementId, el) => {
        const tasks = el.querySelectorAll(".setting");
        for (const task of tasks) {
          const taskName = task.querySelector("h3").innerText;
          task.classList.add(
            this.visiblePluginTasks.indexOf(taskName) === -1
              ? "d-none"
              : "d-flex",
          );
          this.dispatchEvent(
            new CustomEvent("stash:plugin:task", {
              detail: {
                taskName,
                task,
              },
            }),
          );
        }
      },
    );
  }
  async updateConfigValueTask(sectionKey, propName, value) {
    return this.runPluginTask("userscript_functions", "Update Config Value", [
      {
        key: "section_key",
        value: {
          str: sectionKey,
        },
      },
      {
        key: "prop_name",
        value: {
          str: propName,
        },
      },
      {
        key: "value",
        value: {
          str: value,
        },
      },
    ]);
  }
  async getConfigValueTask(sectionKey, propName) {
    await this.runPluginTask("userscript_functions", "Get Config Value", [
      {
        key: "section_key",
        value: {
          str: sectionKey,
        },
      },
      {
        key: "prop_name",
        value: {
          str: propName,
        },
      },
    ]);

    // poll logs until plugin task output appears
    const prefix = `[Plugin / Userscript Functions] get_config_value: [${sectionKey}][${propName}] =`;
    return this.pollLogsForMessage(prefix);
  }
  async pollLogsForMessage(prefix) {
    const reqTime = Date.now();
    const reqData = {
      variables: {},
      query: `query Logs {
                        logs {
                            time
                            level
                            message
                        }
                    }`,
    };
    await new Promise((r) => setTimeout(r, 500));
    let retries = 0;
    while (true) {
      const delay = 2 ** retries * 100;
      await new Promise((r) => setTimeout(r, delay));
      retries++;

      const logs = await this.callGQL(reqData);
      for (const log of logs.data.logs) {
        const logTime = Date.parse(log.time);
        if (logTime > reqTime && log.message.startsWith(prefix)) {
          return log.message.replace(prefix, "").trim();
        }
      }

      if (retries >= 5) {
        throw `Poll logs failed for message: ${prefix}`;
      }
    }
  }
  processTagger() {
    waitForElementByXpath("//button[text()='Scrape All']", (xpath, el) => {
      this.dispatchEvent(
        new CustomEvent("tagger", {
          detail: el,
        }),
      );

      const searchItemContainer =
        document.querySelector(".tagger-container").lastChild;

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (
              node?.classList?.contains("entity-name") &&
              node.innerText.startsWith("Performer:")
            ) {
              this.dispatchEvent(
                new CustomEvent("tagger:mutation:add:remoteperformer", {
                  detail: {
                    node,
                    mutation,
                  },
                }),
              );
            } else if (
              node?.classList?.contains("entity-name") &&
              node.innerText.startsWith("Studio:")
            ) {
              this.dispatchEvent(
                new CustomEvent("tagger:mutation:add:remotestudio", {
                  detail: {
                    node,
                    mutation,
                  },
                }),
              );
            } else if (
              node.tagName === "SPAN" &&
              node.innerText.startsWith("Matched:")
            ) {
              this.dispatchEvent(
                new CustomEvent("tagger:mutation:add:local", {
                  detail: {
                    node,
                    mutation,
                  },
                }),
              );
            } else if (node.tagName === "UL") {
              this.dispatchEvent(
                new CustomEvent("tagger:mutation:add:container", {
                  detail: {
                    node,
                    mutation,
                  },
                }),
              );
            } else if (node?.classList?.contains("col-lg-6")) {
              this.dispatchEvent(
                new CustomEvent("tagger:mutation:add:subcontainer", {
                  detail: {
                    node,
                    mutation,
                  },
                }),
              );
            } else if (node.tagName === "H5") {
              // scene date
              this.dispatchEvent(
                new CustomEvent("tagger:mutation:add:date", {
                  detail: {
                    node,
                    mutation,
                  },
                }),
              );
            } else if (
              node.tagName === "DIV" &&
              node?.classList?.contains("d-flex") &&
              node?.classList?.contains("flex-column")
            ) {
              // scene stashid, url, details
              this.dispatchEvent(
                new CustomEvent("tagger:mutation:add:detailscontainer", {
                  detail: {
                    node,
                    mutation,
                  },
                }),
              );
            } else {
              this.dispatchEvent(
                new CustomEvent("tagger:mutation:add:other", {
                  detail: {
                    node,
                    mutation,
                  },
                }),
              );
            }
          });
        });
        this.dispatchEvent(
          new CustomEvent("tagger:mutations:searchitems", {
            detail: mutations,
          }),
        );
      });
      observer.observe(searchItemContainer, {
        childList: true,
        subtree: true,
      });

      const taggerContainerHeader = document.querySelector(
        ".tagger-container-header",
      );
      const taggerContainerHeaderObserver = new MutationObserver(
        (mutations) => {
          this.dispatchEvent(
            new CustomEvent("tagger:mutations:header", {
              detail: mutations,
            }),
          );
        },
      );
      taggerContainerHeaderObserver.observe(taggerContainerHeader, {
        childList: true,
        subtree: true,
      });

      for (const searchItem of document.querySelectorAll(".search-item")) {
        this.dispatchEvent(
          new CustomEvent("tagger:searchitem", {
            detail: searchItem,
          }),
        );
      }

      if (!document.getElementById("progress-bar")) {
        const progressBar = createElementFromHTML(
          `<div id="progress-bar" class="progress"><div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div></div>`,
        );
        progressBar.classList.add("progress");
        progressBar.style.display = "none";
        taggerContainerHeader.appendChild(progressBar);
      }
    });
    waitForElementByXpath(
      "//div[@class='tagger-container-header']/div/div[@class='row']/h4[text()='Configuration']",
      (xpath, el) => {
        this.dispatchEvent(
          new CustomEvent("tagger:configuration", {
            detail: el,
          }),
        );
      },
    );
  }
  setProgress(value) {
    const progressBar = document.getElementById("progress-bar");
    if (progressBar) {
      progressBar.firstChild.style.width = value + "%";
      progressBar.style.display = value <= 0 || value > 100 ? "none" : "flex";
    }
  }
  processRemoteScenes(data) {
    if (data.data?.scrapeMultiScenes) {
      for (const matchResults of data.data.scrapeMultiScenes) {
        for (const scene of matchResults) {
          this.remoteScenes[scene.remote_site_id] = scene;
        }
      }
    } else if (data.data?.scrapeSingleScene) {
      for (const scene of data.data.scrapeSingleScene) {
        this.remoteScenes[scene.remote_site_id] = scene;
      }
    }
  }
  processScene(data) {
    if (data.data.findScene) {
      this.scenes[data.data.findScene.id] = data.data.findScene;
    }
  }
  processScenes(data) {
    if (data.data.findScenes?.scenes) {
      for (const scene of data.data.findScenes.scenes) {
        this.scenes[scene.id] = scene;
      }
    }
  }
  processStudios(data) {
    if (data.data.findStudios?.studios) {
      for (const studio of data.data.findStudios.studios) {
        this.studios[studio.id] = studio;
      }
    }
  }
  processPerformers(data) {
    if (data.data.findPerformers?.performers) {
      for (const performer of data.data.findPerformers.performers) {
        this.performers[performer.id] = performer;
      }
    }
  }
  processApiKey(data) {
    if (data.data.generateAPIKey != null && this.pluginVersion) {
      this.updateConfigValueTask("STASH", "api_key", data.data.generateAPIKey);
    }
  }
  parseSearchItem(searchItem) {
    const urlNode = searchItem.querySelector("a.scene-link");
    const url = new URL(urlNode.href);
    const id = url.pathname.replace(baseURL + "scenes/", "");
    const data = this.scenes[id];
    const nameNode = searchItem.querySelector(
      "a.scene-link > div.TruncatedText",
    );
    const name = nameNode.innerText;
    const queryInput = searchItem.querySelector("input.text-input");
    const performerNodes = searchItem.querySelectorAll(
      ".performer-tag-container",
    );

    return {
      urlNode,
      url,
      id,
      data,
      nameNode,
      name,
      queryInput,
      performerNodes,
    };
  }
  parseSearchResultItem(searchResultItem) {
    const remoteUrlNode = searchResultItem.querySelector(
      ".scene-details .optional-field .optional-field-content a",
    );
    const remoteId = remoteUrlNode?.href.split("/").pop();
    const remoteUrl = remoteUrlNode?.href ? new URL(remoteUrlNode.href) : null;
    const remoteData = this.remoteScenes[remoteId];

    const sceneDetailNodes = searchResultItem.querySelectorAll(
      ".scene-details .optional-field .optional-field-content",
    );
    let urlNode = null;
    let detailsNode = null;
    for (const sceneDetailNode of sceneDetailNodes) {
      if (
        sceneDetailNode.innerText.startsWith("http") &&
        remoteUrlNode?.href !== sceneDetailNode.innerText
      ) {
        urlNode = sceneDetailNode;
      } else if (!sceneDetailNode.innerText.startsWith("http")) {
        detailsNode = sceneDetailNode;
      }
    }

    const imageNode = searchResultItem.querySelector(
      ".scene-image-container .optional-field .optional-field-content",
    );

    const metadataNode = searchResultItem.querySelector(".scene-metadata");
    const titleNode = metadataNode.querySelector(
      "h4 .optional-field .optional-field-content",
    );
    const codeAndDateNodes = metadataNode.querySelectorAll(
      "h5 .optional-field .optional-field-content",
    );
    let codeNode = null;
    let dateNode = null;
    for (const node of codeAndDateNodes) {
      if (node.textContent.includes("-")) {
        dateNode = node;
      } else {
        codeNode = node;
      }
    }

    const entityNodes = searchResultItem.querySelectorAll(".entity-name");
    let studioNode = null;
    const performerNodes = [];
    for (const entityNode of entityNodes) {
      if (entityNode.innerText.startsWith("Studio:")) {
        studioNode = entityNode;
      } else if (entityNode.innerText.startsWith("Performer:")) {
        performerNodes.push(entityNode);
      }
    }

    const matchNodes = searchResultItem.querySelectorAll(
      "div.col-lg-6 div.mt-2 div.row.no-gutters.my-2 span.ml-auto",
    );
    const matches = [];
    for (const matchNode of matchNodes) {
      let matchType = null;
      const entityNode = matchNode.parentElement.querySelector(".entity-name");

      const matchName = matchNode.querySelector(
        ".optional-field-content b",
      ).innerText;
      const remoteName = entityNode.querySelector("b").innerText;

      let data;
      if (entityNode.innerText.startsWith("Performer:")) {
        matchType = "performer";
        if (remoteData) {
          data = remoteData.performers.find(
            (performer) => performer.name === remoteName,
          );
        }
      } else if (entityNode.innerText.startsWith("Studio:")) {
        matchType = "studio";
        if (remoteData) {
          data = remoteData.studio;
        }
      }

      matches.push({
        matchType,
        matchNode,
        entityNode,
        matchName,
        remoteName,
        data,
      });
    }

    return {
      remoteUrlNode,
      remoteId,
      remoteUrl,
      remoteData,
      urlNode,
      detailsNode,
      imageNode,
      titleNode,
      codeNode,
      dateNode,
      studioNode,
      performerNodes,
      matches,
    };
  }
}

window.stash = new Stash();

function waitForElementQuerySelector(query, callback, time) {
  time = typeof time !== "undefined" ? time : 100;
  window.setTimeout(() => {
    const element = document.querySelector(query);
    if (element) {
      callback(query, element);
    } else {
      waitForElementQuerySelector(query, callback, time);
    }
  }, time);
}

function waitForElementClass(elementId, callback, time) {
  time = typeof time !== "undefined" ? time : 100;
  window.setTimeout(() => {
    const element = document.getElementsByClassName(elementId);
    if (element.length > 0) {
      callback(elementId, element);
    } else {
      waitForElementClass(elementId, callback, time);
    }
  }, time);
}

function waitForElementId(elementId, callback, time) {
  time = typeof time !== "undefined" ? time : 100;
  window.setTimeout(() => {
    const element = document.getElementById(elementId);
    if (element != null) {
      callback(elementId, element);
    } else {
      waitForElementId(elementId, callback, time);
    }
  }, time);
}

function waitForElementByXpath(xpath, callback, time) {
  time = typeof time !== "undefined" ? time : 100;
  window.setTimeout(() => {
    const element = getElementByXpath(xpath);
    if (element) {
      callback(xpath, element);
    } else {
      waitForElementByXpath(xpath, callback, time);
    }
  }, time);
}

function getElementByXpath(xpath, contextNode) {
  return document.evaluate(
    xpath,
    contextNode || document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue;
}

function createElementFromHTML(htmlString) {
  const div = document.createElement("div");
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes.
  return div.firstChild;
}

function getElementByXpath(xpath, contextNode) {
  return document.evaluate(
    xpath,
    contextNode || document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue;
}

function getElementsByXpath(xpath, contextNode) {
  return document.evaluate(
    xpath,
    contextNode || document,
    null,
    XPathResult.ORDERED_NODE_ITERATOR_TYPE,
    null,
  );
}

function getClosestAncestor(el, selector, stopSelector) {
  let retval = null;
  while (el) {
    if (el.matches(selector)) {
      retval = el;
      break;
    } else if (stopSelector && el.matches(stopSelector)) {
      break;
    }
    el = el.parentElement;
  }
  return retval;
}

function setNativeValue(element, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(element, "value").set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(
    prototype,
    "value",
  ).set;

  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else {
    valueSetter.call(element, value);
  }
}

function updateTextInput(element, value) {
  setNativeValue(element, value);
  element.dispatchEvent(
    new Event("input", {
      bubbles: true,
    }),
  );
}

function concatRegexp(reg, exp) {
  let flags = reg.flags + exp.flags;
  flags = Array.from(new Set(flags.split(""))).join();
  return new RegExp(reg.source + exp.source, flags);
}

function sortElementChildren(node) {
  const items = node.childNodes;
  const itemsArr = [];
  for (const i in items) {
    if (items[i].nodeType == Node.ELEMENT_NODE) {
      // get rid of the whitespace text nodes
      itemsArr.push(items[i]);
    }
  }

  itemsArr.sort((a, b) => {
    return a.innerHTML == b.innerHTML ? 0 : a.innerHTML > b.innerHTML ? 1 : -1;
  });

  for (let i = 0; i < itemsArr.length; i++) {
    node.appendChild(itemsArr[i]);
  }
}

function xPathResultToArray(result) {
  let node = null;
  const nodes = [];
  while ((node = result.iterateNext())) {
    nodes.push(node);
  }
  return nodes;
}

function createStatElement(container, title, heading) {
  const statEl = document.createElement("div");
  statEl.classList.add("stats-element");
  container.appendChild(statEl);

  const statTitle = document.createElement("p");
  statTitle.classList.add("title");
  statTitle.innerText = title;
  statEl.appendChild(statTitle);

  const statHeading = document.createElement("p");
  statHeading.classList.add("heading");
  statHeading.innerText = heading;
  statEl.appendChild(statHeading);
}

const reloadImg = (url) =>
  fetch(url, {
    cache: "reload",
    mode: "no-cors",
  }).then(() =>
    document.body
      .querySelectorAll(`img[src='${url}']`)
      .forEach((img) => (img.src = url)),
  );
