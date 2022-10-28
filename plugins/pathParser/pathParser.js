// Common Patterns
var patterns = {
  movieTitleAndYear: /(.+) \(\d{4}\)/,
  sceneTitleAndPerformers: /(.+) - ([^\.]+)/
}

var rules = [
  {
    name: 'Rule 1',
    pattern: [
      'Specific Studio',
      null,
      null
    ],
    fields: {
      studio: '#0',
      title: '#2',
    }
  },
  {
    name: 'Rule 2',
    pattern: [
      ['One Studio', 'Another Studio'],
      patterns.movieTitleAndYear,
      patterns.sceneTitleAndPerformers
    ],
    fields: {
      title: '#2',
      studio: '#0',
      performers: '#3'
    }
  },
];

/* ----------------------------------------------------------------------------
// DO NOT EDIT BELOW!
---------------------------------------------------------------------------- */
function main()
{
  try
  {
    switch (getTask(input.Args))
    {
      case 'createTags':
        createTags(['[Run]', '[Test]']);
        break;

      case 'removeTags':
        removeTags(['[Run]', '[Test]']);
        break;

      case 'runRules':
        initBasePaths();
        runRules('[Run]');
        break;

      case 'testRules':
        DEBUG = true;
        initBasePaths();
        runRules('[Test]');
        break;

      case 'scene':
        var id = getId(input.Args);
        initBasePaths();
        matchRuleWithSceneId(id, applyRule);
        break;

      case 'image':
        var id = getId(input.Args);
        initBasePaths();
        break;

      default:
        throw 'Unsupported task';
    }
  }
  catch (e)
  {
    return { Output: 'error', Error: e };
  }

  return { Output: 'ok' };
}

// Determine task based on input args
function getTask(inputArgs)
{
  if (inputArgs.hasOwnProperty('task'))
  {
    return inputArgs.task;
  }
  
  if (!inputArgs.hasOwnProperty('hookContext'))
  {
    return;
  }

  switch (inputArgs.hookContext.type)
  {
    case 'Scene.Create.Post':
      return 'scene';
    
    case 'Image.Create.Post':
      return 'image';
  }
}

// Get stash paths from configuration
function initBasePaths()
{
  var query ='\
  query Query {\
    configuration {\
      general {\
        stashes {\
          path\
        }\
      }\
    }\
  }';

  var result = gql.Do(query);
  if (!result.configuration)
  {
    throw 'Unable to get library paths';
  }

  BASE_PATHS = result.configuration.general.stashes.map(function (stash)
  {
    return stash.path;
  });

  if (BASE_PATHS == null || BASE_PATHS.length == 0)
  {
    throw 'Unable to get library paths';
  }
}

// Create tag if it does not already exist
function createTags(tags)
{
  var query ='\
  mutation TagCreate($input: TagCreateInput!) {\
    tagCreate(input: $input) {\
      id\
    }\
  }';

  tags.forEach(function (tag)
  {
    if (getTagId(tag) !== null)
    {
      return;
    }

    var variables = {
      input: {
        name: tag
      }
    };

    var result = gql.Do(query, variables);
    if (!result.tagCreate)
    {
      throw 'Could not create tag ' + tag;
    }
  });
}

// Remove tags if it already exists
function removeTags(tags)
{
  tags.forEach(function (tag)
  {
    var tagId = getTagId(tag);
    if (tagId === null)
    {
      return;
    }

    var query = '\
    mutation TagsDestroy($ids: [ID!]!) {\
      tagsDestroy(ids: $ids)\
    }';

    var variables = {
      ids: [ tagId ]
    };

    var result = gql.Do(query, variables);
    if (!result.tagsDestroy)
    {
      throw 'Unable to remove tag ' + tag;
    }
  });
}

// Run rules for scenes containing tag
function runRules(tag)
{
  var tagId = getTagId(tag);
  if (tagId === null)
  {
    throw 'Tag ' + tag + ' does not exist';
  }

  var query = '\
  query FindScenes($sceneFilter: SceneFilterType) {\
    findScenes(scene_filter: $sceneFilter) {\
      scenes {\
        id\
      }\
    }\
  }';

  var variables = {
    sceneFilter: {
      tags: {
        value: tagId,
        modifier: 'INCLUDES'
      }
    }
  };

  var result = gql.Do(query, variables);
  if (!result.findScenes || result.findScenes.scenes.length == 0)
  {
    throw 'No scenes found with tag ' + tag;
  }

  result.findScenes.scenes.forEach(function (scene)
  {
    matchRuleWithSceneId(scene.id, applyRule);
  });
}

// Get scene/image id from input args
function getId(inputArgs)
{
  if ((id = inputArgs.hookContext.id) == null)
  {
    throw 'Input is missing id';
  }

  return id;
}

// Apply callback function to first matching rule for id
function matchRuleWithSceneId(sceneId, cb)
{
  var query = '\
  query FindScene($findSceneId: ID) {\
    findScene(id: $findSceneId) {\
      files {\
        path\
      }\
    }\
  }';

  var variables = {
    findSceneId: sceneId
  }

  var result = gql.Do(query, variables);
  if (!result.findScene || result.findScene.files.length == 0)
  {
    throw 'Missing scene for id: ' + sceneId;
  }

  for (var i = 0; i < result.findScene.files.length; i++)
  {
    try
    {
      matchRuleWithPath(sceneId, result.findScene.files[i].path, cb);
      
      if (DEBUG && bufferedOutput !== null && bufferedOutput !== '')
      {
        log.Info('[PathParser] ' + bufferedOutput);
      }

      return;
    }
    catch (e)
    {
      continue;
    }
  }
  
  if (DEBUG && bufferedOutput !== null && bufferedOutput !== '')
  {
    log.Info('[PathParser] ' + bufferedOutput);
  }

  throw 'No rule matches id: ' + sceneId;
}

// Apply callback to first matching rule for path
function matchRuleWithPath(sceneId, path, cb)
{
  // Remove base path
  for (var i = 0; i < BASE_PATHS.length; i++)
  {
    if (path.slice(0, BASE_PATHS[i].length) === BASE_PATHS[i])
    {
      path = path.slice(BASE_PATHS[i].length);
    }
  }

  if (DEBUG)
  {
    bufferedOutput = path + '\n';
  }

  // Split paths into parts
  var parts = path.split(/[\\/]/);

  // Remove extension from filename
  parts[parts.length - 1] = parts[parts.length - 1].slice(0, parts[parts.length - 1].lastIndexOf('.'));

  for (var i = 0; i < rules.length; i++)
  {
    var sceneData = testRule(rules[i].pattern, parts);
    if (sceneData !== null)
    {
      if (DEBUG)
      {
        bufferedOutput += 'Rule: ' + rules[i].name + '\n';
      }

      log.Debug('[PathParser] Rule: ' + rules[i].name + '\nPath: ' + path);
      cb(sceneId, rules[i].fields, sceneData);
      return;
    }
  }

  bufferedOutput += 'No matching rule!';
  throw 'No matching rule for path: ' + path;
}

// Test single rule
function testRule(pattern, parts)
{
  if (pattern.length !== parts.length)
  {
    return null;
  }

  var matchedParts = [];
  for (var i = 0; i < pattern.length; i++)
  {
    if ((subMatches = testPattern(pattern[i], parts[i])) == null)
    {
      return null;
    }

    matchedParts = [].concat(matchedParts, subMatches);
  }

  return matchedParts;
}

function testPattern(pattern, part)
{
  // Match anything
  if (pattern == null)
  {
    return [part];
  }

  // Simple match
  if (typeof pattern === 'string')
  {
    if (pattern === part)
    {
      return [part];
    }

    return null;
  }

  // Predicate match
  if (typeof pattern == 'function')
  {
    try
    {
      var results = pattern(part);
      if (results !== null)
      {
        return results;
      }
    }
    catch (e)
    {
      throw e;
    }

    return null;
  }

  // Array match
  if (pattern instanceof Array)
  {
    for (var i = 0; i < pattern.length; i++)
    {
      if ((results = testPattern(pattern[i], part)) != null)
      {
        return results;
      }
    }

    return null;
  }

  // RegExp match
  if (pattern instanceof RegExp)
  {
    var results = pattern.exec(part);
    if (results === null)
    {
      return null;
    }

    return results.slice(1);
  }
}

// Apply rule
function applyRule(sceneId, fields, data)
{
  var values = {};

  for (var field in fields)
  {
    var value = fields[field];
    for (var j = data.length - 1; j >= 0; j--)
    {
      value = value.replace('#' + j, data[j]);
    }

    if (DEBUG)
    {
      bufferedOutput += field + ': ' + value + '\n';
    }

    values[field] = value;
  }

  // Test only
  if (DEBUG)
  {
    return;
  }

  // Apply updates
  var query = '\
  mutation Mutation($input: SceneUpdateInput!) {\
    sceneUpdate(input: $input) {\
      id\
    }\
  }';

  var variables = {
    input: {
      id: sceneId
    }
  };

  var any = false;
  for (var field in values)
  {
    switch (field)
    {
      case 'title':
        variables.input['title'] = values[field];
        any = true;
        break;

      case 'studio':
        var studioId = getStudioId(values[field]);
        if (studioId != null)
        {
          variables.input['studio_id'] = getStudioId(values[field]);
          any = true;
        }

        break;
      
      case 'performers':
        var performers = values[field].split(',').map(getPerformerId).filter(notNull);
        if (performers.length != 0)
        {
          variables.input['performer_ids'] = performers;
          any = true;
        }

        break;

      case 'tags':
        var tags = values[field].split(',').map(getTagId).filter(notNull);
        if (tags.length != 0)
        {
          variables.input['tag_ids'] = tags;
          any = true;
        }

        break;
    }
  }

  if (!any)
  {
    throw 'No fields to update for scene ' + sceneId;
  }

  var result = gql.Do(query, variables);
  if (!result.sceneUpdate)
  {
    throw 'Unable to update scene ' + sceneId;
  }
}

// Returns true for not null elements
function notNull(ele)
{
  return ele != null;
}

// Get studio id from studio name
function getStudioId(studio)
{
  var query = '\
  query FindStudios($studioFilter: StudioFilterType) {\
    findStudios(studio_filter: $studioFilter) {\
      studios {\
        id\
      }\
      count\
    }\
  }';

  var variables = {
    studioFilter: {
      name: {
        value: studio.trim(),
        modifier: 'EQUALS'
      }
    }
  };

  var result = gql.Do(query, variables);
  if (!result.findStudios || result.findStudios.count == 0)
  {
    return;
  }

  return result.findStudios.studios[0].id;
}

// Get performer id from performer name
function getPerformerId(performer)
{
  var query = '\
  query FindPerformers($performerFilter: PerformerFilterType) {\
    findPerformers(performer_filter: $performerFilter) {\
      performers {\
        id\
      }\
      count\
    }\
  }';

  var variables = {
    performerFilter: {
      name: {
        value: performer.trim(),
        modifier: 'EQUALS'
      }
    }
  };

  var result = gql.Do(query, variables);
  if (!result.findPerformers || result.findPerformers.count == 0)
  {
    return;
  }

  return result.findPerformers.performers[0].id;
}

// Get tag id from tag name
function getTagId(tag)
{
  var query ='\
  query FindTags($tagFilter: TagFilterType) {\
    findTags(tag_filter: $tagFilter) {\
      tags {\
        id\
      }\
      count\
    }\
  }';

  var variables = {
    tagFilter: {
      name: {
        value: tag.trim(),
        modifier: 'EQUALS'
      }
    }
  };

  var result = gql.Do(query, variables);
  if (!result.findTags || result.findTags.count == 0)
  {
    return;
  }

  return result.findTags.tags[0].id;
}

var DEBUG = false;
var BASE_PATHS = [];
var bufferedOutput = '';
main();