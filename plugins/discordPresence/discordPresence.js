(async function () {
  /**
   * @typedef {{
   *  discordClientId?: string;
   *  discordLargeImageKey?: string;
   *  discordShowUrlButton?: boolean;
   *  discordUrlButtonText?: string;
   * }} PluginConfig
   */

  /**
   * @typedef {{
   * id, title, details?, urls?: string[], date, created_at, resume_time,
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
      details
      urls
      date
      created_at
      resume_time
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

  /** @type {Required<PluginConfig>} */
  const CONFIG = {
    discordClientId: "1236860180407521341",
    discordLargeImageKey: "stashbox",
    discordShowUrlButton: false,
    discordUrlButtonText: "Watch",
    ...(await getPluginConfig()),
  };

  console.debug("Discord Presence Plugin: config", CONFIG);

  let SCENE_ID = null;
  let INTERVAL_ID = null;

  const doUpdatingPresence = (e) => {
    clearInterval(INTERVAL_ID);
    SCENE_ID = null;
    INTERVAL_ID = null;

    const pathname = e.detail.data.location.pathname;

    if (!pathname.startsWith("/scenes")) {
      clearDiscordActivity();
      return;
    }

    SCENE_ID = parseInt(pathname.split("/")[2], 10);

    if (!!SCENE_ID === false) {
      clearDiscordActivity();
      console.warn("Discord Presence Plugin: sceneId is invalid", SCENE_ID);
      return;
    }

    setDiscordActivity();
    INTERVAL_ID = setInterval(setDiscordActivity, 10000);
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
  window.addEventListener("beforeunload", async () => {
    await clearDiscordActivity();
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

  async function clearDiscordActivity() {
    if (ws.OPEN) {
      ws.send(JSON.stringify({ action: "disconnect" }));
    }
  }

  async function setDiscordActivity() {
    const { sceneData, duration } = await getSceneData(SCENE_ID);

    const url =
      CONFIG.discordShowUrlButton && sceneData?.urls.length > 0
        ? sceneData?.urls[0]
        : undefined;
    const studio = sceneData?.studio?.name;

    const body = sceneData
      ? {
          details: sceneData.title,
          state: studio ? `by ${studio}` : undefined,
          largeImageKey: CONFIG.discordLargeImageKey,
          startTimestamp: Date.now() + sceneData["resume_time"] * 1000,
          endTimestamp:
            Date.now() + (duration - sceneData["resume_time"]) * 1000,
          buttons: url
            ? [{ label: CONFIG.discordUrlButtonText, url }]
            : undefined,
          instance: true,
        }
      : undefined;

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
})();
