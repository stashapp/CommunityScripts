(async () => {
  const markerDeleteButton =
    '<button class="marker-delete-button btn btn-danger">Delete</button>';

  async function setupMarkerDeleteButton() {
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
        deleteButton.addEventListener("click", function (e) {
          deleteMarker(markerID);
        });
      });
  }

  async function deleteMarker(markerID) {
    const variables = { id: markerID };
    const query = `mutation SceneMarkerDestroy($id: ID!) {sceneMarkerDestroy(id: $id)}`;
    await csLib.callGQL({ query, variables }).then(() => {
      window.location.reload();
    });
  }

  // Wait for markers page to load.
  csLib.PathElementListener(
    "/scenes/markers",
    "div.wall",
    setupMarkerDeleteButton
  ); // PathElementListener is from cs-ui-lib.js
})();
