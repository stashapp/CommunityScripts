(async () => {
  const volumeScrollScale = -0.00065;
  const timeScrollScale = 0.01;
  const timeScrollFriction = 0.00015;
  const timeScrollAcceleration = 0.55;

  let vjsPlayer = null;
  let scrollVelocity = 1;
  let previousTime = Date.now();
  let pluginSettings = {};
  const defaultPluginSettings = {
    allowVolumeChange: false,
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
    // weird issue in inconsistent plugin name (https://github.com/stashapp/CommunityScripts/issues/320)
    const v25Settings = await csLib.getConfiguration("videoScrollWheel", {}); // getConfiguration is from cs-ui-lib.js
    const v26Settings = await csLib.getConfiguration("VideoScrollWheel", {}); // getConfiguration is from cs-ui-lib.js
    pluginSettings = {
      ...defaultPluginSettings,
      ...v25Settings,
      ...v26Settings,
    };

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

    if (targetWidth / 2 > targetX && pluginSettings.allowVolumeChange) {
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

      // Make sure that the time delta is big enough that the change is not ignored.
      var extraDelta = 0;

      if (timeDelta > 0) {
        while (vjsPlayer.currentTime() < newTime) {
          vjsPlayer.currentTime(newTime + extraDelta);
          ++extraDelta;

          if (vjsPlayer.currentTime() + extraDelta >= vjsPlayer.duration()) {
            vjsPlayer.currentTime(vjsPlayer.duration());
            break;
          }
        }
      } else {
        while (vjsPlayer.currentTime() > newTime) {
          vjsPlayer.currentTime(newTime - extraDelta);
          ++extraDelta;

          if (vjsPlayer.currentTime() - extraDelta <= 0) {
            vjsPlayer.currentTime(0);
            break;
          }
        }
      }
    }
  }

  // Wait for video player to load on scene page.
  csLib.PathElementListener(
    "/scenes/",
    "#VideoJsPlayer",
    setupVideoScrollWheel
  ); // PathElementListener is from cs-ui-lib.js
})();
