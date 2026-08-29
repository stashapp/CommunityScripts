(function () {
    "use strict";
    const PluginApi = window.PluginApi;
    const React = PluginApi.React;

    function setStyle() {
        if(!document.querySelector(".VideoPlayer .video-wrapper") || !document.querySelector(".vjs-poster")) {
            window.setTimeout(setStyle, 100)
        } else {
            document.querySelector(".VideoPlayer .video-wrapper").before(document.querySelector(".vjs-poster"))
            document.querySelector(".VideoPlayer").classList.add("audio")
        }
    }

    // patch.instead() appends to a list of patches, so registering on every
    // navigation stacks up copies of this patch and breaks the patch chain.
    let patched = false;

    PluginApi.Event.addEventListener("stash:location", async (e) => {
        if (patched) return;

        const path = e.detail.data.location.pathname;
        const idRegExp = /.*\/scenes\/(\d+)/;
        if (!idRegExp.test(path)) return;

        await PluginApi.utils.loadComponents([
            PluginApi.loadableComponents.ScenePlayer
        ]);

        // re-check: another navigation event may have been handled while awaiting
        if (patched) return;
        patched = true;

        PluginApi.patch.instead("ScenePlayer", function (props, _, originalComponent) {
            const file = props.scene && props.scene.files && props.scene.files[0];
            let scene = props.scene;
            if (file && file.video_codec === "") {
                scene = { ...scene,
                    sceneStreams: props.scene.sceneStreams.filter((ss) => ss.label.toUpperCase() === 'HSL')
                };
                setStyle()
            }
            return React.createElement(originalComponent, { ...props, scene });
        });
    });
})();
