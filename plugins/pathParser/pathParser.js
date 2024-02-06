// Common Patterns
var patterns = {
  movieTitleAndYear: /(.+) \(\d{4}\)/,
  sceneTitleAndPerformers: /(.+) - ([A-zÀ-ú, ]+)/,
};

var rules = [
  {
    name: "Rule 1",
    pattern: ["Specific Studio", null, null],
    fields: {
      studio: "#0",
      title: "#2",
    },
  },
  {
    name: "Rule 2",
    pattern: [
      ["One Studio", "Another Studio"],
      patterns.movieTitleAndYear,
      patterns.sceneTitleAndPerformers,
    ],
    fields: {
      title: "#2",
      studio: "#0",
      performers: "#3",
    },
  },
];

/* ----------------------------------------------------------------------------
// DO NOT EDIT BELOW!
---------------------------------------------------------------------------- */
function main() {
  try {
    switch (getTask(input.Args)) {
      case "createTags":
        var runTag = getArg(input.Args, "runTag");
        var testTag = getArg(input.Args, "testTag");
        createTags([runTag, testTag]);
        break;

      case "removeTags":
        var runTag = getArg(input.Args, "runTag");
        var testTag = getArg(input.Args, "testTag");
        removeTags([runTag, testTag]);
        break;

      case "runRules":
        var runTag = getArg(input.Args, "runTag");
        initBasePaths();
        runRules(runTag);
        break;

      case "testRules":
        DEBUG = true;
        var testTag = getArg(input.Args, "testTag");
        initBasePaths();
        runRules(testTag);
        break;

      case "scene":
        var id = getId(input.Args);
        initBasePaths();
        matchRuleWithSceneId(id, applyRule);
        break;

      case "image":
        var id = getId(input.Args);
        initBasePaths();
        break;

      default:
        throw "Unsupported task";
    }
  } catch (e) {
    return { Output: "error", Error: e };
  }

  return { Output: "ok" };
}

// Get an input arg
function getArg(inputArgs, arg) {
  if (inputArgs.hasOwnProperty(arg)) {
    return inputArgs[arg];
  }

  throw "Input is missing " + arg;
}

// Determine task based on input args
function getTask(inputArgs) {
  if (inputArgs.hasOwnProperty("task")) {
    return inputArgs.task;
  }

  if (!inputArgs.hasOwnProperty("hookContext")) {
    return;
  }

  switch (inputArgs.hookContext.type) {
    case "Scene.Create.Post":
      return "scene";

    case "Image.Create.Post":
      return "image";
  }
}

// Get stash paths from configuration
function initBasePaths() {
  var query =
    "\
  query Query {\
    configuration {\
      general {\
        stashes {\
          path\
        }\
      }\
    }\
  }";

  var result = gql.Do(query);
  if (!result.configuration) {
    throw "Unable to get library paths";
  }

  BASE_PATHS = result.configuration.general.stashes.map(function (stash) {
    return stash.path;
  });

  if (BASE_PATHS == null || BASE_PATHS.length == 0) {
    throw "Unable to get library paths";
  }
}

// Create tag if it does not already exist
function createTags(tags) {
  var query =
    "\
  mutation TagCreate($input: TagCreateInput!) {\
    tagCreate(input: $input) {\
      id\
    }\
  }";

  tags.forEach(function (tag) {
    if (tryGetTag(tag) !== null) {
      return;
    }

    var variables = {
      input: {
        name: tag,
      },
    };

    var result = gql.Do(query, variables);
    if (!result.tagCreate) {
      throw "Could not create tag " + tag;
    }
  });
}

// Remove tags if it already exists
function removeTags(tags) {
  tags.forEach(function (tag) {
    var tagId = tryGetTag(tag);
    if (tagId === null) {
      return;
    }

    var query =
      "\
    mutation TagsDestroy($ids: [ID!]!) {\
      tagsDestroy(ids: $ids)\
    }";

    var variables = {
      ids: [tagId],
    };

    var result = gql.Do(query, variables);
    if (!result.tagsDestroy) {
      throw "Unable to remove tag " + tag;
    }
  });
}

// Run rules for scenes containing tag
function runRules(tag) {
  var tagId = tryGetTag(tag);
  if (tagId === null) {
    throw "Tag " + tag + " does not exist";
  }

  var query =
    "\
  query FindScenes($sceneFilter: SceneFilterType) {\
    findScenes(scene_filter: $sceneFilter) {\
      scenes {\
        id\
      }\
    }\
  }";

  var variables = {
    sceneFilter: {
      tags: {
        value: tagId,
        modifier: "INCLUDES",
      },
    },
  };

  var result = gql.Do(query, variables);
  if (!result.findScenes || result.findScenes.scenes.length == 0) {
    throw "No scenes found with tag " + tag;
  }

  result.findScenes.scenes.forEach(function (scene) {
    matchRuleWithSceneId(scene.id, applyRule);
  });
}

// Get scene/image id from input args
function getId(inputArgs) {
  if ((id = inputArgs.hookContext.id) == null) {
    throw "Input is missing id";
  }

  return id;
}

// Apply callback function to first matching rule for id
function matchRuleWithSceneId(sceneId, cb) {
  var query =
    "\
  query FindScene($findSceneId: ID) {\
    findScene(id: $findSceneId) {\
      files {\
        path\
      }\
    }\
  }";

  var variables = {
    findSceneId: sceneId,
  };

  var result = gql.Do(query, variables);
  if (!result.findScene || result.findScene.files.length == 0) {
    throw "Missing scene for id: " + sceneId;
  }

  for (var i = 0; i < result.findScene.files.length; i++) {
    try {
      matchRuleWithPath(sceneId, result.findScene.files[i].path, cb);

      if (DEBUG && bufferedOutput !== null && bufferedOutput !== "") {
        log.Info("[PathParser] " + bufferedOutput);
      }

      return;
    } catch (e) {
      continue;
    }
  }

  if (DEBUG && bufferedOutput !== null && bufferedOutput !== "") {
    log.Info("[PathParser] " + bufferedOutput);
  }

  throw "No rule matches id: " + sceneId;
}

// Apply callback to first matching rule for path
function matchRuleWithPath(sceneId, path, cb) {
  // Remove base path
  for (var i = 0; i < BASE_PATHS.length; i++) {
    if (path.slice(0, BASE_PATHS[i].length) === BASE_PATHS[i]) {
      path = path.slice(BASE_PATHS[i].length);
    }
  }

  if (DEBUG) {
    bufferedOutput = path + "\n";
  }

  // Split paths into parts
  var parts = path.split(/[\\/]/);

  // Remove extension from filename
  parts[parts.length - 1] = parts[parts.length - 1].slice(
    0,
    parts[parts.length - 1].lastIndexOf("."),
  );

  for (var i = 0; i < rules.length; i++) {
    var sceneData = testRule(rules[i].pattern, parts);
    if (sceneData !== null) {
      if (DEBUG) {
        bufferedOutput += "Rule: " + rules[i].name + "\n";
      }

      log.Debug("[PathParser] Rule: " + rules[i].name + "\nPath: " + path);
      cb(sceneId, rules[i].fields, sceneData);
      return;
    }
  }

  bufferedOutput += "No matching rule!";
  throw "No matching rule for path: " + path;
}

// Test single rule
function testRule(pattern, parts) {
  if (pattern.length !== parts.length) {
    return null;
  }

  var matchedParts = [];
  for (var i = 0; i < pattern.length; i++) {
    if ((subMatches = testPattern(pattern[i], parts[i])) == null) {
      return null;
    }

    matchedParts = [].concat(matchedParts, subMatches);
  }

  return matchedParts;
}

function testPattern(pattern, part) {
  // Match anything
  if (pattern == null) {
    return [part];
  }

  // Simple match
  if (typeof pattern === "string") {
    if (pattern === part) {
      return [part];
    }

    return null;
  }

  // Predicate match
  if (typeof pattern == "function") {
    try {
      var results = pattern(part);
      if (results !== null) {
        return results;
      }
    } catch (e) {
      throw e;
    }

    return null;
  }

  // Array match
  if (pattern instanceof Array) {
    for (var i = 0; i < pattern.length; i++) {
      if ((results = testPattern(pattern[i], part)) != null) {
        return results;
      }
    }

    return null;
  }

  // RegExp match
  if (pattern instanceof RegExp) {
    var results = pattern.exec(part);
    if (results === null) {
      return null;
    }

    return results.slice(1);
  }
}

// Apply rule
function applyRule(sceneId, fields, data) {
  var any = false;
  var variables = {
    input: {
      id: sceneId,
    },
  };

  if (DEBUG) {
    for (var i = 0; i < data.length; i++) {
      bufferedOutput += "#" + i + ": " + data[i] + "\n";
    }
  }

  for (var field in fields) {
    var value = fields[field];
    for (var i = data.length - 1; i >= 0; i--) {
      value = value.replace("#" + i, data[i]);
    }

    switch (field) {
      case "title":
        if (DEBUG) {
          bufferedOutput += field + ": " + value + "\n";
        }

        variables.input["title"] = value;
        any = true;
        continue;

      case "studio":
        var studioId = tryGetStudio(value);
        if (studioId == null) {
          continue;
        }

        if (DEBUG) {
          bufferedOutput += field + ": " + value + "\n";
          bufferedOutput += "studio_id: " + studioId + "\n";
        }

        variables.input["studio_id"] = studioId;
        any = true;
        continue;

      case "movie_title":
        var movie_title = value.split(" ").join("[\\W]*");
        var movieId = tryGetMovie(movie_title);
        if (movieId == null) {
          continue;
        }

        if (!variables.input.hasOwnProperty("movies")) {
          variables.input["movies"] = [{}];
        }

        if (DEBUG) {
          bufferedOutput += field + ": " + value + "\n";
          bufferedOutput += "movie_id: " + movieId + "\n";
        }

        variables.input["movies"][0]["movie_id"] = movieId;
        any = true;
        continue;

      case "scene_index":
        var sceneIndex = parseInt(value);
        if (isNaN(sceneIndex)) {
          continue;
        }

        if (!variables.input.hasOwnProperty("movies")) {
          variables.input["movies"] = [{}];
        }

        if (DEBUG) {
          bufferedOutput += "scene_index: " + sceneIndex + "\n";
        }

        variables.input["movies"][0]["scene_index"] = sceneIndex;
        continue;

      case "performers":
        var performers = value.split(",").map(tryGetPerformer).filter(notNull);
        if (performers.length == 0) {
          continue;
        }

        if (DEBUG) {
          bufferedOutput += field + ": " + value + "\n";
          bufferedOutput += "performer_ids: " + performers.join(", ") + "\n";
        }

        variables.input["performer_ids"] = performers;
        any = true;
        continue;

      case "tags":
        var tags = value.split(",").map(tryGetTag).filter(notNull);
        if (tags.length == 0) {
          continue;
        }

        if (DEBUG) {
          bufferedOutput += field + ": " + value + "\n";
          bufferedOutput += "tag_ids: " + tags.join(", ") + "\n";
        }

        variables.input["tag_ids"] = tags;
        any = true;
        continue;
    }
  }

  // Test only
  if (DEBUG) {
    if (!any) {
      bufferedOutput += "No fields to update!\n";
    }

    return;
  }

  // Remove movies if movie_id is missing
  if (
    variables.input.hasOwnProperty("movies") &&
    !variables.input["movies"][0].hasOwnProperty("movie_id")
  ) {
    delete variables.input["movies"];
  }

  // Apply updates
  var query =
    "\
  mutation Mutation($input: SceneUpdateInput!) {\
    sceneUpdate(input: $input) {\
      id\
    }\
  }";

  if (!any) {
    throw "No fields to update for scene " + sceneId;
  }

  var result = gql.Do(query, variables);
  if (!result.sceneUpdate) {
    throw "Unable to update scene " + sceneId;
  }
}

// Returns true for not null elements
function notNull(ele) {
  return ele != null;
}

// Get studio id from studio name
function tryGetStudio(studio) {
  var query =
    "\
  query FindStudios($studioFilter: StudioFilterType) {\
    findStudios(studio_filter: $studioFilter) {\
      studios {\
        id\
      }\
      count\
    }\
  }";

  var variables = {
    studioFilter: {
      name: {
        value: studio.trim(),
        modifier: "EQUALS",
      },
    },
  };

  var result = gql.Do(query, variables);
  if (!result.findStudios || result.findStudios.count == 0) {
    return;
  }

  return result.findStudios.studios[0].id;
}

function tryGetMovie(movie_title) {
  var query =
    "\
  query FindMovies($movieFilter: MovieFilterType) {\
    findMovies(movie_filter: $movieFilter) {\
      movies {\
        id\
      }\
      count\
    }\
  }";

  var variables = {
    movieFilter: {
      name: {
        value: movie_title.trim(),
        modifier: "MATCHES_REGEX",
      },
    },
  };

  var result = gql.Do(query, variables);
  if (!result.findMovies || result.findMovies.count == 0) {
    return;
  }

  return result.findMovies.movies[0].id;
}

// Get performer id from performer name
function tryGetPerformer(performer) {
  var query =
    "\
  query FindPerformers($performerFilter: PerformerFilterType) {\
    findPerformers(performer_filter: $performerFilter) {\
      performers {\
        id\
      }\
      count\
    }\
  }";

  var variables = {
    performerFilter: {
      name: {
        value: performer.trim(),
        modifier: "EQUALS",
      },
    },
  };

  var result = gql.Do(query, variables);
  if (!result.findPerformers || result.findPerformers.count == 0) {
    return;
  }

  return result.findPerformers.performers[0].id;
}

// Get tag id from tag name
function tryGetTag(tag) {
  var query =
    "\
  query FindTags($tagFilter: TagFilterType) {\
    findTags(tag_filter: $tagFilter) {\
      tags {\
        id\
      }\
      count\
    }\
  }";

  var variables = {
    tagFilter: {
      name: {
        value: tag.trim(),
        modifier: "EQUALS",
      },
    },
  };

  var result = gql.Do(query, variables);
  if (!result.findTags || result.findTags.count == 0) {
    return;
  }

  return result.findTags.tags[0].id;
}

var DEBUG = false;
var BASE_PATHS = [];
var bufferedOutput = "";
main();
