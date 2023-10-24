(function () {

    async function getPerformerByName(name) {
        const reqData = {
            "operationName": "FindPerformers",
            "variables": {
                "performer_filter": {
                  "name": {
                    "value": name,
                    "modifier": "EQUALS"
                  }
                }
              },
            "query": `query FindPerformers($filter: FindFilterType, $performer_filter: PerformerFilterType) {
                findPerformers(filter: $filter, performer_filter: $performer_filter) {
                  performers {
                    id
                  }
                }
              }`
        };
        const result = await stash.callGQL(reqData);
        if (result?.data?.findPerformers?.performers?.length) {
            return result.data.findPerformers.performers[0];
        }
        return null;
    }

    async function getStudioByName(name) {
        const reqData = {
            "operationName": "FindStudios",
            "variables": {
                "studio_filter": {
                  "name": {
                    "value": name,
                    "modifier": "EQUALS"
                  }
                }
              },
            "query": `query FindStudios($filter: FindFilterType, $studio_filter: StudioFilterType) {
                findStudios(filter: $filter, studio_filter: $studio_filter) {
                  studios {
                    id
                  }
                }
              }`
        };
        const result = await stash.callGQL(reqData);
        if (result?.data?.findStudios?.studios?.length) {
            return result.data.findStudios.studios[0];
        }
        return null;
    }

    function processMatchRemotePerformer(node, matchNode) {
        if (!document.getElementById('linkify-stashbox-performers').checked) return;
        if (!matchNode) matchNode = getClosestAncestor(node, '.search-item');
        const {
            remoteUrl,
            remoteData,
        } = stash.parseSearchResultItem(matchNode);
        const performerNode = node.querySelector('b.ml-2');
        const performerName = performerNode.innerText;
        const performer = remoteData.performers.find(performer => performer.name === performerName);
        const performerUrl = remoteUrl.origin + '/performers/' + performer.remote_site_id;
        performerNode.innerHTML = `<a href=${performerUrl} target="_blank">${performerName}</a>`;
        performerNode.firstChild.style.color = performerNode.style.color;
    }

    function processMatchRemoteStudio(node, matchNode) {
        if (!document.getElementById('linkify-stashbox-studio').checked) return;
        if (!matchNode) matchNode = getClosestAncestor(node, '.search-item');
        const {
            remoteUrl,
            remoteData,
        } = stash.parseSearchResultItem(matchNode);
        const subNode = node.querySelector('b.ml-2');
        const studioName = subNode.innerText;
        const studioUrl = remoteUrl.origin + '/studios/' + remoteData.studio.remote_site_id;
        subNode.innerHTML = `<a href=${studioUrl} target="_blank">${studioName}</a>`;
        subNode.firstChild.style.color = subNode.style.color;
    }

    async function processMatchLocal(node, searchItem) {
        if (!searchItem) searchItem = getClosestAncestor(node, '.search-item');
        const { matches } = stash.parseSearchResultItem(searchItem);
        const { matchType, data } = matches.find(({ matchNode }) => matchNode === node);
        const subNode = node.querySelector('b');
        if (matchType === 'performer' && document.getElementById('linkify-performers').checked) {
            let performerUrl;
            if (data?.stored_id) {
                performerUrl = window.location.origin + '/performers/' + data.stored_id;
            }
            else {
                const performer = await getPerformerByName(subNode.innerText);
                performerUrl = window.location.origin + '/performers/' + performer.id;
            }
            subNode.innerHTML = `<a href=${performerUrl} target="_blank">${subNode.innerText}</a>`;
            subNode.firstChild.style.color = subNode.style.color;
        }
        else if (matchType === 'studio' && document.getElementById('linkify-studio').checked) {
            let studioUrl;
            if (data?.stored_id) {
                studioUrl = window.location.origin + '/studios/' + data.stored_id;
            }
            else {
                const studio = await getStudioByName(subNode.innerText);
                studioUrl = window.location.origin + '/studios/' + studio.id;
            }
            subNode.innerHTML = `<a href=${studioUrl} target="_blank">${subNode.innerText}</a>`;
            subNode.firstChild.style.color = subNode.style.color;
        }
    }

    function processMatchResult(matchNode) {
        const remotePerformerNodes = getElementsByXpath('.//div[@class="entity-name" and text()="Performer"]', matchNode);
        for (const performerNode of xPathResultToArray(remotePerformerNodes)) {
            processMatchRemotePerformer(performerNode, matchNode);
        }
        const localPerformerNodes = getElementsByXpath('.//div[@class="entity-name" and text()="Performer"]/following-sibling::span[@class="ml-auto"]', matchNode);
        for (const performerNode of xPathResultToArray(localPerformerNodes)) {
            processMatchLocal(performerNode, matchNode);
        }
        const remoteStudioNode = getElementByXpath('.//div[@class="entity-name" and text()="Studio"]', matchNode);
        if (remoteStudioNode) {
            processMatchRemoteStudio(remoteStudioNode, matchNode);
        }
        const localStudioNode = getElementByXpath('.//div[@class="entity-name" and text()="Studio"]/following-sibling::span[@class="ml-auto"]', matchNode);
        if (localStudioNode) {
            processMatchLocal(localStudioNode, matchNode);
        }
    }

    stash.addEventListener('tagger:searchitem', function (evt) {
        const searchItem = evt.detail;
        const sceneLink = searchItem.querySelector('a.scene-link');
        sceneLink.addEventListener("click", (event) => {
            event.preventDefault();
            window.open(sceneLink.href, '_blank');
        });
    });

    const linkifyConfigId = 'linkify-config';

    stash.addEventListener('tagger:configuration', evt => {
        const el = evt.detail;
        if (!document.getElementById(linkifyConfigId)) {
            const configContainer = el.parentElement;
            const linkifyConfig = createElementFromHTML(`
<div id="${linkifyConfigId}" class="col-md-6 mt-4">
<h5>Linkify Configuration</h5>
<div class="row">
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="linkify-studio" class="form-check-input" data-default="true">
            <label title="" for="linkify-studio" class="form-check-label">Studio</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="linkify-performers" class="form-check-input" data-default="true">
            <label title="" for="linkify-performers" class="form-check-label">Performers</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="linkify-stashbox-studio" class="form-check-input" data-default="true">
            <label title="" for="linkify-stashbox-studio" class="form-check-label">Stashbox Studio</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="linkify-stashbox-performers" class="form-check-input" data-default="true">
            <label title="" for="linkify-stashbox-performers" class="form-check-label">Stashbox Performers</label>
        </div>
    </div>
</div>
</div>
            `);
            configContainer.appendChild(linkifyConfig);
            loadSettings();
        }
    });

    async function loadSettings() {
        for (const input of document.querySelectorAll(`#${linkifyConfigId} input`)) {
            input.checked = await GM.getValue(input.id, input.dataset.default === 'true');
            input.addEventListener('change', async () => {
                await GM.setValue(input.id, input.checked);
            });
        }
    }

    stash.addEventListener('tagger:mutation:add:remoteperformer', evt => processMatchRemotePerformer(evt.detail.node));
    stash.addEventListener('tagger:mutation:add:remotestudio', evt => processMatchRemoteStudio(evt.detail.node));
    stash.addEventListener('tagger:mutation:add:local', evt => processMatchLocal(evt.detail.node));
    stash.addEventListener('tagger:mutation:add:container', evt => processMatchResult(evt.detail.node));
    stash.addEventListener('tagger:mutation:add:subcontainer', evt => processMatchResult(getClosestAncestor(evt.detail.node, '.search-item')));
})();