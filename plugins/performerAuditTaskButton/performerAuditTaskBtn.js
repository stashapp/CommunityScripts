(function () {
    let pluginName = "performerAuditTaskBtn"
    stash.visiblePluginTasks.push('Audit performer urls');

    const settingsId = 'userscript-settings-audit-task';
    const inputId = 'userscript-settings-audit-task-button-visible';

    stash.addEventListener('page:performers', function () {
        waitForElementClass("btn-toolbar", async () => {
            if (!document.getElementById('audit-task')) {
                const toolbar = document.querySelector(".btn-toolbar");

                const newGroup = document.createElement('div');
                newGroup.classList.add('mx-2', 'mb-2', await stash.getValue(pluginName, inputId, false) ? 'd-flex' : 'd-none');
                toolbar.appendChild(newGroup);

                const auditButton = document.createElement("button");
                auditButton.setAttribute("id", "audit-task");
                auditButton.classList.add('btn', 'btn-secondary');
                auditButton.innerHTML = 'Audit URLs';
                auditButton.onclick = () => {
                    stash.runPluginTask("userscript_functions", "Audit performer urls");
                };
                newGroup.appendChild(auditButton);
            }
        });
    });

    stash.addSystemSetting(async (elementId, el) => {
        if (document.getElementById(inputId)) return;
        const settingsHeader = 'Show Audit Performer URLs Button';
        const settingsSubheader = 'Display audit performer urls button on performers page.';
        const checkbox = await stash.createSystemSettingCheckbox(el, settingsId, inputId, settingsHeader, settingsSubheader);
        checkbox.checked = await stash.getValue(pluginName, inputId, false);
        checkbox.addEventListener('change', async () => {
            const value = checkbox.checked;
            await stash.setValue(pluginName, inputId, value);
        });
    });
})();