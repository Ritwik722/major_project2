from pymongo import MongoClient
from deepface import DeepFace  # Install via: pip install deepface
import os

# MongoDB Connection Setup
client = MongoClient("mongodb+srv://ritwiksuneliya:Ritwik123@cluster0.4o02p.mongodb.net/attendance-system?retryWrites=true&w=majority")
db = client["attendance-system"]  # Database name
embeddings_collection = db["face_embeddings"]  # Collection to store embeddings

# Folder Path to Images
folder_path = r"C:\Users\RITHWIK\Desktop\Major_Project\face recog\db_images"  # Replace with your folder path

# Extract and Save Embeddings
for filename in os.listdir(folder_path):
    if filename.endswith((".png", ".jpg", ".jpeg")):  # Process only images
        file_path = os.path.join(folder_path, filename)
        
        try:
            # Generate Embedding Using DeepFace
            embedding = DeepFace.represent(img_path=file_path, model_name="Facenet", enforce_detection=False)[0]['embedding']
            
            # Save to MongoDB as a document
            embeddings_collection.insert_one({
                "filename": filename,
                "embedding": embedding  # Embedding is stored as a list in the document
            })
            print(f"Embedding for {filename} saved successfully!")
        
        except Exception as e:
            print(f"Error processing {filename}: {e}")


