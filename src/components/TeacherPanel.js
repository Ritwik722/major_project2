import React, { useState } from 'react';

function TeacherPanel({ onLogin }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [formData, setFormData] = useState({
    enrollmentNumber: '',
    password: '',
    document: null,
  });
  const [error, setError] = useState('');

  const predefinedUser = {
    enrollmentNumber: 'teacher',
    password: 'password',
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: files ? files[0] : value,
    }));
    setError(''); 
  };

  const handleLogin = (e) => {
    e.preventDefault();

    if (
      formData.enrollmentNumber === predefinedUser.enrollmentNumber &&
      formData.password === predefinedUser.password
    ) {
      setLoggedIn(true);
      setError('');
      onLogin(true); 
    } else {
      setError('Invalid enrollment number or password.');
    }
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!formData.document) {
      setError('Please select a document to upload.');
      return;
    }

    
    console.log('Document uploaded:', formData.document);
    alert('Document uploaded successfully!');
    setError('');
  };

  return (
    <div className="teacher-panel">
      <h2>{loggedIn ? 'Document Upload' : 'Teacher Login'}</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={loggedIn ? handleUpload : handleLogin}>
        {loggedIn ? (
          <div>
            <label htmlFor="document">Upload PDF/DOC</label>
            <input
              type="file"
              id="document"
              name="document"
              onChange={handleInputChange}
              accept=".pdf,.doc,.docx"
              required
            />
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="enrollmentNumber">Enrollment Number</label>
              <input
                type="text"
                id="enrollmentNumber"
                name="enrollmentNumber"
                value={formData.enrollmentNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
          </>
        )}

        <button type="submit">{loggedIn ? 'Upload Document' : 'Login'}</button>
      </form>

      {loggedIn && (
        <button
          onClick={() => {
            setLoggedIn(false);
            onLogin(false); 
          }}
        >
          Back to Login
        </button>
      )}
    </div>
  );
}


export default TeacherPanel;
