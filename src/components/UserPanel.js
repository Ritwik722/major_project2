import React, { useState } from 'react';

const submitUserRequest = async (userDetails, file) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('userDetails', JSON.stringify(userDetails));

    try {
        const uploadResponse = await fetch('http://localhost:3001/api/upload', {
            method: 'POST',
            body: formData,
        });

        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) {
            throw new Error(uploadResult.error || 'File upload failed');
        }

        const requestResponse = await fetch('http://localhost:3001/api/requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...userDetails,
                fileName: uploadResult.file,
            }),
        });

        const requestResult = await requestResponse.json();
        if (!requestResponse.ok) {
            throw new Error(requestResult.error || 'Request submission failed');
        }

        return requestResult;
    } catch (error) {
        throw new Error(error.message || 'Unexpected error occurred');
    }
};

const performFaceRecognition = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('http://localhost:5000/api/face-recognition', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Face recognition failed');
        }

        return result;
    } catch (error) {
        throw new Error(error.message || 'Unexpected error occurred');
    }
};

function UserPanel() {
    const [biometricData, setBiometricData] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [error, setError] = useState('');
    const [faceRecognitionResult, setFaceRecognitionResult] = useState('');

    const handleBiometricUpload = async (e) => {
        const file = e.target.files[0];
        setBiometricData(file);

        if (!userDetails) {
            setError('Please provide user details first.');
            return;
        }

        try {
            const request = await submitUserRequest(userDetails, file);
            console.log('Request submitted', request);
            setUserDetails(request.userDetails);
            setError('');
        } catch (error) {
            setError('Request submission failed: ' + error.message);
        }
    };

    const handleCapturePhoto = async () => {
        if (!biometricData) {
            setError('Please upload a photo first.');
            return;
        }

        try {
            const result = await performFaceRecognition(biometricData);
            setFaceRecognitionResult(result.message);
            setError('');
        } catch (error) {
            setError('Face recognition failed: ' + error.message);
        }
    };

    return (
        <div className="user-panel">
            <h2>User Details Request</h2>
            {error && <div className="error-message">{error}</div>}

            <div>
                <label>Upload Digital Signature/Fingerprint</label>
                <input
                    type="file"
                    onChange={handleBiometricUpload}
                    accept=".png,.jpg,.jpeg,.pdf"
                />
                <button onClick={handleCapturePhoto}>Capture Photo</button>
                {faceRecognitionResult && (
                    <div className="success-message">{faceRecognitionResult}</div>
                )}
                {userDetails && (
                    <div>
                        <h3>User Details</h3>
                        <pre>{JSON.stringify(userDetails, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserPanel;