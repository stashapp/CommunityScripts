(function () {
  function createStatElement(container, title, heading) {
    const statEl = document.createElement("div");
    statEl.classList.add("stats-element");
    container.appendChild(statEl);

    const statTitle = document.createElement("p");
    statTitle.classList.add("title");
    statTitle.innerText = title;
    statEl.appendChild(statTitle);

    const statHeading = document.createElement("p");
    statHeading.classList.add("heading");
    statHeading.innerText = heading;
    statEl.appendChild(statHeading);
  }

  async function createSceneStashIDPct(row) {
    const reqData = {
      variables: {
        scene_filter: {
          stash_id_endpoint: {
            modifier: "NOT_NULL",
          },
        },
      },
      query:
        "query FindScenes($filter: FindFilterType, $scene_filter: SceneFilterType, $scene_ids: [Int!]) {\n  findScenes(filter: $filter, scene_filter: $scene_filter, scene_ids: $scene_ids) {\n    count\n  }\n}",
    };
    const stashIdCount = (await stash.callGQL(reqData)).data.findScenes.count;

    const reqData2 = {
      variables: {
        scene_filter: {},
      },
      query:
        "query FindScenes($filter: FindFilterType, $scene_filter: SceneFilterType, $scene_ids: [Int!]) {\n  findScenes(filter: $filter, scene_filter: $scene_filter, scene_ids: $scene_ids) {\n    count\n  }\n}",
    };
    const totalCount = (await stash.callGQL(reqData2)).data.findScenes.count;

    createStatElement(
      row,
      ((stashIdCount / totalCount) * 100).toFixed(2) + "%",
      "Scene StashIDs",
    );
  }

  async function createPerformerStashIDPct(row) {
    const reqData = {
      variables: {
        performer_filter: {
          stash_id_endpoint: {
            modifier: "NOT_NULL",
          },
        },
      },
      query:
        "query FindPerformers($filter: FindFilterType, $performer_filter: PerformerFilterType) {\n  findPerformers(filter: $filter, performer_filter: $performer_filter) {\n    count\n  }\n}",
    };
    const stashIdCount = (await stash.callGQL(reqData)).data.findPerformers
      .count;

    const reqData2 = {
      variables: {
        performer_filter: {},
      },
      query:
        "query FindPerformers($filter: FindFilterType, $performer_filter: PerformerFilterType) {\n  findPerformers(filter: $filter, performer_filter: $performer_filter) {\n    count\n  }\n}",
    };
    const totalCount = (await stash.callGQL(reqData2)).data.findPerformers
      .count;

    createStatElement(
      row,
      ((stashIdCount / totalCount) * 100).toFixed(2) + "%",
      "Performer StashIDs",
    );
  }

  async function createStudioStashIDPct(row) {
    const reqData = {
      variables: {
        studio_filter: {
          stash_id_endpoint: {
            modifier: "NOT_NULL",
          },
        },
      },
      query:
        "query FindStudios($filter: FindFilterType, $studio_filter: StudioFilterType) {\n  findStudios(filter: $filter, studio_filter: $studio_filter) {\n    count\n  }\n}",
    };
    const stashIdCount = (await stash.callGQL(reqData)).data.findStudios.count;

    const reqData2 = {
      variables: {
        scene_filter: {},
      },
      query:
        "query FindStudios($filter: FindFilterType, $studio_filter: StudioFilterType) {\n  findStudios(filter: $filter, studio_filter: $studio_filter) {\n    count\n  }\n}",
    };
    const totalCount = (await stash.callGQL(reqData2)).data.findStudios.count;

    createStatElement(
      row,
      ((stashIdCount / totalCount) * 100).toFixed(2) + "%",
      "Studio StashIDs",
    );
  }

  async function createPerformerFavorites(row) {
    const reqData = {
      variables: {
        performer_filter: {
          filter_favorites: true,
        },
      },
      query:
        "query FindPerformers($filter: FindFilterType, $performer_filter: PerformerFilterType) {\n  findPerformers(filter: $filter, performer_filter: $performer_filter) {\n    count\n  }\n}",
    };
    const perfCount = (await stash.callGQL(reqData)).data.findPerformers.count;

    createStatElement(row, perfCount, "Favorite Performers");
  }

  async function createMarkersStat(row) {
    const reqData = {
      variables: {
        scene_marker_filter: {},
      },
      query:
        "query FindSceneMarkers($filter: FindFilterType, $scene_marker_filter: SceneMarkerFilterType) {\n  findSceneMarkers(filter: $filter, scene_marker_filter: $scene_marker_filter) {\n    count\n  }\n}",
    };
    const totalCount = (await stash.callGQL(reqData)).data.findSceneMarkers
      .count;

    createStatElement(row, totalCount, "Markers");
  }

  stash.addEventListener("stash:page:stats", function () {
    waitForElementByXpath(
      "//div[contains(@class, 'container-fluid')]/div[@class='mt-5']",
      function (xpath, el) {
        if (!document.getElementById("custom-stats-row")) {
          const changelog = el.querySelector("div.changelog");
          const row = document.createElement("div");
          row.setAttribute("id", "custom-stats-row");
          row.classList.add("col", "col-sm-8", "m-sm-auto", "row", "stats");
          el.insertBefore(row, changelog);

          createSceneStashIDPct(row);
          createStudioStashIDPct(row);
          createPerformerStashIDPct(row);
          createPerformerFavorites(row);
          createMarkersStat(row);
        }
      },
    );
  });
})();
