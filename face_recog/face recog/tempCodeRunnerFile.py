import os
import numpy as np
from deepface import DeepFace
import pymongo

# MongoDB Setup
mongo_uri = "mongodb://localhost:27017/"
db_name = "face_db"  # Database where embeddings are stored
collection_name = "face_embeddings"  # Collection to store embeddings
threshold = 0.6  # Adjusted threshold for face similarity matching

client = pymongo.MongoClient(mongo_uri)
db = client[db_name]
embeddings_collection = db[collection_name]

def get_face_embedding(image_path):
    """
    Extract face embedding using DeepFace's built-in detection with enhanced debugging.
    """
    try:
        print(f"Processing image: {image_path}")
        
        # Check if the file exists
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image path {image_path} does not exist.")
        
        # Generate embedding
        embedding = DeepFace.represent(
            img_path=image_path,
            model_name="Facenet",
            detector_backend="mtcnn",
            enforce_detection=True
        )
        print("Embedding generated successfully.")
        return np.array(embedding[0]['embedding'])
    except Exception as e:
        print(f"Error during embedding generation: {e}")
        return None

def recognize_face_in_database(check_embedding, threshold=0.6):
    """
    Compare the input face embedding with stored embeddings in MongoDB.
    Returns the best match within the threshold.
    """
    best_distance = float("inf")
    best_match = None

    # Retrieve all stored embeddings
    for record in embeddings_collection.find({}, {"filename": 1, "embedding": 1}):
        stored_embedding = np.array(record["embedding"])
        distance = np.linalg.norm(check_embedding - stored_embedding)

        # Update the best match if this distance is lower
        if distance < best_distance:
            best_distance = distance
            best_match = record

    # Check if the best match is within the threshold
    if best_distance < threshold:
        return best_match, best_distance
    else:
        return None, None

# Path to the image you want to check
image_path_to_check = "faces_images\sam.png"  # Replace with the actual path to the image

# Generate embedding for the input image
check_embedding = get_face_embedding(image_path_to_check)

if check_embedding is not None:
    print("Embedding for the given image:")
    print(check_embedding)  # Print the embedding vector

    # Compare with stored embeddings
    match_doc, distance = recognize_face_in_database(check_embedding, threshold)
    if match_doc is not None:
        print(f"Face matches with filename: {match_doc['filename']} (Similarity Distance: {np.round(distance, 3)})")
    else:
        print("No matching face found in the database.")
else:
    print("No face found in the input image.")