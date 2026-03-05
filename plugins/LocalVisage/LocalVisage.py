import os
import sys
import zipfile
import tempfile
from PythonDepManager import ensure_import
# --- VENV AUTO-CREATION WITH REQUIREMENTS AND AUTO-RESTART ---
venv_dir = os.path.join(os.path.dirname(__file__), "venv")
requirements_path = os.path.join(os.path.dirname(__file__), "requirements.txt")
# --- PYTHON VERSION CHECK ---

if not os.path.isdir(venv_dir) and not (sys.version_info.major == 3 and sys.version_info.minor == 10):
    ensure_import("stashapi:stashapp-tools>=0.2.58")
    import stashapi.log as log
    log.error("Error: Python version must be >= 3.10.X (recommanded 3.10.11) for the first installation of the plugin. Once installed you can change back your python version in stash as this plugin will run within its own venv")
    log.error(f"Current version: {sys.version}")
    log.error("Go to https://www.python.org/downloads/release/python-31011/")
    sys.exit(1)
# --- END PYTHON VERSION CHECK ---


def in_venv():
    # Checks if running inside the venv we expect
    return (
        hasattr(sys, 'real_prefix') or
        (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
    ) and os.path.abspath(sys.prefix) == os.path.abspath(venv_dir)
def install_dependencies():
	"""
	Install dependencies from requirements.txt if not already installed.
	"""
	if not os.path.isfile(requirements_path):
		print("No requirements.txt found, skipping dependency installation.")
		return

	import subprocess
	pip_exe = os.path.join(venv_dir, "Scripts", "pip.exe") if os.name == "nt" else os.path.join(venv_dir, "bin", "pip")
	py_exe = os.path.join(venv_dir, "Scripts", "python.exe") if os.name == "nt" else os.path.join(venv_dir, "bin", "python")
	subprocess.check_call([py_exe,"-m","pip", "install", "--upgrade", "pip"])
	subprocess.check_call([pip_exe, "install", "-r", requirements_path])

if not os.path.isdir(venv_dir):
    
    ensure_import("stashapi:stashapp-tools>=0.2.58")
    import stashapi.log as log
    import subprocess
    log.info("No venv found. Creating virtual environment...")
    
    subprocess.check_call([sys.executable, "-m", "venv", venv_dir])
    log.progress(0.25)
    log.info("Virtual environment created at "+ venv_dir)
    if os.path.isfile(requirements_path):
        log.info("Installing dependencies... This might take a while")
        install_dependencies()
    else:
        log.info("No requirements.txt found, skipping dependency installation.")

# If not running in the venv, restart the script using the venv's Python
if not in_venv():
    py_exe = os.path.join(venv_dir, "Scripts", "python.exe") if os.name == "nt" else os.path.join(venv_dir, "bin", "python")
    print(f"Restarting script in venv: {py_exe}")
    os.execv(py_exe, [py_exe] + sys.argv)
# --- END VENV AUTO-CREATION WITH REQUIREMENTS AND AUTO-RESTART ---

import json
import subprocess
import platform

# Set environment variables
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"  # Suppress TF logs
# Ensure dependencies

try:
	from deepface import DeepFace
	import numpy as np
	import psutil
	import stashapi.log as log
	from stashapi.stashapp import StashInterface
except:
    install_dependencies()

from deepface import DeepFace
import numpy as np
import psutil
import stashapi.log as log
from stashapi.stashapp import StashInterface

VOY_DB_PATH = os.path.join(os.path.dirname(__file__), "voy_db")
os.makedirs(os.path.join(VOY_DB_PATH, "facenet"), exist_ok=True)
os.makedirs(os.path.join(VOY_DB_PATH, "arc"), exist_ok=True)


def main():
    """
    Main entry point for the plugin.
    """
    global stash

    json_input = json.loads(sys.stdin.read())
    stash = StashInterface(json_input["server_connection"])
    mode_arg = json_input["args"].get("mode")
    config = stash.get_configuration()["plugins"]
    settings = {"voyCount": 15, "sceneCount": 0, "imgCount": 0}
    if "LocalVisage" in config:
        settings.update(config["LocalVisage"])

    if mode_arg == "spawn_server":
        spawn_server(json_input["server_connection"])
    elif mode_arg == "stop_server":
        kill_stashface_server()
    elif mode_arg == "rebuild_model":
        rebuild_model(update_only=False, settings=settings)
    elif mode_arg == "update_model":
        rebuild_model(update_only=True, settings=settings)

def can_read_image(image_path):
    """
    Check if an image path can be read, handling both regular files and files inside ZIP archives.
    
    Args:
        image_path (str): Path to the image file
        
    Returns:
        tuple: (can_read, actual_path) where can_read is bool and actual_path is the path to use
    """
    if os.path.exists(image_path):
        return True, image_path
    
    # Check if it's inside a ZIP file
    if ".zip" in image_path.lower():
        try:
            parts = image_path.split(".zip")
            if len(parts) >= 2:
                zip_path = parts[0] + ".zip"
                internal_path = parts[1].lstrip(os.sep + "/")  # Remove leading separators
                
                if os.path.exists(zip_path):
                    with zipfile.ZipFile(zip_path, 'r') as zip_file:
                        # Check if the internal path exists in the ZIP
                        if internal_path in zip_file.namelist():
                            # Extract to temporary file and return temp path
                            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(internal_path)[1]) as tmp_file:
                                tmp_file.write(zip_file.read(internal_path))
                                return True, tmp_file.name
        except Exception as e:
            log.warning(f"Error reading from ZIP file {image_path}: {e}")
    
    return False, image_path

def cleanup_temp_file(file_path):
    """
    Clean up temporary files created for ZIP extraction.
    
    Args:
        file_path (str): Path to the temporary file
    """
    try:
        if file_path.startswith(tempfile.gettempdir()):
            os.unlink(file_path)
    except Exception as e:
        log.warning(f"Error cleaning up temporary file {file_path}: {e}")


def find_performers(settings):
    """
    Find performers with images for model building.
    """
    query={}
    # query performers based on sceneCount and imgCount settings
    scene_count_min = settings.get("sceneCount", 0)
    img_count_min = settings.get("imgCount", 0)
    if scene_count_min>0 or img_count_min>0:
        query={
            "scene_count": {"modifier": "GREATER_THAN", "value": scene_count_min-1},
            "image_count": {"modifier": "GREATER_THAN", "value": img_count_min-1},
        }
    performers_all = stash.find_performers(f=query, fragment="id name image_path custom_fields")
    performers_without_image = stash.find_performers(f={"is_missing": "image"}, fragment="id")
    performers_without_image_ids = {p["id"] for p in performers_without_image}
    performers_to_process = [p for p in performers_all if p["id"] not in performers_without_image_ids]
    
    
    
    performers_to_process = [
        p for p in performers_to_process 
        if (p.get("scene_count", 0) >= scene_count_min and 
            p.get("image_count", 0) >= img_count_min)
    ] 
    return enrich_performers(performers_to_process, settings)

def enrich_performers(performers, settings):
    """
    Add extra images to each performer for embedding calculation.
    """
    for progress, performer in enumerate(performers):
        performer["images"] = []
        if performer.get("image_path"):
            performer["images"].append(performer["image_path"])
        extra_images = stash.find_images(
            filter={
                "direction": "ASC",
                "page": 1,
                "per_page": settings.get("voyCount", 15) - 1,
                "q": "",
                "sort": "random_11365347"
            },
            f={
                "performer_count": {"modifier": "EQUALS", "value": 1},
                "performers": {"modifier": "INCLUDES_ALL", "value": [performer["id"]]},
                "path": {
                    "modifier": "NOT_MATCHES_REGEX",
                    "value": r".*\.(mp4|webm|avi|mov|mkv|flv|wmv|gif)$|.*[^\x00-\x7F].*"
                }
            }
        )
        for image in extra_images:
            if image.get("visual_files") and len(image["visual_files"]) > 0:
                image_path = image["visual_files"][0]["path"]
                can_read, actual_path = can_read_image(image_path)
                if can_read:
                    performer["images"].append(actual_path)
                else:
                    log.warning(f"Image path does not exist and cannot be read: {image_path}")
            else:
                log.warning(f"No visual files found for image ID: {image['id']}")
        log.progress((progress + 1) / len(performers))
    return performers

def rebuild_model(update_only, settings):
    """
    Build or update the face embedding model for all performers.
    """
    log.info("Updating model..." if update_only else "Rebuilding model...")
    performers = find_performers(settings)
    if not performers:
        log.info("No performers found for model building.")
        return

    log.info("Database scraped, starting to rebuild model...")
    for progress, performer in enumerate(performers):
        embeddings_facenet = []
        embeddings_arc = []
        custom_fields = performer.get("custom_fields", {})
        images_used = custom_fields.get("number_of_images_used_for_voy", 0)
        if update_only and images_used >= settings["voyCount"]:
            continue
        if update_only and len(performer["images"]) <= images_used:
            continue

        for uri in performer["images"]:
            try:
                result_facenet = DeepFace.represent(
                    img_path=uri,
                    model_name="Facenet512",
                    detector_backend='yolov8',
                    normalization='Facenet2018',
                    align=True,
                    enforce_detection=False
                )
                embeddings_facenet.append(result_facenet[0]['embedding'])
                result_arc = DeepFace.represent(
                    img_path=uri,
                    model_name="ArcFace",
                    detector_backend='yolov8',
                    enforce_detection=False,
                    align=True
                )
                embeddings_arc.append(result_arc[0]['embedding'])
            except Exception as e:
                log.warning(f"[WARN] Skipping {uri}: {e}")
            finally:
                # Clean up temporary files created for ZIP extraction
                cleanup_temp_file(uri)

        if embeddings_facenet and embeddings_arc:
            avg_embedding_facenet = np.mean(embeddings_facenet, axis=0).astype(np.float32)
            facenet_path = os.path.join(VOY_DB_PATH, "facenet", f"{performer['id']}-{performer['name']}.voy")
            np.save(facenet_path, avg_embedding_facenet)
            avg_embedding_arc = np.mean(embeddings_arc, axis=0).astype(np.float32)
            arc_path = os.path.join(VOY_DB_PATH, "arc", f"{performer['id']}-{performer['name']}.voy")
            np.save(arc_path, avg_embedding_arc)
            embeddings_count = max(len(embeddings_facenet), len(embeddings_arc))
            stash.update_performer({
                "id": performer["id"],
                "custom_fields": {
                    "partial": {
                        "number_of_images_used_for_voy": embeddings_count,
                    }
                }
            })
            log.info(f"[INFO] Saved VOY for {performer['name']} with {embeddings_count} images.")
        else:
            log.warning(f"[WARN] No valid embeddings for {performer['name']}.")
        log.progress((progress + 1) / len(performers))
    log.info("Rebuilding model finished.")
    if server_running():
        kill_stashface_server()
        # Optionally, reload server with new connection info if needed

def server_running():
    """
    Check if the stashface server is running.
    """
    try:
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            name = proc.info.get('name', '').lower()
            cmdline_raw = proc.info.get('cmdline')
            if not cmdline_raw:
                continue
            cmdline = [str(arg).lower() for arg in cmdline_raw]
            if 'python' in name and any('stashface' in arg and 'app.py' in arg for arg in cmdline):
                log.debug("Stashface server is already running.")
                return True
    except psutil.NoSuchProcess:
        return False
    return False

def kill_stashface_server():
    """
    Kill any running stashface server processes.
    """
    killed = False
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            cmdline = proc.info['cmdline']
            if cmdline and any('stashface' in arg and 'app.py' in arg for arg in cmdline):
                log.debug(f"Killing process {proc.pid}: {' '.join(cmdline)}")
                proc.kill()
                killed = True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    if killed:
        log.info("Stashface server killed.")

def spawn_server(server_connection=None):
    """
    Spawn the stashface server as a subprocess.
    """
    if server_running():
        log.info("Stashface server is already running.")
        return
    plugin_dir = os.path.dirname(__file__)
    py_exe = os.path.join(venv_dir, "Scripts", "python.exe") if os.name == "nt" else os.path.join(venv_dir, "bin", "python")
    cmd = [
        py_exe,
        os.path.abspath(os.path.join(plugin_dir, "stashface", "app.py")),
    ]
    log.info("Spawning server")
    env = os.environ.copy()
    if server_connection is not None:
        env["SERVER_CONNECTION"] = json.dumps(server_connection)
    if platform.system() == "Windows":
        subprocess.Popen(
            cmd,
            creationflags=subprocess.CREATE_NEW_CONSOLE,
            close_fds=True,
            cwd=plugin_dir,
            env=env
        )
    else:
        subprocess.Popen(
            cmd,
            start_new_session=True,
            close_fds=True,
            cwd=plugin_dir,
            env=env
        )
    log.info("Server spawned successfully, you can now use the plugin.")

if __name__ == '__main__':
    main()