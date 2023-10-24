(function() {

    let running = false;
    const buttons = [];
    let maxCount = 0;
    let sceneId = null;

    function run() {
        if (!running) return;
        const button = buttons.pop();
        stash.setProgress((maxCount - buttons.length) / maxCount * 100);
        if (button) {
            const searchItem = getClosestAncestor(button, '.search-item');
            const { id } = stash.parseSearchItem(searchItem);
            sceneId = id;
            if (!button.disabled) {
                button.click();
            }
            else {
                buttons.push(button);
            }
        }
        else {
            stop();
        }
    }

    function processSceneUpdate(evt) {
        if (running && evt.detail.data?.sceneUpdate?.id === sceneId) {
            setTimeout(() => {
                run();
            }, 0)
        }
    }

    const btnId = 'batch-save';
    const startLabel = 'Save All';
    const stopLabel = 'Stop Save';
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
        if (!confirm("Are you sure you want to batch save?")) return;
        btn.innerHTML = stopLabel;
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-danger');
        running = true;
        stash.setProgress(0);
        buttons.length = 0;
        for (const button of document.querySelectorAll('.btn.btn-primary')) {
            if (button.innerText === 'Save') {
                buttons.push(button);
            }
        }
        maxCount = buttons.length;
        stash.addEventListener('stash:response', processSceneUpdate);
        run();
    }

    function stop() {
        btn.innerHTML = startLabel;
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-primary');
        running = false;
        stash.setProgress(0);
        sceneId = null;
        stash.removeEventListener('stash:response', processSceneUpdate);
    }

    stash.addEventListener('tagger:mutations:header', evt => {
        const el = getElementByXpath("//button[text()='Scrape All']");
        if (el && !document.getElementById(btnId)) {
            const container = el.parentElement;
            container.appendChild(btn);
            sortElementChildren(container);
            el.classList.add('ml-3');
        }
    });

    function checkSaveButtonDisplay() {
        const taggerContainer = document.querySelector('.tagger-container');
        const saveButton = getElementByXpath("//button[text()='Save']", taggerContainer);
        btn.style.display = saveButton ? 'inline-block' : 'none';
    }

    stash.addEventListener('tagger:mutations:searchitems', checkSaveButtonDisplay);

})();