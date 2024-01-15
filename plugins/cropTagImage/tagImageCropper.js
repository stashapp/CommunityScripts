// tag image cropper
// ported from 7dJx1qP

(function () {
    tryLoadCropper();
    async function uploadCroppedImage(canvas) {
        const tagId = window.location.pathname.replace('/tags/', '').split('/')[0];
        const reqData = {
            "operationName": "TagUpdate",
            "variables": {
              "input": {
                "image": canvas,
                "id": tagId
              }
            },
            "query": `mutation TagUpdate($input: TagUpdateInput!) {
                tagUpdate(input: $input) {
                  id
                }
              }`
        }
        await stash.callGQL(reqData);
    }
    function startCropper() {
        const tagImage = getElementByXpath("//div[contains(@class, 'detail-header-image')]//img[@class='logo']");
        const headerImageContainer = document.querySelector('.detail-header-image')
        setupCropper(tagImage, 1, uploadCroppedImage, headerImageContainer);
        const cropStart = document.getElementById("crop-start");
        cropStart.classList.remove("btn-primary");
        cropStart.classList.add("btn-link");
        cropStart.innerText = "";
        cropStart.appendChild(tagImage)
    }

    stash.addEventListener('page:tag:scenes', function () {
        waitForElementId('tag-tabs-tab-scenes', startCropper);
    });
})();