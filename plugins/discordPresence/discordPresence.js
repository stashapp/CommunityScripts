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
      files { duration }
      studio { name }
    }
  `;

  const PLUGIN_ID = "discordPresence";

  const userConfig = await csLib.getConfiguration(PLUGIN_ID, {});
  console.debug("Discord Presence Plugin: user config", userConfig);

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
  let WS_ALIVE = false;

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
  ws.addEventListener("message", () => (WS_ALIVE = true));
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
  // set timeout for checking liveliness
  const checkLiveliness = () => {
    if (!WS_ALIVE) {
      unbindVideoListener(document.querySelector("#VideoJsPlayer video"));
      clearInterval(INTERVAL_ID);
      throw new Error(`Discord Presence Plugin: Discord RPC Extension not running
      Please consult the README on how to set up the Discord RPC Extension
      (https://github.com/stashapp/CommunityScripts/tree/main/plugins/discordPresence)`);
    }
  };
  setTimeout(checkLiveliness, 2000);

  /** @return {Promise<FlattenedSceneData | null>} */
  async function getSceneData(sceneId) {
    if (!sceneId) {
      return { sceneData: null, duration: 0 };
    }
    const reqData = {
      variables: { id: sceneId },
      query: SCENE_GQL_QUERY,
    };

    /** @type {GQLSceneDataResponse} */
    const sceneData = await csLib
      .callGQL(reqData)
      .then((data) => data.findScene);

    if (!sceneData) return null;

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
    if (!sceneData) return;

    const currentTime = getCurrentVideoTime() ?? 0;
    const endTimestamp =
      Date.now() + (sceneData.file_duration - currentTime) * 1000;

    let body = {
      details: replaceVars(CONFIG.discordDetailsText, sceneData),
      state: replaceVars(CONFIG.discordStateText, sceneData),
      largeImageKey: CONFIG.discordShowImage
        ? CONFIG.discordLargeImageKey
        : undefined,
      largeImageText: replaceVars(CONFIG.discordLargeImageText, sceneData),
      endTimestamp: sceneData.file_duration > 0 ? endTimestamp : undefined,
      buttons:
        CONFIG.discordShowUrlButton && URL.canParse(sceneData.url)
          ? [
              {
                label: replaceVars(CONFIG.discordUrlButtonText, sceneData),
                url: sceneData.url,
              },
            ]
          : undefined,
      instance: true,
    };

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

  const getCurrentVideoTime = () =>
    document.querySelector("#VideoJsPlayer video")?.currentTime;

  /**
   * Performs string replacement on templated config vars with scene data
   * @param {string} templateStr
   * @param {FlattenedSceneData} sceneData
   */
  function replaceVars(templateStr, sceneData) {
    const pattern = /{\s*(\w+?)\s*}/g;
    return templateStr.replace(pattern, (_, token) => sceneData[token] ?? "");
  }

  // add listener for video events
  const videoListener = (video) => {
    SCENE_ID = parseInt(location.pathname.split("/")[2]);
    video.addEventListener("playing", setDiscordActivity);
    video.addEventListener("play", setDiscordActivity);
    video.addEventListener("seeked", setDiscordActivity);
    // end on video end
    video.addEventListener("ended", clearDiscordActivity);
  };
  const unbindVideoListener = (video) => {
    video.removeEventListener("playing", setDiscordActivity);
    video.removeEventListener("play", setDiscordActivity);
    video.removeEventListener("seeked", setDiscordActivity);
    video.removeEventListener("ended", clearDiscordActivity);
  };
  csLib.PathElementListener("/scenes/", "video", videoListener);
})();
