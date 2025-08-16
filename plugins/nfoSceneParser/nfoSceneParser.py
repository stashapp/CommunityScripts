from math import log10
import sys
import json
import difflib
import config
import log
import re
import unicodedata
from abstractParser import AbstractParser
from nfoParser import NfoParser
from reParser import RegExParser
from stashInterface import StashInterface


class NfoSceneParser:

    def __init__(self, stash):
        self._stash: StashInterface = stash
        self._scene_id: str = None
        self._scene: dict = None
        self._folder_data: dict = {}
        self._file_data: dict = {}
        self._reload_tag_id = None

        # For reload mode, checks & preload ids matching marker tag config
        if self._stash.get_mode() == "reload" and config.reload_tag:
            reload_tag_found = False
            results = self._stash.gql_findTags(config.reload_tag)
            for tag in results.get("tags"):
                if tag["name"].lower() == config.reload_tag.lower():
                    self._reload_tag_id = tag["id"]
                    reload_tag_found = True
                    break
            if not reload_tag_found:
                log.LogError(
                    f"Reload cancelled: '{config.reload_tag}' do not exist in stash.")
                self._stash.exit_plugin("Reload task cancelled!")

    def __prepare(self, scene_id):
        self._scene_id = scene_id
        self._scene = self._stash.gql_findScene(self._scene_id)
        self._folder_data = {}
        self._file_data = {}

    # def __substitute_file_data(self):
    #     # Nothing to do if no config or actors...
    #     if not config.performers_substitutions or not self._file_data.get("actors"):
    #         return
    #     # Substitute performers names according to config
    #     index = 0
    #     for actor in self._file_data.get("actors"):
    #         for subst in config.performers_substitutions:
    #             if subst[0].lower() in actor.lower():
    #                 self._file_data.get("actors")[index] = actor.replace(
    #                     subst[0], subst[1])
    #                 break
    #         index += 1

    # Parses data from files. Supports nfo & regex
    def __parse(self):
        if self._scene["organized"] and config.skip_organized:
            log.LogInfo(
                f"Skipping already organized scene id: {self._scene['id']}")
            return

        # Parse folder nfo (used as default)
        # TODO: Manage file path array.
        folder_nfo_parser = NfoParser(self._scene["files"][0]["path"], None, True)
        self._folder_data = folder_nfo_parser.parse()

        # Parse scene nfo (nfo & regex).
        re_parser = RegExParser(self._scene["files"][0]["path"], [
            self._folder_data or AbstractParser.empty_default
        ])
        re_file_data = re_parser.parse()
        nfo_parser = NfoParser(self._scene["files"][0]["path"], [
            self._folder_data or AbstractParser.empty_default,
            re_file_data or AbstractParser.empty_default
        ])
        nfo_file_data = nfo_parser.parse()

        # nfo as preferred input. re as fallback
        self._file_data = nfo_file_data or re_file_data
        # self.__substitute_file_data()
        return self._file_data

    def __strip_b64(self, data):
        if data.get("cover_image"):
            data["cover_image"] = "*** Base64 image removed for readability ***"
        return json.dumps(data)

    # Updates the parsed data into stash db (and creates what is missing)
    def __update(self):
        # Must have found at least a "title" in the nfo or regex...
        if not self._file_data:
            log.LogDebug(
                "Skipped or no matching NFO or RE found: nothing done...")
            return

        # Retrieve/create performers, studios, movies,...
        scene_data = self.__find_create_scene_data()

        if config.dry_mode:
            log.LogInfo(
                f"Dry mode. Would have updated scene based on: {self.__strip_b64(scene_data)}")
            return scene_data

        # Update scene data from parsed info
        updated_scene = self._stash.gql_updateScene(self._scene_id, scene_data)
        if updated_scene is not None and updated_scene["id"] == str(self._scene_id):
            log.LogInfo(
                f"Successfully updated scene: {self._scene_id} using '{self._file_data['file']}'")
        else:
            log.LogError(
                f"Error updating scene: {self._scene_id} based on: {self.__strip_b64(scene_data)}.")
        return scene_data

    def __find_create_scene_data(self):
        # Lookup and/or create satellite objects in stash database
        file_performer_ids = []
        file_studio_id = None
        file_movie_id = None
        if "performers" not in config.blacklist:
            file_performer_ids = self.__find_create_performers()
        if "studio" not in config.blacklist:
            file_studio_id = self.__find_create_studio()
        if "movie" not in config.blacklist:
            file_movie_id = self.__find_create_movie(file_studio_id)
        # "tags" blacklist applied inside func (blacklist create, allow find):
        file_tag_ids = self.__find_create_tags()

        # Existing scene satellite data
        scene_studio_id = self._scene.get("studio").get(
            "id") if self._scene.get("studio") else None
        scene_performer_ids = list(
            map(lambda p: p.get("id"), self._scene["performers"]))
        scene_tag_ids = list(map(lambda t: t.get("id"), self._scene["tags"]))
        # in "reload" mode, removes the reload marker tag as part of the scene update
        if config.reload_tag and self._reload_tag_id and self._reload_tag_id in scene_tag_ids:
            scene_tag_ids.remove(self._reload_tag_id)
        # Currently supports only one movie (the first one...)
        scene_movie_id = scene_movie_index = None
        if self._scene.get("movies"):
            scene_movie_id = self._scene.get("movies")[0]["movie"]["id"]
            scene_movie_index = self._scene.get("movies")[0]["scene_index"]

        # Merges file data with the existing scene data (priority to the nfo/regex content)
        bl = config.blacklist
        scene_data = {
            "source": self._file_data["source"],
            "title": (self._file_data["title"] or self._scene["title"] or None) if "title" not in bl else None,
            "details": (self._file_data["details"] or self._scene["details"] or None) if "details" not in bl else None,
            "date": (self._file_data["date"] or self._scene["date"] or None) if "date" not in bl else None,
            "rating": (self._file_data["rating"] or self._scene["rating"] or None) if "rating" not in bl else None,
            # TODO: scene URL is now an array
            "urls": (self._file_data["urls"] or self._scene["urls"] or None) if "urls" not in bl else None,
            "studio_id": file_studio_id or scene_studio_id or None,
            "code": self._file_data["uniqueid"] if "uniqueid" in self._file_data else None,
            "performer_ids": list(set(file_performer_ids + scene_performer_ids)),
            "tag_ids": list(set(file_tag_ids + scene_tag_ids)),
            "movie_id": file_movie_id or scene_movie_id or None,
            "scene_index": self._file_data["scene_index"] or scene_movie_index or None,
            "cover_image": (self._file_data["cover_image"] or None) if "image" not in bl else None,
        }
        return scene_data

    def levenshtein_distance(self, str1, str2, ):
        counter = {"+": 0, "-": 0}
        distance = 0
        for edit_code, *_ in difflib.ndiff(str1, str2):
            if edit_code == " ":
                distance += max(counter.values())
                counter = {"+": 0, "-": 0}
            else:
                counter[edit_code] += 1
        distance += max(counter.values())
        return distance

    def __is_matching(self, text1, text2, tolerance=False):
        if not text1 or not text2:
            return text1 == text2
        
        # Normalize Unicode to handle emoji and special character variations
        normalized_text1 = unicodedata.normalize('NFC', text1).strip()
        normalized_text2 = unicodedata.normalize('NFC', text2).strip()
        
        if tolerance:
            distance = self.levenshtein_distance(normalized_text1.lower(), normalized_text2.lower())
            # Ensure minimum tolerance for very short strings (like single emoji)
            tolerance_threshold = max(config.levenshtein_distance_tolerance * log10(max(len(normalized_text1), 2)), 1)
            match = distance < tolerance_threshold
            if match and distance:
                log.LogDebug(f"Matched with distance {distance}: '{normalized_text1}' with '{normalized_text2}'")
            return match
        else:
            return normalized_text1.lower() == normalized_text2.lower()

    def __find_create_performers(self):
        performer_ids = []
        created_performers = []
        for actor in self._file_data["actors"]:
            if not actor:
                continue
            performers = self._stash.gql_findPerformers(actor)
            match_direct = False
            match_alias = False
            matching_id = None
            matching_name = None
            match_count = 0
            # 1st pass for direct name matches
            for performer in performers["performers"]:
                if self.__is_matching(actor, performer["name"]):
                    if not matching_id:
                        matching_id = performer["id"]
                        match_direct = True
                    match_count += 1
            # log.LogDebug(
            #     f"Direct '{actor}' performer search: matching_id: {matching_id}, match_count: {match_count}")
            # 2nd pass for alias matches
            if not matching_id and \
                    config.search_performer_aliases and \
                    (not config.ignore_single_name_performer_aliases or " " in actor or actor in config.single_name_whitelist):
                for performer in performers["performers"]:
                    for alias in performer["alias_list"]:
                        if self.__is_matching(actor, alias):
                            if not matching_id:
                                matching_id = performer["id"]
                                matching_name = performer["name"]
                                match_alias = True
                            match_count += 1
                # log.LogDebug(
                #     f"Aliases '{actor}' performer search: matching_id: {matching_id}, matching_name: {matching_name}, match_count: {match_count}")
            if not matching_id:
                # Create a new performer when it does not exist
                if not config.create_missing_performers or config.dry_mode:
                    log.LogInfo(
                        f"'{actor}' performer creation prevented by config")
                else:
                    new_performer = self._stash.gql_performerCreate(actor)
                    created_performers.append(actor)
                    performer_ids.append(new_performer["id"])
            else:
                performer_ids.append(matching_id)
                log.LogDebug(f"Matched existing performer '{actor}' with \
                    id {matching_id} name {matching_name or actor} \
                    (direct: {match_direct}, alias: {match_alias}, match_count: {match_count})")
                if match_count > 1:
                    log.LogInfo(f"Linked scene with title '{self._file_data['title']}' to existing \
                        performer '{actor}' (id {matching_id}). Attention: {match_count} matches \
                        were found. Check to de-duplicate your performers and their aliases...")
        if created_performers:
            log.LogInfo(f"Created missing performers '{created_performers}'")
        return performer_ids

    def __find_create_studio(self) -> str:
        if not self._file_data["studio"]:
            return
        studio_id = None
        studios = self._stash.gql_findStudios(self._file_data["studio"])
        match_direct = False
        match_alias = False
        matching_id = None
        match_count = 0
        # 1st pass for direct name matches
        for studio in studios["studios"]:
            if self.__is_matching(self._file_data["studio"], studio["name"]):
                if not matching_id:
                    matching_id = studio["id"]
                    match_direct = True
                match_count += 1
        # 2nd pass for alias matches
        if not matching_id and config.search_studio_aliases:
            for studio in studios["studios"]:
                if studio["aliases"]:
                    for alias in studio["aliases"]:
                        if self.__is_matching(self._file_data["studio"], alias):
                            if not matching_id:
                                matching_id = studio["id"]
                                match_alias = True
                            match_count += 1
        # Create a new studio when it does not exist
        if not matching_id:
            if not config.create_missing_studios or config.dry_mode:
                log.LogInfo(
                    f"'{self._file_data['studio']}' studio creation prevented by config")
            else:
                new_studio = self._stash.gql_studioCreate(
                    self._file_data["studio"])
                studio_id = new_studio["id"]
                log.LogInfo(
                    f"Created missing studio '{self._file_data['studio']}' with id {new_studio['id']}")
        else:
            studio_id = matching_id
            log.LogDebug(f"Matched existing studio '{self._file_data['studio']}' with id \
                {matching_id} (direct: {match_direct}, alias: {match_alias}, match_count: {match_count})")
            if match_count > 1:
                log.LogInfo(f"Linked scene with title '{self._file_data['title']}' to existing studio \
                    '{self._file_data['studio']}' (id {matching_id}). \
                        Attention: {match_count} matches were found. Check to de-duplicate...")
        return studio_id

    def __find_create_tags(self):
        tag_ids = []
        created_tags = []
        blacklisted_tags = [tag.lower() for tag in config.blacklisted_tags]
        # find all stash tags
        all_tags = self._stash.gql_findTags()
        for file_tag in self._file_data["tags"]:
            # skip empty or blacklisted tags
            if not file_tag or file_tag.lower() in blacklisted_tags:
                continue
            match_direct = False
            match_alias = False
            matching_id = None
            match_count = 0
            # 1st pass for direct name matches
            for tag in all_tags["tags"]:
                if self.__is_matching(file_tag, tag["name"], True):
                    if not matching_id:
                        matching_id = tag["id"]
                        match_direct = True
                    match_count += 1
            # 2nd pass for alias matches
            if not matching_id and config.search_studio_aliases:
                for tag in all_tags["tags"]:
                    if tag["aliases"]:
                        for alias in tag["aliases"]:
                            if self.__is_matching(file_tag, alias, True):
                                if not matching_id:
                                    matching_id = tag["id"]
                                    match_alias = True
                                match_count += 1
            # Create a new tag when it does not exist
            if not matching_id:
                if not config.create_missing_tags or config.dry_mode or "tags" in config.blacklist:
                    log.LogDebug(
                        f"'{file_tag}' tag creation prevented by config")
                else:
                    new_tag = self._stash.gql_tagCreate(file_tag)
                    created_tags.append(file_tag)
                    tag_ids.append(new_tag["id"])
            else:
                tag_ids.append(matching_id)
                log.LogDebug(
                    f"Matched existing tag '{file_tag}' with id {matching_id} \
                        (direct: {match_direct}, alias: {match_alias}, match_count: {match_count})")
                if match_count > 1:
                    log.LogInfo(f"Linked scene with title '{self._file_data['title']}' to existing tag \
                        '{file_tag}' (id {matching_id}). \
                            Attention: {match_count} matches were found. Check to de-duplicate...")
        if created_tags:
            log.LogInfo(f"Created missing tags '{created_tags}'")
        return tag_ids

    def __find_create_movie(self, studio_id):
        if not self._file_data["movie"]:
            return
        movie_id = None
        movies = self._stash.gql_findMovies(self._file_data["movie"])
        matching_id = None
        # [ ] possible improvement: support movie aliases?
        # Ensure direct name match
        for movie in movies["movies"]:
            if self.__is_matching(self._file_data["movie"], movie["name"]):
                if not matching_id:
                    matching_id = movie["id"]
        # Create a new movie when it does not exist
        if not matching_id:
            if not config.create_missing_movies or config.dry_mode:
                log.LogInfo(
                    f"'{self._file_data['movie']}' movie creation prevented by config")
            else:
                new_movie = self._stash.gql_movieCreate(
                    self._file_data, studio_id, self._folder_data)
                movie_id = new_movie["id"]
                log.LogInfo(
                    f"Created missing movie '{self._file_data['movie']}' with id {new_movie['id']}")
        else:
            # [ ] Possible improvement: update existing movie with nfo data
            movie_id = matching_id
            log.LogDebug(
                f"Matched existing movie '{self._file_data['movie']}' with id {matching_id}")
        return movie_id

    def __process_scene(self, scene_id):
        self.__prepare(scene_id)
        file_data = self.__parse()
        try:
            scene_data = self.__update()
        except Exception as e:
            log.LogError(
                f"Error updating stash for scene {scene_id}: {repr(e)}")
            scene_data = None
        return [file_data, scene_data]

    def __process_reload(self):
        # Check if the required config was done
        if not config.reload_tag:
            log.LogInfo(
                "Reload disabled: 'reload_tag' is empty in plugin's config.py")
            return
        # Find all scenes in stash with the reload marker tag
        scenes = self._stash.gql_findScenes(self._reload_tag_id)
        log.LogDebug(
            f"Found {len(scenes['scenes'])} scenes with the reload_tag in stash")
        scene_count = len(scenes["scenes"])
        if not scene_count:
            log.LogInfo("No scenes found with the 'reload_tag' tag")
            return
        reload_count = 0
        progress = 0
        progress_step = 1 / scene_count
        reload_tag = config.reload_tag.lower()

        # Reloads only scenes marked with configured tags
        for scene in scenes["scenes"]:
            for tag in scene.get("tags"):
                if tag.get("name").lower() == reload_tag:
                    log.LogDebug(
                        f"Scene {scene['id']} is tagged to be reloaded.")
                    self.__process_scene(scene["id"])
                    reload_count += 1
                    break
            progress += progress_step
            log.LogProgress(progress)

        # Inform if nothing was done
        if reload_count == 0:
            log.LogInfo(
                f"Scanned {scene_count} scenes. None had the '{config.reload_tag}' tag.")

    def process(self):
        if self._stash.get_mode() == "normal":
            return self.__process_scene(self._stash.get_scene_id())
        elif self._stash.get_mode() == "reload":
            return self.__process_reload()
        else:
            raise Exception(
                f"nfoSceneParser error: unsupported mode {self._stash.get_mode()}")


if __name__ == '__main__':
    # Init
    if len(sys.argv) > 1:
        # Loads from argv for testing...
        fragment = json.loads(sys.argv[1])
    else:
        fragment = json.loads(sys.stdin.read())

    # Start processing: parse file data and update scenes
    # (+ create missing performer, tag, movie,...)
    stash_interface = StashInterface(fragment)
    nfoSceneParser = NfoSceneParser(stash_interface)
    nfoSceneParser.process()
    stash_interface.exit_plugin("Successful!")
