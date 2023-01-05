// settings
const settings = {
    "apiKey": "",
    "urlScheme": "iina://weblink?url=file://",
    "replacePath": ["", ""],
};

// style
const style = document.createElement("style");
style.innerHTML = `
    .button {
        border-radius: 3.5px;
        cursor: pointer;
        padding: 2px 9px 3px 13px;
    }
    .button:hover {
        background-color: rgba(138, 155, 168, .15);
    }
    .button svg {
        fill: currentColor;
        width: 1em;
        vertical-align: middle;
    }
    .button span {
        font-size: 15px;
        font-weight: 500;
        letter-spacing: 0.1em;
        color: currentColor;
        vertical-align: middle;
        margin-left: 3px;
    }
`;
document.head.appendChild(style);

// api
let getFilePath = async href => {
    let regex = /\/scenes\/(.*)\?/,
        sceneId = regex.exec(href)[1],
        graphQl = `{ findScene(id: ${sceneId}) { files { path } } }`,
        response = await fetch("/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "ApiKey": settings.apiKey,
            },
            body: JSON.stringify({ query: graphQl })
        });
    return response.json();
};

// promise
let waitForElm = selector => {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }
        let observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
};

// initial
waitForElm("video").then(() => {
    addButton();
});

// route
let previousUrl = '';
const observer = new MutationObserver(function (mutations) {
    if (window.location.href !== previousUrl) {
        previousUrl = window.location.href;
        waitForElm("video").then(() => {
            addButton();
        });
    }
});
const config = { subtree: true, childList: true };
observer.observe(document, config);

// main
let addButton = () => {
    let scenes = document.querySelectorAll("div.row > div");
    for (let scene of scenes) {
        if (scene.querySelector("a.button") === null) {
            let scene_url = scene.querySelector("a.scene-card-link"),
                popover = scene.querySelector("div.card-popovers"),
                button = document.createElement("a");
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <path d="M77.2 1.1H22.8c-12 0-21.7 9.7-21.7 21.7v54.4c0 12 9.7 21.7 21.7 21.7h54.4c12 
                    0 21.7-9.7 21.7-21.7V22.8c0-12-9.7-21.7-21.7-21.7zM22 54.9c0 1.8-1.4 3.2-3.2 3.2h0c-1.8 
                    0-3.2-1.4-3.2-3.2v-10c0-1.8 1.4-3.2 3.2-3.2h0c1.8 0 3.2 1.4 3.2 3.2v10zm11.4 2.9c0 2.3-1.8 
                    4.1-4.1 4.1h-.1c-2.3 0-4.1-1.8-4.1-4.1V42c0-2.3 1.8-4.1 4.1-4.1h.1c2.3 0 4.1 1.8 4.1 
                    4.1v15.8zm49.3-2.7c-3.6 3.3-7.4 4.9-8.7 5.7-3.1 1.7-19.9 11.8-25 
                    14-3.2 1.4-5.5.6-7.1-.4-1.1-.7-2.1-2.4-2.7-3.8-1-2.3-.8-10.2-.8-10.2V37.6c0-4 .4-6.8.8-7.8.5-1.3 
                    1.6-4.2 4.2-4.9s4.2-.3 6.7.7 8.1 4.4 8.1 4.4l21 12.1c4.1 2.4 5 4.6 5.4 5.6.2.4 1.7 4.1-1.9 7.4z" />
                </svg>
                <span>IINA</span>
            `;
            button.classList.add("button");
            if (popover) popover.append(button);
            button.onmouseover = () => {
                if ([button.title.length, button.href.length].indexOf(0) > -1) {
                    getFilePath(scene_url.href)
                        .then((result) => {
                            let filePath = result.data.findScene.files[0].path
                                .replace(settings.replacePath[0], "");
                            button.title = filePath;
                            button.href = settings.urlScheme +
                                settings.replacePath[1] +
                                encodeURIComponent(filePath);
                        });
                }
            };
        }
    }
};
