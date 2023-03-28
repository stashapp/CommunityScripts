function ok() {
    return {
        output: "ok"
    };
}

function main() {
    var hookContext = input.Args.hookContext;
    var opInput = hookContext.input;
    var primaryTagID = opInput.primary_tag_id;
    var markerTagIDs = opInput.tag_ids ? opInput.tag_ids : [];
    var sceneID = opInput.scene_id;

    // we can't currently find scene markers. If it's not in the input
    // then just return
    if (!primaryTagID || !sceneID) {
        // just return
        return ok();
    }
    markerTagIDs.push(primaryTagID)

    // get the existing scene tags
    var sceneTags = getSceneTags(sceneID);
    var missingTagIDs = markerTagIDs.filter(markerTagID => !sceneTags.includes(markerTagID))
    
    if (missingTagIDs.length == 0){
        log.Debug("all marker tags already exists on scene");
        return;
    }

    // add missing tags to existing scene tags
    var tagIDs = sceneTags.concat(missingTagIDs)
    setSceneTags(sceneID, tagIDs);
    log.Info(`added missing tag(s) ${missingTagIDs} to scene ${sceneID}`);
}

function getSceneTags(sceneID) {
    var query = "\
query findScene($id: ID) {\
  findScene(id: $id) {\
    tags {\
      id\
    }\
  }\
}";

    var variables = {
        id: sceneID
    };

    var result = gql.Do(query, variables);
    var findScene = result.findScene;
    if (findScene) {
        return findScene.tags;
    }

    return [];
}

function setSceneTags(sceneID, tagIDs) {
    var mutation = "\
mutation sceneUpdate($input: SceneUpdateInput!) {\
  sceneUpdate(input: $input) {\
    id\
  }\
}";

    var variables = {
        input: {
            id: sceneID,
            tag_ids: tagIDs
        }
    };

    gql.Do(mutation, variables);
}

main();
