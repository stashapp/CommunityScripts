from math import log10
import sys
import json
import difflib
import os
import config
import log
import re
from abstractParser import AbstractParser
from nfoParser import NfoParser
from reParser import RegExParser
from stashInterface import StashInterface


class NfoContentParser:

    def __init__(self, stash):
        self._stash: StashInterface = stash
        self._content_id: str = None
        self._content_type: str = None
        self._content: dict = None
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

    def __prepare(self, content_id, content_type):
        self._content_id = content_id
        self._content_type = content_type
        
        # Get content data based on type
        if content_type == "scene":
            self._content = self._stash.gql_findScene(self._content_id)
        elif content_type == "image":
            self._content = self._stash.gql_findImage(self._content_id)
        elif content_type == "gallery":
            self._content = self._stash.gql_findGallery(self._content_id)
        else:
            raise Exception(f"Unsupported content type: {content_type}")
            
        self._folder_data = {}
        self._file_data = {}

    # Parses data from files. Supports nfo & regex
    def __parse(self):
        if self._content["organized"] and config.skip_organized:
            log.LogInfo(
                f"Skipping already organized {self._content_type} id: {self._content['id']}")
            return

        # Get the content path based on content type
        if self._content_type == "gallery":
            # For galleries, use the folder.path field
            content_path = None
            if self._content.get("folder") and self._content["folder"].get("path"):
                content_path = self._content["folder"]["path"]
            elif self._content.get("files") and len(self._content["files"]) > 0:
                # Fallback: get directory from first file
                content_path = os.path.dirname(self._content["files"][0]["path"])
            
            if not content_path:
                log.LogError(f"Could not determine folder path for gallery {self._content['id']}")
                return
            log.LogDebug(f"Gallery folder path: {content_path}")
        else:
            # For scenes and images, use the file path
            if not self._content.get("files") or len(self._content["files"]) == 0:
                log.LogError(f"No files found for {self._content_type} {self._content['id']}")
                return
            content_path = self._content["files"][0]["path"]
            log.LogDebug(f"{self._content_type.capitalize()} path: {content_path}")

        # Parse folder nfo (used as default)
        folder_nfo_parser = NfoParser(content_path, None, True, self._content_type)
        self._folder_data = folder_nfo_parser.parse()

        # Parse content nfo (nfo & regex).
        re_parser = RegExParser(content_path, [
            self._folder_data or AbstractParser.empty_default
        ], self._content_type)
        re_file_data = re_parser.parse()
        nfo_parser = NfoParser(content_path, [
            self._folder_data or AbstractParser.empty_default,
            re_file_data or AbstractParser.empty_default
        ], False, self._content_type)
        nfo_file_data = nfo_parser.parse()

        # nfo as preferred input. re as fallback
        self._file_data = nfo_file_data or re_file_data
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
        content_data = self.__find_create_content_data()

        if config.dry_mode:
            log.LogInfo(
                f"Dry mode. Would have updated {self._content_type} based on: {self.__strip_b64(content_data)}")
            return content_data

        # Update content data from parsed info
        updated_content = None
        if self._content_type == "scene":
            updated_content = self._stash.gql_updateScene(self._content_id, content_data)
        elif self._content_type == "image":
            updated_content = self._stash.gql_updateImage(self._content_id, content_data)
        elif self._content_type == "gallery":
            updated_content = self._stash.gql_updateGallery(self._content_id, content_data)
            
        if updated_content is not None and updated_content["id"] == str(self._content_id):
            log.LogInfo(
                f"Successfully updated {self._content_type}: {self._content_id} using '{self._file_data['file']}'")
        else:
            log.LogError(
                f"Error updating {self._content_type}: {self._content_id} based on: {self.__strip_b64(content_data)}.")
        return content_data

    def __find_create_content_data(self):
        # Lookup and/or create satellite objects in stash database
        file_performer_ids = []
        file_studio_id = None
        file_movie_id = None
        if "performers" not in config.blacklist:
            file_performer_ids = self.__find_create_performers()
        if "studio" not in config.blacklist:
            file_studio_id = self.__find_create_studio()
        if "movie" not in config.blacklist and self._content_type == "scene":
            file_movie_id = self.__find_create_movie(file_studio_id)
        # "tags" blacklist applied inside func (blacklist create, allow find):
        file_tag_ids = self.__find_create_tags()

        # Existing content satellite data
        content_studio_id = self._content.get("studio").get(
            "id") if self._content.get("studio") else None
        content_performer_ids = list(
            map(lambda p: p.get("id"), self._content["performers"]))
        content_tag_ids = list(map(lambda t: t.get("id"), self._content["tags"]))
        
        # in "reload" mode, removes the reload marker tag as part of the content update
        if config.reload_tag and self._reload_tag_id:
            if self._reload_tag_id in content_tag_ids:
                content_tag_ids.remove(self._reload_tag_id)
                
        # Movies only for scenes
        content_movie_id = content_movie_index = None
        if self._content_type == "scene" and self._content.get("movies"):
            content_movie_id = self._content.get("movies")[0]["movie"]["id"]
            content_movie_index = self._content.get("movies")[0]["scene_index"]

        # Merges file data with the existing content data (priority to the nfo/regex content)
        bl = config.blacklist
        content_data = {
            "source": self._file_data["source"],
            "title": (self._file_data["title"] or self._content["title"] or None) if "title" not in bl else None,
            "date": (self._file_data["date"] or self._content["date"] or None) if "date" not in bl else None,
            "rating": (self._file_data["rating"] or self._content["rating"] or None) if "rating" not in bl else None,
            "urls": (self._file_data["urls"] or self._content["urls"] or None) if "urls" not in bl else None,
            "performer_ids": list(set(file_performer_ids + content_performer_ids)),
            "tag_ids": list(set(file_tag_ids + content_tag_ids)),
        }

        # Add content-type specific fields
        if self._content_type == "scene":
            content_data.update({
                "details": (self._file_data["details"] or self._content["details"] or None) if "details" not in bl else None,
                "code": self._file_data["uniqueid"] if "uniqueid" in self._file_data else None,
                "movie_id": file_movie_id or content_movie_id or None,
                "scene_index": self._file_data["scene_index"] or content_movie_index or None,
                "cover_image": (self._file_data["cover_image"] or None) if "image" not in bl else None,
            })
        elif self._content_type == "image":
            content_data.update({
                "details": (self._file_data["details"] or self._content["details"] or None) if "details" not in bl else None,
            })
        elif self._content_type == "gallery":
            content_data.update({
                "details": (self._file_data["details"] or self._content["details"] or None) if "details" not in bl else None,
            })

        return content_data

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
        if tolerance:
            distance = self.levenshtein_distance(text1.lower(), text2.lower())
            match = distance < (config.levenshtein_distance_tolerance * log10(len(text1)))
            if match and distance:
                log.LogDebug(f"Matched with distance {distance}: '{text1}' with '{text2}'")
            return match
        else:
            return text1.lower() == text2.lower()

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
                    log.LogInfo(f"Linked {self._content_type} with title '{self._file_data['title']}' to existing \
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
                log.LogInfo(f"Linked {self._content_type} with title '{self._file_data['title']}' to existing studio \
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
                    log.LogInfo(f"Linked {self._content_type} with title '{self._file_data['title']}' to existing tag \
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

    def __process_content(self, content_id, content_type):
        self.__prepare(content_id, content_type)
        file_data = self.__parse()
        try:
            content_data = self.__update()
        except Exception as e:
            log.LogError(
                f"Error updating stash for {content_type} {content_id}: {repr(e)}")
            content_data = None
        return [file_data, content_data]

    def __process_reload(self):
        # Check if the required config was done
        if not config.reload_tag:
            log.LogInfo(
                "Reload disabled: 'reload_tag' is empty in plugin's config.py")
            return
            
        # Find all content in stash with the reload marker tag
        all_content = []
        
        scenes = self._stash.gql_findScenes(self._reload_tag_id)
        for scene in scenes.get("scenes", []):
            all_content.append(("scene", scene))
            
        images = self._stash.gql_findImages(self._reload_tag_id)
        for image in images.get("images", []):
            all_content.append(("image", image))
            
        galleries = self._stash.gql_findGalleries(self._reload_tag_id)
        for gallery in galleries.get("galleries", []):
            all_content.append(("gallery", gallery))
        
        log.LogDebug(
            f"Found {len(all_content)} content items with the reload_tag in stash")
        content_count = len(all_content)
        if not content_count:
            log.LogInfo("No content found with the 'reload_tag' tag")
            return
            
        reload_count = 0
        progress = 0
        progress_step = 1 / content_count
        reload_tag = config.reload_tag.lower()

        # Reloads only content marked with configured tags
        for content_type, content_item in all_content:
            for tag in content_item.get("tags"):
                if tag.get("name").lower() == reload_tag:
                    log.LogDebug(
                        f"{content_type.capitalize()} {content_item['id']} is tagged to be reloaded.")
                    self.__process_content(content_item["id"], content_type)
                    reload_count += 1
                    break
            progress += progress_step
            log.LogProgress(progress)

        # Inform if nothing was done
        if reload_count == 0:
            log.LogInfo(
                f"Scanned {content_count} content items. None had the '{config.reload_tag}' tag.")

    def process(self):
        if self._stash.get_mode() == "normal":
            return self.__process_content(
                self._stash.get_content_id(), 
                self._stash.get_content_type()
            )
        elif self._stash.get_mode() == "reload":
            return self.__process_reload()
        else:
            raise Exception(
                f"nfoContentParser error: unsupported mode {self._stash.get_mode()}")


if __name__ == '__main__':
    # Init
    if len(sys.argv) > 1:
        # Loads from argv for testing...
        fragment = json.loads(sys.argv[1])
    else:
        fragment = json.loads(sys.stdin.read())

    # Start processing: parse file data and update content
    # (+ create missing performer, tag, movie,...)
    stash_interface = StashInterface(fragment)
    nfoContentParser = NfoContentParser(stash_interface)
    nfoContentParser.process()
    stash_interface.exit_plugin("Successful!")
