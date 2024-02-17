(async () => {
  while (!window.stash) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const volumeScrollScale = -0.00065;
  const timeScrollScale = 0.01;
  const timeScrollFriction = 0.00015;
  const timeScrollAcceleration = 0.55;

  let vjsPlayer = null;
  let scrollVelocity = 1;
  let previousTime = Date.now();
  let pluginSettings = {
    volumeScrollSpeed: 100.0,
    timeScrollSpeed: 100.0,
    timeScrollAcceleration: 100.0,
    minTimeScrollSpeed: 1.0,
    maxTimeScrollSpeed: 5.0,
    timeScrollVelocityDecay: 100.0,
    timeScrollVelocityTimeout: 2000,
  };

  async function setupVideoScrollWheel() {
    // Get settings
    var settings = await getPluginConfig("videoScrollWheel");
    if (settings) {
      for (var key in settings) {
        if (pluginSettings.hasOwnProperty(key)) {
          pluginSettings[key] = settings[key];
        }
      }
    }

    // Get video player and register wheel event listener.
    vjsPlayer = document.getElementById("VideoJsPlayer").player;
    var vjsEl = vjsPlayer.el_;
    vjsEl.addEventListener("wheel", onWheel);
  }

  function onWheel(e) {
    // Get position of mouse within video player.
    const target = e.target;
    const targetWidth = target.offsetWidth;
    const targetX = e.clientX - target.getBoundingClientRect().left;

    var scrollDelta = e.deltaY;

    if (targetWidth / 2 > targetX) {
      // Scrolled on left side, change volume.
      var newVolume =
        vjsPlayer.volume() +
        scrollDelta *
          volumeScrollScale *
          (pluginSettings.volumeScrollSpeed / 100.0);
      vjsPlayer.volume(newVolume);
    } else {
      // Scrolled on right side, change time.
      var now = Date.now();
      var deltaTime = now - previousTime;
      if (deltaTime === 0) {
        return;
      } else if (
        deltaTime > pluginSettings.timeScrollVelocityTimeout ||
        pluginSettings.timeScrollAcceleration === 0
      ) {
        scrollVelocity = pluginSettings.minTimeScrollSpeed;
      } else {
        var friction =
          scrollVelocity *
          timeScrollFriction *
          deltaTime *
          (pluginSettings.timeScrollVelocityDecay / 100.0);
        var acceleration =
          (1 / deltaTime) *
          timeScrollAcceleration *
          (pluginSettings.timeScrollAcceleration / 100.0);
        scrollVelocity = scrollVelocity - friction + acceleration;
        scrollVelocity = Math.max(
          pluginSettings.minTimeScrollSpeed,
          Math.min(scrollVelocity, pluginSettings.maxTimeScrollSpeed)
        );
      }

      previousTime = now;

      var timeDelta =
        scrollDelta *
        timeScrollScale *
        scrollVelocity *
        (pluginSettings.timeScrollSpeed / 100.0);
      var newTime = vjsPlayer.currentTime() + timeDelta;
      vjsPlayer.currentTime(newTime);
    }
  }

  // Util functions for getting plugin settings.
  async function getPluginConfigs() {
    const reqData = {
      operationName: "Configuration",
      variables: {},
      query: `query Configuration {
                configuration {
                  plugins
                }
              }`,
    };
    return stash.callGQL(reqData);
  }
  async function getPluginConfig(pluginId) {
    const data = await getPluginConfigs();
    return data.data.configuration.plugins[pluginId];
  }

  // Wait for video player to load on scene page.
  stash.addEventListener("stash:page:scene", function () {
    waitForElementId("VideoJsPlayer", setupVideoScrollWheel);
  });
})();
