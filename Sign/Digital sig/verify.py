# from cryptography.hazmat.primitives import hashes
# from cryptography.hazmat.primitives.asymmetric import padding
# from cryptography.hazmat.primitives import serialization
# from pymongo import MongoClient

# # MongoDB Connection
# client = MongoClient("mongodb://localhost:27017/")
# db = client["digital_signature_db"]
# students_collection = db["students"]

# def verify_signature(student_id, message, signature):
#     """
#     Verify a digital signature using the student's public key from MongoDB.

#     Args:
#         student_id (str): The ID of the student.
#         message (bytes): The original message that was signed.
#         signature (bytes): The digital signature to verify.

#     Returns:
#         bool: True if the signature is valid, False otherwise.
#     """
#     try:
#         # Retrieve student's public key from MongoDB
#         student_data = students_collection.find_one({"student_id": student_id})
        
#         if not student_data:
#             print(f"Student '{student_id}' not found in MongoDB.")
#             return False

#         # Load public key from database
#         public_key = serialization.load_pem_public_key(
#             student_data["public_key"].encode('utf-8')
#         )

#         # Verify the signature
#         public_key.verify(
#             signature,
#             message,
#             padding.PSS(
#                 mgf=padding.MGF1(hashes.SHA256()),
#                 salt_length=padding.PSS.MAX_LENGTH
#             ),
#             hashes.SHA256()
#         )
        
#         print(f"Signature is valid for {student_id}.")
#         return True

#     except Exception as e:
#         print(f"Signature verification failed for {student_id}: {e}")
#         return False

# # Example: Verify a student's signature from `signature.bin`
# if __name__ == "__main__":
#     student_id = "Student2"
#     message = b"Authenticate Student2"

#     try:
#         # Load signature from file (ensure this matches what was generated during signing)
#         with open("signature.bin", "rb") as sig_file:
#             signature = sig_file.read()

#         # Verify the signature
#         is_valid = verify_signature(student_id, message, signature)

#         if is_valid:
#             print("Message verification completed successfully.")
#         else:
#             print("Message verification failed.")

#     except FileNotFoundError:
#         print("Signature file not found. Ensure 'signature.bin' exists.")

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization
from pymongo import MongoClient
import cv2
import numpy as np
from PIL import Image
from io import BytesIO
import os

from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization, hashes
import os

KEYS_DIR = "keys"

def verify_signature(student_id, message, signature):
    try:
        with open(f"{KEYS_DIR}/{student_id}_public.pem", "rb") as key_file:
            public_key = serialization.load_pem_public_key(key_file.read())

        public_key.verify(
            signature,
            message,
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256()
        )
        return True
    except Exception:
        return False



# MongoDB Connection - Make sure this is defined
client = MongoClient("mongodb+srv://ritwiksuneliya:Ritwik123@cluster0.4o02p.mongodb.net/attendance-system?retryWrites=true&w=majority")
db = client["attendance-system"]
students_collection = db["Signature"]

def verify_signature(student_id, message, signature):
    """
    Verify a signature using image comparison with focus on the actual signature.
    """
    try:
        # Load the stored signature image
        stored_signature_path = f"signatures/{student_id}_signature.png"
        if not os.path.exists(stored_signature_path):
            print(f"No stored signature found for {student_id}")
            return False
            
        # Convert the new signature bytes to an image
        new_sig_image = Image.open(BytesIO(message))
        new_sig_temp_path = f"temp_new_signature.png"
        new_sig_image.save(new_sig_temp_path)
        
        # Load both images in grayscale
        stored_sig = cv2.imread(stored_signature_path, cv2.IMREAD_GRAYSCALE)
        new_sig = cv2.imread(new_sig_temp_path, cv2.IMREAD_GRAYSCALE)
        
        if stored_sig is None or new_sig is None:
            print("Failed to load one or both images")
            return False
        
        # Resize to match dimensions
        new_sig = cv2.resize(new_sig, (stored_sig.shape[1], stored_sig.shape[0]))
        
        # Apply threshold to make binary images - invert so signature is white (255)
        _, stored_binary = cv2.threshold(stored_sig, 200, 255, cv2.THRESH_BINARY_INV)
        _, new_binary = cv2.threshold(new_sig, 200, 255, cv2.THRESH_BINARY_INV)
        
        # Find contours to focus only on the signature pixels
        stored_contours, _ = cv2.findContours(stored_binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        new_contours, _ = cv2.findContours(new_binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Create masks with only the signature
        stored_mask = np.zeros_like(stored_binary)
        new_mask = np.zeros_like(new_binary)
        
        cv2.drawContours(stored_mask, stored_contours, -1, 255, -1)
        cv2.drawContours(new_mask, new_contours, -1, 255, -1)
        
        # Calculate Intersection over Union (IoU)
        intersection = np.logical_and(stored_mask, new_mask)
        union = np.logical_or(stored_mask, new_mask)
        
        if np.sum(union) == 0:
            similarity = 0.0
        else:
            similarity = np.sum(intersection) / np.sum(union)
        
        print(f"Signature similarity: {similarity:.2f}")
        
        # Clean up temporary file
        os.remove(new_sig_temp_path)
        
        # Set a threshold for similarity
        threshold = 0.20  # 20% similarity required
        
        # Compare the signatures
        if similarity >= threshold:
            print("Signature is visually similar")
            return True
        else:
            print("Signature is not visually similar")
            return False
        
    except Exception as e:
        print(f"Signature verification error: {e}")
        return False
