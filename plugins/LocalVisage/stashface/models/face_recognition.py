import os
import numpy as np
from typing import Dict, List, Tuple

from deepface import DeepFace

class EnsembleFaceRecognition:
    def __init__(self, model_weights: Dict[str, float] = None):
        """
        Initialize ensemble face recognition system.

        Parameters:
        model_weights: Dictionary mapping model names to their weights.
                       If None, all models are weighted equally.
        """
        self.model_weights = model_weights or {}
        self.boost_factor = 1.8

    def normalize_distances(self, distances: np.ndarray) -> np.ndarray:
        """Normalize distances to [0,1] range within each model's predictions."""
        min_dist = np.min(distances)
        max_dist = np.max(distances)
        if max_dist == min_dist:
            return np.zeros_like(distances)
        return (distances - min_dist) / (max_dist - min_dist)

    def compute_model_confidence(self, distances: np.ndarray, temperature: float = 0.1) -> np.ndarray:
        """Convert distances to confidence scores for a single model."""
        normalized_distances = self.normalize_distances(distances)
        exp_distances = np.exp(-normalized_distances / temperature)
        return exp_distances / np.sum(exp_distances)

    def get_face_embeddings(self, image_path: str) -> Dict[str, np.ndarray]:
        """Get face embeddings for each model from an image path."""
        return {
            'facenet': DeepFace.represent(img_path=image_path, detector_backend='skip', model_name='Facenet512', normalization='Facenet2018', align=True)[0]['embedding'],
            'arc': DeepFace.represent(img_path=image_path, detector_backend='skip', model_name='ArcFace', align=True)[0]['embedding']
        }

    def ensemble_prediction(
        self,
        model_predictions: Dict[str, Tuple[List[str], List[float]]],
        temperature: float = 0.1,
        min_agreement: float = 0.5
    ) -> List[Tuple[str, float]]:
        """
        Combine predictions from multiple models.

        Parameters:
        model_predictions: Dictionary mapping model names to their (names, distances) predictions.
        temperature: Temperature parameter for softmax scaling.
        min_agreement: Minimum agreement threshold between models.

        Returns:
        final_predictions: List of (name, confidence) tuples.
        """
        vote_dict = {}
        confidence_dict = {}

        for model_name, (names, distances) in model_predictions.items():
            model_weight = self.model_weights.get(model_name, 1.0)
            confidences = self.compute_model_confidence(np.array(distances), temperature)
            top_name = names[0]
            top_confidence = confidences[0]
            vote_dict[top_name] = vote_dict.get(top_name, 0) + model_weight
            confidence_dict[top_name] = confidence_dict.get(top_name, [])
            confidence_dict[top_name].append(top_confidence)

        total_weight = sum(self.model_weights.values()) if self.model_weights else len(model_predictions)
        final_results = []
        for name, votes in vote_dict.items():
            normalized_votes = votes / total_weight
            if normalized_votes >= min_agreement:
                avg_confidence = np.mean(confidence_dict[name])
                final_score = normalized_votes * avg_confidence * self.boost_factor
                final_score = min(final_score, 1.0)
                final_results.append((name, final_score))

        final_results.sort(key=lambda x: x[1], reverse=True)
        return final_results

def extract_faces(image_path):
    """Extract faces from an image using DeepFace (YoloV8 backend)."""
    return DeepFace.extract_faces(img_path=image_path, detector_backend="yolov8")

def extract_faces_mediapipe(image_path, enforce_detection=False, align=False):
    """Extract faces from an image using MediaPipe backend."""
    return DeepFace.extract_faces(img_path=image_path, detector_backend="mediapipe",
                                 enforce_detection=enforce_detection,
                                 align=align)