import os


class AbstractParser:

    empty_default = { "actors": [], "tags": [] }
    
    # Max number if images to process (2 for front/back cover in movies).
    _image_Max = 2

    def __init__(self):
        self._defaults = [self.empty_default]

    def _find_in_parents(self, start_path, searched_file):
        parent_dir = os.path.dirname(start_path)
        file = os.path.join(start_path, searched_file)
        if os.path.exists(file):
            return file
        elif start_path != parent_dir:
            # Not found => recurse via parent
            return self._find_in_parents(parent_dir, searched_file)

    def _get_default(self, key, source=None):
        for default in self._defaults:
            # Source filter: skip default if it is not of the specified source
            if source and default.get("source") != source:
                continue
            if default.get(key) is not None:
                return default.get(key)

    def parse(self):
        pass
