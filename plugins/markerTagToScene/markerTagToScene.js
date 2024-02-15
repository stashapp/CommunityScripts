function ok() {
  return {
    output: "ok",
  };
}

function main() {
  var hookContext = input.Args.hookContext;
  var opInput = hookContext.input;
  var primaryTagID = opInput.primary_tag_id;
  var sceneID = opInput.scene_id;

  // we can't currently find scene markers. If it's not in the input
  // then just return
  if (!primaryTagID || !sceneID) {
    // just return
    return ok();
  }

  // get the existing scene tags
  var sceneTags = getSceneTags(sceneID);
  var tagIDs = [];
  for (var i = 0; i < sceneTags.length; ++i) {
    var tagID = sceneTags[i].id;
    if (tagID == primaryTagID) {
      log.Debug("primary tag already exists on scene");
      return;
    }

    tagIDs.push(tagID);
  }

  // set the tag on the scene if not present
  tagIDs.push(primaryTagID);

  setSceneTags(sceneID, tagIDs);
  log.Info("added primary tag " + primaryTagID + " to scene " + sceneID);
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
    return findScene.tags;
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
