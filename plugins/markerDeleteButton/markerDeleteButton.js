(async () => {
  const markerDeleteButton =
    '<button class="marker-delete-button btn btn-danger">Delete</button>';

  async function setupMarkerDeleteButtonForMarkersWall() {
    document
      .querySelectorAll("div.wall-item-container")
      .forEach(function (node) {
        // Insert delete button.
        var deleteButton = document.createElement("div");
        deleteButton.innerHTML = markerDeleteButton;
        node.prepend(deleteButton);

        // Parse marker ID.
        var markerImg = node
          .querySelector(".wall-item-media")
          .getAttribute("src");
        var markerID = markerImg.split("/")[6];

        // Register click handler.
        deleteButton.addEventListener("click", async () => {
          await deleteMarker(markerID);
          window.location.reload();
        });
      });
  }

  async function setupMarkerDeleteButtonForScenePage() {
    const markerMap = new Map();

    // Build a map of marker identifiers based on the preview videos.
    document
      .querySelectorAll("div.wall-item-container")
      .forEach(function (node) {
        const markerTag = node.querySelector(".wall-tag").innerText;
        const markerTime = node
          .querySelector(".wall-item-text div")
          .innerText.split(" - ")[1];
        const markerImg = node
          .querySelector(".wall-item-media")
          .getAttribute("src");
        const markerID = markerImg.split("/")[6];

        // Use a combined key of tag and time to uniquely identify markers.
        const markerKey = `${markerTag}_${markerTime}`;
        markerMap.set(markerKey, markerID);
      });

    // Now, add the delete button to the appropriate markers.
    document
      .querySelectorAll("div.primary-card-body .row")
      .forEach(function (node) {
        // Insert delete button.
        var deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn btn-link ml-auto";
        deleteButton.innerText = "Delete";

        // Parse marker tag and time.
        const markerTag = node.querySelector(".btn.btn-link").innerText;
        const timeDiv = node.nextElementSibling;
        const markerTime = timeDiv ? timeDiv.innerText : null;

        // Generate the key to find the marker ID.
        const markerKey = `${markerTag}_${markerTime}`;
        const markerID = markerMap.get(markerKey);

        if (markerID) {
          // Insert the delete button next to the Edit button.
          var editButton = node.querySelector(".btn.btn-link.ml-auto");
          if (editButton) {
            editButton.insertAdjacentElement("afterend", deleteButton);
          }

          // Register click handler with the correct marker ID.
          deleteButton.addEventListener("click", async (e) => {
            await deleteMarker(markerID);

            var markerContainer = deleteButton.parentElement.parentElement;
            var markersContainer = markerContainer.parentElement;
            var markerTagContainer = markersContainer.parentElement;

            // Remove the element for this marker.
            deleteButton.parentElement.parentElement.remove();

            // If there are no more markers for this tag, remove the marker tag container.
            if (!markersContainer.hasChildNodes()) {
              markerTagContainer.remove();
            }
          });
        }
      });
  }

  async function deleteMarker(markerID) {
    const variables = { id: markerID };
    const query = `mutation SceneMarkerDestroy($id: ID!) {sceneMarkerDestroy(id: $id)}`;
    await csLib.callGQL({ query, variables });
  }

  // Wait for markers page to load.
  // PathElementListener is from cs-ui-lib.js
  csLib.PathElementListener(
    "/scenes/markers",
    "div.wall",
    setupMarkerDeleteButtonForMarkersWall
  );

  csLib.PathElementListener(
    "/scenes/",
    "div.scene-markers-panel",
    setupMarkerDeleteButtonForScenePage
  );
})();
