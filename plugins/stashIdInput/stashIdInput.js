(function () {
    async function updatePerformerStashIDs(performerId, stash_ids) {
        const reqData = {
            "variables": {
                "input": {
                    "stash_ids": stash_ids,
                    "id": performerId
                }
            },
            "query": `mutation PerformerUpdate($input: PerformerUpdateInput!) {
                performerUpdate(input: $input) { id }
            }`
        };
        await stash.callGQL(reqData);
    }

    async function getPerformerStashIDs(performerId) {
        const reqData = {
            "variables": {
                "id": performerId
            },
            "query": `query FindPerformer($id: ID!) {
                findPerformer(id: $id) {
                    stash_ids {
                        endpoint
                        stash_id
                    }
                }
            }`
        };
        return stash.callGQL(reqData);
    }

    async function getStudioStashIDs(studioId) {
        const reqData = {
            "variables": {
                "id": studioId
            },
            "query": `query FindStudio($id: ID!) {
                findStudio(id: $id) {
                    stash_ids {
                        endpoint
                        stash_id
                    }
                }
            }`
        };
        return stash.callGQL(reqData);
    }

    async function updateStudioStashIDs(studioId, stash_ids) {
        const reqData = {
            "variables": {
                "input": {
                    "stash_ids": stash_ids,
                    "id": studioId
                }
            },
            "query": `mutation StudioUpdate($input: StudioUpdateInput!) {
                studioUpdate(input: $input) { id }
            }`
        };
        await stash.callGQL(reqData);
    }

    const toUrl = (string) => {
        try {
            return new URL(string);
        } catch { return null; }
    }

    // Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc.
    const copyButtonSvg = `<svg class="svg-inline--fa" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#FFF" d="M384 96V0H272c-26.51 0-48 21.49-48 48v288c0 26.51 21.49 48 48 48h192c26.51 0 48-21.49 48-48V128h-95.1c-18.5 0-32.9-14.4-32.9-32zm32-96v96h96L416 0zM192 352V128H48c-26.51 0-48 21.49-48 48v288c0 26.51 21.49 48 48 48h192c26.51 0 48-21.49 48-48v-48h-32c-35.3 0-64-28.7-64-64z"/></svg>`

    function createCopyButton(copyText) {
        const copyBtn = document.createElement('button');
        copyBtn.title = 'Copy to clipboard';
        copyBtn.innerHTML = copyButtonSvg;
        copyBtn.classList.add('btn', 'btn-secondary', 'btn-sm', 'minimal', 'ml-1');
        copyBtn.addEventListener('click', () => copyHandler(copyText));
        return copyBtn;
    }

    function copyHandler(copyText) {
        try {
            navigator.clipboard.writeText(copyText);
        } catch {
            Toastify({
                text: 'Copy failed!'
            })
        }
        Toastify({
            text: 'Copied!',
            duration: 500
        }).showToast()
    }

    function addCopyBtnToPills() {
        document.querySelectorAll(".stash-id-pill").forEach(pill => {
            const data = pill.querySelector("a")
            const copyBtn = createCopyButton(data.innerText);
            pill.appendChild(copyBtn);
        })
    }

    async function setupPerformerPage(el) {
        if (document.getElementById('performer-stashids')) return
        const performerHead = el.querySelector('.performer-head');

        const stashIdInputCol = document.createElement('div')
        stashIdInputCol.classList.add('col');
        
        const stashboxInputContainer = document.createElement('div')
        stashboxInputContainer.classList.add('row', 'row-cols-8');
        
        const stashboxInput = document.createElement('select');
        stashboxInput.setAttribute('id', 'update-stashids-endpoint');
        stashboxInput.classList.add('col-2','form-control', 'input-control');

        stashIdInputCol.appendChild(stashboxInputContainer)
        performerHead.appendChild(stashIdInputCol);

        const data = await stash.getStashBoxes();
        let i = 0;
        for (const { name, endpoint } of data.data.configuration.general.stashBoxes) {
            i++;
            const option = document.createElement('option');
            option.innerText = name || `stash-box: #${i}`
            option.value = endpoint;
            stashboxInput.appendChild(option);
        }

        const stashIdInput = document.createElement('input');
        stashIdInput.classList.add('col-4','query-text-field', 'bg-secondary', 'text-white', 'border-secondary', 'form-control');
        stashIdInput.setAttribute('id', 'update-stashids');
        stashIdInput.setAttribute('placeholder', 'Add StashID…');
        function idChange() {
            const url = toUrl(stashIdInput.value);
            let newEndpoint;
            let newStashId;
            if (url) {
                for (const option of stashboxInput.options) {
                    if (option.value === url.origin + '/graphql') {
                        newEndpoint = option.value;
                    }
                }
                if (!newEndpoint || !url.pathname.startsWith('/performers/')) {
                    alert('Unknown stashbox url.');
                    return;
                }
                newStashId = url.pathname.replace('/performers/', '');
            } else {
                newEndpoint = stashboxInput.options[stashboxInput.selectedIndex].value;
                newStashId = stashIdInput.value;
            }
            stashIdInput.value = '';
            if (!newStashId) return;

            const performerId = window.location.pathname.replace('/performers/', '');
            getPerformerStashIDs(performerId)
                .then(data => {
                    const stash_ids = data.data.findPerformer.stash_ids;
                    if (stash_ids.find(({endpoint, stash_id }) => endpoint === newEndpoint && stash_id === newStashId)) return;
                    if (!confirm(`Add StashID ${newStashId}?`)) return;
                    return updatePerformerStashIDs(performerId, stash_ids.concat([{ endpoint: newEndpoint, stash_id: newStashId }]));
                }).then(() => window.location.reload());
        }
        stashIdInput.addEventListener('change', () => idChange());
        stashboxInputContainer.appendChild(stashIdInput);
        stashboxInputContainer.appendChild(stashboxInput);

        const stashIdsResult = getElementsByXpath("//dl[@class='details-list']//dt[text()='StashIDs']/following-sibling::dd/ul/li/a")
        const stashIds = [];
        let node = null;
        while (node = stashIdsResult.iterateNext()) {
            stashIds.push(node);
        }
        addCopyBtnToPills()
    }

    async function setupStudioPage(el) {
        if (document.getElementById('studio-stashids')) return
        const studioHead = el.querySelector('.studio-head');

        const stashIdInputCol = document.createElement('div')
        stashIdInputCol.classList.add('col');

        const container = document.createElement('div');
        container.setAttribute('id', 'studio-stashids');
        container.classList.add('row', 'row-cols-8');
        studioHead.appendChild(stashIdInputCol);
        stashIdInputCol.appendChild(container)

        const stashboxInput = document.createElement('select');
        stashboxInput.setAttribute('id', 'update-stashids-endpoint');
        stashboxInput.classList.add('col-2','form-control', 'input-control', 'mt-2', 'col-md-4');

        const data = await stash.getStashBoxes();
        let i = 0;
        for (const { name, endpoint } of data.data.configuration.general.stashBoxes) {
            i++;
            const option = document.createElement('option');
            option.innerText = name || `stash-box: #${i}`
            option.value = endpoint;
            stashboxInput.appendChild(option);
        }

        const studioId = window.location.pathname.replace('/studios/', '');

        const stashIdInput = document.createElement('input');
        stashIdInput.classList.add('col-4','query-text-field', 'bg-secondary', 'text-white', 'border-secondary', 'form-control', 'mt-2', 'col-md-8');
        stashIdInput.setAttribute('id', 'update-stashids');
        stashIdInput.setAttribute('placeholder', 'Add StashID…');
        function idChange() {
            const url = toUrl(stashIdInput.value);
            let newEndpoint;
            let newStashId;
            if (url) {
                for (const option of stashboxInput.options) {
                    if (option.value === url.origin + '/graphql') {
                        newEndpoint = option.value;
                    }
                }
                if (!newEndpoint || !url.pathname.startsWith('/studios/')) {
                    alert('Unknown stashbox url.');
                    return;
                }
                newStashId = url.pathname.replace('/studios/', '');
            }
            else {
                newEndpoint = stashboxInput.options[stashboxInput.selectedIndex].value;
                newStashId = stashIdInput.value;
            }
            stashIdInput.value = '';
            if (!newStashId) return;

            getStudioStashIDs(studioId)
                .then(data => {
                    const stash_ids = data.data.findStudio.stash_ids;
                    if (stash_ids.find(({endpoint, stash_id }) => endpoint === newEndpoint && stash_id === newStashId)) return;
                    if (!confirm(`Add StashID ${newStashId}?`)) return;
                    return updateStudioStashIDs(studioId, stash_ids.concat([{ endpoint: newEndpoint, stash_id: newStashId }]));
                }).then(() => window.location.reload());
        }
        stashIdInput.addEventListener('change', () => idChange());
        container.appendChild(stashIdInput);
        container.appendChild(stashboxInput);
        addCopyBtnToPills()
    }

    stash.addEventListener('page:performer:details', function () {
        waitForElementId('performer-page', (elementId, el) => setupPerformerPage(el));
    });

    stash.addEventListener('page:studio:scenes', function () {
        waitForElementId('studio-page', (elementId, el) => setupStudioPage(el));
    });
})();