var jsonData = [
  {
    name: "OPTIONAL NAME - NOT USED IN SCRIPT",
    paths: [
      "C:\\Users\\UserName\\Desktop\\NOTPORN\\Brazzers",
      "D:\\SecretStorage\\Porn\\Brazzers",
    ],
    studio: "Brazzers",
    tags: ["Default_Data_For_Path_Tagged"],
  },
];

function ok() {
  return {
    output: "ok",
  };
}

function main() {
  var hookContext = input.Args.hookContext;
  var type = hookContext.type;
  var ID = hookContext.ID;

  if (!type || !ID) {
    // just return
    return ok();
  }

  var itemPath;
  var name = "";
  if (type === "Scene.Create.Post") {
    itemPath = getScenePath(ID);
    name = "scene";
  } else if (type === "Gallery.Create.Post") {
    itemPath = getGalleryPath(ID);
    name = "gallery";
  } else if (type === "Image.Create.Post") {
    itemPath = getImagePath(ID);
    name = "image";
  }

  var defaultData = getDefaultData(itemPath);

  // create tags
  var defaultTags = [];
  for (var p = 0; p < defaultData.length; p++) {
    var tags = defaultData[p].tags;
    if (tags) {
      for (var t = 0; t < tags.length; t++) {
        var tag = tags[t];
        if (stringNotAlreadyPresent(tag, defaultTags)) defaultTags.push(tag);
      }
    }
  }

  // create studio
  var addStudio = false;
  var defaultStudioId = null;
  var defaultStudio;
  for (var p = 0; p < defaultData.length; p++) {
    var studio = defaultData[p].studio;
    if (studio) {
      var studioId = getStudioId(studio);
      if (studioId) {
        defaultStudioId = studioId;
        addStudio = true;
        defaultStudio = studio;
      }
    }
  }

  // create performers
  var defaultPerformers = [];
  for (var p = 0; p < defaultData.length; p++) {
    var performers = defaultData[p].performers;
    if (performers) {
      for (var t = 0; t < performers.length; t++) {
        var performer = performers[t];
        if (stringNotAlreadyPresent(performer, defaultPerformers))
          defaultPerformers.push(performer);
      }
    }
  }

  // convert tags to tagIds
  var addTags = false;
  var defaultTagIds = [];
  if (defaultTags) {
    for (var i = defaultTags.length - 1; i >= 0; i--) {
      var tagId = getTagId(defaultTags[i]);
      tagId ? defaultTagIds.push(tagId) : defaultTags.pop();
    }
    if (defaultTagIds && defaultTagIds.length != 0) {
      addTags = true;
    }
  }

  // convert performers to performerIds
  var addPerformers = false;
  var defaultPerformerIds = [];
  if (defaultPerformers) {
    for (var i = defaultPerformers.length - 1; i >= 0; i--) {
      var tagId = getPerformerId(defaultPerformers[i]);
      tagId ? defaultPerformerIds.push(tagId) : defaultPerformers.pop();
    }
    if (defaultPerformerIds && defaultPerformerIds.length != 0) {
      addPerformers = true;
    }
  }

  // Apply all and log
  var tags = addTags ? defaultTagIds : null;
  var studio = addStudio ? defaultStudioId : null;
  var performers = addPerformers ? defaultPerformerIds : null;

  if (type === "Scene.Create.Post") {
    setSceneData(ID, tags, studio, performers);
  } else if (type === "Gallery.Create.Post") {
    setGalleryData(ID, tags, studio, performers);
  } else if (type === "Image.Create.Post") {
    setImageData(ID, tags, studio, performers);
  }

  for (var o = 0; o < defaultTags.length; o++) {
    log.Info(
      "[DefaultDataForPath]: Added tag " +
        defaultTags[o] +
        " to " +
        name +
        " " +
        ID,
    );
  }
  for (var o = 0; o < defaultPerformers.length; o++) {
    log.Info(
      "[DefaultDataForPath]: Added performer " +
        defaultPerformers[o] +
        " to " +
        name +
        " " +
        ID,
    );
  }
  addStudio
    ? log.Info(
        "[DefaultDataForPath]: Added studio " +
          defaultStudio +
          " to " +
          name +
          " " +
          ID,
      )
    : "";
}

function getScenePath(ID) {
  var query =
    "\
query findScene($id: ID) {\
    findScene(id: $id) {\
        path\
    }\
}";

  var variables = {
    id: ID,
  };

  var result = gql.Do(query, variables);
  var findScene = result.findScene;
  if (!findScene) {
    return null;
  }

  var path = findScene.path;
  return path;
}

function getImagePath(ID) {
  var query =
    "\
query findImage($id: ID) {\
    findImage(id: $id) {\
        path\
    }\
}";

  var variables = {
    id: ID,
  };

  var result = gql.Do(query, variables);
  var findImage = result.findImage;
  if (!findImage) {
    return null;
  }

  var path = findImage.path;
  return path;
}

function getGalleryPath(ID) {
  var query =
    "\
query findGallery($id: ID) {\
    findGallery(id: $id) {\
        path\
    }\
}";

  var variables = {
    id: ID,
  };

  var result = gql.Do(query, variables);
  var findGallery = result.findGallery;
  if (!findGallery) {
    return null;
  }

  var path = findGallery.path;
  return path;
}

function getTagId(tagName) {
  var query =
    "\
    query findTagId($filter: FindFilterType!) {\
        findTags(filter: $filter) {\
            tags {\
                id\
            }\
        }\
    }";

  var variables = {
    filter: {
      q: tagName,
    },
  };

  result = gql.Do(query, variables);
  if (result.findTags.tags[0]) {
    return result.findTags.tags[0].id;
  } else {
    log.Error("TAG " + tagName + " DOES NOT EXIST IN STASH!");
    return null;
  }
}

function getPerformerId(performerName) {
  var query =
    "\
    query findPerformerId($filter: FindFilterType!) {\
        findPerformers(filter: $filter) {\
            performers {\
                id\
            }\
        }\
    }";

  var variables = {
    filter: {
      q: performerName,
    },
  };

  result = gql.Do(query, variables);
  if (result.findPerformers.performers[0]) {
    return result.findPerformers.performers[0].id;
  } else {
    log.Error("PERFORMER " + performerName + " DOES NOT EXIST IN STASH!");
    return null;
  }
}

function getStudioId(studioName) {
  var query =
    "\
    query findStudioId($filter: FindFilterType!) {\
        findStudios(filter: $filter) {\
            studios {\
                id\
            }\
        }\
    }";

  var variables = {
    filter: {
      q: studioName,
    },
  };

  result = gql.Do(query, variables);
  if (result.findStudios.studios[0]) {
    return result.findStudios.studios[0].id;
  } else {
    log.Error("STUDIO " + studioName + " DOES NOT EXIST IN STASH!");
    return null;
  }
}

function stringNotAlreadyPresent(text, itemArray) {
  for (var i = 0; i < itemArray.length; i++) {
    if (itemArray[i] === text) {
      return false;
    }
  }
  return true;
}

function addAllData(
  obj,
  lowerItemPath,
  defaultData,
  pTags,
  pPerformers,
  pStudio,
) {
  if (obj) {
    if (obj.paths) {
      var paths = obj.paths;
      if (containsPath(paths, lowerItemPath)) {
        // inject data from parent if avail
        if (pTags) {
          if (!obj.tags) {
            obj.tags = [];
          }
          obj.tags = obj.tags.concat(pTags);
        }
        if (pPerformers) {
          if (!obj.performers) {
            obj.performers = [];
          }
          obj.performers = obj.performers.concat(pPerformers);
        }
        if (pStudio) {
          obj.studio = pStudio;
        }
        defaultData.push(obj);
      }
    } else {
      // add defaults to children
      if (obj.tags) {
        if (!pTags) {
          pTags = obj.tags;
        } else {
          pTags = pTags.concat(obj.tags);
        }
      }
      if (obj.performers) {
        if (!pPerformers) {
          pPerformers = obj.performers;
        } else {
          pPerformers = pPerformers.concat(obj.performers);
        }
      }
      if (obj.studio) {
        pStudio = obj.studio;
      }
    }
    if (obj.children) {
      for (var o = 0; o < obj.children.length; o++) {
        defaultData = addAllData(
          obj.children[o],
          lowerItemPath,
          defaultData,
          pTags,
          pPerformers,
          pStudio,
        );
      }
    }
  }
  return defaultData;
}

function getDefaultData(itemPath) {
  var defaultData = [];
  var lowerItemPath = itemPath.toLowerCase();
  for (var i = 0; i < jsonData.length; i++) {
    var obj = jsonData[i];
    defaultData = addAllData(obj, lowerItemPath, defaultData, null, null, null);
  }

  return defaultData;
}

function containsPath(paths, inputPath) {
  for (var p = 0; p < paths.length; p++) {
    var path = paths[p].toLowerCase() + "";
    if (stringContains(inputPath, path)) {
      log.Info("[DefaultDataForPath]: " + inputPath + " MATCH " + path);
      return true;
    }
  }
  return false;
}

function stringContains(value, searchFor) {
  var v = (value || "").toLowerCase();
  var v2 = searchFor;
  if (v2) {
    v2 = v2.toLowerCase();
  }
  return v.indexOf(v2) > -1;
}

function containsElem(items, elem) {
  for (var i = 0; i < items.length; i++) {
    var item = items[i].toLowerCase();
    if (item.equals(elem)) {
      return true;
    }
  }
  return false;
}

function setSceneData(sceneID, tagIDs, studioID, performerIds) {
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
      studio_id: studioID,
      performer_ids: performerIds,
    },
  };

  gql.Do(mutation, variables);
}

function setImageData(sceneID, tagIDs, studioID, performerIds) {
  var mutation =
    "\
mutation imageUpdate($input: ImageUpdateInput!) {\
    imageUpdate(input: $input) {\
    id\
  }\
}";

  var variables = {
    input: {
      id: sceneID,
      tag_ids: tagIDs,
      studio_id: studioID,
      performer_ids: performerIds,
    },
  };

  gql.Do(mutation, variables);
}

function setGalleryData(sceneID, tagIDs, studioID, performerIds) {
  var mutation =
    "\
mutation galleryUpdate($input: GalleryUpdateInput!) {\
    galleryUpdate(input: $input) {\
    id\
  }\
}";

  var variables = {
    input: {
      id: sceneID,
      tag_ids: tagIDs,
      studio_id: studioID,
      performer_ids: performerIds,
    },
  };

  gql.Do(mutation, variables);
}

main();
