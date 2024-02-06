function ok() {
  return {
    output: "ok",
  };
}

function main() {
  var hookContext = input.Args.hookContext;
  var type = hookContext.type;
  var ID = hookContext.ID;

  if (!ID) {
    return ok();
  }

  var filenameFetcher;
  var saver;
  if (type === "Scene.Create.Post") {
    filenameFetcher = getSceneFilename;
    saver = updateScene;
  } else if (type === "Gallery.Create.Post") {
    filenameFetcher = getGalleryFilename;
    saver = updateGallery;
  } else {
    return ok();
  }

  var filename = filenameFetcher(ID);
  if (!filename) {
    return ok();
  }

  filename = cleanFilename(filename);
  var parseResult = parseFilename(filename);

  saver(ID, parseResult);

  return ok();
}

function getSceneFilename(sceneID) {
  var query =
    "\
query findScene($id: ID) {\
    findScene(id: $id) {\
        files {\
            path\
        }\
    }\
}";

  var variables = {
    id: sceneID,
  };

  var result = gql.Do(query, variables);
  var findScene = result.findScene;
  if (!findScene) {
    return null;
  }

  var path = findScene.files[0].path;
  return path.substring(path.lastIndexOf("/") + 1);
}

function updateScene(sceneID, parseResult) {
  var query =
    "\
mutation SceneUpdate($input: SceneUpdateInput!) {\
    sceneUpdate(input: $input) {\
        id\
    }\
}";

  var variables = {
    input: parseResult,
  };

  variables.input.id = sceneID;

  gql.Do(query, variables);
}

function getGalleryFilename(galleryID) {
  var query =
    "\
query findGallery($id: ID!) {\
    findGallery(id: $id) {\
        files {\
            path\
        }\
    }\
}";

  var variables = {
    id: galleryID,
  };

  var result = gql.Do(query, variables);
  var findGallery = result.findGallery;
  if (!findGallery) {
    return null;
  }

  var path = findGallery.files[0].path;
  return path.substring(path.lastIndexOf("/") + 1);
}

function updateGallery(galleryID, parseResult) {
  var query =
    "\
mutation GalleryUpdate($input: GalleryUpdateInput!) {\
    galleryUpdate(input: $input) {\
        id\
    }\
}";

  var variables = {
    input: parseResult,
  };

  variables.input.id = galleryID;

  gql.Do(query, variables);
}

function matchNames(parts, name, aliases) {
  var names = [name].concat(aliases);

  var partRegexes = [];

  for (var i = 0; i < parts.length; i++) {
    partRegexes[i] = new RegExp("^" + parts[i].toLowerCase() + "[. \\-_]*");
  }

  var cleanRegex = /[. \-_]/g;
  var longestMatch = 0;
  for (var i = 0; i < names.length; i++) {
    var name = names[i].replace(cleanRegex, "").toLowerCase();
    for (var j = 0; j < partRegexes.length; j++) {
      if (!partRegexes[j].test(name)) {
        break;
      }

      name = name.replace(partRegexes[j], "");

      if (name.length === 0) {
        if (j + 1 > longestMatch) {
          longestMatch = j + 1;
        }
      }
    }
  }

  return longestMatch;
}

function cleanFilename(name) {
  name = name
    // remove imageset-...[rarbg]
    .replace(/imageset-[\w\d]+\[rarbg]/i, "")
    // replace [...] with just ...
    .replace(/\[(.*?)]/g, "$1")
    // replace (...) with just ...
    .replace(/\((.*?)\)/g, "$1")
    // replace {...} with just ...
    .replace(/{(.*?)}/g, "$1");

  var blockList = [
    "mp4",
    "mov",
    "mkv",
    "zip",
    "cbz",
    "cbr",
    "xxx",
    "4k",
    "4096x2160",
    "3840x2160",
    "2160p",
    "1080p",
    "1920x1080",
    "60fps",
    "30fps",
    "repack",
    "ktr",
  ];
  var regExp = new RegExp(
    "(_|[^\\w\\d]|^)(" + blockList.join("|") + ")(_|[^\\w\\d]|$)",
    "i",
  );
  while (regExp.test(name)) {
    name = name.replace(regExp, "$1$3");
  }

  // If name starts with <...>.com remove the .com (sometimes names include studio name as site/domain)
  name = name.replace(/^([\w\d-]+?)\.com/, "$1");

  name = name
    // Remove everything except letters and digits at the start
    .replace(/^(_|[^\w\d])+/, "")
    // Remove everything except letters and digits at the end
    .replace(/(_|[^\w\d])+$/, "");

  return name;
}

function matchStudio(parts, result) {
  var query =
    "\
query findStudios($studio_filter: StudioFilterType, $filter: FindFilterType!) {\
    findStudios(studio_filter: $studio_filter, filter: $filter) {\
        studios {\
            id\
            name\
            aliases\
        }\
    }\
}";

  var searchTerm = parts[0].substring(0, 2);
  if (parts[0].substring(0, 1) === "a") {
    searchTerm = parts[0].substring(1, 3);
  }
  var variables = {
    filter: {
      per_page: -1,
    },
    studio_filter: {
      name: {
        modifier: "INCLUDES",
        value: searchTerm,
      },
      OR: {
        aliases: {
          modifier: "INCLUDES",
          value: searchTerm,
        },
      },
    },
  };

  var queryResult = gql.Do(query, variables);
  var studios = queryResult.findStudios.studios;
  if (!studios.length && parts[0].substring(0, 1) === "a") {
    variables.studio_filter.name.value =
      variables.studio_filter.OR.aliases.value = parts[0].substring(1, 3);
    queryResult = gql.Do(query, variables);
    studios = queryResult.findStudios.studios;
  }

  var matchingParts = 0;
  for (var i = 0; i < studios.length; i++) {
    var studio = studios[i];
    matchingParts = matchNames(parts, studio.name, studio.aliases);
    if (matchingParts === 0) {
      continue;
    }

    result.studio_id = studio.id;

    break;
  }

  return matchingParts;
}

function matchDate(parts, result) {
  if (
    parts.length < 3 ||
    !/^(\d{2}|\d{4})$/.test(parts[0]) ||
    !/^\d{2}$/.test(parts[1]) ||
    !/^\d{2}$/.test(parts[2])
  ) {
    return 0;
  }

  var year = parseInt(parts[0], 10);
  var month = parseInt(parts[1], 10);
  var day = parseInt(parts[2], 10);

  if (year < 100) {
    year += 2000;
  }

  if (
    year < 2000 ||
    year > 2100 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return 0;
  }

  result.date =
    year +
    "-" +
    (month < 10 ? "0" + month : month) +
    "-" +
    (day < 10 ? "0" + day : day);

  return 3;
}

function matchPerformers(parts, result) {
  var query =
    "\
query findPerformers($performer_filter: PerformerFilterType, $filter: FindFilterType!) {\
    findPerformers(performer_filter: $performer_filter, filter: $filter) {\
        performers {\
            id\
            name\
            alias_list\
        }\
    }\
}";
  var variables = {
    filter: {
      per_page: -1,
    },
    performer_filter: {
      name: {
        modifier: "INCLUDES",
      },
      OR: {
        aliases: {
          modifier: "INCLUDES",
        },
      },
    },
  };

  var totalMatchingParts = 0;
  result.performer_ids = [];
  do {
    variables.performer_filter.name.value =
      variables.performer_filter.OR.aliases.value = parts[0].substring(0, 2);

    var queryResult = gql.Do(query, variables);
    var performers = queryResult.findPerformers.performers;
    if (!performers.length) {
      parts.shift();
      continue;
    }

    var maxMatchLength = 0;
    var matches = [];
    for (var i = 0; i < performers.length; i++) {
      var performer = performers[i];
      var aliases = performer.aliases
        ? performer.aliases.split(/\s*[,;]+\s*/)
        : [];
      var matchingParts = matchNames(parts, performer.name, aliases);
      if (matchingParts === 0) {
        continue;
      }

      if (matchingParts > maxMatchLength) {
        maxMatchLength = matchingParts;
        matches = [performer.id];
      } else if (matchingParts === maxMatchLength) {
        matches.push(performer.id);
      }
    }

    if (maxMatchLength === 0) {
      break;
    }

    result.performer_ids = result.performer_ids.concat(matches);

    totalMatchingParts += maxMatchLength;

    parts = parts.slice(maxMatchLength);
    while (
      parts.length > 0 &&
      (parts[0].toLowerCase() === "and" || parts[0] === "&")
    ) {
      parts.shift();
      totalMatchingParts += 1;
    }
  } while (parts.length > 0);

  return totalMatchingParts;
}

function parseFilename(name) {
  var parts = name.split(/[. \-_,]+/);

  var matchers = [matchStudio, matchDate, matchPerformers];

  var result = {};
  var hasMatched = false;
  for (
    var matchTries = 0;
    matchTries < 3 && !hasMatched && parts.length;
    matchTries++
  ) {
    for (var i = 0; i < matchers.length && parts.length > 0; i++) {
      var matchedParts = matchers[i](parts, result);

      if (matchedParts > 0) {
        hasMatched = true;
        parts = parts.slice(matchedParts);
      }
    }

    // If no matchers worked remove a part. Maybe the format is correct but studio isn't found? etc
    if (!hasMatched) {
      parts.shift();
    }
  }

  if (hasMatched && parts.length > 0) {
    var title = parts.join(" ");
    // Look behind assertions are not supported, so can't use `replace(/(?<=.)([A-Z]/g, ' $1')` so instead have to do a loop. Otherwise for example 'FooABar' will become 'Foo ABar' instead of 'Foo A Bar'
    while (/[^\s][A-Z]/.test(title)) {
      title = title.replace(/([^\s])([A-Z])/g, "$1 $2");
    }
    result.title = title.trim();
  }
  return result;
}

main();
