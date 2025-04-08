from flask import Flask, request, jsonify
from deepface import DeepFace
import numpy as np
import cv2
import os
import tempfile
from pymongo import MongoClient
import test5

app = Flask(__name__)

# MongoDB Setup
mongo_uri = "mongodb://localhost:27017/"
db_name = "face_db"
collection_name = "face_embeddings"
threshold = 0.70

client = MongoClient(mongo_uri)
db = client[db_name]
embeddings_collection = db[collection_name]

@app.route('/verify-face', methods=['POST'])
def verify_face():
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'message': 'No image provided'})

        if 'student_id' not in request.form:
            return jsonify({'success': False, 'message': 'No student ID provided'})

        file = request.files['image']
        student_id = request.form['student_id']

        # Save the uploaded file temporarily
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, f"verify_{student_id}.png")
        file.save(temp_path)

        # Generate embedding for the uploaded image
        check_embedding = test5.get_face_embedding(temp_path)
        if check_embedding is None:
            return jsonify({
                'success': False,
                'message': 'No face detected in the image'
            })

        # Compare with stored embeddings
        match_doc, similarity = test5.recognize_face_in_database(check_embedding)

        # Clean up temporary file
        try:
            os.remove(temp_path)
        except:
            pass

        if match_doc is not None:
            return jsonify({
                'success': True,
                'match': True,
                'confidence': float(similarity),
                'message': f'Face verified with {similarity:.2%} confidence'
            })
        else:
            return jsonify({
                'success': True,
                'match': False,
                'confidence': 0,
                'message': 'No matching face found'
            })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)