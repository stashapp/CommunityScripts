// Stash Audio Player
(async function () {
    "use strict"

    const { waitForElement, PathElementListener, getConfiguration, callGQL, baseURL } = window.csLib

    const defaultConfig = { audioExtensions: "mp3, m4a", useTag: false }
    const config = await getConfiguration("AudioPlayer", defaultConfig)
    const pluginConfig = {
        ...defaultConfig,
        ...config,
    }

    function setAudioElement(bool) {
        const pl = document.querySelector(".VideoPlayer")
        var elm = document.getElementById("VideoJsPlayer_html5_api")
        const sourceElements = Array.from(
            document.querySelectorAll(
                "#VideoJsPlayer > div.vjs-control-bar > div.vjs-source-selector.vjs-menu-button.vjs-menu-button-popup.vjs-control.vjs-button > div > ul > li > span.vjs-menu-item-text"
            )
        )
        const hlsButton = sourceElements.find((el) => el.textContent.trim().toLowerCase() === "hls")
        if (bool) {
            pl.classList.add("audio")
            document.querySelector(".VideoPlayer .video-wrapper").before(document.querySelector(".vjs-poster"))
            if (hlsButton) {
                hlsButton.click()
            }
        } else {
            document.getElementById("VideoJsPlayer_html5_api").after(document.querySelector(".vjs-poster"))
            pl.classList.remove("audio")
            sourceElements[0].click()
        }
    }

    function audiotoggle() {
        const elm = document.querySelector(".scene-toolbar-group")
        const btng = document.createElement("div")
        const btn = document.createElement("button")
        const pl = document.querySelector(".VideoPlayer")
        if (pl.classList.contains("audio")) {
            btn.classList.add("enabled")
        }
        btn.id = "audioToggle"
        btn.classList.add("minimal", "btn", "btn-secondary")
        //btn.innerHTML = "Audio Only";
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.25a.75.75 0 0 0-.75.75v11.26a4.25 4.25 0 1 0 1.486 2.888A1 1 0 0 0 12.75 17V7.75H18a2.75 2.75 0 1 0 0-5.5z"/></svg>`
        btn.onclick = function () {
            const pl = document.querySelector(".VideoPlayer")
            const bt = document.getElementById("audioToggle")
            if (pl.classList.contains("audio")) {
                setAudioElement(false)
                bt.classList.remove("enabled")
            } else {
                setAudioElement(true)
                bt.classList.add("enabled")
            }
        }
        btng.classList.add("btn-group")
        btng.appendChild(btn)
        elm.appendChild(btng)
    }

    async function getScene() {
        const currentPath = window.location.pathname
        const idRegExp = /\/scenes\/(\d+).*/
        const id = idRegExp.exec(currentPath)[1]
        const query = `query FindScene($id: ID!, $checksum: String) {findScene(id: $id, checksum: $checksum) { id\n files { id\n path\n __typename }\n tags { id\n name\n __typename }\n __typename}}`
        const variables = { id }
        const response = await callGQL({ query, variables })
        return response
    }

    function findAudioTag(sceneInfo) {
        const tags = sceneInfo["findScene"]["tags"]
        const audioTag = tags.find((tag) => tag.name === "Audio")
        if (audioTag) {
            setAudioElement(true)
        }
        // waitForElement(".tag-item", function (){
        // const links = document.querySelectorAll('.tag-item a');
        // if (links) {
        //     links.forEach(link => {
        //         const divText = link.querySelector('div').textContent.trim();
        //         if (divText === "Audio") {
        //             setAudioElement(true);
        //         }
        //     });
        // }})
    }

    function findAudioExtension(sceneInfo) {
        const filesExt = sceneInfo["findScene"]["files"].map((file) => {
            const fileNameArray = file.path.split(".")
            return fileNameArray[fileNameArray.length - 1]
        })
        const extToSearch = pluginConfig["audioExtensions"].split(",").map((ext) => ext.trim())
        const audioFiles = filesExt.find((ext) => extToSearch.includes(ext))
        if (audioFiles) {
            setAudioElement(true)
        }
    }

    PathElementListener(
       baseURL + "scenes/",
        "#VideoJsPlayer > div.vjs-control-bar > div.vjs-source-selector.vjs-menu-button.vjs-menu-button-popup.vjs-control.vjs-button > div > ul > li > span.vjs-menu-item-text",
        async function () {
            const sceneInfo = await getScene()
            const useTag = pluginConfig["useTag"]
            if (useTag) {
                findAudioTag(sceneInfo)
            } else {
                findAudioExtension(sceneInfo)
            }
            waitForElement(".scene-toolbar-group", audiotoggle)
        }
    )
})()
