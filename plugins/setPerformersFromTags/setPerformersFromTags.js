(function () {
  if (input.Args.hookContext) {
    log.Debug("Hook triggered: " + input.Args.hookContext.type);

    const hookData = input.Args.hookContext;
    const performers = getAllPerformers();

    if (hookData.type.startsWith("Scene")) {
      processSingleScene(hookData.id, performers);
    } else if (hookData.type.startsWith("Image")) {
      processSingleImage(hookData.id, performers);
    }

    return { Output: "Hook processed: " + hookData.id };
  }

  log.Info("Fetching all performers...");
  const performers = getAllPerformers();

  log.Info("Processing scenes...");
  processScenes(performers);

  log.Info("Processing images...");
  processImages(performers);

  log.Info("Done!");
  return { Output: "Success" };
})();

function getAllPerformers() {
  const query = `
        query {
            findPerformers(filter: { per_page: -1 }) {
                performers {
                    id
                    name
                    alias_list
                }
            }
        }
    `;

  const result = gql.Do(query, {});
  return result.findPerformers.performers || [];
}

function getAllScenes() {
  const query = `
        query {
            findScenes(filter: { per_page: -1 }) {
                scenes {
                    id
                    tags { name }
                    performers { id }
                }
            }
        }
    `;

  const result = gql.Do(query, {});
  return result.findScenes.scenes || [];
}

function getAllImages() {
  const query = `
        query {
            findImages(filter: { per_page: -1 }) {
                images {
                    id
                    tags { name }
                    performers { id }
                }
            }
        }
    `;

  const result = gql.Do(query, {});
  return result.findImages.images || [];
}

function getSceneById(sceneId) {
  const query = `
        query SceneById($id: ID!) {
            findScene(id: $id) {
                id
                tags { name }
                performers { id }
            }
        }
    `;

  const result = gql.Do(query, { id: sceneId });
  return result.findScene || null;
}

function getImageById(imageId) {
  const query = `
        query ImageById($id: ID!) {
            findImage(id: $id) {
                id
                tags { name }
                performers { id }
            }
        }
    `;

  const result = gql.Do(query, { id: imageId });
  return result.findImage || null;
}

function updateScenePerformers(sceneId, performerIds) {
  const mutation = `
        mutation UpdateScene($id: ID!, $performerIds: [ID!]) {
            sceneUpdate(input: { id: $id, performer_ids: $performerIds }) {
                id
            }
        }
    `;

  gql.Do(mutation, { id: sceneId, performerIds: performerIds });
  log.Debug(
    "Updated Scene " +
      sceneId +
      " with Performers " +
      JSON.stringify(performerIds)
  );
}

function updateImagePerformers(imageId, performerIds) {
  const mutation = `
        mutation UpdateImage($id: ID!, $performerIds: [ID!]) {
            imageUpdate(input: { id: $id, performer_ids: $performerIds }) {
                id
            }
        }
    `;

  gql.Do(mutation, { id: imageId, performerIds: performerIds });
  log.Debug(
    "Updated Image " +
      imageId +
      " with Performers " +
      JSON.stringify(performerIds)
  );
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[#@._+\-]/g, " ") // Convert special characters to spaces
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

function matchPerformers(tags, performers) {
  const matchedPerformers = [];
  const tagSet = new Set(tags.map((tag) => normalizeName(tag.name)));

  for (let performer of performers) {
    const performerNames = new Set(
      [performer.name].concat(performer.alias_list).map(normalizeName)
    );

    if ([...performerNames].some((name) => tagSet.has(name))) {
      matchedPerformers.push(performer.id);
    }
  }

  return matchedPerformers;
}

function processScenes(performers) {
  const scenes = getAllScenes();

  for (let scene of scenes) {
    const existingPerformerIds = scene.performers.map((p) => p.id); // Extract IDs from performer objects
    const matchedPerformerIds = matchPerformers(scene.tags, performers);

    if (
      matchedPerformerIds.length > 0 &&
      JSON.stringify(matchedPerformerIds) !==
        JSON.stringify(existingPerformerIds)
    ) {
      updateScenePerformers(scene.id, matchedPerformerIds);
    }
  }
}

function processImages(performers) {
  const images = getAllImages();

  for (let image of images) {
    const existingPerformerIds = image.performers.map((p) => p.id); // Extract IDs from performer objects
    const matchedPerformerIds = matchPerformers(image.tags, performers);

    if (
      matchedPerformerIds.length > 0 &&
      JSON.stringify(matchedPerformerIds) !==
        JSON.stringify(existingPerformerIds)
    ) {
      updateImagePerformers(image.id, matchedPerformerIds);
    }
  }
}

function processSingleScene(sceneId, performers) {
  const scene = getSceneById(sceneId);
  if (!scene) return;

  const existingPerformerIds = scene.performers.map((p) => p.id);
  const matchedPerformers = matchPerformers(scene.tags, performers);

  if (
    matchedPerformers.length > 0 &&
    JSON.stringify(matchedPerformers) !== JSON.stringify(existingPerformerIds)
  ) {
    updateScenePerformers(scene.id, matchedPerformers);
  }
}

function processSingleImage(imageId, performers) {
  const image = getImageById(imageId);
  if (!image) return;

  const existingPerformerIds = image.performers.map((p) => p.id);
  const matchedPerformers = matchPerformers(image.tags, performers);

  if (
    matchedPerformers.length > 0 &&
    JSON.stringify(matchedPerformers) !== JSON.stringify(existingPerformerIds)
  ) {
    updateImagePerformers(image.id, matchedPerformers);
  }
}
