import React, { useState } from 'react';
import axios from 'axios';

function TeacherPanel({ onLogin }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
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

  return (
    <div className="teacher-panel">
      <h2>{loggedIn ? 'Teacher Panel' : 'Teacher Login'}</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={loggedIn ? undefined : handleLogin}>
        {loggedIn ? (
          <div>
            <button
              type="button"
              onClick={() => {
                window.location.href = 'https://8c24-14-139-250-92.ngrok-free.app/';
              }}
            >
              Upload Document
            </button>
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

        {!loggedIn && <button type="submit">Login</button>}
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