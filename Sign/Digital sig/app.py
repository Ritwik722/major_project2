from flask import Flask, request, jsonify, render_template, send_from_directory
import base64
import re
import os
from io import BytesIO
from PIL import Image
import webbrowser
from threading import Timer

from sign import sign_message
from verify import verify_signature

# Import your original code files with correct filenames
from Generate import generate_and_store_keys, check_student_in_mongo
from sign import sign_message
from verify import verify_signature

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/sign-signature', methods=['POST'])
def sign_signature_route():
    if 'student_id' not in request.form or 'signature_image' not in request.form:
        return jsonify({'success': False, 'error': 'Missing student ID or signature'})
    
    student_id = request.form['student_id']
    signature_data_url = request.form['signature_image']
    
    try:
        # Extract the base64 encoded image data from the data URL
        image_data = re.sub('^data:image/.+;base64,', '', signature_data_url)
        image_bytes = base64.b64decode(image_data)
        
        # Generate keys for this student
        generate_and_store_keys(student_id)
        
        # Save the signature image
        os.makedirs('signatures', exist_ok=True)
        signature_path = f"signatures/{student_id}_signature.png"
        
        # Convert to image and save
        image = Image.open(BytesIO(image_bytes))
        image.save(signature_path)
        
        # Sign the signature image data
        digital_signature = sign_message(student_id, image_bytes)
        
        if digital_signature:
            # Save the digital signature
            signature_file_path = f"signatures/{student_id}_digital_signature.bin"
            with open(signature_file_path, "wb") as sig_file:
                sig_file.write(digital_signature)
            
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to create digital signature'})
            
    except Exception as e:
        print(f"Error in sign_signature_route: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/verify-signature', methods=['POST'])
def verify_signature_route():
    if 'student_id' not in request.form or 'signature_image' not in request.form:
        return jsonify({'valid': False, 'error': 'Missing student ID or signature'})
    
    student_id = request.form['student_id']
    signature_data_url = request.form['signature_image']
    
    try:
        # Extract the base64 encoded image data
        image_data = re.sub('^data:image/.+;base64,', '', signature_data_url)
        image_bytes = base64.b64decode(image_data)
        
        # Check if the student has a stored signature
        signature_path = f"signatures/{student_id}_signature.png"
        if not os.path.exists(signature_path):
            return jsonify({'valid': False, 'error': 'No signature on file for this student'})
           
        # Load the stored digital signature
        signature_file_path = f"signatures/{student_id}_digital_signature.bin"
        if not os.path.exists(signature_file_path):
            return jsonify({'valid': False, 'error': 'No digital signature on file for this student'})
            
        with open(signature_file_path, "rb") as sig_file:
            digital_signature = sig_file.read()
        
        # Verify the signature
        is_valid = verify_signature(student_id, image_bytes, digital_signature)
        
        return jsonify({'valid': is_valid})
            
    except Exception as e:
        print(f"Verification error: {str(e)}")
        return jsonify({'valid': False, 'error': str(e)})

@app.route('/signatures/<path:filename>')
def serve_signature(filename):
    return send_from_directory('signatures', filename)

def open_browser():
    webbrowser.open_new('http://127.0.0.1:5500/')

if __name__ == '__main__':
    os.makedirs('signatures', exist_ok=True)
    Timer(1.0, open_browser).start()
    app.run(debug=True, host='0.0.0.0', port=5500)

