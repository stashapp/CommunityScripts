import os
import sys
import json
from urllib.parse import urlparse
import numpy as np
from typing import Dict, Any, Optional, List

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../py_dependencies/numpy_1.26.4")))

server_connection = json.loads(os.environ.get("SERVER_CONNECTION"))
from stashapi.stashapp import StashInterface

class DataManager:
    def __init__(self, voy_root_folder):
        """
        Initialize the data manager using folders of .voy files for each model.
        Parameters:
        voy_root_folder: Path to the root folder containing 'facenet' and 'arc' subfolders.
        """
        self.voy_root_folder = voy_root_folder
        self.embeddings = {
            "facenet": {},  # Dict[str, Dict[str, Any]]
            "arc": {}
        }
        self._load_voy_files()
        self.stash = StashInterface(server_connection)

    def _load_voy_files(self):
        """Load all .voy files for each model into memory."""
        for model in ["facenet", "arc"]:
            folder = os.path.join(self.voy_root_folder, model)
            self.embeddings[model] = {}
            if not os.path.isdir(folder):
                continue
            for fname in os.listdir(folder):
                if fname.endswith(".voy.npy") or fname.endswith(".voy"):
                    try:
                        # Remove .voy or .voy.npy
                        if fname.endswith(".voy.npy"):
                            id_name = fname[:-8]
                        else:
                            id_name = fname[:-4]
                        stash_id, name = id_name.split("-", 1)
                        path = os.path.join(folder, fname)
                        embedding = np.load(path)
                        self.embeddings[model][stash_id] = {
                            "name": name,
                            "embedding": embedding
                        }
                    except Exception as e:
                        print(f"Error loading {fname} for {model}: {e}")

    def get_all_ids(self, model: str = "facenet") -> List[str]:
        """Return all performer IDs for a given model."""
        return list(self.embeddings.get(model, {}).keys())

    def get_performer_info(self, stash_id: str, confidence: float) -> Optional[Dict[str, Any]]:
        """
        Get performer information from the loaded embeddings.
        Parameters:
        stash_id: Stash ID of the performer
        confidence: Confidence score (0-1)
        Returns:
        Dictionary with performer information or None if not found
        """
        performer = self.stash.find_performer(stash_id)
        if not performer:
            # Fallback to embedding name if performer not found
            for model in self.embeddings:
                if stash_id in self.embeddings[model]:
                    name = self.embeddings[model][stash_id].get("name", "Unknown")
                    break
            else:
                name = "Unknown"
            return {
                'id': stash_id,
                "name": name,
                "image": None,
                "confidence": int(confidence * 100),
            }
        return {
            'id': stash_id,
            "name": performer['name'],
            "image": urlparse(performer['image_path']).path if performer.get('image_path') else None,
            "confidence": int(confidence * 100),
            'country': performer.get('country'),
            'distance': int(confidence * 100),
            'performer_url': f"/performers/{stash_id}"
        }

    def query_index(self, model: str, embedding: np.ndarray, limit: int = 5):
        """
        Query the loaded embeddings for the closest matches using cosine similarity for a given model.
        Parameters:
        model: 'facenet' or 'arc'
        embedding: The embedding to compare
        limit: Number of top matches to return
        Returns:
        List of (stash_id, distance) tuples, sorted by distance ascending
        """
        results = []
        for stash_id, data in self.embeddings.get(model, {}).items():
            db_embedding = data["embedding"]
            sim = np.dot(embedding, db_embedding) / (np.linalg.norm(embedding) * np.linalg.norm(db_embedding))
            distance = 1 - sim
            results.append((stash_id, distance))
        results.sort(key=lambda x: x[1])
        return results[:limit]

    def query_facenet_index(self, embedding: np.ndarray, limit: int = 5):
        """Query the Facenet index."""
        return self.query_index("facenet", embedding, limit)

    def query_arc_index(self, embedding: np.ndarray, limit: int = 5):
        """Query the ArcFace index."""
        return self.query_index("arc", embedding, limit)