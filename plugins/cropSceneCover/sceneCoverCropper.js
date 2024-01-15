// By ScruffyNerf
// Ported by feederbox826

(function () {
    tryLoadCropper();
    async function uploadCroppedImage(canvas) {
        const sceneId = window.location.pathname.replace('/scenes/', '').split('/')[0];
        const reqData = {
            "operationName": "SceneUpdate",
            "variables": {
                "input": {
                    "cover_image": canvas,
                    "id": sceneId
                }
            },
            "query": `mutation SceneUpdate($input: SceneUpdateInput!) {
                sceneUpdate(input: $input) {
                    id
                }
            }`
        }
        await stash.callGQL(reqData);
    }
    function startCropper() {
        console.log("start cropper")
        const sceneImage = document.querySelector("img.scene-cover")
        const cropContainer = sceneImage.parentElement
        setupCropper(sceneImage, NaN, uploadCroppedImage, cropContainer);
    }

    stash.addEventListener('page:scene', function () {
        waitForElementId('scene-edit-details', startCropper);
    });
})();