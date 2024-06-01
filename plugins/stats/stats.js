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

  const noStashIDFilter = { stash_id_endpoint: { modifier: "NOT_NULL" } };

  async function findPerformers(filter) {
    const query = `query ($filter: PerformerFilterType) { findPerformers(performer_filter: $filter) { count } }`;
    return await csLib
      .callGQL({ query, variables: { filter } })
      .then((data) => data.findPerformers.count);
  }

  async function findScenes(filter) {
    const query = `query ($filter: SceneFilterType) { findScenes(scene_filter: $filter) { count }}`;
    return await csLib
      .callGQL({ query, variables: { filter } })
      .then((data) => data.findScenes.count);
  }

  async function findStudios(filter) {
    const query = `query ($filter: StudioFilterType) { findStudios(studio_filter: $filter) { count }}`;
    return await csLib
      .callGQL({ query, variables: { filter } })
      .then((data) => data.findStudios.count);
  }

  const percentage = (portion, total) =>
    ((portion / total) * 100).toFixed(2) + "%";

  async function createSceneStashIDPct(row) {
    const stashIdCount = await findScenes(noStashIDFilter);
    const totalCount = await findScenes();

    createStatElement(
      row,
      percentage(stashIdCount, totalCount),
      "Scene StashIDs"
    );
  }

  async function createPerformerStashIDPct(row) {
    const stashIdCount = await findPerformers(noStashIDFilter);
    const totalCount = await findPerformers();

    createStatElement(
      row,
      percentage(stashIdCount, totalCount),
      "Performer StashIDs"
    );
  }

  async function createStudioStashIDPct(row) {
    const stashIdCount = await findStudios(noStashIDFilter);
    const totalCount = await findStudios();

    createStatElement(
      row,
      percentage(stashIdCount, totalCount),
      "Studio StashIDs"
    );
  }

  async function createPerformerFavorites(row) {
    const filter = { filter_favorites: true };
    const perfCount = await findPerformers(filter);

    createStatElement(row, perfCount, "Favorite Performers");
  }

  async function createMarkersStat(row) {
    const query = `query { findSceneMarkers { count }}`;
    const totalCount = (await csLib.callGQL({ query })).findSceneMarkers.count;

    createStatElement(row, totalCount, "Markers");
  }

  csLib.PathElementListener(
    "/stats",
    "div.container-fluid div.mt-5",
    setupStats
  );
  function setupStats(el) {
    if (document.getElementById("custom-stats-row")) return;
    const changelog = el.querySelector("div.changelog");
    const row = document.createElement("div");
    row.id = "custom-stats-row";
    row.classList = "col col-sm-8 m-sm-auto row stats";
    el.insertBefore(row, changelog);

    createSceneStashIDPct(row);
    createStudioStashIDPct(row);
    createPerformerStashIDPct(row);
    createPerformerFavorites(row);
    createMarkersStat(row);
  }
})();
