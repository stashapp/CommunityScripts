import io
import base64
import numpy as np
from uuid import uuid4
from PIL import Image as PILImage
from typing import List, Dict, Any, Tuple
import logging

from models.face_recognition import EnsembleFaceRecognition, extract_faces, extract_faces_mediapipe
from models.data_manager import DataManager
from utils.vtt_parser import parse_vtt_offsets

def get_face_predictions_ensemble(face, data_manager, results=3, max_distance=0.8):
    """
    Get predictions for a single face using both Facenet and ArcFace, then ensemble.

    Parameters:
    face: Face image array
    data_manager: DataManager instance
    results: Number of results to return

    Returns:
    List of (stash_id, confidence) tuples
    """
    # Get embeddings for original and flipped images, then average
    from deepface import DeepFace
    embedding_facenet_orig = DeepFace.represent(img_path=face, detector_backend='skip', model_name='Facenet512', normalization='Facenet2018', align=True)[0]['embedding']
    embedding_facenet_flip = DeepFace.represent(img_path=np.fliplr(face), detector_backend='skip', model_name='Facenet512', normalization='Facenet2018', align=True)[0]['embedding']
    embedding_facenet = np.mean([embedding_facenet_orig, embedding_facenet_flip], axis=0)

    embedding_arc_orig = DeepFace.represent(img_path=face, detector_backend='skip', model_name='ArcFace', align=True)[0]['embedding']
    embedding_arc_flip = DeepFace.represent(img_path=np.fliplr(face), detector_backend='skip', model_name='ArcFace', align=True)[0]['embedding']
    embedding_arc = np.mean([embedding_arc_orig, embedding_arc_flip], axis=0)

    # Query DataManager for closest matches for both models
    preds_facenet = data_manager.query_facenet_index(embedding_facenet, limit=results)
    preds_arc = data_manager.query_arc_index(embedding_arc, limit=results)

    # Filter by distance threshold
    filtered_facenet = [(stash_id, dist) for stash_id, dist in preds_facenet if dist < max_distance]
    filtered_arc = [(stash_id, dist) for stash_id, dist in preds_arc if dist < max_distance]

    # Prepare for ensemble
    model_predictions = {}
    if filtered_facenet:
        names_f, dists_f = zip(*filtered_facenet)
        model_predictions['facenet'] = (list(names_f), list(dists_f))
    if filtered_arc:
        names_a, dists_a = zip(*filtered_arc)
        model_predictions['arc'] = (list(names_a), list(dists_a))

    if not model_predictions:
        return []

    ensemble = EnsembleFaceRecognition()
    return ensemble.ensemble_prediction(model_predictions)

def image_search_performer(image, data_manager, threshold=0.5, results=3):
    """
    Search for a performer in an image using both Facenet and ArcFace.

    Parameters:
    image: PIL Image object
    data_manager: DataManager instance
    threshold: Confidence threshold
    results: Number of results to return

    Returns:
    List of performer information dictionaries
    """
    image_array = np.array(image)
    try:
        faces = extract_faces(image_array)
    except ValueError:
        raise ValueError("No faces found")

    predictions = get_face_predictions_ensemble(faces[0]['face'], data_manager, results)
    logging.info(f"Predictions: {predictions}")
    response = []
    for stash_id, confidence in predictions:
        if confidence < threshold:
            continue
        performer_info = data_manager.get_performer_info(stash_id, confidence)
        if performer_info:
            response.append(performer_info)
    print(response)
    return response

def image_search_performers(image, data_manager, threshold=0.5, results=3):
    """
    Search for multiple performers in an image using both Facenet and ArcFace.

    Parameters:
    image: PIL Image object
    data_manager: DataManager instance
    threshold: Confidence threshold
    results: Number of results to return

    Returns:
    List of dictionaries with face image and performer information
    """
    image_array = np.array(image)
    try:
        faces = extract_faces(image_array)
    except ValueError:
        raise ValueError("No faces found")

    response = []
    for face in faces:
        predictions = get_face_predictions_ensemble(face['face'], data_manager, results)

        # Crop and encode face image
        area = face['facial_area']
        cimage = image.crop((area['x'], area['y'], area['x'] + area['w'], area['y'] + area['h']))
        buf = io.BytesIO()
        cimage.save(buf, format='JPEG')
        im_b64 = base64.b64encode(buf.getvalue()).decode('ascii')

        # Get performer information
        performers = []
        for stash_id, confidence in predictions:
            if confidence < threshold:
                continue
            performer_info = data_manager.get_performer_info(stash_id, confidence)
            if performer_info:
                performers.append(performer_info)

        response.append({
            'image': im_b64,
            'confidence': face['confidence'],
            'performers': performers
        })
    return response

def find_faces_in_sprite(image, vtt_data):
    """
    Find faces in a sprite image using VTT data

    Parameters:
    image: PIL Image object
    vtt_data: Base64 encoded VTT data

    Returns:
    List of dictionaries with face information
    """
    vtt = base64.b64decode(vtt_data.replace("data:text/vtt;base64,", ""))
    sprite = PILImage.fromarray(image)

    results = []
    for i, (left, top, right, bottom, time_seconds) in enumerate(parse_vtt_offsets(vtt)):
        cut_frame = sprite.crop((left, top, left + right, top + bottom))
        faces = extract_faces_mediapipe(np.asarray(cut_frame), enforce_detection=False, align=False)
        faces = [face for face in faces if face['confidence'] > 0.6]
        if faces:
            size = faces[0]['facial_area']['w'] * faces[0]['facial_area']['h']
            data = {'id': str(uuid4()), "offset": (left, top, right, bottom), "frame": i, "time": time_seconds, 'size': size}
            results.append(data)

    return results