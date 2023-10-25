(function () {
    const processMarkdown = (elid, els) => {
        for (const el of els) {
            el.innerHTML = marked.parse(el.innerHTML);
        }
    }

    stash.addEventListener('page:tag:any', function () {
        waitForElementClass("detail-item-value", processMarkdown(elid, el));
    });

    stash.addEventListener('page:tags', function () {
        waitForElementClass("tag-description", (elid, el) =>
            processMarkdown(null, document.querySelectorAll('.tag-description'))
        );
    });
})();