import React, { useState } from 'react';
import axios from 'axios';

function TeacherPanel({ onLogin }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    password: '',
    document: null,
  });
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: files ? files[0] : value,
    }));
    setError('');
  };

  // Handle teacher login API
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/teachers/login', {
        employeeId: formData.employeeId,
        password: formData.password,
      });

      setToken(response.data.token);
      localStorage.setItem('token', response.data.token); // Optional
      setLoggedIn(true);
      onLogin(true);
      setError('');
      alert(response.data.message);
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  // Handle document upload API
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.document) {
      setError('Please select a document to upload.');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('document', formData.document);

      const response = await axios.post('http://localhost:5000/api/teachers/upload-document', 
        formDataToSend, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      alert(response.data.message);
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'Document upload failed.');
    }
  };

  return (
    <div className="teacher-panel">
      <h2>{loggedIn ? 'Upload Teaching Document' : 'Teacher Login'}</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={loggedIn ? handleUpload : handleLogin}>
        {loggedIn ? (
          <div>
            <label htmlFor="document">Upload PDF/DOC (Teaching Materials)</label>
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
              <label htmlFor="employeeId">Employee ID</label>
              <input
                type="text"
                id="employeeId"
                name="employeeId"
                value={formData.employeeId}
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
            setToken('');
            localStorage.removeItem('token');
            onLogin(false);
          }}
        >
          Logout
        </button>
      )}
    </div>
  );
}

export default TeacherPanel;