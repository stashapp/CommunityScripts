// shared cropper code for use in other plugins
// ported from 7dJx1qP

function tryLoadCropper() {
    try {
        const img = document.createElement('img');
        new Cropper(img)
    } catch (e) {
        console.error("Cropper not loaded - please install 'CropperJS' from CommunityScripts")
    }
    try {
        stash.isPlugin()
    } catch (e) {
        console.error("Stash not loaded - please install 'stashUserscriptLibrary' from CommunityScripts")
    }
}

function setupCropper(originalImage, initialAspectRatio, uploadCroppedImage, cropStartParent) {
    const cropBtnContainerId = "crop-btn-container";
    if (document.getElementById(cropBtnContainerId)) return

    var cropperModal = document.createElement("dialog");
    cropperModal.classList.add("stash-cropper-modal")
    document.body.appendChild(cropperModal)

    var cropperContainer = document.createElement("div")
    cropperContainer.classList.add("stash-cropper-container")
    cropperModal.appendChild(cropperContainer)

    var image = originalImage.cloneNode()
    image.style.display = "block"
    image.style.maxWidth = "100%"
    cropperContainer.appendChild(image)

    var cropBtnContainer = document.createElement('div');
    cropBtnContainer.setAttribute("id", cropBtnContainerId);
    cropBtnContainer.classList.add('d-flex','flex-row','justify-content-center','align-items-center')
    cropBtnContainer.style.gap = "10px"
    cropperModal.appendChild(cropBtnContainer)

    const cropInfo = document.createElement('p');
    cropInfo.style.all = "revert"
    cropInfo.classList.add('text-white')

    const cropStart = document.createElement('button');
    cropStart.setAttribute("id", "crop-start");
    cropStart.classList.add('btn', 'btn-primary');
    cropStart.innerText = 'Crop Image';
    cropStart.addEventListener('click', evt => {
        cropping = true;
        cropStart.classList.add("crop-hidden")
        cropCancel.classList.remove("crop-hidden")

        cropper = new Cropper(image, {
            viewMode: 1,
            initialAspectRatio: initialAspectRatio,
            movable: false,
            rotatable: false,
            scalable: false,
            zoomable: false,
            zoomOnTouch: false,
            zoomOnWheel: false,
            ready() {
                cropAccept.classList.remove("crop-hidden")
            },
            crop(e) {
                const roundProxy = new Proxy(e.detail, {
                    get(target, prop, receiver) {
                        return Math.round(Reflect.get(...arguments));
                    }
                })
                cropInfo.innerText = `X: ${roundProxy.x}, Y: ${roundProxy.y}, Width: ${roundProxy.width}px, Height: ${roundProxy.height}px`;
            }
        });
        cropperModal.showModal();
    })
    cropStartParent.appendChild(cropStart);

    function stopCropping() {
        cropping = false;
        cropStart.classList.remove("crop-hidden")
        cropAccept.classList.add("crop-hidden")
        cropCancel.classList.add("crop-hidden")
        cropInfo.innerText = '';
    }

    const cropAccept = document.createElement('button');
    cropAccept.setAttribute("id", "crop-accept");
    cropAccept.classList.add('btn', 'btn-success', 'mr-2', 'crop-hidden');
    cropAccept.innerText = 'OK';
    cropAccept.addEventListener('click', async evt => {
        stopCropping()
        const canvas = cropper.getCroppedCanvas().toDataURL();
        uploadCroppedImage(canvas)
        reloadImg(image.src);
        cropper.destroy();
        cropperModal.close("cropAccept")
    });
    cropBtnContainer.appendChild(cropAccept);

    const cropCancel = document.createElement('button');
    cropCancel.setAttribute("id", "crop-accept");
    cropCancel.classList.add('btn', 'btn-danger', 'crop-hidden');
    cropCancel.innerText = 'Cancel';
    cropCancel.addEventListener('click', evt => {
        stopCropping()
        cropper.destroy();
        cropperModal.close("cropCancel")
    });
    cropBtnContainer.appendChild(cropCancel);
    cropBtnContainer.appendChild(cropInfo);
}