import React, { useState, useEffect } from 'react';
import Camera from 'react-html5-camera-photo';
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
        digitalSignature: null
    });

    const [yearOptions, setYearOptions] = useState([]);

    const [isCameraActive, setIsCameraActive] = useState({
        studentPhoto: false,
        digitalSignature: false
    });

    useEffect(() => {
        const storedFormData = localStorage.getItem('formData');
        if (storedFormData) {
            setFormData(JSON.parse(storedFormData));
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

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

        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
        localStorage.setItem('formData', JSON.stringify({
            ...formData,
            [name]: value
        }));
    };

    const dataUriToFile = (dataUri) => {
        const byteString = atob(dataUri.split(',')[1]);
        const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uintArray = new Uint8Array(arrayBuffer);

        for (let i = 0; i < byteString.length; i++) {
            uintArray[i] = byteString.charCodeAt(i);
        }

        const blob = new Blob([uintArray], { type: mimeString });
        return new File([blob], 'image.png', { type: mimeString });
    };

    const handleTakePhoto = (type, dataUri) => {
        const file = dataUriToFile(dataUri);
        setFormData(prevState => ({
            ...prevState,
            [type]: file
        }));
        localStorage.setItem('formData', JSON.stringify({
            ...formData,
            [type]: file
        }));
        setIsCameraActive(prev => ({
            ...prev,
            [type]: false
        }));
    };

    const validateStep1 = () => {
        const requiredFields = [
            'enrollmentNumber', 'name', 'email', 'phoneNumber', 'gender', 
            'course', 'department', 'year', 'section'
        ];
        
        for (let field of requiredFields) {
            if (!formData[field]) {
                alert(`Please fill in the ${field} field`);
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

    const validateStep2 = () => {
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

    const handleNextStep = () => {
        if (registrationStep === 1 && validateStep1()) {
            setRegistrationStep(2);
        } else if (registrationStep === 2 && validateStep2()) {
            setRegistrationStep(3);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/api/students/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (response.ok) {
                alert('Registration Submitted!');
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
                    digitalSignature: null
                });
                setMode('initial');
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Error submitting registration:", error);
            alert('Error submitting registration');
        }
    };

const renderCameraSection = (type) => (
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
                >
                    {type === 'studentPhoto' ? 'Capture Student Photo' : 'Capture Digital Signature'}
                </button>
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(type, e)} 
                />
                {formData[type] instanceof File && (
                    <img 
                        src={URL.createObjectURL(formData[type])} 
                        alt={type} 
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
                    />
                )}
            </div>
        )}
    </div>
);

const handleFileUpload = (type, e) => {
    const file = e.target.files[0];
    setFormData(prevState => ({
        ...prevState,
        [type]: file
    }));
    localStorage.setItem('formData', JSON.stringify({
        ...formData,
        [type]: file
    }));
};

     
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
                {yearOptions.map((year, index) => (
                    <option key={index} value={year}>{year}</option>
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
    
            <button type="button" onClick={handleNextStep}>Next</button>
            <button type="button" onClick={() => setMode('initial')}>Back</button>
        </div>
    );
    
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
    
            {renderCameraSection('studentPhoto')}
            {renderCameraSection('digitalSignature')}
    
            <button type="button" onClick={() => setRegistrationStep(1)}>Back</button>
            <button type="button" onClick={handleNextStep}>Next</button>
        </div>
    );
    

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
                    {formData.studentPhoto && (
                        <div>
                            <h4>Student Photo</h4>
                            <img 
                                src={URL.createObjectURL(formData.studentPhoto)} 
                                alt="Student" 
                                style={{ width: '200px', height: '200px', objectFit: 'cover' }} 
                            />
                        </div>
                    )}
                </div>
                <div className="grid-item">
                    {formData.digitalSignature && (
                        <div>
                            <h4>Digital Signature</h4>
                            <img 
                                src={URL.createObjectURL(formData.digitalSignature)} 
                                alt="Signature" 
                                style={{ width: '200px', height: '100px', objectFit: 'contain' }} 
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className="action-buttons">
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