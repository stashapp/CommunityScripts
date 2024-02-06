// By ScruffyNerf
// Ported by feederbox826

(function () {
  let cropping = false;
  let cropper = null;

  try {
    const img = document.createElement("img");
    new Cropper(img);
  } catch (e) {
    console.error(
      "Cropper not loaded - please install 4. CropperJS from CommunityScripts",
    );
  }
  try {
    stash.getVersion();
  } catch (e) {
    console.error(
      "Stash not loaded - please install 1. stashUserscriptLibrary from CommunityScripts",
    );
  }

  function setupCropper() {
    const cropBtnContainerId = "crop-btn-container";
    if (document.getElementById(cropBtnContainerId)) return;
    const sceneId = window.location.pathname
      .replace("/scenes/", "")
      .split("/")[0];
    const sceneImage = document.querySelector("img.scene-cover");

    var cropperModal = document.createElement("dialog");
    cropperModal.style.width = "90%";
    cropperModal.style.border = "none";
    cropperModal.classList.add("bg-dark");
    document.body.appendChild(cropperModal);

    var cropperContainer = document.createElement("div");
    cropperContainer.style.width = "100%";
    cropperContainer.style.height = "auto";
    cropperContainer.style.margin = "auto";
    cropperModal.appendChild(cropperContainer);

    var image = sceneImage.cloneNode();
    image.style.display = "block";
    image.style.maxWidth = "100%";
    cropperContainer.appendChild(image);

    var cropBtnContainer = document.createElement("div");
    cropBtnContainer.setAttribute("id", cropBtnContainerId);
    cropBtnContainer.classList.add(
      "d-flex",
      "flex-row",
      "justify-content-center",
      "align-items-center",
    );
    cropBtnContainer.style.gap = "10px";
    cropperModal.appendChild(cropBtnContainer);

    sceneImage.parentElement.parentElement.style.flexFlow = "column";

    const cropInfo = document.createElement("p");
    cropInfo.style.all = "revert";
    cropInfo.classList.add("text-white");

    const cropStart = document.createElement("button");
    cropStart.setAttribute("id", "crop-start");
    cropStart.classList.add("btn", "btn-primary");
    cropStart.innerText = "Crop Image";
    cropStart.addEventListener("click", (evt) => {
      cropping = true;
      cropStart.style.display = "none";
      cropCancel.style.display = "inline-block";

      //const isVertical = image.naturalHeight > image.naturalWidth;
      //const aspectRatio = isVertical ? 3/2 : NaN
      const aspectRatio = NaN;

      cropper = new Cropper(image, {
        viewMode: 1,
        initialAspectRatio: aspectRatio,
        movable: false,
        rotatable: false,
        scalable: false,
        zoomable: false,
        zoomOnTouch: false,
        zoomOnWheel: false,
        ready() {
          cropAccept.style.display = "inline-block";
        },
        crop(e) {
          cropInfo.innerText = `X: ${Math.round(e.detail.x)}, Y: ${Math.round(e.detail.y)}, Width: ${Math.round(e.detail.width)}px, Height: ${Math.round(e.detail.height)}px`;
        },
      });
      cropperModal.showModal();
    });
    sceneImage.parentElement.appendChild(cropStart);

    const cropAccept = document.createElement("button");
    cropAccept.setAttribute("id", "crop-accept");
    cropAccept.classList.add("btn", "btn-success", "mr-2");
    cropAccept.innerText = "OK";
    cropAccept.addEventListener("click", async (evt) => {
      cropping = false;
      cropStart.style.display = "inline-block";
      cropAccept.style.display = "none";
      cropCancel.style.display = "none";
      cropInfo.innerText = "";

      const reqData = {
        operationName: "SceneUpdate",
        variables: {
          input: {
            cover_image: cropper.getCroppedCanvas().toDataURL(),
            id: sceneId,
          },
        },
        query: `mutation SceneUpdate($input: SceneUpdateInput!) {
                    sceneUpdate(input: $input) {
                        id
                    }
                }`,
      };
      await stash.callGQL(reqData);
      reloadImg(image.src);
      cropper.destroy();
      cropperModal.close("cropAccept");
    });
    cropBtnContainer.appendChild(cropAccept);

    const cropCancel = document.createElement("button");
    cropCancel.setAttribute("id", "crop-accept");
    cropCancel.classList.add("btn", "btn-danger");
    cropCancel.innerText = "Cancel";
    cropCancel.addEventListener("click", (evt) => {
      cropping = false;
      cropStart.style.display = "inline-block";
      cropAccept.style.display = "none";
      cropCancel.style.display = "none";
      cropInfo.innerText = "";

      cropper.destroy();
      cropperModal.close("cropCancel");
    });
    cropBtnContainer.appendChild(cropCancel);
    cropAccept.style.display = "none";
    cropCancel.style.display = "none";

    cropBtnContainer.appendChild(cropInfo);
  }

  stash.addEventListener("stash:page:scene", function () {
    waitForElementId("scene-edit-details", setupCropper);
  });
})();
