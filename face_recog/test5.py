# AUTOMATIC CAPTURE 

# Import necessary libraries
import os
import cv2  # OpenCV for image capture
import numpy as np
from deepface import DeepFace
import pymongo
import tempfile  # To handle temporary file storage
import time  # To add delays if necessary
import subprocess  # To run external scripts

# MongoDB Setup
mongo_uri = "mongodb://localhost:27017/"
db_name = "face_db"  # Database where embeddings are stored
collection_name = "face_embeddings"  # Collection to store embeddings
threshold = 0.70  # Cosine similarity threshold for face similarity matching

# Establish MongoDB connection
client = pymongo.MongoClient(mongo_uri)
db = client[db_name]
embeddings_collection = db[collection_name]

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

def is_duplicate_face(new_embedding, threshold=0.70):
    """
    Check if the new face embedding matches any existing face embedding in MongoDB.
    
    Parameters:
    - new_embedding (np.array): The embedding of the new face.
    - threshold (float): Cosine similarity threshold to consider a match.
    
    Returns:
    - bool: True if a duplicate face is found, False otherwise.
    """
    for record in embeddings_collection.find({}, {"embedding": 1}):
        stored_embedding = np.array(record["embedding"])
        similarity = calculate_cosine_similarity(new_embedding, stored_embedding)
        if similarity >= threshold:
            print(f"Duplicate face detected in MongoDB (Similarity: {similarity:.3f}).")
            return True
    return False

def capture_image(auto_capture_delay=15, save_to_db_images=True, allow_recognition_on_duplicate=False):
    """
    Capture an image automatically using the computer's default camera and save it temporarily.
    Optionally, save the image to the db_images folder for database processing.
    Returns the path to the captured image.
    
    Parameters:
    - auto_capture_delay (int): Time in seconds to wait before capturing the image.
    - save_to_db_images (bool): Whether to save the image to the db_images folder.
    - allow_recognition_on_duplicate (bool): Whether to allow recognition if a duplicate face is detected.
    """
    try:
        # Initialize the webcam (0 is usually the default camera)
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            raise Exception("Could not open video device")

        print("Camera opened successfully. Preparing to capture image...")

        # Allow the camera to warm up
        time.sleep(auto_capture_delay)

        # Capture a single frame
        ret, frame = cap.read()
        if not ret or frame is None:
            print("Failed to capture image from camera.")
            cap.release()
            cv2.destroyAllWindows()
            return None

        # Save the captured frame temporarily to generate its embedding
        temp_dir = tempfile.gettempdir()
        temp_image_path = os.path.join(temp_dir, "temp_captured_image.png")
        if not cv2.imwrite(temp_image_path, frame):
            print(f"Failed to save temporary image to {temp_image_path}.")
            cap.release()
            return None

        print(f"Temporary image saved to {temp_image_path}.")

        # Determine the save path
        if save_to_db_images:
            db_images_folder = r"E:\MAJOR TEST\face recog\db_images"
            os.makedirs(db_images_folder, exist_ok=True)  # Ensure the folder exists
            
            # Generate a unique filename (incremental)
            existing_files = os.listdir(db_images_folder)
            count = 1
            while f"capture_image{count}.png" in existing_files:
                count += 1
            image_path = os.path.join(db_images_folder, f"capture_image{count}.png")

            # Save the captured image
            if not cv2.imwrite(image_path, frame):
                print(f"Failed to save image to {image_path}.")
                cap.release()
                return None

            print(f"Image captured and saved to {image_path}\n")
        else:
            image_path = temp_image_path

        # Generate embedding for the captured image
        new_embedding = get_face_embedding(image_path)  # Use the saved image path
        if new_embedding is None:
            print("No face detected in the captured image. Skipping save.")
            cap.release()
            return None

        # Check for duplicate faces in MongoDB
        if is_duplicate_face(new_embedding, threshold=0.70):
            print("Duplicate face detected. Image will not be saved.")
            cap.release()

            if allow_recognition_on_duplicate:
                print("Reopening camera for recognition...")
                return image_path  # Return the saved image path for recognition
            else:
                return None

        # Trigger db2.py to process the new image
        if save_to_db_images:
            try:
                print("Triggering db2.py to process the new image...")
                subprocess.run(["python", r"E:\MAJOR TEST\face recog\db2.py"], check=True)
                print("db2.py executed successfully.\n")
            except subprocess.CalledProcessError as e:
                print(f"Error while running db2.py: {e}\n")

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

def recognize_face_from_camera(auto_capture_delay=2):
    """
    Reopen the camera to capture an image for recognition and match it with stored embeddings.
    
    Parameters:
    - auto_capture_delay (int): Time in seconds to wait before capturing the image.
    """
    print("Reopening camera for recognition...")
    captured_image_path = capture_image(auto_capture_delay=auto_capture_delay, save_to_db_images=False)

    if captured_image_path is not None:
        print("Captured image prepared for recognition.\n")

        # Generate embedding for the captured image
        recognition_embedding = get_face_embedding(captured_image_path)

        if recognition_embedding is not None:
            # Compare with stored embeddings in MongoDB
            match_doc, similarity = recognize_face_in_database(recognition_embedding, threshold)
            if match_doc is not None:
                print(f"Face matches with filename: '{match_doc['filename']}'")
                print(f"Similarity Score (Cosine Similarity): {similarity:.3f}")
            else:
                print("No matching face found in the database.")

            # Optionally, delete the temporary recognition image
            try:
                os.remove(captured_image_path)
                print(f"\nTemporary image '{captured_image_path}' has been deleted.")
            except Exception as e:
                print(f"Could not delete temporary image: {e}")
        else:
            print("No face found in the recognition image.")
    else:
        print("Image capture failed. Please ensure the camera is connected and try again.")

if __name__ == "__main__":
    # Step 1: Capture image and save to db_images folder
    captured_image_path = capture_image(auto_capture_delay=2, save_to_db_images=True, allow_recognition_on_duplicate=True)

    if captured_image_path is not None:
        print("Captured image saved successfully or prepared for recognition.\n")

        # Generate embedding for the captured image
        recognition_embedding = get_face_embedding(captured_image_path)

        if recognition_embedding is not None:
            # Compare with stored embeddings in MongoDB
            match_doc, similarity = recognize_face_in_database(recognition_embedding, threshold)
            if match_doc is not None:
                print(f"Face matches with filename: '{match_doc['filename']}'")
                print(f"Similarity Score (Cosine Similarity): {similarity:.3f}")
            else:
                print("No matching face found in the database.")

            # Optionally, delete the temporary recognition image
            try:
                os.remove(captured_image_path)
                print(f"\nTemporary image '{captured_image_path}' has been deleted.")
            except Exception as e:
                print(f"Could not delete temporary image: {e}")
        else:
            print("No face found in the recognition image.")
    else:
        print("Image capture failed. Please ensure the camera is connected and try again.")

    # Step 2: Reopen camera for recognition
    recognize_face_from_camera(auto_capture_delay=2)