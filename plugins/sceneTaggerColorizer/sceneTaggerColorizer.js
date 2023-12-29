(function() {
    let pluginName = "sceneTaggerColorize";
    const DEFAULT_COLORS = {
        'green': '#0f9960',
        'red': '#ff7373',
        'yellow': '#d9822b'
    };

    const COLORS = {
        'green': '#0f9960',
        'red': '#ff7373',
        'yellow': '#d9822b'
    };

    function isAlphaNumeric(str) {
        let code, i, len;

        for (i = 0, len = str.length; i < len; i++) {
            code = str.charCodeAt(i);
            if (!(code > 47 && code < 58) && // numeric (0-9)
                !(code > 64 && code < 91) && // upper alpha (A-Z)
                !(code > 96 && code < 123)) { // lower alpha (a-z)
                return false;
            }
        }
        return true;
    };

    const findCommon = (str1 = '', str2 = '') => {
        const s1 = [...str1].filter(isAlphaNumeric);
        const s2 = [...str2].filter(isAlphaNumeric);
        const arr = Array(s2.length + 1).fill(null).map(() => {
           return Array(s1.length + 1).fill(null);
        });
        for (let j = 0; j <= s1.length; j += 1) {
           arr[0][j] = 0;
        }
        for (let i = 0; i <= s2.length; i += 1) {
           arr[i][0] = 0;
        }
        let len = 0;
        let col = 0;
        let row = 0;
        for (let i = 1; i <= s2.length; i += 1) {
           for (let j = 1; j <= s1.length; j += 1) {
              if (s1[j - 1] === s2[i - 1]) {
                 arr[i][j] = arr[i - 1][j - 1] + 1;
              }
              else {
                 arr[i][j] = 0;
              }
              if (arr[i][j] > len) {
                 len = arr[i][j];
                 col = j;
                 row = i;
              }
           }
        }
        if (len === 0) {
           return '';
        }
        let res = '';
        while (arr[row][col] > 0) {
           res = s1[col - 1] + res;
           row -= 1;
           col -= 1;
        }
        return res;
     };

    function getMatchIndex(a, b) {
        const re = new RegExp('(' + b.split('').join('[^a-zA-Z\d]*?') + ')', 'i');
        const match = a.match(re);
        let matchedText = null,
            start = null,
            end = null;
        if (match) {
            matchedText = match[0];
            start = match.index;
            end = match.index + matchedText.length;
        }
        return {
            matchedText,
            start,
            end
        };
    }

    function colorCommonText(element, title, commonText) {
        const {
            matchedText,
            start,
            end
        } = getMatchIndex(title, commonText);
        if (matchedText) {
            colorNode(element, title, start, end);
        }
        else {
            element.style.color = COLORS.red;
        }
    }

    function colorNode(element, title, start, end) {
        if (start === 0 && end === title.length) {
            element.style.color = COLORS.green;
        }
        else {
            element.innerHTML = '';
            if (start) {
                const substring1 = document.createElement('span');
                substring1.style.color = COLORS.red;
                substring1.innerText = title.substring(0, start);
                element.appendChild(substring1);
            }
            const substring2 = document.createElement('span');
            substring2.innerText = title.substring(start, end);
            substring2.style.color = COLORS.green;
            element.appendChild(substring2);
            if (end < title.length) {
                const substring3 = document.createElement('span');
                substring3.innerText = title.substring(end);
                substring3.style.color = COLORS.red;
                element.appendChild(substring3);
            }
        }
    }

    function colorizeSearchItem(searchItem) {
        const searchResultItem = searchItem.querySelector('li.search-result.selected-result.active');
        if (!searchResultItem) return;

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

        const {
            remoteUrlNode,
            remoteId,
            remoteUrl,
            remoteData,
            urlNode: matchUrlNode,
            detailsNode,
            imageNode,
            titleNode,
            dateNode,
            studioNode,
            performerNodes: matchPerformerNodes,
            matches
        } = stash.parseSearchResultItem(searchResultItem);

        const includeTitle = document.getElementById('colorize-title').checked;
        const includeDate = document.getElementById('colorize-date').checked;
        const includeStashID = document.getElementById('colorize-stashid').checked;
        const includeURL = document.getElementById('colorize-url').checked;
        const includeDetails = document.getElementById('colorize-details').checked;
        const includeStudio = document.getElementById('colorize-studio').checked;
        const includePerformers = document.getElementById('colorize-performers').checked;

        if (includeTitle && titleNode) {
            titleNode.firstChild.style.color = COLORS.yellow;
            if (data?.title) {
                if (titleNode.innerText === data.title) {
                    titleNode.firstChild.style.color = COLORS.green;
                    nameNode.style.color = COLORS.green;
                }
                else {
                    const commonText = findCommon(data.title.toLowerCase(), remoteData.title.toLowerCase());

                    colorCommonText(nameNode, data.title, commonText);
                    colorCommonText(titleNode.firstChild, remoteData.title, commonText);
                }
            }

        }

        if (includeDate && dateNode) {
            dateNode.style.color = COLORS.yellow;
            if (data?.date) {
                dateNode.style.color = dateNode.innerText === data.date ? COLORS.green : COLORS.red;
            }
        }

        if (includeStashID && remoteUrlNode) {
            remoteUrlNode.style.color = COLORS.yellow;
            if (data?.stash_ids?.length) {
                remoteUrlNode.style.color = data.stash_ids.find(o => o.stash_id === remoteUrlNode.innerText) ? COLORS.green : COLORS.red;
            }
        }

        if (includeDetails && detailsNode) {
            detailsNode.style.color = COLORS.yellow;
            if (data?.details) {
                detailsNode.style.color = detailsNode.textContent === data.details ? COLORS.green : COLORS.red;
            }
        }

        if (includeURL && matchUrlNode) {
            matchUrlNode.firstChild.style.color = COLORS.yellow;
            if (data?.url) {
                matchUrlNode.firstChild.style.color = matchUrlNode.innerText === data.url ? COLORS.green : COLORS.red;
            }
        }

        const performerTags = Array.from(performerNodes);
        performerTags.forEach(performerTag => performerTag.style.backgroundColor = COLORS.red);

        for (const {
            matchType,
            matchNode,
            data: matchData
        } of matches) {
            const subNode = matchNode.querySelector('b');
            const nodeToColor = subNode.firstChild.nodeType === Node.TEXT_NODE ? subNode : subNode.firstChild;
            let matchColor = COLORS.yellow;
            if (matchType === 'performer') {
                const performer = data?.performers?.find(performer => performer.id === matchData.stored_id);
                if (performer) {
                    matchColor = COLORS.green;
                    const performerTag = performerTags.find(performerTag => performerTag.innerText === performer.name);
                    if (performerTag) {
                        performerTag.style.backgroundColor = COLORS.green;
                    }
                }
            }
            else if (matchType === 'studio' && data?.studio?.id) {
                matchColor = data?.studio?.id === matchData.stored_id ? COLORS.green : COLORS.red;
            }
            if ((includeStudio && matchType === 'studio') || (includePerformers && matchType === 'performer')) {
                nodeToColor.style.color = matchColor;
            }
        }

    }

    const colorizeConfigId = 'colorize-config';

    stash.addEventListener('tagger:configuration', evt => {
        const el = evt.detail;
        if (!document.getElementById(colorizeConfigId)) {
            const configContainer = el.parentElement;
            const colorizeConfig = createElementFromHTML(`
<div id="${colorizeConfigId}" class="col-md-6 mt-4">
<h5>Colorize Configuration</h5>
<div class="row">
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="colorize-title" class="form-check-input" data-default="true">
            <label title="" for="colorize-title" class="form-check-label">Title</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="colorize-date" class="form-check-input" data-default="true">
            <label title="" for="colorize-date" class="form-check-label">Date</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="colorize-stashid" class="form-check-input" data-default="true">
            <label title="" for="colorize-stashid" class="form-check-label">Stash ID</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="colorize-url" class="form-check-input" data-default="true">
            <label title="" for="colorize-url" class="form-check-label">URL</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="colorize-details" class="form-check-input" data-default="true">
            <label title="" for="colorize-details" class="form-check-label">Details</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="colorize-studio" class="form-check-input" data-default="true">
            <label title="" for="colorize-studio" class="form-check-label">Studio</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="colorize-performers" class="form-check-input" data-default="true">
            <label title="" for="colorize-performers" class="form-check-label">Performers</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-12">
        <div class="row">
            <label title="" for="colorize-color-green" class="col-sm-2 col-form-label">Match Color</label>
            <div class="col-sm-10">
                <input type="text" id="colorize-color-green" class="query-text-field bg-secondary text-white border-secondary form-control" data-default="${DEFAULT_COLORS.green}" placeholder="${DEFAULT_COLORS.green}">
            </div>
        </div>
    </div>
    <div class="align-items-center form-group col-md-12">
        <div class="row">
            <label title="" for="colorize-color-yellow" class="col-sm-2 col-form-label">Missing Color</label>
            <div class="col-sm-10">
                <input type="text" id="colorize-color-yellow" class="query-text-field bg-secondary text-white border-secondary form-control" data-default="${DEFAULT_COLORS.yellow}" placeholder="${DEFAULT_COLORS.yellow}">
            </div>
        </div>
    </div>
    <div class="align-items-center form-group col-md-12">
        <div class="row">
            <label title="" for="colorize-color-red" class="col-sm-2 col-form-label">Mismatch Color</label>
            <div class="col-sm-10">
                <input type="text" id="colorize-color-red" class="query-text-field bg-secondary text-white border-secondary form-control" data-default="${DEFAULT_COLORS.red}" placeholder="${DEFAULT_COLORS.red}">
            </div>
        </div>
    </div>
</div>
</div>
            `);
            configContainer.appendChild(colorizeConfig);
            loadSettings();
        }
    });

    async function loadSettings() {
        for (const input of document.querySelectorAll(`#${colorizeConfigId} input[type="checkbox"]`)) {
            input.checked = await stash.getValue(pluginName, input.id, input.dataset.default === 'true');
            input.addEventListener('change', async () => {
                await stash.setValue(pluginName, input.id, input.checked);
            });
        }
        for (const input of document.querySelectorAll(`#${colorizeConfigId} input[type="text"]`)) {
            input.value = await stash.getValue(pluginName, input.id, input.dataset.default);
            input.addEventListener('change', async () => {
                const value = input.value.trim() || input.dataset.default;
                input.value = value;
                COLORS[input.id.replace('colorize-color-', '')] = value;
                await stash.setValue(pluginName, input.id, value);
            });
        }
    }

    stash.addEventListener('tagger:mutation:add:remoteperformer', evt => colorizeSearchItem(getClosestAncestor(evt.detail.node, '.search-item')));
    stash.addEventListener('tagger:mutation:add:remotestudio', evt => colorizeSearchItem(getClosestAncestor(evt.detail.node, '.search-item')));
    stash.addEventListener('tagger:mutation:add:local', evt => colorizeSearchItem(getClosestAncestor(evt.detail.node, '.search-item')));
    stash.addEventListener('tagger:mutation:add:container', evt => colorizeSearchItem(getClosestAncestor(evt.detail.node, '.search-item')));
    stash.addEventListener('tagger:mutation:add:subcontainer', evt => colorizeSearchItem(getClosestAncestor(evt.detail.node, '.search-item')));

})();