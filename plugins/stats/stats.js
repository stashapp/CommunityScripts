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

  // *** filter ***
  // filter for * without StashID
  const noStashIDFilter = { stash_id_endpoint: { modifier: "NOT_NULL" } };
  // filter for missing image
  const noImageFilter = { is_missing: "image" };

  // *** fetch helpers ***
  // fetch performers with filter
  async function findPerformers(filter) {
    const query = `query ($filter: PerformerFilterType) { findPerformers(performer_filter: $filter) { count } }`;
    return await csLib
      .callGQL({ query, variables: { filter } })
      .then((data) => data.findPerformers.count);
  }

  // fetch scenes with filter
  async function findScenes(filter) {
    const query = `query ($filter: SceneFilterType) { findScenes(scene_filter: $filter) { count }}`;
    return await csLib
      .callGQL({ query, variables: { filter } })
      .then((data) => data.findScenes.count);
  }

  // fetch studios with filter
  async function findStudios(filter) {
    const query = `query ($filter: StudioFilterType) { findStudios(studio_filter: $filter) { count }}`;
    return await csLib
      .callGQL({ query, variables: { filter } })
      .then((data) => data.findStudios.count);
  }

  // fetch tags with filter
  async function findTags(filter) {
    const query = `query ($filter: TagFilterType) { findTags(tag_filter: $filter) { count }}`;
    return await csLib
      .callGQL({ query, variables: { filter } })
      .then((data) => data.findTags.count);
  }

  // fetch movies with filter
  async function findMovies(filter) {
    const query = `query ($filter: MovieFilterType) { findMovies(movie_filter: $filter) { count }}`;
    return await csLib
      .callGQL({ query, variables: { filter } })
      .then((data) => data.findMovies.count);
  }

  // percentage helper
  const percentage = (portion, total) => (total > 0 ? (portion / total * 100).toFixed(2) : 0) + "%";

  // *** actual stats fetching ***
  // performer of scenes with any StashID
  async function createSceneStashIDPct(row) {
    const stashIdCount = await findScenes(noStashIDFilter);
    const totalCount = await findScenes();

    createStatElement(
      row,
      percentage(stashIdCount, totalCount),
      "Scene StashIDs"
    );
  }

  // percentage of performers with any StashID
  async function createPerformerStashIDPct(row) {
    const stashIdCount = await findPerformers(noStashIDFilter);
    const totalCount = await findPerformers();

    createStatElement(
      row,
      percentage(stashIdCount, totalCount),
      "Performer StashIDs"
    );
  }

  // percentage of studios with any StashID
  async function createStudioStashIDPct(row) {
    const stashIdCount = await findStudios(noStashIDFilter);
    const totalCount = await findStudios();

    createStatElement(
      row,
      percentage(stashIdCount, totalCount),
      "Studio StashIDs"
    );
  }

  // number of favourite performers
  async function createPerformerFavorites(row) {
    const filter = { filter_favorites: true };
    const perfCount = await findPerformers(filter);

    createStatElement(row, perfCount, "Favorite Performers");
  }

  // number of markers
  async function createMarkersStat(row) {
    const query = `query { findSceneMarkers { count }}`;
    const totalCount = (await csLib.callGQL({ query })).findSceneMarkers.count;

    createStatElement(row, totalCount, "Markers");
  }

  // second row stats
  // tags with images
  async function createTagHasImage(row) {
    const missingImgCount = await findTags(noImageFilter);
    const totalCount = await findTags();
    const hasImgCount = totalCount - missingImgCount;

    createStatElement(row, percentage(hasImgCount, totalCount), "Tag Images");
  }

  // studios with images
  async function createStudioHasimage(row) {
    const missingImgCount = await findStudios(noImageFilter);
    const totalCount = await findStudios();
    const hasImgCount = totalCount - missingImgCount;

    createStatElement(
      row,
      percentage(hasImgCount, totalCount),
      "Studio Images"
    );
  }

  // performers with images
  async function createPerformerHasImage(row) {
    const missingImgCount = await findPerformers(noImageFilter);
    const totalCount = await findPerformers();
    const hasImgCount = totalCount - missingImgCount;

    createStatElement(
      row,
      percentage(hasImgCount, totalCount),
      "Performer Images"
    );
  }

  // movies with cover images
  async function createMovieHasCover(row) {
    const filter = { is_missing: "front_image" };
    const missingImgCount = await findMovies(filter);
    const totalCount = await findMovies();
    const hasImgCount = totalCount - missingImgCount;

    createStatElement(row, percentage(hasImgCount, totalCount), "Movie Covers");
  }

  // scenes over WEB_HD (540p)
  async function createSceneOverWebHD(row) {
    const filter = {
      resolution: { modifier: "GREATER_THAN", value: "WEB_HD" },
    };
    const sceneCount = await findScenes(filter);
    const totalCount = await findScenes();

    createStatElement(row, percentage(sceneCount, totalCount), "Scenes HD");
  }

  csLib.PathElementListener(
    "/stats",
    "div.container-fluid div.mt-5",
    setupStats
  );
  function setupStats(el) {
    if (document.querySelector(".custom-stats-row")) return;
    const changelog = el.querySelector("div.changelog");
    const rowOne = document.createElement("div");
    rowOne.classList = "custom-stats-row col col-sm-8 m-sm-auto row stats";
    el.insertBefore(rowOne, changelog);
    const rowTwo = rowOne.cloneNode();
    el.insertBefore(rowTwo, changelog);
    // row one
    createSceneStashIDPct(rowOne);
    createStudioStashIDPct(rowOne);
    createPerformerStashIDPct(rowOne);
    createPerformerFavorites(rowOne);
    createMarkersStat(rowOne);
    // row two
    createTagHasImage(rowTwo);
    createStudioHasimage(rowTwo);
    createPerformerHasImage(rowTwo);
    createMovieHasCover(rowTwo);
    createSceneOverWebHD(rowTwo);
  }
})();
