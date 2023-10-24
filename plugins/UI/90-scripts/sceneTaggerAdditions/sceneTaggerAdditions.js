(function () {

    function formatDuration(s) {
        const sec_num = parseInt(s, 10);
        let hours   = Math.floor(sec_num / 3600);
        let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        let seconds = sec_num - (hours * 3600) - (minutes * 60);
    
        if (hours < 10) { hours = "0" + hours; }
        if (minutes < 10) { minutes = "0" + minutes; }
        if (seconds < 10) { seconds = "0" + seconds; }
        return hours + ':' + minutes + ':' + seconds;
    }

    function openMediaPlayerTask(path) {
        stash.runPluginTask("userscript_functions", "Open in Media Player", {"key":"path", "value":{"str": path}});
    }

    stash.addEventListener('tagger:searchitem', async function (evt) {
        const searchItem = evt.detail;
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

        const includeDuration = await GM.getValue('additions-duration', true);
        const includePath = await GM.getValue('additions-path', true);
        const includeUrl = await GM.getValue('additions-url', true);

        const originalSceneDetails = searchItem.querySelector('.original-scene-details');

        if (!originalSceneDetails.firstChild.firstChild.querySelector('.scene-url') && data.url) {
            const sceneUrlNode = createElementFromHTML(`<a href="${data.url}" class="scene-url" target="_blank">${data.url}</a>`);
            sceneUrlNode.style.display = includeUrl ? 'block' : 'none';
            sceneUrlNode.style.fontWeight = 500;
            sceneUrlNode.style.color = '#fff';
            originalSceneDetails.firstChild.firstChild.appendChild(sceneUrlNode);
        }

        const paths = stash.compareVersion("0.17.0") >= 0 ? data.files.map(file => file.path) : [data.path];
        if (!originalSceneDetails.firstChild.firstChild.querySelector('.scene-path')) {
            for (const path of paths) {
                if (path) {
                    const pathNode = createElementFromHTML(`<a href="#" class="scene-path">${path}</a>`);
                    pathNode.style.display = includePath ? 'block' : 'none';
                    pathNode.style.fontWeight = 500;
                    pathNode.style.color = '#fff';
                    pathNode.addEventListener('click', evt => {
                        evt.preventDefault();
                        if (stash.pluginVersion) {
                            openMediaPlayerTask(path);
                        }
                    });
                    originalSceneDetails.firstChild.firstChild.appendChild(pathNode);
                }
            }
        }

        const duration = stash.compareVersion("0.17.0") >= 0 ? data.files[0].duration : data.file.duration;
        if (!originalSceneDetails.firstChild.firstChild.querySelector('.scene-duration') && duration) {
            const durationNode = createElementFromHTML(`<span class="scene-duration">Duration: ${formatDuration(duration)}</span>`);
            durationNode.style.display = includeDuration ? 'block' : 'none';
            durationNode.style.fontWeight = 500;
            durationNode.style.color = '#fff';
            originalSceneDetails.firstChild.firstChild.appendChild(durationNode);
        }

        const expandDetailsButton = originalSceneDetails.querySelector('button');
        if (!expandDetailsButton.classList.contains('.enhanced')) {
            expandDetailsButton.classList.add('enhanced');
            expandDetailsButton.addEventListener('click', evt => {
                const icon = expandDetailsButton.firstChild.dataset.icon;
                if (evt.shiftKey) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    for (const button of document.querySelectorAll('.original-scene-details button')) {
                        if (button.firstChild.dataset.icon === icon) {
                            button.click();
                        }
                    }
                }
            });
        }
    });

    const additionsConfigId = 'additionsconfig';

    stash.addEventListener('tagger:configuration', evt => {
        const el = evt.detail;
        if (!document.getElementById(additionsConfigId)) {
            const configContainer = el.parentElement;
            const additionsConfig = createElementFromHTML(`
<div id="${additionsConfigId}" class="col-md-6 mt-4">
<h5>Tagger Additions Configuration</h5>
<div class="row">
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="additions-duration" class="form-check-input" data-default="true">
            <label title="" for="additions-duration" class="form-check-label">Duration</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="additions-path" class="form-check-input" data-default="true">
            <label title="" for="additions-path" class="form-check-label">Filepath</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="additions-url" class="form-check-input" data-default="true">
            <label title="" for="additions-url" class="form-check-label">URL</label>
        </div>
    </div>
</div>
</div>
            `);
            configContainer.appendChild(additionsConfig);
            loadSettings();
            document.getElementById('additions-duration').addEventListener('change', function () {
                for (const node of document.querySelectorAll('.scene-duration')) {
                    node.style.display = this.checked ? 'block' : 'none';
                }
            });
            document.getElementById('additions-path').addEventListener('change', function () {
                for (const node of document.querySelectorAll('.scene-path')) {
                    node.style.display = this.checked ? 'block' : 'none';
                }
            });
            document.getElementById('additions-url').addEventListener('change', function () {
                for (const node of document.querySelectorAll('.scene-url')) {
                    node.style.display = this.checked ? 'block' : 'none';
                }
            });
        }
    });

    async function loadSettings() {
        for (const input of document.querySelectorAll(`#${additionsConfigId} input`)) {
            input.checked = await GM.getValue(input.id, input.dataset.default === 'true');
            input.addEventListener('change', async () => {
                await GM.setValue(input.id, input.checked);
            });
        }
    }
})();