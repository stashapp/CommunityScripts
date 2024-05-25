function ok() {
  return {
    output: "ok",
  };
}

function main() {
  var hookContext = input.Args.hookContext;
  var opInput = hookContext.Input;
  var primaryTagID = opInput.PrimaryTagID;
  var sceneID = opInput.SceneID;

  // we can't currently find scene markers. If it's not in the input
  // then just return
  if (!primaryTagID || !sceneID) {
    // just return
    return ok();
  }

  // get the existing scene tags
  var sceneTags = getSceneTags(sceneID);

  // Combine all tags from scene and the new marker
  var allTags = [...new Set([...sceneTags, primaryTagID, ...opInput.TagIds])];
  var newTags = allTags.filter((t) => sceneTags.includes(t));

  setSceneTags(sceneID, allTags);
  log.Debug("added new tags " + newTags.join(", ") + " to scene " + sceneID);
}

function getSceneTags(sceneID) {
  var query =
    "\
query findScene($id: ID) {\
  findScene(id: $id) {\
    tags {\
      id\
    }\
  }\
}";

  var variables = {
    id: sceneID,
  };

  var result = gql.Do(query, variables);
  var findScene = result.findScene;
  if (findScene) {
    return findScene.tags.map((t) => t.id);
  }

  return [];
}

function setSceneTags(sceneID, tagIDs) {
  var mutation =
    "\
mutation sceneUpdate($input: SceneUpdateInput!) {\
  sceneUpdate(input: $input) {\
    id\
  }\
}";

  var variables = {
    input: {
      id: sceneID,
      tag_ids: tagIDs,
    },
  };

  gql.Do(mutation, variables);
}

main();
