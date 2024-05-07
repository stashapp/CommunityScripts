(async function () {
  /**
   * @typedef {{
   *  discordClientId?: string;
   *  discordLargeImageKey?: string;
   *  discordShowImage?: boolean;
   *  discordShowUrlButton?: boolean;
   *  discordUrlButtonText?: string;
   * }} PluginConfig
   */

  /**
   * @typedef {{
   * id, title, urls?: string[], date,
   * files: {duration:number}[], studio?: {id, name}
   * }} SceneData
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
      urls
      date
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
    discordClientId: "1236860180407521341",
    discordLargeImageKey: "stashbox",
    discordShowImage: true,
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

    return {
      sceneData: data.data.findScene,
      duration: data.data.findScene?.files[0]?.duration ?? 0,
    };
  }

  function clearDiscordActivity() {
    if (!!SCENE_ID === false || ws.OPEN !== 1) {
      return;
    }

    SCENE_ID = null;
    ws.send(JSON.stringify({ action: "disconnect" }));
  }

  async function setDiscordActivity() {
    const { sceneData, duration } = await getSceneData(SCENE_ID);

    const url =
      CONFIG.discordShowUrlButton && sceneData?.urls.length > 0
        ? sceneData?.urls[0]
        : undefined;
    const studio = sceneData?.studio?.name;

    const currentTime = getCurrentVideoTime() ?? 0;
    const endTimestamp = Date.now() + (duration - currentTime) * 1000;

    let body = {};

    if (sceneData !== null) {
      body = {
        details: sceneData.title,
        state: studio ? `by ${studio}` : undefined,
        largeImageKey: CONFIG.discordShowImage
          ? CONFIG.discordLargeImageKey
          : undefined,
        endTimestamp,
        buttons: url
          ? [{ label: CONFIG.discordUrlButtonText, url }]
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
})();
