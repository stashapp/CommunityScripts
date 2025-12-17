(async () => {
  const localStorageGalleryKey = "imageGalleryNavigation-GalleryID";
  const localStorageGalleryParams = "imageGalleryNavigation-GalleryParams";

  const defaultSearchParams = new URLSearchParams({
    sortby: "title",
    sortdir: "asc",
  });

  let pluginSettings = {};
  const defaultPluginSettings = {
    enableTransform: true
  };

  // In order to handle scenarios where an image is in multiple galleries, capture ID of gallery the user is navigating from.
  // If user navigates directly to an image URL and image is in multiple galleries, we will just use the first gallery in list.
  // This may break if user jumps around in browser history, in which case we will fall back to basic scenario of assuming first gallery in list.
  async function setupGalleryImageLinks() {
    document.querySelectorAll("a[href*='/images/']").forEach(function (link) {
      link.addEventListener("click", () => {
        // Parse Gallery URL.
        var galleryID = window.location.pathname.split("/")[2];

        // Save Gallery Info.
        localStorage.setItem(localStorageGalleryKey, galleryID);
        localStorage.setItem(localStorageGalleryParams, window.location.search);
      });
    });
  }

  // On image page, get data about gallery (image's position within gallery, next/prev image IDs),
  // add arrow buttons to page, and register arrow keypress handlers,
  async function setupImageContainer() {
    const configSettings = await csLib.getConfiguration("imageGalleryNavigation", {}); // getConfiguration is from cs-ui-lib.js
    pluginSettings = {
      ...defaultPluginSettings,
      ...configSettings,
    };

    var imageID = window.location.pathname.split("/")[2];
    var imageGalleries = await findImage(imageID);

    if (imageGalleries != null && imageGalleries.length > 0) {
      // Get first entry in galleries list.
      var galleryID = imageGalleries[0];
      var galleryParams = defaultSearchParams;

      // Check if there is a saved gallery ID and it is in gallery list. If true, use saved ID.
      var savedGalleryId = localStorage.getItem(localStorageGalleryKey);
      var savedGalleryParamsStr = localStorage.getItem(
        localStorageGalleryParams
      );
      var savedGalleryParams = savedGalleryParamsStr
        ? new URLSearchParams(savedGalleryParamsStr)
        : defaultSearchParams;
      if (savedGalleryId != null && imageGalleries.includes(savedGalleryId)) {
        galleryID = savedGalleryId;

        if (savedGalleryParams != null) {
          galleryParams = savedGalleryParams;
        }
      } else {
        localStorage.setItem(localStorageGalleryKey, galleryID);
        localStorage.setItem(localStorageGalleryParams, null);
      }

      // Get gallery image list.
      var galleryImages = await findGalleryImages(galleryID, galleryParams);
      var totalImageCount = galleryImages.length;
      var currentImageIndex = galleryImages.indexOf(imageID);
      var nextImageID =
        galleryImages[wrapIndex(currentImageIndex + 1, totalImageCount)];
      var prevImageID =
        galleryImages[wrapIndex(currentImageIndex - 1, totalImageCount)];

      // Add UI elements.
      insertGalleryToolbar(currentImageIndex, totalImageCount, galleryImages);
      insertArrowButtons(nextImageID, prevImageID);
      insertArrowKeyHandlers(nextImageID, prevImageID);

      // Add translate/scale controls.
      if (pluginSettings.enableTransform) {
        setupMouseEventHandlers();
      }
    }
  }

  function insertGalleryToolbar(
    currentImageIndex,
    totalImageCount,
    galleryImages
  ) {
    var galleryToolbar = document.createElement("div");
    galleryToolbar.innerHTML = `<span class="imageGalleryNav-NavTitle">Gallery Image: </span><input type="number" class="text-input imageGalleryNav-NavInput" value="${
      currentImageIndex + 1
    }"> <span class="imageGalleryNav-NavTotal">/ ${totalImageCount}</span>`;

    var toolbar = document.querySelector("div.image-toolbar");
    toolbar.parentNode.insertBefore(galleryToolbar, toolbar.nextSibling);

    galleryToolbar.querySelector("input").addEventListener("change", (e) => {
      var imageIndex = e.target.value - 1;
      if (imageIndex < 0 || imageIndex > totalImageCount - 1) {
        e.target.value = currentImageIndex + 1;
        e.target.select();
      } else {
        var imageID = galleryImages[imageIndex];
        redirectToImage(imageID);
      }
    });

    galleryToolbar.querySelector("input").addEventListener("focus", (e) => {
      e.target.select();
    });
  }

  function insertArrowButtons(nextImageID, prevImageID) {
    var leftButton = document.createElement("button");
    leftButton.className = "imageGalleryNav-leftButton btn btn-primary";
    leftButton.innerText = "<";
    leftButton.addEventListener("click", () => {
      redirectToImage(prevImageID);
    });

    var rightButton = document.createElement("button");
    rightButton.className = "imageGalleryNav-rightButton btn btn-primary";
    rightButton.innerText = ">";
    rightButton.addEventListener("click", () => {
      redirectToImage(nextImageID);
    });

    document.querySelector("div.image-container").prepend(leftButton);
    document.querySelector("div.image-container").prepend(rightButton);
  }

  function insertArrowKeyHandlers(nextImageID, prevImageID) {
    // TODO: Determine how to cleanup this listener properly, so that we can handle left/right arrow key.
    // // Add keypress handlers for arrow keys.
    // document.addEventListener('keydown', function onKeydownHandler(e) {
    //   if (!isTextboxFocused()) {
    //     if (e.key === "ArrowRight") {
    //       redirectToImage(nextImageID);
    //     } else if (e.key === "ArrowLeft") {
    //       redirectToImage(prevImageID);
    //     }
    //   }
    // });
  }

  function setupMouseEventHandlers() {
    var img = document.querySelector("div.image-container img");

    // Init transform values.
    imgScale = 1.0;
    imgTranslateX = 0.0;
    imgTranslateY = 0.0;

    // Prevent listeners from being attached twice.
    img.removeEventListener('mousedown', onStartDrag);
    img.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', onStopDrag);
    img.removeEventListener('wheel', onMouseWheel);

    // Add event listeners.
    img.addEventListener('mousedown', onStartDrag);
    img.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', onStopDrag);
    img.addEventListener('wheel', onMouseWheel);
  }

  // *** Mouse Event Handlers *** //
  var imgScale = 1.0;
  var imgTranslateX = 0.0;
  var imgTranslateY = 0.0;
  var dragStartX = 0.0;
  var dragStartY = 0.0;
  var dragStartTranslateX = 0.0;
  var dragStartTranslateY = 0.0;
  var dragActive = false;

  function onStartDrag(event) {
    if (event.button === 0) {
      event.preventDefault(); // Needed to prevent drag from being blocked.
      dragActive = true;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      dragStartTranslateX = imgTranslateX;
      dragStartTranslateY = imgTranslateY;
    }
  }

  function onStopDrag(event) {
    if (event.button === 0) {
      dragActive = false;
    }
  }

  function onDrag(event) {
    if (dragActive) {
      imgTranslateX = dragStartTranslateX + (event.clientX - dragStartX);
      imgTranslateY = dragStartTranslateY + (event.clientY - dragStartY);
      applyImageTransform();
    }
  }
  
  function onMouseWheel(event) {
    event.preventDefault();

    // TODO: Zoom to cursor.
    // var img = document.querySelector("div.image-container img");
    // img.style.transformOrigin = `${event.offsetX}px ${event.offsetY}px`
    imgScale += (event.deltaY * -0.001);
    imgScale = Math.max(imgScale, 1.0);

    if (imgScale == 1.0) {
      imgTranslateX = 0.0;
      imgTranslateY = 0.0;
    }

    applyImageTransform();
  }

  function applyImageTransform() {
    var img = document.querySelector("div.image-container img");
    img.style.transform = `translate(${imgTranslateX}px,${imgTranslateY}px) scale(${imgScale})`
  }

  // *** Utility Functions ***

  function redirectToImage(imageID) {
    const baseImagesPath = "/images/";
    window.location.replace(`${baseImagesPath}${imageID}`);
  }

  function isTextboxFocused() {
    if (
      document.activeElement.nodeName == "TEXTAREA" ||
      document.activeElement.nodeName == "INPUT" ||
      (document.activeElement.nodeName == "DIV" &&
        document.activeElement.isContentEditable)
    ) {
      return true;
    } else {
      return false;
    }
  }

  function wrapIndex(index, arrayLength) {
    return ((index % arrayLength) + arrayLength) % arrayLength;
  }

  function getFindFilter(searchParams) {
    var findFilter = {
      per_page: -1,
      sort: searchParams.has("sortby") ? searchParams.get("sortby") : "title",
      direction: searchParams.has("sortdir")
        ? searchParams.get("sortdir").toUpperCase()
        : "ASC",
    };

    return findFilter;
  }

  function getImageFilter(galleryID, searchParams) {
    var imageFilter = {
      galleries: { value: galleryID, modifier: "INCLUDES_ALL" },
    };

    if (searchParams.has("c")) {
      searchParams.getAll("c").forEach((cStr) => {
        // Parse filter condition string.
        cStr = cStr.replaceAll("(", "{").replaceAll(")", "}");
        cObj = JSON.parse(cStr);

        // Init filter type field.
        imageFilter[cObj.type] = {};

        // Get all keys (except for "type").
        var keys = Object.keys(cObj);
        keys.splice(keys.indexOf("type"), 1);

        // Add all filter data.
        keys.forEach((keyName) => {
          if (typeof cObj[keyName] === "object") {
            // Special parsing for object type "value" fields (used where there's possibly a value and value2)
            var keys2 = Object.keys(cObj[keyName]);
            keys2.forEach((keyName2) => {
              imageFilter[cObj.type][keyName2] = cObj[keyName][keyName2];
            });
          } else {
            imageFilter[cObj.type][keyName] = cObj[keyName];
          }
        });
      });
    }

    console.log(imageFilter);
    return imageFilter;
  }

  // *** GQL Calls ***

  // Find Image by ID
  // Return Galleries list (id)
  async function findImage(imageID) {
    const variables = { id: imageID };
    const query = `query ($id: ID!) { findImage(id: $id) { galleries { id } } }`;
    return await csLib
      .callGQL({ query, variables })
      .then((data) => data.findImage.galleries.map((item) => item.id));
  }

  // Find Images by Gallery ID
  // Return Images list (id)
  async function findGalleryImages(galleryID, galleryParams) {
    const imageFilter = getImageFilter(galleryID, galleryParams);
    const findFilter = getFindFilter(galleryParams);
    const variables = { image_filter: imageFilter, filter: findFilter };
    const query = `query ($image_filter: ImageFilterType!, $filter: FindFilterType!) { findImages(image_filter: $image_filter, filter: $filter) { images { id } } }`;
    return await csLib
      .callGQL({ query, variables })
      .then((data) => data.findImages.images.map((item) => item.id));
  }

  // Wait for galleries page to load.
  csLib.PathElementListener(
    "/galleries/",
    ".image-card",
    setupGalleryImageLinks
  ); // PathElementListener is from cs-ui-lib.js

  // Wait for images page to load.
  csLib.PathElementListener(
    "/images/",
    ".image-container",
    setupImageContainer
  ); // PathElementListener is from cs-ui-lib.js
})();
