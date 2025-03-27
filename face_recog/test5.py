# AUTOMATIC CAPTURE 

# Import necessary libraries
import os
import cv2  # OpenCV for image capture
import numpy as np
from deepface import DeepFace
import pymongo
import tempfile  # To handle temporary file storage
import time  # To add delays if necessary

# MongoDB Setup
mongo_uri = "mongodb+srv://ritwiksuneliya:Ritwik123@cluster0.4o02p.mongodb.net/attendance-system?retryWrites=true&w=majority"
db_name = "attendance-system"  # Database where embeddings are stored
collection_name = "face_embeddings"  # Collection to store embeddings
threshold = 0.70  # Cosine similarity threshold for face similarity matching

# Establish MongoDB connection
client = pymongo.MongoClient(mongo_uri)
db = client[db_name]
embeddings_collection = db[collection_name]

def capture_image(auto_capture_delay=15, save_path="C:\\Users\\RITHWIK\\Desktop\\Major_Project\\face_recog\\db_images"):
    """
    Capture an image using the computer's default camera and save it to the specified directory.
    Returns the path to the captured image.

    Parameters:
    - auto_capture_delay (int): Time in seconds to wait before capturing the image.
    - save_path (str): Path where the image will be saved.
    """
    try:
        # Initialize the webcam
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            raise Exception("Could not open video device")

        print("Camera opened successfully. Preparing to capture image...")

        # Allow the camera to warm up
        time.sleep(auto_capture_delay)

        # Capture a single frame
        ret, frame = cap.read()
        if not ret:
            print("Failed to capture image from camera.")
            cap.release()
            return None

        # Ensure the save directory exists
        os.makedirs(save_path, exist_ok=True)

        # Generate a unique filename using timestamp
        filename = f"captured_image_{int(time.time())}.png"
        image_path = os.path.join(save_path, filename)

        # Save the image
        cv2.imwrite(image_path, frame)
        print(f"Image captured and saved to {image_path}\n")

        # Release the camera
        cap.release()

        return image_path
    except Exception as e:
        print(f"Error during image capture: {e}\n")
        return None
    
    
def get_face_embedding(image_path):
    """
    Extract face embedding using DeepFace's built-in detection with enhanced debugging.
    """
    try:
        print(f"Processing image: {image_path}")
        
        # Check if the file exists
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image path '{image_path}' does not exist.")
        
        # Generate embedding
        embedding = DeepFace.represent(
            img_path=image_path,
            model_name="Facenet",
            detector_backend="mtcnn",
            enforce_detection=True
        )
        print("Embedding generated successfully.\n")
        return np.array(embedding[0]['embedding'])
    except Exception as e:
        print(f"Error during embedding generation: {e}\n")
        return None

def calculate_cosine_similarity(vec1, vec2):
    """
    Calculate the cosine similarity between two vectors.
    """
    dot_product = np.dot(vec1, vec2)
    norm_vec1 = np.linalg.norm(vec1)
    norm_vec2 = np.linalg.norm(vec2)
    if norm_vec1 == 0 or norm_vec2 == 0:
        return 0.0
    return dot_product / (norm_vec1 * norm_vec2)

def recognize_face_in_database(check_embedding, threshold=0.70):
    """
    Compare the input face embedding with stored embeddings in MongoDB.
    Returns the best match within the threshold along with similarity metrics.
    """
    best_similarity = -1  # Initialize with the lowest possible similarity
    best_match = None

    print("Comparing with stored embeddings...\n")

    # Retrieve all stored embeddings
    for record in embeddings_collection.find({}, {"filename": 1, "embedding": 1}):
        stored_embedding = np.array(record["embedding"])
        similarity = calculate_cosine_similarity(check_embedding, stored_embedding)
        
        #print(f"Comparing with '{record['filename']}':")
        #print(f"Stored Embedding: {stored_embedding}")
        #print(f"Cosine Similarity: {similarity:.4f}\n")

        # Update the best match if this similarity is higher
        if similarity > best_similarity:
            best_similarity = similarity
            best_match = record

    # Check if the best match is within the threshold
    if best_similarity >= threshold:
        #print(f"Best Match Found: '{best_match['filename']}'")
        #print(f"Best Cosine Similarity: {best_similarity:.4f}\n")
        return best_match, best_similarity
    else:
        print("No matching face found in the database within the threshold.\n")
        return None, None

# Capture image from the camera automatically
captured_image_path = capture_image(auto_capture_delay=2)  # Adjust delay as needed

if captured_image_path is not None:
    # Generate embedding for the captured image
    check_embedding = get_face_embedding(captured_image_path)
    
    if check_embedding is not None:
        #print("--- Input Image Embedding ---")
       # print(check_embedding, "\n")  # Print the embedding vector of the input image
        
        # Compare with stored embeddings
        match_doc, similarity = recognize_face_in_database(check_embedding, threshold)
        if match_doc is not None:
            print(f"Face matches with filename: '{match_doc['filename']}'")
            print(f"Similarity Score (Cosine Similarity): {similarity:.3f}")
        else:
            print("No matching face found in the database.")
        
        # Optionally, delete the temporary captured image
        try:
            os.remove(captured_image_path)
            print(f"\nTemporary image '{captured_image_path}' has been deleted.")
        except Exception as e:
            print(f"Could not delete temporary image: {e}")
    else:
        print("No face found in the captured image.")
else:
    print("Image capture failed. Please ensure the camera is connected and try again.")