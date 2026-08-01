(async () => {
  const markerDeleteButton =
    '<button class="marker-delete-button btn btn-danger">Delete</button>';

  async function setupMarkerDeleteButtonForMarkersWall() {
    document
      .querySelectorAll("div.wall-item")
      .forEach(function (node) {
        // Insert delete button.
        var deleteButton = document.createElement("div");
        deleteButton.classList.add('marker-delete-wrapper');
        deleteButton.innerHTML = markerDeleteButton;
        node.prepend(deleteButton);

        // Parse marker ID.
        var markerImg = node
          .querySelector("video")
          .getAttribute("src");
        var markerID = markerImg.split("/")[6];

        // Register click handler.
        deleteButton.addEventListener("click", async (e) => {
          e.stopPropagation();
          await deleteMarker(markerID);
          if (window.location.href.indexOf("/scenes/markers") > -1)
          {
            window.location.reload();
          } else {
            node.remove();
          }
        });
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
    "div.marker-wall",
    setupMarkerDeleteButtonForMarkersWall
  );

  csLib.PathElementListener(
    "/scenes/",
    "div.scene-markers-panel",
    setupMarkerDeleteButtonForMarkersWall
  );
})();
