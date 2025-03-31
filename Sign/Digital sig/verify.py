from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization
from pymongo import MongoClient
import cv2
import numpy as np
from PIL import Image
from io import BytesIO
import os

SIGNATURES_DIR = "signatures"  # Use the same directory for all signature-related files

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
        stored_signature_path = f"{SIGNATURES_DIR}/{student_id}_signature.png"
        if not os.path.exists(stored_signature_path):
            print(f"No stored signature found for {student_id}")
            return False
            
        # Convert the new signature bytes to an image
        new_sig_image = Image.open(BytesIO(message))
        new_sig_temp_path = f"{SIGNATURES_DIR}/temp_new_signature.png"
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
