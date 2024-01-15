// performer image cropper
// ported from 7dJx1qP

(function () {
    tryLoadCropper();
    async function uploadCroppedImage(canvas) {
        const performerId = window.location.pathname.replace('/performers/', '').split('/')[0];
        const reqData = {
            "operationName": "PerformerUpdate",
            "variables": {
                "input": {
                    "image": canvas,
                    "id": performerId
                }
            },
            "query": `mutation PerformerUpdate($input: PerformerUpdateInput!) {
                performerUpdate(input: $input) {
                    id
                }
            }`
        }
        await stash.callGQL(reqData);
    }
    function startCropper() {
        const performerImage = getElementByXpath("//div[contains(@class, 'detail-header-image')]//img[@class='performer']");
        const startCropContainer = document.createElement('div')
        startCropContainer.classList.add('d-flex','flex-column','justify-content-between','align-items-center')
        const target = performerImage.parentElement.parentElement;
        target.appendChild(startCropContainer);
        target.style.flexFlow = 'column';
        setupCropper(performerImage, NaN, uploadCroppedImage, startCropContainer);
    }

    stash.addEventListener('page:performer', function () {
        waitForElementId('performer-edit', startCropper);
    });
})();