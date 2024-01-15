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
    performerUpdate(input: $input) {
        ...PerformerData
    }
}

fragment PerformerData on Performer {
    id
    favorite
    stash_ids {
        stash_id
        endpoint
  }
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
        ...PerformerData
    }
}

fragment PerformerData on Performer {
    id
    stash_ids {
        endpoint
        stash_id
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
        ...StudioData
    }
}

fragment StudioData on Studio {
    id
    stash_ids {
        endpoint
        stash_id
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
    studioUpdate(input: $input) {
        ...StudioData
    }
}

fragment StudioData on Studio {
    id
    stash_ids {
        stash_id
        endpoint
    }
}`
        };
        await stash.callGQL(reqData);
    }

    function toUrl(string) {
        let url;
        
        try {
            url = new URL(string);
        } catch (_) {
            return null;
        }
    
        if (url.protocol === "http:" || url.protocol === "https:") return url;
        return null;
    }

    function createTooltipElement() {
        const copyTooltip = document.createElement('span');
        copyTooltip.setAttribute('id', 'copy-tooltip');
        copyTooltip.innerText = 'Copied!';
        copyTooltip.classList.add('fade', 'hide');
        copyTooltip.style.position = "absolute";
        copyTooltip.style.left = '0px';
        copyTooltip.style.top = '0px';
        copyTooltip.style.marginLeft = '40px';
        copyTooltip.style.padding = '5px 12px';
        copyTooltip.style.backgroundColor = '#000000df';
        copyTooltip.style.borderRadius = '4px';
        copyTooltip.style.color = '#fff';
        document.body.appendChild(copyTooltip);
        return copyTooltip;
    }

    function createCopyButton(copyTooltip, copyText) {
        const copyBtn = document.createElement('button');
        copyBtn.title = 'Copy to clipboard';
        copyBtn.innerHTML = `<svg class="svg-inline--fa" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path fill="#FFFFFF" d="M384 96L384 0h-112c-26.51 0-48 21.49-48 48v288c0 26.51 21.49 48 48 48H464c26.51 0 48-21.49 48-48V128h-95.1C398.4 128 384 113.6 384 96zM416 0v96h96L416 0zM192 352V128h-144c-26.51 0-48 21.49-48 48v288c0 26.51 21.49 48 48 48h192c26.51 0 48-21.49 48-48L288 416h-32C220.7 416 192 387.3 192 352z"/></svg>`;
        copyBtn.classList.add('btn', 'btn-secondary', 'btn-sm', 'minimal', 'ml-1');
        copyBtn.addEventListener('click', copyHandler(copyTooltip, copyText));
        return copyBtn;
    }

    function copyHandler(copyTooltip, copyText) {
        return evt => {
            stash.setClipboard(copyText);
            const rect = document.body.getBoundingClientRect();
            const rect2 = evt.currentTarget.getBoundingClientRect();
            const x = rect2.left - rect.left;
            const y = rect2.top - rect.top;
            copyTooltip.classList.add('show');
            copyTooltip.style.left = `${x}px`;
            copyTooltip.style.top = `${y}px`;
            setTimeout(() => {
                copyTooltip.classList.remove('show');
            }, 500);
        }
    }

    function createDownloadButton(studioId, endpoint, remoteSiteId) {
        const downloadBtn = document.createElement('button');
        downloadBtn.title = 'Download studio image and set parent studio';
        downloadBtn.innerHTML = `<svg class="svg-inline--fa" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path fill="#FFFFFF" d="M152 120c-26.51 0-48 21.49-48 48s21.49 48 48 48s48-21.49 48-48S178.5 120 152 120zM447.1 32h-384C28.65 32-.0091 60.65-.0091 96v320c0 35.35 28.65 64 63.1 64h384c35.35 0 64-28.65 64-64V96C511.1 60.65 483.3 32 447.1 32zM463.1 409.3l-136.8-185.9C323.8 218.8 318.1 216 312 216c-6.113 0-11.82 2.768-15.21 7.379l-106.6 144.1l-37.09-46.1c-3.441-4.279-8.934-6.809-14.77-6.809c-5.842 0-11.33 2.529-14.78 6.809l-75.52 93.81c0-.0293 0 .0293 0 0L47.99 96c0-8.822 7.178-16 16-16h384c8.822 0 16 7.178 16 16V409.3z"/></svg>`
        downloadBtn.classList.add('btn', 'btn-secondary', 'btn-sm', 'minimal', 'ml-1');
        downloadBtn.addEventListener('click', downloadImageHandler(studioId, endpoint, remoteSiteId));
        return downloadBtn;
    }

    function downloadImageHandler(studioId, endpoint, remoteSiteId) {
        return evt => {
            if (!confirm(`Download studio image and set parent studio?`)) return;
            const callback = () => {
                document.body.style.cursor = 'auto';
                window.location.reload();
            }
            document.body.style.cursor = 'wait';
            stash.dispatchEvent(new CustomEvent('userscript_functions:update_studio', { 'detail': { studioId, endpoint, remoteSiteId, callback, errCallback: callback } }));
        }
    }

    stash.addEventListener('page:performer:details', function () {
        waitForElementId('performer-page', async function (elementId, el) {
            if (!document.getElementById('update-stashids-endpoint')) {
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

                const performerId = window.location.pathname.replace('/performers/', '');

                const stashIdInput = document.createElement('input');
                stashIdInput.classList.add('col-4','query-text-field', 'bg-secondary', 'text-white', 'border-secondary', 'form-control');
                stashIdInput.setAttribute('id', 'update-stashids');
                stashIdInput.setAttribute('placeholder', 'Add StashID…');
                stashIdInput.addEventListener('change', () => {
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
                    }
                    else {
                        newEndpoint = stashboxInput.options[stashboxInput.selectedIndex].value;
                        newStashId = stashIdInput.value;
                    }
                    stashIdInput.value = '';
                    if (!newStashId) return;

                    getPerformerStashIDs(performerId).then(data => {
                        const stash_ids = data.data.findPerformer.stash_ids;
                        if (stash_ids.find(({endpoint, stash_id }) => endpoint === newEndpoint && stash_id === newStashId)) return;
                        if (!confirm(`Add StashID ${newStashId}?`)) return;
                        return updatePerformerStashIDs(performerId, stash_ids.concat([{ endpoint: newEndpoint, stash_id: newStashId }]));
                    }).then(() => window.location.reload());
                });
                stashboxInputContainer.appendChild(stashIdInput);
                stashboxInputContainer.appendChild(stashboxInput);

                const copyTooltip = createTooltipElement();

                const stashIdsResult = getElementsByXpath("//dl[@class='details-list']//dt[text()='StashIDs']/following-sibling::dd/ul/li/a")
                const stashIds = [];
                let node = null;
                while (node = stashIdsResult.iterateNext()) {
                    stashIds.push(node);
                }
                for (const stashId of stashIds) {
                    const copyBtn = createCopyButton(copyTooltip, stashId.innerText);
                    stashId.parentElement.appendChild(copyBtn);
                }

            }
        });
    });

    stash.addEventListener('page:studio:scenes', function () {
        waitForElementId('studio-page', async function (elementId, el) {
            if (!document.getElementById('studio-stashids')) {
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
                stashIdInput.addEventListener('change', () => {
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

                    getStudioStashIDs(studioId).then(data => {
                        const stash_ids = data.data.findStudio.stash_ids;
                        if (stash_ids.find(({endpoint, stash_id }) => endpoint === newEndpoint && stash_id === newStashId)) return;
                        if (!confirm(`Add StashID ${newStashId}?`)) return;
                        return updateStudioStashIDs(studioId, stash_ids.concat([{ endpoint: newEndpoint, stash_id: newStashId }]));
                    }).then(() => window.location.reload());
                });
                container.appendChild(stashIdInput);
                container.appendChild(stashboxInput);

                const copyTooltip = createTooltipElement();

                getStudioStashIDs(studioId).then(data => {
                    for (const { endpoint, stash_id } of data.data.findStudio.stash_ids) {
                        const url = endpoint.replace(/graphql$/, 'studios/') + stash_id
                        const row = document.createElement('div');
                        row.classList.add('col-md-12', 'pl-1', 'mt-1');
                        row.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer">${stash_id}</a>`;
                        container.appendChild(row);

                        const copyBtn = createCopyButton(copyTooltip, stash_id);
                        row.appendChild(copyBtn);

                        if (stash.userscripts.indexOf('Stash Studio Image And Parent On Create') !== -1) {
                            const downloadBtn = createDownloadButton(studioId, endpoint, stash_id);
                            row.appendChild(downloadBtn);
                        }
                    }
                });
            }
        });
    });
})();