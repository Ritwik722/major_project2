import React, { useState, useEffect, useRef } from 'react';
import Camera from 'react-html5-camera-photo';
import SignaturePad from 'signature_pad';
import 'react-html5-camera-photo/build/css/index.css';

function StudentRegistration() {
    const [mode, setMode] = useState('initial');
    const [registrationStep, setRegistrationStep] = useState(1);
    const [formData, setFormData] = useState({
        enrollmentNumber: '',
        name: '',
        email: '',
        phoneNumber: '',
        gender: '',
        department: '',
        course: '',
        year: '',
        section: '',
        password: '',
        confirmPassword: '',
        studentPhoto: null,
        digitalSignature: null,
        publicKey: null
    });

    const [yearOptions, setYearOptions] = useState([]);
    const [isCameraActive, setIsCameraActive] = useState({
        studentPhoto: false,
        digitalSignature: false
    });

    // Add signature pad instance state
    const [signaturePadInstance, setSignaturePadInstance] = useState(null);
    const canvasRef = useRef(null);

    // Add a state to track if the canvas is ready
    const [isCanvasReady, setIsCanvasReady] = useState(false);

    // Update resizeCanvas function
    const resizeCanvas = () => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const parent = canvas.parentElement;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        
        // Set canvas size based on parent container
        canvas.width = parent.clientWidth * ratio;
        canvas.height = parent.clientHeight * ratio;
        canvas.style.width = `${parent.clientWidth}px`;
        canvas.style.height = `${parent.clientHeight}px`;
        
        const context = canvas.getContext("2d");
        context.scale(ratio, ratio);
    };

    // Update SignaturePad initialization
    useEffect(() => {
        let pad = null;

        const initializeSignaturePad = () => {
            if (!canvasRef.current || !isCanvasReady) return;

            // Clear any existing instance
            if (signaturePadInstance) {
                signaturePadInstance.off();
            }

            resizeCanvas();
            
            pad = new SignaturePad(canvasRef.current, {
                backgroundColor: 'rgb(255, 255, 255)',
                penColor: 'rgb(0, 0, 0)',
                minWidth: 1,
                maxWidth: 2.5,
                velocityFilterWeight: 0.7,
            });
            
            setSignaturePadInstance(pad);
        };

        initializeSignaturePad();

        const handleResize = () => {
            resizeCanvas();
            if (pad) {
                const data = pad.toData();
                pad.clear();
                pad.fromData(data);
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (pad) {
                pad.off();
            }
        };
    }, [isCanvasReady]); // Only re-run when canvas ready state changes

    // Load saved form data from localStorage
    useEffect(() => {
        const storedFormData = localStorage.getItem('formData');
        if (storedFormData) {
            setFormData(JSON.parse(storedFormData));
        }
    }, []);

    // Handle input changes for form fields
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Update year options based on selected course
        if (name === 'course') {
            switch (value) {
                case 'btech':
                    setYearOptions(['First Year', 'Second Year', 'Third Year', 'Final Year']);
                    break;
                case 'mtech':
                    setYearOptions(['First Year', 'Second Year']);
                    break;
                case 'phd':
                    setYearOptions(['First Year', 'Second Year', 'Third Year', 'Fourth Year']);
                    break;
                default:
                    setYearOptions([]);
            }
        }

        // Update form data and save to localStorage
        const updatedFormData = {
            ...formData,
            [name]: value
        };
        
        setFormData(updatedFormData);
        localStorage.setItem('formData', JSON.stringify(updatedFormData));
    };

    // Enhanced data URI to File conversion with error handling
    const dataUriToFile = (dataUri) => {
        try {
            const byteString = atob(dataUri.split(',')[1]);
            const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
            const arrayBuffer = new ArrayBuffer(byteString.length);
            const uintArray = new Uint8Array(arrayBuffer);

            for (let i = 0; i < byteString.length; i++) {
                uintArray[i] = byteString.charCodeAt(i);
            }

            return new File([uintArray], 'image.png', { type: mimeString });
        } catch (error) {
            console.error('Data URI conversion failed:', error);
            throw new Error('Invalid image format');
        }
    };

    // Simplified handleTakePhoto function
    const handleTakePhoto = async (type, dataUri) => {
        try {
            const file = dataUriToFile(dataUri);
            const formDataToSend = new FormData();
            formDataToSend.append('file', file);
            formDataToSend.append('studentId', formData.enrollmentNumber);
    
            const response = await fetch('/api/students/upload-photo', {  // Updated endpoint path
                method: 'POST',
                body: formDataToSend
            });
    
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to upload photo');
            }
    
            const result = await response.json();
    
            // Update the form data with the file path from the server
            setFormData(prev => ({
                ...prev,
                [type]: {
                    file,
                    preview: dataUri,
                    path: result.file.path
                }
            }));
    
            return result.file.path;  // Return the file path for further use if needed
    
        } catch (error) {
            console.error(`${type} processing failed:`, error);
            alert(`Error processing ${type}: ${error.message}`);
        } finally {
            setIsCameraActive(prev => ({ ...prev, [type]: false }));
        }
    };
    // Update saveSignature function to handle errors better
    const saveSignature = async () => {
        try {
            if (!signaturePadInstance) {
                throw new Error('Signature pad not initialized');
            }
            
            if (signaturePadInstance.isEmpty()) {
                throw new Error('Please draw your signature first');
            }

            const dataUrl = signaturePadInstance.toDataURL('image/png');
            await handleTakePhoto('digitalSignature', dataUrl);
            signaturePadInstance.clear();
            
        } catch (error) {
            alert(error.message);
        }
    };

    // Enhanced signature verification
    const verifySignature = async (signatureData) => {
        try {
            const response = await fetch('http://localhost:5000/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: formData.enrollmentNumber,
                    signatureData: signatureData.split(',')[1]
                })
            });

            const result = await response.json();
            if (!result.valid) {
                throw new Error(`Signature mismatch: ${Math.round(result.similarity * 100)}% similarity`);
            }
            return true;
        } catch (error) {
            console.error('Verification failed:', error);
            throw error;
        }
    };

    // Handle file upload from disk
    const handleFileUpload = (type, e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prevState => ({
                ...prevState,
                [type]: {
                    file: file,
                    preview: reader.result
                }
            }));
        };
        reader.readAsDataURL(file);
    };

    // Validation for step 1
    const validateStep1 = () => {
        const requiredFields = [
            'enrollmentNumber', 'name', 'email', 'phoneNumber', 'gender', 
            'course', 'department', 'year', 'section'
        ];
        
        for (let field of requiredFields) {
            if (!formData[field]) {
                alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field`);
                return false;
            }
        }

        const phoneNumberPattern = /^\d{10}$/;
        if (!phoneNumberPattern.test(formData.phoneNumber)) {
            alert('Phone number must be exactly 10 digits.');
            return false;
        }

        const emailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!emailPattern.test(formData.email)) {
            alert('Email must be a valid Gmail address.');
            return false;
        }

        return true;
    };

    // Validation for step 2
    const validateStep2 = () => {
        if (!formData.password) {
            alert('Please enter a password');
            return false;
        }
        
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match');
            return false;
        }
        
        if (formData.password.length < 6) {
            alert('Password must be at least 6 characters long');
            return false;
        }
        
        return true;
    };

    // Handle next step navigation
    const handleNextStep = () => {
        if (registrationStep === 1 && validateStep1()) {
            setRegistrationStep(2);
        } else if (registrationStep === 2 && validateStep2()) {
            setRegistrationStep(3);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // // Verify signature before submission if available
            // if (formData.digitalSignature?.path) {
            //     try {
            //         await verifySignature(formData.digitalSignature.path);
            //     } catch (error) {
            //         // Continue even if verification fails or endpoint isn't available
            //         console.warn('Signature verification skipped:', error.message);
            //     }
            // }

            // Prepare registration payload
            const registrationPayload = {
                ...formData,
                photo: formData.studentPhoto?.path,  // Use the stored file path
                signature: formData.digitalSignature?.path,  // Use the stored file path
                publicKey: formData.publicKey
            };

            // Submit registration
            const response = await fetch("http://localhost:5000/api/students/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registrationPayload)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Registration failed');

            // Reset state on success
            alert('Registration Successful!');
            localStorage.removeItem('formData');
            setFormData({
                enrollmentNumber: '',
                name: '',
                email: '',
                phoneNumber: '',
                gender: '',
                department: '',
                course: '',
                year: '',
                section: '',
                password: '',
                confirmPassword: '',
                studentPhoto: null,
                digitalSignature: null,
                publicKey: null
            });
            setMode('initial');
            setRegistrationStep(1);
            
        } catch (error) {
            console.error("Registration Error:", error);
            alert(`Registration Failed: ${error.message}`);
        }
    };

    // Update renderSignaturePad function
    const renderSignaturePad = () => (
        <div className="signature-section">
            <div 
                style={{ 
                    border: '2px solid #ccc', 
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    margin: '10px 0',
                    width: '100%',
                    maxWidth: '600px',
                    height: '300px', // Fixed height container
                    position: 'relative'
                }}
                onMouseEnter={() => setIsCanvasReady(true)} // Initialize when user interacts
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        touchAction: 'none',
                        cursor: 'crosshair'
                    }}
                />
            </div>
            <div className="signature-controls">
                <button
                    type="button"
                    onClick={() => signaturePadInstance?.clear()}
                    className="button"
                    style={{ marginRight: '10px' }}
                >
                    Clear
                </button>
                <button
                    type="button"
                    onClick={saveSignature}
                    className="button"
                >
                    Save
                </button>
            </div>
        </div>
    );

    // Modified renderCameraSection for digital signatures
    const renderCameraSection = (type) => {
        if (type === 'digitalSignature') {
            return renderSignaturePad();
        }

        return (
            <div className="camera-section">
                {isCameraActive[type] ? (
                    <Camera
                        onTakePhoto={(dataUri) => handleTakePhoto(type, dataUri)}
                        idealFacingMode="environment"
                        imageType="png"
                        imageCompression={0.97}
                        isImageMirror={false}
                    />
                ) : (
                    <div>
                        <button 
                            type="button" 
                            onClick={() => setIsCameraActive(prev => ({ ...prev, [type]: true }))}
                            className="camera-button"
                        >
                            {type === 'studentPhoto' 
                                ? 'Capture Student Photo'
                                : 'Capture Signature'}
                        </button>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleFileUpload(type, e)} 
                            style={{ display: 'none' }}
                            id={`file-upload-${type}`}
                        />
                        <label 
                            htmlFor={`file-upload-${type}`} 
                            className="file-upload-label"
                        >
                            Upload {type === 'studentPhoto' ? 'Photo' : 'Signature'}
                        </label>
                        
                        {/* Show preview if available */}
                        {formData[type]?.preview && (
                            <div className="preview-container">
                                <img 
                                    src={formData[type].preview} 
                                    alt={type === 'studentPhoto' ? 'Student' : 'Signature'} 
                                    style={{ 
                                        width: type === 'studentPhoto' ? '100px' : '150px', 
                                        height: type === 'studentPhoto' ? '100px' : '75px', 
                                        objectFit: type === 'studentPhoto' ? 'cover' : 'contain',
                                        margin: '10px 0' 
                                    }} 
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };
    
    // Render the first step of registration
    const renderRegistrationStep1 = () => (
        <div className="registration-step-1">
            <h4>Enrollment Number <span style={{ color: 'red' }}>*</span></h4>
            <input
                type="text"
                name="enrollmentNumber"
                placeholder="Enrollment Number"
                value={formData.enrollmentNumber}
                onChange={handleInputChange}
                required
            />
    
            <h4>Name <span style={{ color: 'red' }}>*</span></h4>
            <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                required
            />
    
            <h4>Email <span style={{ color: 'red' }}>*</span></h4>
            <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                required
            />
    
            <h4>Phone Number <span style={{ color: 'red' }}>*</span></h4>
            <input
                type="tel"
                name="phoneNumber"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
            />
    
            <h4>Gender <span style={{ color: 'red' }}>*</span></h4>
            <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
            >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
            </select>
    
            <h4>Department <span style={{ color: 'red' }}>*</span></h4>
            <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
            >
                <option value="">Select Department</option>
                <option value="IT">Information Technology</option>
                <option value="CSE">Computer Science</option>
                <option value="ECE">Electronics & Communication</option>
                <option value="MECH">Mechanical Engineering</option>
                <option value="CIVIL">Civil Engineering</option>
            </select>
    
            <h4>Course <span style={{ color: 'red' }}>*</span></h4>
            <select
                name="course"
                value={formData.course}
                onChange={handleInputChange}
                required
            >
                <option value="">Select Course</option>
                <option value="btech">B.Tech</option>
                <option value="mtech">M.Tech</option>
                <option value="phd">PhD</option>
            </select>
    
            <h4>Year <span style={{ color: 'red' }}>*</span></h4>
            <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
            >
                <option value="">Select Academic Year</option>
                {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                ))}
            </select>
    
            <h4>Section <span style={{ color: 'red' }}>*</span></h4>
            <select
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                required
            >
                <option value="">Select Section</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
            </select>
    
            <div className="action-buttons" style={{ marginTop: '20px' }}>
                <button type="button" onClick={handleNextStep}>Next</button>
                <button type="button" onClick={() => setMode('initial')}>Back</button>
            </div>
        </div>
    );
    
    // Render the second step of registration
    const renderRegistrationStep2 = () => (
        <div className="registration-step-2">
            <h4>Password <span style={{ color: 'red' }}>*</span></h4>
            <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
            />
    
            <h4>Confirm Password <span style={{ color: 'red' }}>*</span></h4>
            <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
            />
    
            <h4>Student Photo <span style={{ color: 'red' }}>*</span></h4>
            {renderCameraSection('studentPhoto')}
            
            <h4>Digital Signature <span style={{ color: 'red' }}>*</span></h4>
            {renderCameraSection('digitalSignature')}
    
            <div className="action-buttons" style={{ marginTop: '20px' }}>
                <button type="button" onClick={() => setRegistrationStep(1)}>Back</button>
                <button type="button" onClick={handleNextStep}>Next</button>
            </div>
        </div>
    );
    
    // Render the final step of registration (preview)
    const renderRegistrationStep3 = () => (
        <div className="registration-preview">
            <h3>Registration Preview</h3>
            <div className="bento-grid">
                <div className="grid-item">
                    <div className="details-section">
                        <p><strong>Enrollment Number:</strong> {formData.enrollmentNumber}</p>
                        <p><strong>Name:</strong> {formData.name}</p>
                        <p><strong>Email:</strong> {formData.email}</p>
                        <p><strong>Phone:</strong> {formData.phoneNumber}</p>
                        <p><strong>Gender:</strong> {formData.gender}</p>
                        <p><strong>Course:</strong> {formData.course}</p>
                        <p><strong>Department:</strong> {formData.department}</p>
                        <p><strong>Year:</strong> {formData.year}</p>
                        <p><strong>Section:</strong> {formData.section}</p>
                    </div>
                </div>
                <div className="grid-item">
                    {formData.studentPhoto?.preview && (
                        <div>
                            <h4>Student Photo</h4>
                            <img 
                                src={formData.studentPhoto.preview}
                                alt="Student" 
                                style={{ width: '200px', height: '200px', objectFit: 'cover' }} 
                            />
                        </div>
                    )}
                </div>
                <div className="grid-item">
                    {formData.digitalSignature?.preview && (
                        <div>
                            <h4>Digital Signature</h4>
                            <img 
                                src={formData.digitalSignature.preview}
                                alt="Signature" 
                                style={{ width: '200px', height: '100px', objectFit: 'contain' }} 
                            />
                        </div>
                    )}
                </div>
                {formData.publicKey && (
                    <div className="grid-item">
                        <div className="crypto-info">
                            <h4>Cryptographic Verification</h4>
                            <p><strong>Public Key:</strong> 
                                <span className="key-preview">
                                    {formData.publicKey.slice(0, 30)}...
                                </span>
                            </p>
                        </div>
                    </div>
                )}
            </div>
            <div className="action-buttons" style={{ marginTop: '20px' }}>
                <button type="button" onClick={() => setRegistrationStep(2)}>Back</button>
                <button type="submit">Submit Registration</button>
            </div>
        </div>
    );

    return (
        <div className="student-registration-container">
            {mode === 'initial' && (
                <div className="initial-buttons">
                    <button onClick={() => setMode('register')}>Register</button>
                </div>
            )}

            {mode === 'register' && (
                <form onSubmit={handleSubmit}>
                    {registrationStep === 1 && renderRegistrationStep1()}
                    {registrationStep === 2 && renderRegistrationStep2()}
                    {registrationStep === 3 && renderRegistrationStep3()}
                </form>
            )}
        </div>
    );
}

export default StudentRegistration;