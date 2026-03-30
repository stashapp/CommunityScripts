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
        return pluginSettings?.audio_setting === true;
    } catch (e) {
        console.error("SFW Switch: Could not fetch config", e);
        return false;
    }
}
async function sfw_mode() {
    const stash_css = sfwswitch_findstashcss();
    const button = document.getElementById("plugin_sfw");

    if (!stash_css) return;

    const sfwState = localStorage.getItem("sfw_mode") === "true";
    const audioMuteEnabled = await getSfwConfig();

    stash_css.disabled = !sfwState;

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

            // Initialize the button based on saved state
            sfw_mode();
        }
    }, 100);

    setTimeout(() => clearInterval(intervalId), 10000);
}

// Function to strictly handle the muted state
function sfw_forceMute(media) {
    if (!media) return;
    media.muted = true;
}

function sfw_mute_all_media() {
    // Initial sweep
    document.querySelectorAll("audio, video").forEach(sfw_forceMute);

    // Global event listener for play, seek, and volume changes
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

    // MutationObserver for content loaded via AJAX/Dynamic updates
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
    // 1. Remove listeners FIRST to prevent them from firing during the unmute loop
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

    // 2. Unmute existing media
    document.querySelectorAll("audio, video").forEach(media => {
        media.muted = false;
        // Optional: media.volume = 1.0; // Use if volume was also forced to 0
    });
}

async function sfwswitch_switcher() {
    const stash_css = sfwswitch_findstashcss();
    if (!stash_css) return;

    // Toggle the CSS
    stash_css.disabled = !stash_css.disabled;
    const enabled = !stash_css.disabled;

    localStorage.setItem("sfw_mode", enabled);

    const audioMuteEnabled = await getSfwConfig();

    // Logic Check: If we just disabled SFW, we MUST run unmute immediately
    if (enabled && audioMuteEnabled) {
        sfw_mute_all_media();
    } else {
        // This clears observers and sets muted = false
        sfw_unmute_all_media();
        
        // CRITICAL: Force a pause/reset on any media that might be stuck in a background buffer
        document.querySelectorAll("audio, video").forEach(media => {
            if (media.paused && media.muted) {
                // If it was supposed to be stopped, make sure it stays stopped
                media.muted = false; 
            }
        });
    }

    const button = document.getElementById("plugin_sfw");
    if (button) {
        button.style.color = enabled ? "#5cff00" : "#f5f8fa";
    }
}

function sfwswitch_findstashcss() {
    for (let i = 0; i < document.styleSheets.length; i++) {
        const stylesheet = document.styleSheets[i];
        if (stylesheet.href && stylesheet.href.includes("/plugin/sfwswitch/css")) {
            return stylesheet;
        }
    }
    return null;
}

// Initialize button on page load
sfwswitch_createbutton();
