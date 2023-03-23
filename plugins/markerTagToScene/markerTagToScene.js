//config
var ALL_MARKER_TAGS = false;

function ok() {
    return {
        output: "ok"
    };
}

function main() {
    // Check if running task, or hook triggered
    if (input.args.mode === "updateAllScenes") {
        // running task
        var totalScenes;
        var checkedScenes = 0;
        var pageSize = 100;
        var currentPage = 1;
        var modifiedScenes = 0;
        do {
            var result = getScenesWithTagsAndMarkers(pageSize, currentPage)
            totalScenes = result.count;
            checkedScenes += pageSize;
            currentPage++;
            var scenes = result.scenes;

            for (var i = 0; i < scenes.length; i++) {
                var scene = scenes[i];
                var sceneTagIDs = scene.tags.map(function (tag) { return tag.id });
                var markerTags = [];
                scene.scene_markers.forEach(function (marker) {
                    markerTags.push(marker.primary_tag.id);
                    if (ALL_MARKER_TAGS) {
                        markerTags = markerTags.concat(marker.tags.map(function (tag) {
                            return tag.id
                        }));
                    }
                });
                var newSceneTags = concatAndDeduplicate(sceneTagIDs, markerTags);
                if (newSceneTags.length > sceneTagIDs.length) {
                    // This scene is going to get new tags
                    modifiedScenes++;
                    setSceneTags(scene.id, newSceneTags)
                }
            }

        } while (checkedScenes < totalScenes)

        log.Info("Updated tags in " + modifiedScenes + " scenes to include tag(s) from their markers.");

    } else if (input.Args.hookContext) {
        // hook triggered
        var hookContext = input.Args.hookContext;
        var opInput = hookContext.input;
        var primaryMarkerTagID = opInput.primary_tag_id;
        var otherMarkerTagIDs = opInput.tag_ids;
        var sceneID = opInput.scene_id;

        // check if missing any of the required fields
        if (!primaryMarkerTagID || !sceneID) {
            // just return
            return ok();
        }

        // get the existing scene tags
        var sceneTagIDs = getSceneTags(sceneID).map(function (item) { return item.id });
        var combinedTags = concatAndDeduplicate(sceneTagIDs, [primaryMarkerTagID]);
        if (ALL_MARKER_TAGS && otherMarkerTagIDs) {
            combinedTags = concatAndDeduplicate(combinedTags, otherMarkerTagIDs);
        }

        setSceneTags(sceneID, combinedTags);
        log.Info("Added marker tag(s) to scene " + sceneID);
    }
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

function getScenesWithTagsAndMarkers(per_page, page) {
    var query = "\
    query FindScenes($filter: FindFilterType, $scene_filter: SceneFilterType, $scene_ids: [Int!]) {\
        findScenes(filter: $filter, scene_filter: $scene_filter, scene_ids: $scene_ids) {\
          count\
          scenes {\
            ...MarkersAndTagSceneData\
            __typename\
          }\
            __typename\
        }\
      } fragment MarkersAndTagSceneData on Scene {\
        id\
        scene_markers {\
          id\
          primary_tag {\
            id\
            __typename\
          }\
          tags {\
            id\
            __typename\
          }\
          __typename\
        }\
        tags {\
          id\
          __typename\
        }\
        __typename\
      }";


    var variables = {
        "filter": {
            "direction": "ASC",
            "page": page,
            "per_page": per_page,
            "q": "",
            "sort": "created_at"
        },
        "scene_filter": {
            "has_markers": "true"
        }

    }

    var result = gql.Do(query, variables);
    var findScenes = result.findScenes;
    if (findScenes) {
        return findScenes;
    }

    return {};
}

function concatAndDeduplicate(a, b) {
    var combined = a.concat(b);
    combined = combined.filter(function (item, pos, self) {
        return self.indexOf(item) == pos;
    });
    return combined;
}

main();