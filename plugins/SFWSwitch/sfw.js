function sfw_mode() {
    const stash_css = sfwswitch_findstashcss();
    const button = document.getElementById("plugin_sfw");

    if (!stash_css) return;

    const sfwState = localStorage.getItem("sfw_mode") === "true";

    // Apply saved state to the stylesheet
    stash_css.disabled = !sfwState;

    // Update button color
    button.style.color = sfwState ? "#5cff00" : "#f5f8fa";
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

function sfwswitch_switcher() {
    const stash_css = sfwswitch_findstashcss();
    if (!stash_css) {
        console.error("SFW stylesheet not found.");
        return;
    }

    // Toggle stylesheet
    stash_css.disabled = !stash_css.disabled;

    // Save new state to localStorage
    localStorage.setItem("sfw_mode", !stash_css.disabled);

    const button = document.getElementById("plugin_sfw");
    button.style.color = stash_css.disabled ? "#f5f8fa" : "#5cff00";
    console.log(`SFW mode ${stash_css.disabled ? "disabled" : "enabled"}`);
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
