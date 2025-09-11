import log
import shutil
from deps import get_base_folder


def flush_dependencies() -> None:
    """Delete all dependencies in the base folder"""
    # get working directory
    plugin_folder = get_base_folder()
    log.info(f"Flushing dependencies from {plugin_folder}")
    shutil.rmtree(plugin_folder)


if __name__ == "__main__":
    flush_dependencies()
