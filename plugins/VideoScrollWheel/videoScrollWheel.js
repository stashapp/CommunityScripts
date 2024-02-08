(function () {
  const volumeScrollScale = -0.00065;
  const timeScrollScale = 0.01;

  const timeScrollFriction = 0.00015;
  const timeScrollAcceleration = 0.55;
  const maxTimeDelta = 2000;
  const maxTimeScrollVelocity = 5.0;

  let vjsPlayer = null;
  let scrollVelocity = 1;
  let previousTime = Date.now();

  function setupVideoScrollWheel() {
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
      // Scrolled on left, change volume.
      var newVolume = vjsPlayer.volume() + scrollDelta * volumeScrollScale;
      vjsPlayer.volume(newVolume);
    } else {
      // Scrolled on right, change time.
      var now = Date.now();
      var deltaTime = now - previousTime;
      if (deltaTime === 0) {
        return;
      } else if (deltaTime > maxTimeDelta) {
        scrollVelocity = 1;
      } else {
        scrollVelocity =
          scrollVelocity -
          scrollVelocity * timeScrollFriction * deltaTime +
          (1 / deltaTime) * timeScrollAcceleration;
        scrollVelocity = Math.max(
          1,
          Math.min(scrollVelocity, maxTimeScrollVelocity),
        );
      }

      previousTime = now;

      var timeDelta = scrollDelta * timeScrollScale * scrollVelocity;
      var newTime = vjsPlayer.currentTime() + timeDelta;
      vjsPlayer.currentTime(newTime);
    }
  }

  // Wait for video player to load on scene page.
  stash.addEventListener("stash:page:scene", function () {
    waitForElementId("VideoJsPlayer", setupVideoScrollWheel);
  });
})();
