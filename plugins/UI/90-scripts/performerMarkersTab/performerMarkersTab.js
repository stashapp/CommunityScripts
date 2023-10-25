(function () {

    async function getPerformerMarkersCount(performerId) {
        const reqData = {
            "operationName": "FindSceneMarkers",
            "variables": {
                "scene_marker_filter": {
                  "performers": {
                    "value": [
                        performerId
                    ],
                    "modifier": "INCLUDES_ALL"
                  }
                }
              },
            "query": `query FindSceneMarkers($scene_marker_filter: SceneMarkerFilterType) {
                findSceneMarkers(scene_marker_filter: $scene_marker_filter) {
                    count
                }
            }`
        }
        return stash.callGQL(reqData);
    }

    const markersTabId = 'performer-details-tab-markers';

    stash.addEventListener('page:performer:details', function () {
        waitForElementClass("nav-tabs", async function (className, el) {
            const navTabs = el.item(0);
            if (!document.getElementById(markersTabId)) {
                const performerId = window.location.pathname.replace('/performers/', '');
                const markersCount = (await getPerformerMarkersCount(performerId)).data.findSceneMarkers.count;
                const markerTab = createElementFromHTML(`<a id="${markersTabId}" href="#" role="tab" data-rb-event-key="markers" aria-controls="performer-details-tabpane-markers" aria-selected="false" class="nav-item nav-link">Markers<span class="left-spacing badge badge-pill badge-secondary">${markersCount}</span></a>`)
                navTabs.appendChild(markerTab);
                const performerName = document.querySelector('.performer-head h2').innerText;
                const markersUrl = `${window.location.origin}/scenes/markers?c=${JSON.stringify({"type":"performers","value":[{"id":performerId,"label":performerName}],"modifier":"INCLUDES_ALL"})}`
                markerTab.href = markersUrl;
            }
        });
    });
})();