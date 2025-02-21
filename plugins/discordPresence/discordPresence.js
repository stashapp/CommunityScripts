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
   * last_played_at, play_duration, play_count, files: {duration:number}[],
   * studio?: {id, name}, performers: {name, gender}[]
   * }} SceneData
   */

  /**
   * @typedef {{ studio_name: string, url: string, file_duration: string, performers: string }
   * & Omit<SceneData, ['urls', 'files', 'studio', 'performers']>
   * } FlattenedSceneData
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
      performers { name, gender }
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

  function throttle(mainFunction, delay) {
    let timerFlag = null;

    return (...args) => {
      if (timerFlag === null) {
        mainFunction(...args);
        timerFlag = setTimeout(() => {
          timerFlag = null;
        }, delay);
      }
    };
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const player = () => document.querySelector("#VideoJsPlayer video");

  let WAITING_FOR_REFRESH = true;
  let SCENE_ID = null;
  /** @type {FlattenedSceneData?} */ let cachedSceneData;

  /** @type {WebSocket} */ let ws;
  const wsAlive = () => ws && ws.readyState === 1;

  // Start ws connection to RPC server and add video listener
  // Will retry on disconnection/error after 10s
  async function start() {
    if (ws && ws.readyState <= 1) {
      return;
    }

    // https://github.com/NotForMyCV/discord-presence-server/releases
    ws = new WebSocket("ws://localhost:6969");

    ws.addEventListener("open", () => {
      csLib.PathElementListener("/scenes/", "video", videoListener);
    });

    window.addEventListener("beforeunload", () => {
      clearDiscordActivity();
    });

    // If failed during video playback, remove the listeners
    ws.addEventListener("close", async () => {
      if (player()) {
        unbindVideoListener(player());
      }

      await sleep(10000);
      start();
    });

    ws.addEventListener("error", async () => {
      if (player()) {
        unbindVideoListener(player());
      }

      console.error(
        `Discord Presence Plugin: Could not connect to Discord Rich Presence Server.
        Consult the README on how to setup the Rich Presence Server:
        https://github.com/stashapp/CommunityScripts/tree/main/plugins/discordPresence`
      );
      await sleep(10000);
      start();
    });
  }

  start();

  /** @return {Promise<FlattenedSceneData | null>} */
  async function getSceneData(sceneId) {
    if (!sceneId) return null;

    if (Number(sceneId).toString() === Number(cachedSceneData?.id).toString()) {
      return cachedSceneData;
    }

    const reqData = {
      variables: { id: sceneId },
      query: SCENE_GQL_QUERY,
    };

    /** @type {SceneData} */
    const sceneData = await csLib
      .callGQL(reqData)
      .then((data) => data.findScene);

    if (!sceneData) return null;

    const newProps = {
      studio_name: sceneData.studio?.name ?? "Unknown Studio",
      url: sceneData.urls?.length ? sceneData.urls[0] : "",
      file_duration: sceneData.files?.length ? sceneData.files[0].duration : 0,
      performers: sceneData.performers.length
        ? sceneData.performers.map((performer) => performer.name).join(", ")
        : "Unlisted Performer(s)",
    };

    delete sceneData.urls;
    delete sceneData.studio;
    delete sceneData.files;
    delete sceneData.performers;

    cachedSceneData = { ...sceneData, ...newProps };
    return cachedSceneData;
  }

  const clearDiscordActivity = () => {
    if (!!SCENE_ID === false || !wsAlive()) {
      return;
    }

    SCENE_ID = null;
    ws.send(
      JSON.stringify({
        clientId: CONFIG.discordClientId,
        clearActivity: true,
      })
    );
  };

  const setDiscordActivity = throttle(async (event) => {
    if (event?.type === "timeupdate") {
      if (!WAITING_FOR_REFRESH) {
        return;
      }

      WAITING_FOR_REFRESH = false;
      setTimeout(() => (WAITING_FOR_REFRESH = true), 5000);
    }

    const sceneData = await getSceneData(SCENE_ID);
    if (!sceneData) return;

    const currentTime = player()?.currentTime ?? 0;
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

    if (!wsAlive()) {
      return;
    }

    ws.send(
      JSON.stringify({
        clientId: CONFIG.discordClientId,
        presence: body,
      })
    );
  }, 1000);

  /**
   * Performs string replacement on templated config vars with scene data
   * @param {string} templateStr
   * @param {FlattenedSceneData} sceneData
   */
  function replaceVars(templateStr, sceneData) {
    const pattern = /{\s*(\w+?)\s*}/g;

    const replacedStr = templateStr
      .replace(pattern, (_, token) => sceneData[token] ?? "")
      .trim();

    if (replacedStr.length <= 128) {
      return replacedStr;
    }

    return replacedStr.substring(0, 125) + "...";
  }

  const videoListener = (video) => {
    SCENE_ID = parseInt(location.pathname.split("/")[2]);
    video.addEventListener("playing", setDiscordActivity);
    video.addEventListener("play", setDiscordActivity);
    video.addEventListener("timeupdate", setDiscordActivity);
    video.addEventListener("seeked", setDiscordActivity);
    video.addEventListener("ended", clearDiscordActivity);
  };

  const unbindVideoListener = (video) => {
    video.removeEventListener("playing", setDiscordActivity);
    video.removeEventListener("play", setDiscordActivity);
    video.removeEventListener("timeupdate", setDiscordActivity);
    video.removeEventListener("seeked", setDiscordActivity);
    video.removeEventListener("ended", clearDiscordActivity);
  };
})();
