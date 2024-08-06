(async () => {
  const markerDeleteButton =
    '<button class="marker-delete-button btn btn-danger">Delete</button>';

  async function setupMarkerDeleteButton() {
    document
      .querySelectorAll("div.wall-item-container")
      .forEach(function (node) {
        var deleteButton = document.createElement("div");
        deleteButton.innerHTML = markerDeleteButton;
        node.prepend(deleteButton);

        var markerImg = node
          .querySelector(".wall-item-media")
          .getAttribute("src");
        var markerID = markerImg.split("/")[6];

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

  // Wait for video player to load on scene page.
  csLib.PathElementListener(
    "/scenes/markers",
    "div.wall",
    setupMarkerDeleteButton
  ); // PathElementListener is from cs-ui-lib.js
})();
