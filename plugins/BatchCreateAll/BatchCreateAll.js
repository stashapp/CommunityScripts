(function () {
    'use strict';

    const pluginName = "BatchCreateAll";
    const DEFAULT_DELAY = 500; // Set your desired delay in milliseconds
    let delay = DEFAULT_DELAY;

    let running = false;
    let maxCount = 0;

    async function run() {
        if (!running) return;
        const createButtons = document.querySelectorAll('.search-result .btn-group');
        stash.setProgress((maxCount - createButtons.length) / maxCount * 100);
        for (const createButtonGroup of createButtons) {
            const selectPlaceholder = createButtonGroup.querySelector('.react-select__placeholder');
            const buttons = createButtonGroup.querySelectorAll('button.btn.btn-secondary');
            for (const button of buttons) {
                const selectText = selectPlaceholder?.textContent?.trim();
                const buttonText = button?.textContent?.trim();
                if (selectText !== 'Select Performer' && selectText !== 'Select Studio') return
                if (buttonText.disabled || buttonText !== 'Create') continue;
                button.click();
                await delayAction(delay); // Wait for 500ms
                // Add your interaction logic here for the 'Create' button, if needed.
                // For example, fill out a form or perform actions.

                // Click the 'Save' button in the modal footer of the new window
                const saveButton = document.querySelector('.ModalFooter.modal-footer button.btn.btn-primary');
                if (saveButton) {
                    saveButton.click();
                    await delayAction(delay); // Wait for 500ms
                    // Add your interaction logic here for the 'Save' button in the new window.
                }
            }
        }
        stop();
    }

    const btnId = 'batch-create'; // Change the button ID to 'batch-create'
    const startLabel = 'Create All'; // Change the button label to 'Create All'
    const stopLabel = 'Stop Create All';
    const btn = document.createElement("button");
    btn.setAttribute("id", btnId);
    btn.classList.add('btn', 'btn-primary', 'ml-3');
    btn.innerHTML = startLabel;
    btn.onclick = () => {
        if (running) stop();
        else start()
    };

    function start() {
        btn.innerHTML = stopLabel;
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-danger');
        running = true;
        stash.setProgress(0);
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
        loadSettings();
        waitForElementByXpath("//button[text()='Batch Update Performers']", function (xpath, el) {
            if (!document.getElementById(btnId)) {
                const container = el.parentElement;
                container.appendChild(btn);
            }
        });
    });

    stash.addEventListener('tagger:mutations:header', () => {
        loadSettings();
        const el = getElementByXpath("//button[text()='Scrape All']");
        if (el && !document.getElementById(btnId)) {
            const container = el.parentElement;
            container.appendChild(btn);
            sortElementChildren(container);
            el.classList.add('ml-3');
        }
    });

    async function loadSettings() {
        delay = await stash.getValue(pluginName, 'batch-create-delay', DEFAULT_DELAY);
        const input = document.querySelector("input#batch-search-delay");
        input.value = delay;
        input.addEventListener('change', async () => {
            let value = parseInt(input.value.trim())
            value = isNaN(value) ? DEFAULT_DELAY : value;
            input.value = value;
            delay = value;
            await stash.setValue(pluginName, 'batch-create-delay', value);
        });
    }

    // Function to delay actions
    const delayAction = async (ms) => new Promise(resolve => setTimeout(resolve, ms));
})();