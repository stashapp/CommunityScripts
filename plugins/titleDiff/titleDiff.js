var TAG_NAME = "_titleDiff" // Name of tag to set when scene title differs from filename, will create if not found


function main() {
    switch (input.Args.mode) {
        case "diff":
            diff()
    }
}

function diff() {
    log.Info("diff: Begin diff title/filename")
    var sceneIds = findDiffingScenes()
    var tagId = getOrCreateTag()
    var n = setTag(sceneIds, [tagId])

    log.Info("diff: Number of scenes found with differing title/filename: " + n)
}

function findDiffingScenes() {
    var query = "{findScenes(filter:{per_page:-1}){scenes{id title path}}}"
    var result = gql.Do(query)
    if (result.findScenes == null) {
        log.Info("diff: No scenes found")
        return
    }
    var scenes = result.findScenes.scenes
    var diffs = []
    for (var i = 0; i < scenes.length; i++) {
        var filename = scenes[i].path.split(/.*[\/|\\]/)[1];
        var filenameNoExt = filename.replace(/\.[^/.]+$/, "")
        if (scenes[i].title !== filename && scenes[i].title !== filenameNoExt) {
            log.Debug("diff: Id=" + scenes[i].id + " Title='" + scenes[i].title + "' Filename='" + filename + "'")
            diffs.push(scenes[i].id)
        }
    }
    return diffs
}

function getOrCreateTag() {
    var query = "query FindTag($name: String!){\
        findTags(tag_filter:{name:{value:$name, modifier:EQUALS}}){tags{id}}}"

    var result = gql.Do(query, {name: TAG_NAME})
    if (result.findTags == null) {
        log.Warn("diff: No tags?")
        return
    }
    if (result.findTags.tags.length === 0) {
        log.Debug("diff: Tag not found, creating...")
        return createTag()
    } else {
        return result.findTags.tags[0].id
    }
}

function createTag() {
    var query = "mutation CreateTag($name: String!){tagCreate(input:{name:$name}){id}}"
    var result = gql.Do(query, {name: TAG_NAME})
    log.Debug("diff: Tag created Id='" + result.tagCreate.id + "' name='" + TAG_NAME + "'")
    return result.tagCreate.id
}

function setTag(sceneIds, tagIds) {
    var query = "mutation BulkSceneSetTag($scene_ids: [ID!], $tag_ids: [ID!]){\
        bulkSceneUpdate(input:{ids: $scene_ids, tag_ids:{ids: $tag_ids, mode:ADD}}){id}}"

    var result = gql.Do(query, {scene_ids: sceneIds, tag_ids: tagIds})
    log.Debug(result)
    return result.bulkSceneUpdate.length
}

main()