let sfw_mediaObserver = null;
let sfw_playListener = null;
let sfw_extraListeners = null; 

async function getSfwConfig() {
    try {
        const response = await fetch('/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `{
                    configuration {
                        plugins
                    }
                }`
            }),
        });
        const result = await response.json();
        const pluginSettings = result.data.configuration.plugins.sfwswitch;
        return { audioMute: pluginSettings?.audio_setting === true, neverUnblur: pluginSettings?.never_unblur === true };
    } catch (e) {
        console.error("SFW Switch: Could not fetch config", e);
        return { audioMute: false, neverUnblur: false };
    }
}

async function sfw_mode() {
    const stash_css = sfwswitch_findstashcss();
    const button = document.getElementById("plugin_sfw");
    if (!stash_css) return;
    const rawState = localStorage.getItem("sfw_mode");
    const sfwState = rawState === "true";
    const { audioMute: audioMuteEnabled, neverUnblur } = await getSfwConfig();

    stash_css.disabled = !sfwState;
    sfw_apply_never_unblur(sfwState && neverUnblur);

    if (sfwState && audioMuteEnabled) {
        sfw_mute_all_media();
    } else {
        sfw_unmute_all_media();
    }

    if (button) {
        button.style.color = sfwState ? "#5cff00" : "#f5f8fa";
    }
}

function sfwswitch_createbutton() {
    const buttonId = "plugin_sfw";

    if (document.getElementById(buttonId)) return;

    const buttonContainer = document.createElement("a");
    buttonContainer.className = "mr-2";
    buttonContainer.innerHTML = `
        <button id="${buttonId}" type="button" class="minimal d-flex align-items-center h-100 btn btn-primary" title="Toggle SFW Mode">
            <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="svg-inline--fa fa-cog fa-w-16 fa-icon undefined" viewBox="1.5 1.5 13 13">
                <path d="m7.646 9.354-3.792 3.792a.5.5 0 0 0 .353.854h7.586a.5.5 0 0 0 .354-.854L8.354 9.354a.5.5 0 0 0-.708 0z"></path>
                <path d="M11.414 11H14.5a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.5-.5h-13a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h3.086l-1 1H1.5A1.5 1.5 0 0 1 0 10.5v-7A1.5 1.5 0 0 1 1.5 2h13A1.5 1.5 0 0 1 16 3.5v7a1.5 1.5 0 0 1-1.5 1.5h-2.086l-1-1z"></path>
            </svg>
        </button>
    `;

    const intervalId = setInterval(() => {
        const navbarButtons = document.querySelector(".navbar-buttons");
        if (navbarButtons) {
            clearInterval(intervalId);
            navbarButtons.insertBefore(buttonContainer, navbarButtons.childNodes[0]);

            document.getElementById(buttonId).addEventListener("click", sfwswitch_switcher);

            sfw_mode();
        }
    }, 100);

    setTimeout(() => clearInterval(intervalId), 10000);
}

function sfw_forceMute(media) {
    if (!media) return;
    media.muted = true;
}

function sfw_mute_all_media() {
    document.querySelectorAll("audio, video").forEach(sfw_forceMute);

    if (!sfw_playListener) {
        sfw_playListener = function(e) {
            if (e.target.tagName === "VIDEO" || e.target.tagName === "AUDIO") {
                sfw_forceMute(e.target);
            }
        };

        document.addEventListener("play", sfw_playListener, true);
        document.addEventListener("volumechange", sfw_playListener, true);
        document.addEventListener("loadeddata", sfw_playListener, true);
        document.addEventListener("seeking", sfw_playListener, true);
    }

    if (!sfw_mediaObserver) {
        sfw_mediaObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === "VIDEO" || node.tagName === "AUDIO") {
                        sfw_forceMute(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll("video, audio").forEach(sfw_forceMute);
                    }
                });
            }
        });
        sfw_mediaObserver.observe(document.body, { childList: true, subtree: true });
    }
}

function sfw_unmute_all_media() {
    if (sfw_playListener) {
        document.removeEventListener("play", sfw_playListener, true);
        document.removeEventListener("volumechange", sfw_playListener, true);
        document.removeEventListener("loadeddata", sfw_playListener, true);
        document.removeEventListener("seeking", sfw_playListener, true);
        sfw_playListener = null;
    }

    if (sfw_mediaObserver) {
        sfw_mediaObserver.disconnect();
        sfw_mediaObserver = null;
    }

    document.querySelectorAll("audio, video").forEach(media => {
        media.muted = false;
    });
}

async function sfwswitch_switcher() {
    const stash_css = sfwswitch_findstashcss();
    if (!stash_css) return;

    stash_css.disabled = !stash_css.disabled;
    const enabled = !stash_css.disabled;

    localStorage.setItem("sfw_mode", enabled);

    const { audioMute: audioMuteEnabled, neverUnblur } = await getSfwConfig();
    sfw_apply_never_unblur(enabled && neverUnblur);

    if (enabled && audioMuteEnabled) {
        sfw_mute_all_media();
    } else {
        sfw_unmute_all_media();
        
        document.querySelectorAll("audio, video").forEach(media => {
            if (media.paused && media.muted) {
                media.muted = false; 
            }
        });
    }

    const button = document.getElementById("plugin_sfw");
    if (button) {
        button.style.color = enabled ? "#5cff00" : "#f5f8fa";
    }
}

const SFW_NEVER_UNBLUR_CSS = [
    ".thumbnail-container img,.detail-header-image,.wall-item-gallery,",
    ".scene-player-container,.scene-cover,.scene-card-preview,.scrubber-item,",
    ".scene-image,.scene-card img,.wall-item-media,.wall-item.show-title,",
    ".image-card img,.image-thumbnail,.Lightbox-carousel,.image-image,",
    ".react-photo-gallery--gallery img,.group-card-image,.gallery-image,",
    ".gallery-card-image,.gallery-card img,.gallery-cover img,",
    ".GalleryWallCard.GalleryWallCard-portrait,.GalleryWallCard.GalleryWallCard-landscape,",
    ".performer-card img,.studio-card-image,.studio-card img,.tag-card img",
    "{filter:blur(30px)!important}",
    ".card-section-title,.detail-item-value,.TruncatedText,.scene-studio-overlay,",
    ".scene-header>h3,h3.scene-header,.queue-scene-details,.marker-wall,",
    ".performer-name,.card-section,.name-data,.aliases-data,.gallery-header.no-studio,",
    ".studio-name,.studio-overlay a,.studio-logo,.studio-parent-studios,",
    ".group-details>div>h2,h3.image-header,.TruncatedText.image-card__description,",
    ".TruncatedText.tag-description,.tag-item.tag-link.badge.badge-secondary,.tag-name",
    "{filter:blur(2px)!important}",
].join("");

function sfw_apply_never_unblur(enabled) {
    const existing = document.getElementById("sfw-never-unblur");
    if (enabled && !existing) {
        const style = document.createElement("style");
        style.id = "sfw-never-unblur";
        style.textContent = SFW_NEVER_UNBLUR_CSS;
        document.head.appendChild(style);
    } else if (!enabled && existing) {
        existing.remove();
    }
}

function sfwswitch_findstashcss() {
    for (let i = 0; i < document.styleSheets.length; i++) {
        const sheet = document.styleSheets[i];
        try {
            if (sheet.href && sheet.href.includes("/plugin/sfwswitch/css")) {
                return sheet;
            }
        } catch (e) {
            // Cross-origin access blocked - skip
        }
    }
    return null;
}

async function sfw_init() {
    // Wait until the stylesheet is available
    let retries = 0;
    const maxRetries = 50; // ~5 seconds with 100ms delay

    while (!sfwswitch_findstashcss() && retries < maxRetries) {
        await new Promise(r => setTimeout(r, 100));
        retries++;
    }

    if (!document.getElementById("plugin_sfw")) {
        sfwswitch_createbutton();
    }
}

function sfw_start() {
    setTimeout(() => {
        sfw_init();
    }, 0); 
}

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", sfw_start);
} else {
    sfw_start();
}