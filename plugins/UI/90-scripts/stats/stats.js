(function() {
    function createStatElement(container, title, heading) {
        const statEl = document.createElement('div');
        statEl.classList.add('stats-element');
        container.appendChild(statEl);

        const statTitle = document.createElement('p');
        statTitle.classList.add('title');
        statTitle.innerText = title;
        statEl.appendChild(statTitle);

        const statHeading = document.createElement('p');
        statHeading.classList.add('heading');
        statHeading.innerText = heading;
        statEl.appendChild(statHeading);
    }

    // add queries
    const findSceneQuery = "query FindScenes($scene_filter: SceneFilterType) { findScenes(scene_filter: $scene_filter) { count }}"
    const findPerformerQuery = "query FindPerformers($performer_filter: PerformerFilterType) { findPerformers(performer_filter: $performer_filter) { count }}"
    const findStudioQuery = "query FindStudios($studio_filter: StudioFilterType) { findStudios(studio_filter: $studio_filter) { count }}"

    async function createSceneStashIDPct(row) {
        const reqData = {
            "variables": {
                "scene_filter": {
                    "NOT": {
                        "is_missing": "stash_id"
                    }
                }
            },
            "query": findSceneQuery
        };
        const stashIdCount = (await stash.callGQL(reqData)).data.findScenes.count;

        const reqData2 = {
            "variables": {
                "scene_filter": {}
            },
            "query": findSceneQuery
        };
        const res = (await stash.callGQL(reqData2))
        const totalCount = res.data.findScenes.count;

        createStatElement(row, (stashIdCount / totalCount * 100).toFixed(2) + '%', 'Scene StashIDs');
    }

    async function createPerformerStashIDPct(row) {
        const reqData = {
            "variables": {
                "performer_filter": {
                    "NOT": {
                        "is_missing": "stash_id"
                    }
                }
            },
            "query": findPerformerQuery
        };
        const stashIdCount = (await stash.callGQL(reqData)).data.findPerformers.count;

        const reqData2 = {
            "variables": {
                "performer_filter": {}
            },
            "query": findPerformerQuery
        };
        const totalCount = (await stash.callGQL(reqData2)).data.findPerformers.count;

        createStatElement(row, (stashIdCount / totalCount * 100).toFixed(2) + '%', 'Performer StashIDs');
    }

    async function createStudioStashIDPct(row) {
        const reqData = {
            "variables": {
                "studio_filter": {
                    "NOT": {
                        "is_missing": "stash_id"
                    }
                }
            },
            "query": findStudioQuery
        };
        const stashIdCount = (await stash.callGQL(reqData)).data.findStudios.count;

        const reqData2 = {
            "variables": {
                "studio_filter": {}
            },
            "query": findStudioQuery
        };
        const totalCount = (await stash.callGQL(reqData2)).data.findStudios.count;

        createStatElement(row, (stashIdCount / totalCount * 100).toFixed(2) + '%', 'Studio StashIDs');
    }

    async function createPerformerFavorites(row) {
        const reqData = {
            "variables": {
                "performer_filter": {
                    "filter_favorites": true
                }
            },
            "query": findPerformerQuery
        };
        const perfCount = (await stash.callGQL(reqData)).data.findPerformers.count;

        createStatElement(row, perfCount, 'Favorite Performers');
    }

    async function createMarkersStat(row) {
        const reqData = {
            "variables": {
                "scene_marker_filter": {}
            },
            "query": "query FindSceneMarkers($scene_marker_filter: SceneMarkerFilterType) { findSceneMarkers(scene_marker_filter: $scene_marker_filter) { count }}"
        };
        const totalCount = (await stash.callGQL(reqData)).data.findSceneMarkers.count;

        createStatElement(row, totalCount, 'Markers');
    }

    stash.addEventListener('page:stats', function() {
        waitForElementByXpath("//div[contains(@class, 'container-fluid')]/div[@class='mt-5']", function(xpath, el) {
            if (!document.getElementById('custom-stats-row')) {
                const changelog = el.querySelector('div.changelog');
                const row = document.createElement('div');
                row.setAttribute('id', 'custom-stats-row');
                row.classList.add('col', 'col-sm-8', 'm-sm-auto', 'row', 'stats');
                el.insertBefore(row, changelog);

                createSceneStashIDPct(row);
                createStudioStashIDPct(row);
                createPerformerStashIDPct(row);
                createPerformerFavorites(row);
                createMarkersStat(row);
            }
        });
    });
})();
