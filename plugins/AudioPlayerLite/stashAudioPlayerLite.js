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

    PluginApi.Event.addEventListener("stash:location", async (e) => {
        const path = e.detail.data.location.pathname;
        const idRegExp = /.*\/scenes\/(\d+)/;
        if (idRegExp.test(path)) {
            await PluginApi.utils.loadComponents([
                PluginApi.loadableComponents.ScenePlayer
            ]);
            PluginApi.patch.instead("ScenePlayer", function (props, _, originalComponent) {
                const file = props.scene.files[0];
                let scene = props.scene;
                if (file.video_codec === "") {
                    scene = { ...scene,
                        sceneStreams: props.scene.sceneStreams.filter((ss) => ss.label.toUpperCase() === 'HSL')
                    };
                    poster()
                }
                return originalComponent({ ...props, scene });
            });
        }
    });
})();
