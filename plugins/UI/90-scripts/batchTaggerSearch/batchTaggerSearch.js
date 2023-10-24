(function() {

    const DEFAULT_DELAY = 200;
    let delay = DEFAULT_DELAY;

    let running = false;
    const buttons = [];
    let maxCount = 0;

    function run() {
        if (!running) return;
        const button = buttons.pop();
        stash.setProgress((maxCount - buttons.length) / maxCount * 100);
        if (button) {
            if (!button.disabled) {
                button.click();
            }
            else {
                buttons.push(button);
            }
            setTimeout(run, delay);
        }
        else {
            stop();
        }
    }

    const btnId = 'batch-search';
    const startLabel = 'Search All';
    const stopLabel = 'Stop Search';
    const btn = document.createElement("button");
    btn.setAttribute("id", btnId);
    btn.classList.add('btn', 'btn-primary', 'ml-3');
    btn.innerHTML = startLabel;
    btn.onclick = () => {
        if (running) {
            stop();
        }
        else {
            start();
        }
    };

    function start() {
        btn.innerHTML = stopLabel;
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-danger');
        running = true;
        stash.setProgress(0);
        buttons.length = 0;
        for (const button of document.querySelectorAll('.btn.btn-primary')) {
            if (button.innerText === 'Search') {
                buttons.push(button);
            }
        }
        maxCount = buttons.length;
        run();
    }

    function stop() {
        btn.innerHTML = startLabel;
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-primary');
        running = false;
        stash.setProgress(0);
    }

    stash.addEventListener('page:performers', function () {
        waitForElementByXpath("//button[text()='Batch Update Performers']", function (xpath, el) {
            if (!document.getElementById(btnId)) {
                const container = el.parentElement;

                container.appendChild(btn);
            }
        });
    });

    stash.addEventListener('tagger:mutations:header', evt => {
        const el = getElementByXpath("//button[text()='Scrape All']");
        if (el && !document.getElementById(btnId)) {
            const container = el.parentElement;
            container.appendChild(btn);
            sortElementChildren(container);
            el.classList.add('ml-3');
        }
    });

    const batchSearchConfigId = 'batch-search-config';

    stash.addEventListener('tagger:configuration', evt => {
        const el = evt.detail;
        if (!document.getElementById(batchSearchConfigId)) {
            const configContainer = el.parentElement;
            const batchSearchConfig = createElementFromHTML(`
<div id="${batchSearchConfigId}" class="col-md-6 mt-4">
<h5>Batch Search</h5>
<div class="row">
    <div class="align-items-center form-group col-md-12">
        <div class="row">
            <label title="" for="batch-search-delay" class="col-sm-2 col-form-label">Delay (ms)</label>
            <div class="col-sm-10">
                <input type="text" id="batch-search-delay" class="query-text-field bg-secondary text-white border-secondary form-control" data-default="${DEFAULT_DELAY}" placeholder="${DEFAULT_DELAY}">
            </div>
        </div>
        <small class="form-text">Wait time in milliseconds between scene searches.</small>
    </div>
</div>
</div>
            `);
            configContainer.appendChild(batchSearchConfig);
            loadSettings();
        }
    });

    async function loadSettings() {
        for (const input of document.querySelectorAll(`#${batchSearchConfigId} input[type="text"]`)) {
            input.value = parseInt(await GM.getValue(input.id, input.dataset.default));
            delay = input.value;
            input.addEventListener('change', async () => {
                let value = parseInt(input.value.trim())
                if (isNaN(value)) {
                    value = parseInt(input.dataset.default);
                }
                input.value = value;
                delay = value;
                await GM.setValue(input.id, value);
            });
        }
    }

})();