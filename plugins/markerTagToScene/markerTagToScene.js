function ok() {
  return {
    output: "ok",
  };
}

function includes(haystack, needle) {
  for (var i = 0; i < haystack.length; ++i) {
    if (haystack[i] == needle) return true;
  }
  return false;
}

function mapSceneTagsToIds(sceneTags) {
  var ret = [];
  for (var i = 0; i < sceneTags.length; ++i) {
    ret.push(sceneTags[i].id);
  }
  return ret;
}

function shouldHandleAllTags() {
  var query =
    "query Query {\
  configuration {\
    plugins\
  }\
}";

  var result = gql.Do(query);
  //log.Info("Config is " + JSON.stringify(result.configuration));
  if (!result.configuration) {
    throw "Unable to get library paths";
  }
  if (result.configuration.plugins.hasOwnProperty("markerTagToScene")) {
    //log.Info("allTags is " + result.configuration.plugins.markerTagToScene.allTags);
    return !!result.configuration.plugins.markerTagToScene.allTags;
  } else {
    //log.Info("all tags wasn't found. defaulting to false");
    return false;
  }
}

function processMarker(marker, shouldHandleAllTags) {
  log.Debug("processMarker (allTags = " + shouldHandleAllTags + ") " + marker);
  var primaryTagID = marker.primary_tag_id;
  var sceneID = marker.scene_id;

  var tagIDsToCheck = [];
  if (primaryTagID != null) tagIDsToCheck.push(primaryTagID);

  if (shouldHandleAllTags && marker.tag_ids != null)
    tagIDsToCheck = tagIDsToCheck.concat(marker.tag_ids);

  // we can't currently find scene markers. If it's not in the input
  // then just return
  if (tagIDsToCheck.length == 0) {
    // just return
    return ok();
  }

  // get the existing scene tags
  var sceneTags = mapSceneTagsToIds(getSceneTags(sceneID));
  var newTags = [];
  for (var i = 0; i < tagIDsToCheck.length; ++i) {
    var tag = tagIDsToCheck[i];
    if (!includes(sceneTags, tag)) newTags.push(tag);
  }

  if (newTags.length == 0) {
    // All tags were present; don't do anything
    log.Debug("All tags were already present on scene " + sceneID);
    return ok();
  }
  var tagIDs = sceneTags.concat(newTags);
  setSceneTags(sceneID, tagIDs);
  log.Info("adding tags " + newTags + " to scene " + sceneID);
}

function main() {
  //log.Info(input);
  if (input.args.mode == "processMarkers") {
    allTags = shouldHandleAllTags();
    log.Trace("Mode is processMarkers, allTags is " + allTags);
    allMarkers = getAllMarkers();
    //The markers come back as {primary_tag: { id: 600 } }
    //but processMarker (because of the hook) expects 'primary_tag_id', so transform it here
    log.Info(
      "markerTagToScene has " + allMarkers.length + " markers to process"
    );
    for (var i = 0; i < allMarkers.length; ++i) {
      marker = allMarkers[i];
      var sceneMarker = {};
      sceneMarker.id = marker.id;
      sceneMarker.scene_id = marker.scene.id;
      sceneMarker.primary_tag_id = marker.primary_tag.id;
      tag_ids = [];
      for (j = 0; j < marker.tags.length; ++j) {
        tag_ids.push(marker.tags[j].id);
      }
      sceneMarker.tag_ids = tag_ids;
      //log.Info(sceneMarker);
      processMarker(sceneMarker, allTags);
      log.Progress(i / allMarkers.length);
    }
    log.Progress("Finished processing markers");
  } else if (input.args.mode == "hook") {
    log.Info("Mode is hook");
    processMarker(input.Args.hookContext.input, shouldHandleAllTags());
  } else {
    log.Error("Unknown mode");
  }
}

function getAllMarkers() {
  var query =
    "\
query Query($filter: FindFilterType) {\
  findSceneMarkers (filter: $filter) {\
    scene_markers {\
      id,\
      primary_tag {\
        id\
      }\
      tags {\
        id\
      }\
      scene {\
        id\
      }\
    }\
  }\
}";
  var variables = { filter: { per_page: -1 } };
  var result = gql.Do(query, variables);
  var findSceneMarkers = result.findSceneMarkers;
  if (findSceneMarkers) {
    return findSceneMarkers.scene_markers;
  }
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
