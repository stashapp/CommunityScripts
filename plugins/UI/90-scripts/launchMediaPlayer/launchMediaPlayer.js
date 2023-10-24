(function () {

    const MIN_REQUIRED_PLUGIN_VERSION = '0.4.0';

    function openMediaPlayerTask(path) {
        // fixes decodeURI breaking on %'s because they are not encoded
        const encodedPctPath = path.replace(/%([^\d].)/, "%25$1");
        // decode encoded path but then encode % and # otherwise VLC breaks
        const encodedPath = decodeURI(encodedPctPath).replaceAll('%', '%25').replaceAll('#', '%23');

        stash.runPluginTask("userscript_functions", "Open in Media Player", {"key":"path", "value":{"str": encodedPath}});
    }

    // scene filepath open with Media Player
    stash.addEventListener('page:scene', function () {
        waitForElementClass('scene-file-info', function () {
            const a = getElementByXpath("//dt[text()='Path']/following-sibling::dd/a");
            if (a) {
                a.addEventListener('click', function () {
                    openMediaPlayerTask(a.href);
                });
            }
        });
    });
    
    const settingsId = 'userscript-settings-mediaplayer';

    stash.addSystemSetting(async (elementId, el) => {
        const inputId = 'userscript-settings-mediaplayer-input';
        if (document.getElementById(inputId)) return;
        const settingsHeader = 'Media Player Path';
        const settingsSubheader = 'Path to external media player.';
        const placeholder = 'Media Player Path…';
        const textbox = await stash.createSystemSettingTextbox(el, settingsId, inputId, settingsHeader, settingsSubheader, placeholder, false);
        textbox.addEventListener('change', () => {
            const value = textbox.value;
            if (value) {
                stash.updateConfigValueTask('MEDIAPLAYER', 'path', value);
                alert(`Media player path set to ${value}`);
            }
            else {
                stash.getConfigValueTask('MEDIAPLAYER', 'path').then(value => {
                    textbox.value = value;
                });
            }
        });
        textbox.disabled = true;
        stash.getConfigValueTask('MEDIAPLAYER', 'path').then(value => {
            textbox.value = value;
            textbox.disabled = false;
        });
    });

    stash.addEventListener('stash:pluginVersion', async function () {
        waitForElementId(settingsId, async (elementId, el) => {
            el.style.display = stash.pluginVersion != null ? 'flex' : 'none';
        });
        if (stash.comparePluginVersion(MIN_REQUIRED_PLUGIN_VERSION) < 0) {
            const alertedPluginVersion = await GM.getValue('alerted_plugin_version');
            if (alertedPluginVersion !== stash.pluginVersion) {
                await GM.setValue('alerted_plugin_version', stash.pluginVersion);
                alert(`User functions plugin version is ${stash.pluginVersion}. Stash Open Media Player userscript requires version ${MIN_REQUIRED_PLUGIN_VERSION} or higher.`);
            }
        }
    });
})();