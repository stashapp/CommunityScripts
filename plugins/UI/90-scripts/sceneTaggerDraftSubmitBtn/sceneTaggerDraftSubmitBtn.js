(function () {

    async function submitDraft(sceneId, stashBoxIndex) {
        const reqData = {
            "variables": {
                "input": {
                    "id": sceneId,
                    "stash_box_index": stashBoxIndex
                }
            },
            "operationName": "SubmitStashBoxSceneDraft",
            "query": `mutation SubmitStashBoxSceneDraft($input: StashBoxDraftSubmissionInput!) {
                submitStashBoxSceneDraft(input: $input)
            }`
        }
        const res = await stash.callGQL(reqData);
        return res?.data?.submitStashBoxSceneDraft;
    }

    async function initDraftButtons() {
        const data = await stash.getStashBoxes();
        let i = 0;
        const stashBoxes = data.data.configuration.general.stashBoxes;

        const nodes = getElementsByXpath("//button[contains(@class, 'btn-primary') and text()='Scrape by fragment']");
        const buttons = [];
        let node = null;
        while (node = nodes.iterateNext()) {
            buttons.push(node);
        }
        for (const button of buttons) {
            const searchItem = getClosestAncestor(button, '.search-item');
            const {
                urlNode,
                url,
                id,
                data,
                nameNode,
                name,
                queryInput,
                performerNodes
            } = stash.parseSearchItem(searchItem);

            const draftButtonExists = searchItem.querySelector('.submit-draft');
            if (draftButtonExists) {
                continue;
            }

            const submit = createElementFromHTML('<div class="mt-2 text-right submit-draft"><button class="btn btn-primary">Submit Draft</button></div>');
            const submitButton = submit.querySelector('button');
            button.parentElement.parentElement.appendChild(submit);
            submitButton.addEventListener('click', async () => {
                const selectedStashbox = document.getElementById('scraper').value;
                if (!selectedStashbox.startsWith('stashbox:')) {
                    alert('No stashbox source selected.');
                    return;
                }
                const selectedStashboxIndex = parseInt(selectedStashbox.replace(/^stashbox:/, ''));
                const existingStashId = data.stash_ids.find(o => o.endpoint === stashBoxes[selectedStashboxIndex].endpoint);
                if (existingStashId) {
                    alert(`Scene already has StashID for ${stashBoxes[selectedStashboxIndex].endpoint}.`);
                    return;
                }
                const draftId = await submitDraft(id, selectedStashboxIndex);
                const draftLink = createElementFromHTML(`<a href="${stashBoxes[selectedStashboxIndex].endpoint.replace(/graphql$/, 'drafts')}/${draftId}" target="_blank">Draft: ${draftId}</a>`);
                submitButton.parentElement.appendChild(draftLink);
                submitButton.remove();
            });
        }
    }

    stash.addEventListener('page:studio', function () {
        waitForElementByXpath("//button[contains(@class, 'btn-primary') and text()='Scrape by fragment']", initDraftButtons);
    });

    stash.addEventListener('page:performer', function () {
        waitForElementByXpath("//button[contains(@class, 'btn-primary') and text()='Scrape by fragment']", initDraftButtons);
    });

    stash.addEventListener('page:scenes', function () {
        waitForElementByXpath("//button[contains(@class, 'btn-primary') and text()='Scrape by fragment']", initDraftButtons);
    });
})();
