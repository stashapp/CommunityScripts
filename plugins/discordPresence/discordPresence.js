(async function () {
  /**
   * @typedef {{
   *  discordClientId?: string;
   *  discordDetailsText?: string;
   *  discordStateText?: string;
   *  discordShowImage?: boolean;
   *  discordLargeImageKey?: string;
   *  discordLargeImageText?: string;
   *  discordShowUrlButton?: boolean;
   *  discordUrlButtonText?: string;
   * }} PluginConfig
   */

  /**
   * @typedef {{
   * id, title, code, details, director, urls?: string[], date, rating100, o_counter,
   * organized, interactive, interactive_speed, created_at, updated_at, resume_time,
   * last_played_at, play_duration, play_count, files: {duration:number}[], studio?: {id, name}
   * }} SceneData
   */

  /**
   * @typedef {{ studio_name: string, url: string, file_duration: string }
   * & Omit<SceneData, ['urls', 'files', 'studio']>
   * } FlattenedSceneData
   */

  /**
   * @typedef {{ data: { findScene: SceneData | null } }} GQLSceneDataResponse
   */

  const SCENE_GQL_QUERY = `
    query FindScene($id: ID!) {
      findScene(id: $id) {
        ...SceneData
        __typename
      }
    }
    
    fragment SceneData on Scene {
      id
      title
      code
      details
      director
      urls
      date
      rating100
      o_counter
      organized
      interactive
      interactive_speed
      created_at
      updated_at
      resume_time
      last_played_at
      play_duration
      play_count
      files {
        duration
        __typename
      }
      studio {
        ...SlimStudioData
        __typename
      }
      __typename
    }
    
    fragment SlimStudioData on Studio {
      id
      name
      __typename
    }
  `;

  while (!window.stash) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const PLUGIN_ID = "discordPresence";

  let userConfig = await getPluginConfig();
  console.debug("Discord Presence Plugin: user config", userConfig);

  for (let [key, val] of Object.entries(userConfig)) {
    if (val === "" || val === undefined || val === null) {
      delete userConfig[key];
    }
  }

  /** @type {Required<PluginConfig>} */
  const CONFIG = {
    // DEFAULTS
    discordClientId: "1236860180407521341",
    discordDetailsText: "{title}",
    discordStateText: "from {studio_name}",
    discordShowImage: false,
    discordLargeImageKey: "stashbox",
    discordLargeImageText: "Stashapp",
    discordShowUrlButton: false,
    discordUrlButtonText: "Watch",

    ...userConfig,
  };

  console.debug("Discord Presence Plugin: loaded config", CONFIG);

  let SCENE_ID = null;
  let INTERVAL_ID = null;

  const doUpdatingPresence = (e) => {
    clearInterval(INTERVAL_ID);

    const pathname = e.detail.data.location.pathname;

    if (!pathname.match(/\/scenes\/\d+/)) {
      clearDiscordActivity();
      return;
    }

    SCENE_ID = parseInt(pathname.split("/")[2], 10);

    setDiscordActivity();
    INTERVAL_ID = setInterval(setDiscordActivity, 5000);
  };

  // https://github.com/lolamtisch/Discord-RPC-Extension/releases
  const ws = new WebSocket("ws://localhost:6969");
  ws.addEventListener("open", () =>
    PluginApi.Event.addEventListener("stash:location", doUpdatingPresence)
  );
  ws.addEventListener("close", () => {
    clearInterval(INTERVAL_ID);
    PluginApi.Event.removeEventListener("stash:location", doUpdatingPresence);
  });
  ws.addEventListener("error", () => {
    PluginApi.Event.removeEventListener("stash:location", doUpdatingPresence);
  });
  window.addEventListener("beforeunload", () => {
    clearDiscordActivity();
  });

  /** @returns {Promise<PluginConfig>} */
  async function getPluginConfig() {
    const reqData = {
      operationName: "Configuration",
      variables: {},
      query: `query Configuration { configuration { plugins } }`,
    };
    const data = await stash.callGQL(reqData);
    return data.data.configuration.plugins[PLUGIN_ID];
  }

  /** @return {Promise<FlattenedSceneData | null>} */
  async function getSceneData(sceneId) {
    if (!sceneId) {
      return { sceneData: null, duration: 0 };
    }
    const reqData = {
      operationName: "FindScene",
      variables: { id: sceneId },
      query: SCENE_GQL_QUERY,
    };

    /** @type {GQLSceneDataResponse} */
    const data = await stash.callGQL(reqData);
    const sceneData = data.data.findScene;

    if (sceneData === null) {
      return null;
    }

    const newProps = {
      studio_name: sceneData.studio?.name ?? "Unknown Studio",
      url: sceneData.urls?.length ? sceneData.urls[0] : "",
      file_duration: sceneData.files?.length ? sceneData.files[0].duration : 0,
    };

    delete sceneData.urls;
    delete sceneData.studio;
    delete sceneData.files;

    return { ...sceneData, ...newProps };
  }

  function clearDiscordActivity() {
    if (!!SCENE_ID === false || ws.OPEN !== 1) {
      return;
    }

    SCENE_ID = null;
    ws.send(JSON.stringify({ action: "disconnect" }));
  }

  async function setDiscordActivity() {
    const sceneData = await getSceneData(SCENE_ID);

    if (!sceneData) {
      return;
    }

    const currentTime = getCurrentVideoTime() ?? 0;
    const endTimestamp =
      Date.now() + (sceneData.file_duration - currentTime) * 1000;

    let body = {};

    if (sceneData !== null) {
      body = {
        details: replaceVars(CONFIG.discordDetailsText, sceneData),
        state: replaceVars(CONFIG.discordStateText, sceneData),
        largeImageKey: CONFIG.discordShowImage
          ? CONFIG.discordLargeImageKey
          : undefined,
        largeImageText: replaceVars(CONFIG.discordLargeImageText, sceneData),
        endTimestamp: sceneData.file_duration > 0 ? endTimestamp : undefined,
        buttons: CONFIG.discordShowUrlButton
          ? [
              {
                label: replaceVars(CONFIG.discordUrlButtonText, sceneData),
                url: sceneData.url,
              },
            ]
          : undefined,
        instance: true,
      };
    }

    if (!ws.OPEN) {
      return;
    }

    ws.send(
      JSON.stringify({
        clientId: CONFIG.discordClientId,
        extId: "stash-discord-rpc-plugin",
        presence: body,
      })
    );
  }

  function getCurrentVideoTime() {
    const videoElem = document.querySelector("#VideoJsPlayer video");

    if (!videoElem) {
      return null;
    }

    return videoElem.currentTime;
  }

  /**
   * Performs string replacement on templated config vars with scene data
   * @param {string} templateStr
   * @param {FlattenedSceneData} sceneData
   */
  function replaceVars(templateStr, sceneData) {
    const pattern = /{\s*(\w+?)\s*}/g;
    return templateStr.replace(pattern, (_, token) => sceneData[token] ?? "");
  }
})();
