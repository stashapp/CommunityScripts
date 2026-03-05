import os
import xml.etree.ElementTree as xml
import base64
import glob
import re
import requests
import config
import log
from abstractParser import AbstractParser

class NfoParser(AbstractParser):

    def __init__(self, scene_path, defaults=None, folder_mode=False):
        super().__init__()
        if defaults:
            self._defaults = defaults
        # Finds nfo file
        self._nfo_file = None
        dir_path = os.path.dirname(scene_path)
        if config.nfo_location.lower() == "with files":
            if folder_mode:
                # look in current dir & parents for a folder.nfo file...
                self._nfo_file = self._find_in_parents(dir_path, "folder.nfo")
            else:
                if len(getattr(config, "custom_nfo_name", "")) > 0:
                    self._nfo_file = os.path.join(dir_path, config.custom_nfo_name)
                else:
                    self._nfo_file = os.path.splitext(scene_path)[0] + ".nfo"
        # else:
            # TODO: support dedicated dir instead of "with files" (compatibility with nfo exporters)
        self._nfo_root = None

    def __match_image_files(self, files, pattern):
        thumb_images = []
        index = 0
        for file in files:
            if index >= self._image_Max:
                break
            if pattern.match(file):
                with open(file, "rb") as img:
                    img_bytes = img.read()
                thumb_images.append(img_bytes)
                index += 1
        return thumb_images

    def __extract_nfo_uniqueid(self):
        return self._nfo_root.findtext("uniqueid")

    def __read_cover_image_file(self):
        path_no_ext = os.path.splitext(self._nfo_file)[0]
        file_no_ext = os.path.split(path_no_ext)[1]
        # First look for images for a given scene name...
        files = sorted(glob.glob(f"{glob.escape(path_no_ext)}*.*"))
        file_pattern = re.compile("^.*" + re.escape(file_no_ext) + \
            "(-landscape\\d{0,2}|-thumb\\d{0,2}|-poster\\d{0,2}|-cover\\d{0,2}|\\d{0,2})\\.(jpe?g|png|webp)$", re.I)
        result = self.__match_image_files(files, file_pattern)
        if result:
            return result
        # Not found? Look tor folder image...
        path_dir = os.path.dirname(self._nfo_file)
        folder_files = sorted(glob.glob(f"{glob.escape(path_dir)}{os.path.sep}*.*"))
        folder_pattern = re.compile("^.*(landscape\\d{0,2}|thumb\\d{0,2}|poster\\d{0,2}|folder\\d{0,2}|cover\\d{0,2})\\.(jpe?g|png|webp)$", re.I)
        result = self.__match_image_files(folder_files, folder_pattern)
        return result

    def ___find_thumb_urls(self, query):
        result = []
        matches = self._nfo_root.findall(query)
        for match in matches:
            result.append(match.text)
        return result

    def __download_cover_images(self):
        # Prefer "landscape" images, then "poster", otherwise take any thumbnail image...
        thumb_urls = self.___find_thumb_urls("thumb[@aspect='landscape']") \
            or self.___find_thumb_urls("thumb[@aspect='poster']") \
            or self.___find_thumb_urls("thumb")
        # Ensure there are images and the count does not exceed the max allowed...
        if len(thumb_urls) == 0:
            return []
        del thumb_urls[self._image_Max:]
        # Download images from url
        thumb_images = []
        for thumb_url in thumb_urls:
            img_bytes = None
            try:
                r = requests.get(thumb_url, timeout=10)
                img_bytes = r.content
                thumb_images.append(img_bytes)
            except Exception as e:
                log.LogDebug(
                    f"Failed to download the cover image from {thumb_url}: {repr(e)}")
        return thumb_images

    def __extract_cover_images_b64(self):
        if "cover_image" in config.blacklist:
            return []
        file_images = []
        # Get image from disk (file), otherwise from <thumb> tag (url)
        thumb_images = self.__read_cover_image_file() or self.__download_cover_images()
        for thumb_image in thumb_images:
            thumb_b64img = base64.b64encode(thumb_image)
            if thumb_b64img:
                file_images.append(
                    f"data:image/jpeg;base64,{thumb_b64img.decode('utf-8')}")
        return file_images

    def __extract_nfo_rating(self):
        multiplier = getattr(config, "user_rating_multiplier", 1)
        user_rating = round(float(self._nfo_root.findtext(getattr(config, "user_rating_field", "userrating")) or 0) * multiplier)
        if user_rating > 0:
            return user_rating
        # <rating> is converted to a scale of 5 if needed
        rating = None
        rating_elem = self._nfo_root.find("ratings/rating")
        if rating_elem is not None:
            max_value = float(rating_elem.attrib["max"] or 1)
            value = float(rating_elem.findtext("value") or 0)
            # ratings on scale 100 (since stashapp v24)
            rating = round(value / max_value * 100)
        return rating

    def __extract_nfo_date(self):
        # date either in <premiered> (full) or <year> (only the year)
        year = self._nfo_root.findtext("year")
        if year is not None:
            year = f"{year}-01-01"
        return self._nfo_root.findtext("premiered") or year

    def __extract_nfo_tags(self):
        source = getattr(config, "load_tags_from", "both").lower()
        file_tags = []
        if source in ["tags", "both"]:
            # from nfo <tag>
            tags = self._nfo_root.findall("tag")
            for tag in tags:
                if tag.text:
                    file_tags.append(tag.text)
        if source in ["genres", "both"]:
            # from nfo <genre>
            genres = self._nfo_root.findall("genre")
            for genre in genres:
                if genre.text:
                    file_tags.append(genre.text)
        return list(set(file_tags))

    def __extract_nfo_actors(self):
        file_actors = []
        actors = self._nfo_root.findall("actor/name")
        for actor in actors:
            if actor.text:
                file_actors.append(actor.text)
        return file_actors

    def parse(self):
        if not self._nfo_file or not os.path.exists(self._nfo_file):
            if self._nfo_file:
                log.LogDebug(f"The NFO file \"{os.path.split(self._nfo_file)[1]}\" was not found")
            return {}
        log.LogDebug("Parsing '{}'".format(self._nfo_file))
        # Parse NFO xml content
        try:
            with open(self._nfo_file, mode="r", encoding="utf-8") as nfo:
                # Tolerance: strip non-standard whitespaces/new lines
                clean_nfo_content = nfo.read().strip()
            # Tolerance: replace illegal "&nbsp;"
            clean_nfo_content = clean_nfo_content.replace("&nbsp;", " ")
            self._nfo_root = xml.fromstring(clean_nfo_content)
        except Exception as e:
            log.LogError(
                f"Could not parse nfo '{self._nfo_file}': {repr(e)}")
            return {}
        # Extract data from XML tree. Spec: https://kodi.wiki/view/NFO_files/Movies
        b64_images = self.__extract_cover_images_b64()
        file_data = {
            # TODO: supports stash uniqueid to match to existing scenes (compatibility with nfo exporter)
            "file": self._nfo_file,
            "source": "nfo",
            "title": self._nfo_root.findtext("originaltitle") or self._nfo_root.findtext("title") \
            or self._nfo_root.findtext("sorttitle") or self._get_default("title", "re"),
            "director": self._nfo_root.findtext("director") or self._get_default("director"),
            "details": self._nfo_root.findtext("plot") or self._nfo_root.findtext("outline") \
            or self._nfo_root.findtext("tagline") or self._get_default("details"),
            "studio": self._nfo_root.findtext("studio") or self._get_default("studio"),
            "uniqueid": self.__extract_nfo_uniqueid(),
            "date": self.__extract_nfo_date() or self._get_default("date"),
            "actors": self.__extract_nfo_actors() or self._get_default("actors"),
            # Tags are merged with defaults
            "tags": list(set(self.__extract_nfo_tags() + self._get_default("tags"))),
            "rating": self.__extract_nfo_rating() or self._get_default("rating"),
            "cover_image": None if len(b64_images) < 1 else b64_images[0],
            "other_image": None if len(b64_images) < 2 else b64_images[1],
            # Below are NFO extensions or liberal tag interpretations (not part of the nfo spec)
            "movie": self._nfo_root.findtext("set/name") or self._get_default("title", "nfo"),
            "scene_index": self._nfo_root.findtext("set/index") or None,
            "urls": [url.text for url in self._nfo_root.findall("url") if url.text],

        }
        return file_data
