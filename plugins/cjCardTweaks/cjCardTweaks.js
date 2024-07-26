(function() {
    function addFileCount(cardClass, thumbnailSelector, list) {
        for (const card of document.querySelectorAll(cardClass)) {
            const cardLink = card.querySelector(thumbnailSelector);
            if (cardLink) {
                const cardUrl = cardLink.href;
                const cardId = cardUrl.split('/').pop().split('?')[0];
                const cardData = list[cardId]
                if (cardData?.files.length > 1) {
                    const el = createElementFromHTML(`<span class="file-count badge badge-pill badge-info">` + cardData?.files.length + `</span>`)
                    cardLink.parentElement.appendChild(el);
                }
            }
        }
    }

    //Scene Listerers
    stash.addEventListener('page:scenes', function() {
        waitForElementClass("scene-card", function () {
            addFileCount('.scene-card', '.video-section.thumbnail-section > a', stash.scenes);
        });
    });

    stash.addEventListener('page:performer:scenes', function() {
        waitForElementClass("scene-card", function () {
            addFileCount('.scene-card', '.video-section.thumbnail-section > a', stash.scenes);
        });
    });

    stash.addEventListener('page:movie:scenes', function() {
        waitForElementClass("scene-card", function () {
            addFileCount('.scene-card', '.video-section.thumbnail-section > a', stash.scenes);
        });
    });

    stash.addEventListener('page:studio:scenes', function() {
        waitForElementClass("scene-card", function () {
            addFileCount('.scene-card', '.video-section.thumbnail-section > a', stash.scenes);
        });
    });

    stash.addEventListener('page:tag:scenes', function() {
        waitForElementClass("scene-card", function () {
            addFileCount('.scene-card', '.video-section.thumbnail-section > a', stash.scenes);
        });
    });

    //Gallery Listerers
    stash.addEventListener('page:galleries', function() {
        waitForElementClass("gallery-card", function () {
            addFileCount('.gallery-card', '.thumbnail-section > a', stash.galleries);
        });
    });

    stash.addEventListener('page:performer:galleries', function() {
        waitForElementClass("gallery-card", function () {
            addFileCount('.gallery-card', '.thumbnail-section > a', stash.galleries);
        });
    });

    stash.addEventListener('page:studio:galleries', function() {
        waitForElementClass("gallery-card", function () {
            addFileCount('.gallery-card', '.thumbnail-section > a', stash.galleries);
        });
    });

    stash.addEventListener('page:tag:galleries', function() {
        waitForElementClass("gallery-card", function () {
            addFileCount('.gallery-card', '.thumbnail-section > a', stash.galleries);
        });
    });

    //Image Listerers
    stash.addEventListener('page:images', function() {
        waitForElementClass("image-card", function () {
            addFileCount('.image-card', '.thumbnail-section > a', stash.images);
        });
    });

    stash.addEventListener('page:gallery', function() {
        waitForElementClass("image-card", function () {
            addFileCount('.image-card', '.thumbnail-section > a', stash.images);
        });
    });

    stash.addEventListener('page:performer:images', function() {
        waitForElementClass("image-card", function () {
            addFileCount('.image-card', '.thumbnail-section > a', stash.images);
        });
    });

    stash.addEventListener('page:studio:images', function() {
        waitForElementClass("image-card", function () {
            addFileCount('.image-card', '.thumbnail-section > a', stash.images);
        });
    });

    stash.addEventListener('page:tag:images', function() {
        waitForElementClass("image-card", function () {
            addFileCount('.image-card', '.thumbnail-section > a', stash.images);
        });
    });

})();