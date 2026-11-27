# Pure GraphQL (query, variables) builders for the non-destructive primary-swap.

def find_scene_query(scene_id):
    q = """query FindScene($id: ID!) {
      findScene(id: $id) { id files { id path } }
    }"""
    return q, {"id": scene_id}

def find_image_query(image_id):
    # Image clips are a VideoFile filed under the Image model. __typename lets us
    # pick the video file (the croppable one) out of the visual_files union.
    q = """query FindImage($id: ID!) {
      findImage(id: $id) {
        id
        visual_files {
          __typename
          ... on VideoFile { id path }
          ... on ImageFile { id path }
        }
      }
    }"""
    return q, {"id": image_id}

def get_configuration_query():
    q = """query Configuration {
      configuration {
        general { ffmpegPath transcodeInputArgs transcodeOutputArgs }
        plugins(include: ["StashVideoEditor"])
      }
    }"""
    return q, {}

def metadata_scan_mutation(path):
    q = """mutation MetadataScan($input: ScanMetadataInput!) {
      metadataScan(input: $input)
    }"""
    return q, {"input": {"paths": [path]}}

def find_file_id_query(path):
    q = """query FindFileByPath($path: String!) {
      findScenes(scene_filter: {path: {value: $path, modifier: EQUALS}}) {
        scenes { id files { id path } }
      }
    }"""
    return q, {"path": path}

def set_primary_mutation(scene_id, file_id):
    q = """mutation SetPrimary($input: SceneUpdateInput!) {
      sceneUpdate(input: $input) { id }
    }"""
    return q, {"input": {"id": scene_id, "primary_file_id": file_id}}

def scene_merge_mutation(source_ids, destination_id):
    # Move source scenes' files into destination and delete the (now-empty) source
    # scenes. Reassigns files; does NOT delete from disk. We intentionally pass NO
    # `values`: scene.Merge discards a requested primary when the destination already
    # has one (merge.go) — so primary is set separately via sceneUpdate afterward.
    q = """mutation SceneMerge($input: SceneMergeInput!) {
      sceneMerge(input: $input) { id }
    }"""
    return q, {"input": {"source": source_ids, "destination": destination_id}}

def generate_scene_mutation(scene_id):
    # overwrite=True so the new primary file's sprites/previews/phash replace the
    # original's (otherwise generate skips — assets already exist for the scene).
    # markers/markerImagePreviews/markerScreenshots: marker previews are rendered
    # from the file, so a primary swap (crop/stretch/trim) leaves them showing the
    # OLD frames until regenerated.
    q = """mutation Generate($input: GenerateMetadataInput!) {
      metadataGenerate(input: $input)
    }"""
    return q, {"input": {"sceneIDs": [scene_id], "sprites": True, "previews": True,
                         "covers": True, "phashes": True, "markers": True,
                         "markerImagePreviews": True, "markerScreenshots": True,
                         "overwrite": True}}

def generate_image_mutation(image_id):
    # Image-clip counterpart of generate_scene_mutation, for the overwrite-in-place
    # crop swap. overwrite=True or Stash skips (preview/thumbnail assets already
    # exist for the image — this is why the clip's preview kept showing the OLD,
    # uncropped frame until a manual Generate). clipPreviews = the animated looping
    # preview for a video image clip; imageThumbnails = the static thumbnail.
    q = """mutation Generate($input: GenerateMetadataInput!) {
      metadataGenerate(input: $input)
    }"""
    return q, {"input": {"imageIDs": [image_id], "clipPreviews": True,
                         "imageThumbnails": True, "imagePreviews": True,
                         "imagePhashes": True, "overwrite": True}}

def scene_markers_query(scene_id):
    # Markers to remap after a trim, plus file durations to cull out-of-range ones.
    q = """query SceneMarkers($id: ID!) {
      findScene(id: $id) {
        scene_markers { id seconds end_seconds }
        files { id duration }
      }
    }"""
    return q, {"id": scene_id}

def marker_update_mutation(marker_id, seconds, end_seconds):
    # Shift a marker onto the trimmed timeline. end_seconds omitted when absent so
    # we don't clobber a no-end marker with null.
    q = """mutation MarkerUpdate($input: SceneMarkerUpdateInput!) {
      sceneMarkerUpdate(input: $input) { id }
    }"""
    data = {"id": marker_id, "seconds": seconds}
    if end_seconds is not None:
        data["end_seconds"] = end_seconds
    return q, {"input": data}

def marker_destroy_mutation(marker_id):
    # A marker whose moment was trimmed away has nowhere to point — remove it.
    q = """mutation MarkerDestroy($id: ID!) {
      sceneMarkerDestroy(id: $id)
    }"""
    return q, {"id": marker_id}
