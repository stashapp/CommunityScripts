(async () => {
  const localStorageGalleryKey = "imageGalleryNavigation-GalleryID";

  // In order to handle scenarios where an image is in multiple galleries, capture ID of gallery the user is navigating from.
  // If user navigates directly to an image URL and image is in multiple galleries, we will just use the first gallery in list.
  // This may break if user jumps around in browser history, in which case we will fall back to basic scenario of assuming first gallery in list.
  async function setupGalleryImageLinks() {
    document.querySelectorAll("a[href*='/images/']").forEach(function (link) {
      link.addEventListener("click", () => {
        var galleryID = window.location.pathname.split("/")[2];
        localStorage.setItem(localStorageGalleryKey, galleryID);
      });
    });
  }

  // On image page, get data about gallery (image's position within gallery, next/prev image IDs),
  // add arrow buttons to page, and register arrow keypress handlers,
  async function setupImageContainer() {
    var imageID = window.location.pathname.split("/")[2];
    var imageGalleries = await findImage(imageID);

    if (imageGalleries != null && imageGalleries.length > 0) {
      // Get first entry in galleries list.
      var galleryID = imageGalleries[0];

      // Check if there is a saved gallery ID and it is in gallery list. If true, use saved ID.
      var savedGalleryId = localStorage.getItem(localStorageGalleryKey);
      if (savedGalleryId != null && imageGalleries.includes(savedGalleryId)) {
        galleryID = savedGalleryId;
      } else {
        localStorage.setItem(localStorageGalleryKey, galleryID);
      }

      // Get gallery image list.
      var galleryImages = await findGalleryImages(galleryID);
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

  // *** Utility Functions ***

  function redirectToImage(imageID) {
    const baseImagesPath = "/images/";
    // window.location.href = `${baseImagesPath}${imageID}`;
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
  async function findGalleryImages(galleryID) {
    const imageFilter = {
      galleries: { value: galleryID, modifier: "INCLUDES_ALL" },
    };
    const findFilter = { per_page: -1, sort: "title" };
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
