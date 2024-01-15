(function () {
    function addRemoveButtons() {
        // Get all div elements with class "mt-3" and "search-item"
        const divs = document.querySelectorAll(".mt-3.search-item");
        // Loop through each div element and add a remove button
        divs.forEach((div) => {
            // Check if a remove button has already been added to the current element
            if (div.querySelector(".tagger-remover")) return;
            const divContainer = document.createElement("div");
            divContainer.setAttribute("class", "mt-2 text-right");
            const removeBtn = document.createElement("button");
            removeBtn.innerText = "Remove";
            removeBtn.setAttribute("class", "tagger-remover btn btn-danger");
            // Add click event listener to remove button
            removeBtn.addEventListener("click", () => {
                div.parentNode.removeChild(div);
            });
            divContainer.appendChild(removeBtn);
            // Get the first child element with class "col-md-6 my-1"
            const innerDiv = div.querySelector(".col-md-6.my-1>div:not([class])");
            // Append the new element as a child inside the inner div without a class
            innerDiv.appendChild(divContainer);
        });
    }
    async function run() {
        await waitForElementByXpath(
            "//div[contains(@class, 'tagger-container mx-md-auto')]",
            () => addRemoveButtons()
        );
    }

    const updateElements = run
    stash.addEventListener("tagger:searchitem", () => {
        console.log("Loaded");
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                Array.from(mutation.addedNodes).forEach((addedNode) => {
                    if (addedNode.matches && addedNode.matches(".mt-3.search-item")) {
                        setTimeout(function () {
                            updateElements();
                        }, 2000);
                    }
                });
            });
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
    
    stash.addEventListener("tagger:searchitem", function () {
        run();
    });
})();