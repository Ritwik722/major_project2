import React, { useState, useEffect } from "react";

const verifySignature = async (student) => {
  try {
    // If the signature is a file path, fetch it first
    let signatureData = student.signature;
    if (typeof student.signature === 'string' && student.signature.includes('uploads/')) {
      signatureData = student.signature; // Keep using the path since backend handles it
    }

    const response = await fetch('http://localhost:5000/api/signature/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId: student.enrollmentNumber,
        signature: signatureData
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify signature');
    }

    const result = await response.json();
    return {
      success: result.success,
      isValid: result.isValid,
      similarity: result.similarity,
      message: result.message
    };
  } catch (error) {
    throw new Error(`Signature verification failed: ${error.message}`);
  }
};

const handleCaptureSignature = async (e) => {
  const file = e.target.files[0];
  if (!file) {
    setError("Please select a signature file to upload.");
    return;
  }

  try {
    // Create form data for upload
    const formData = new FormData();
    formData.append('signature', file);
    formData.append('studentId', selectedStudent.enrollmentNumber);

    // Upload the signature first
    const uploadResponse = await fetch('http://localhost:5000/api/signature/upload', {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(error.message || 'Failed to upload signature');
    }

    const uploadResult = await uploadResponse.json();
    
    // Update student with new signature path
    const updateResponse = await fetch(`http://localhost:5000/api/students/update/${selectedStudent.enrollmentNumber}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...selectedStudent,
        signature: uploadResult.filePath
      }),
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to update student signature');
    }

    // Now verify the uploaded signature
    const verifyResponse = await fetch('http://localhost:5000/api/signature/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentId: selectedStudent.enrollmentNumber,
        signature: uploadResult.filePath
      })
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(error.message || 'Verification failed');
    }

    const verifyResult = await verifyResponse.json();

    // Update UI
    setSuccessMessage(`Signature ${verifyResult.isValid ? 'verified' : 'failed verification'} (${Math.round(verifyResult.similarity * 100)}% match)`);
    setSelectedStudent(prev => ({
      ...prev,
      signature: uploadResult.filePath
    }));

    // Refresh student list
    if (selectedRoom) {
      const range = selectedRoom.range.split('-').map(Number);
      fetchStudents(range);
    }
    
  } catch (error) {
    setError(error.message);
  }
};

const verifyPhoto = async (student) => {
  try {
    let imageFile;
    // Convert photo to File object
    if (student.photo.startsWith('data:image')) {
      const response = await fetch(student.photo);
      const blob = await response.blob();
      imageFile = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
    } else {
      const response = await fetch(student.photo);
      const blob = await response.blob();
      imageFile = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
    }

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('enrollmentNumber', student.enrollmentNumber);

    const response = await fetch('http://localhost:5000/api/students/verify-photo', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    return {
      success: result.success,
      message: result.message,
      isMatch: result.isMatch
    };
  } catch (error) {
    throw new Error(`Photo verification failed: ${error.message}`);
  }
};

const AttendanceSheet = () => {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]); // New state for rooms
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalType, setModalType] = useState(""); // 'view', 'capture', 'edit'
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null); // New state for selected room
  const [token, setToken] = useState("YOUR_JWT_TOKEN_HERE"); // State for storing the JWT token

  // Fetch function for getting rooms from the API
  const fetchRooms = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/rooms", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch rooms");
      }

      const result = await response.json();

      // Ensure the data is an array
      if (Array.isArray(result)) {
        setRooms(result); // Set the rooms state to the array
      } else {
        throw new Error("Invalid response format");
      }

      setLoading(false);
    } catch (err) {
      setError(err?.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  // Fetch function for getting students from the API
  const fetchStudents = async (range) => {
    try {
      const response = await fetch("http://localhost:5000/api/students", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
      const result = await response.json();

      // Ensure the data is an array
      if (result.success && Array.isArray(result.data)) {
        const filteredStudents = result.data.filter(student => {
          const enrollmentNumber = parseInt(student.enrollmentNumber, 10);
          return enrollmentNumber >= range[0] && enrollmentNumber <= range[1];
        });
        setStudents(filteredStudents); // Set the students state to the array
      } else {
        throw new Error("Invalid response format");
      }

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Use useEffect to fetch rooms when component mounts
  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    localStorage.setItem("students", JSON.stringify(students));
  }, [students]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    const range = room.range.split('-').map(Number);
    fetchStudents(range);
  };

  const filteredStudents = students.filter(
    (student) =>
      student.enrollmentNumber?.toLowerCase().includes(searchTerm) ||
      student.name?.toLowerCase().includes(searchTerm)
  );

  const openModal = (student, type) => {
    if (type === "capture") {
      window.location.href = "http://127.0.0.1:5500/";
      return;
    }
    setSelectedStudent({ ...student });
    setModalType(type);
  };

  const closeModal = () => {
    setModalType("");
    setSelectedStudent(null);
    setError("");
    setSuccessMessage("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setSelectedStudent((prev) => ({ ...prev, [name]: value }));
  };

  const saveChanges = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/students/update/${selectedStudent.enrollmentNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(selectedStudent),
      });

      if (!response.ok) {
        throw new Error('Failed to update student');
      }

      const result = await response.json();

      // Update the local state
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student.enrollmentNumber === selectedStudent.enrollmentNumber
            ? selectedStudent
            : student
        )
      );

      setSuccessMessage('Student updated successfully');
      setTimeout(() => {
        closeModal();
      }, 1500);

    } catch (error) {
      setError(error.message);
    }
  };

  const handleCapturePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setError("Please select a photo to upload.");
      return;
    }

    try {
      const result = await performFaceRecognition(file);
      setSuccessMessage(result.message);
      setSelectedStudent((prev) => ({ ...prev, photo: URL.createObjectURL(file) }));
    } catch (error) {
      setError(error.message);
    }
  };

  const deleteStudent = async (enrollmentNumber) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/students/${enrollmentNumber}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete student');
        }

        setStudents(prevStudents => 
          prevStudents.filter(student => student.enrollmentNumber !== enrollmentNumber)
        );
        setSuccessMessage('Student deleted successfully');
      } catch (error) {
        setError(error.message);
      }
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Attendance Sheet</h1>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}

      {/* Room List */}
      <div style={styles.roomList}>
        <h2 style={styles.subtitle}>Rooms</h2>
        {rooms.map((room) => (
          <button
            key={room.number}
            style={styles.roomButton}
            onClick={() => handleRoomClick(room)}
          >
            Room {room.number}
          </button>
        ))}
      </div>

      {/* Report */}
      {selectedRoom && (
        <div style={styles.report}>
          <h2 style={styles.subtitle}>Report for Room {selectedRoom.number}</h2>
          <p>Total Students: {students.length}</p>
          <ul>
            {students.map(student => (
              <li key={student.enrollmentNumber}>
                {student.name} - {student.course} - {student.department}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by Enrollment Number or Name"
        value={searchTerm}
        onChange={handleSearch}
        style={styles.input}
      />

      {/* Student Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.header}>Enrollment Number</th>
            <th style={styles.header}>Name</th>
            <th style={styles.header}>Course</th>
            <th style={styles.header}>Department</th>
            <th style={styles.header}>Photo</th>
            <th style={styles.header}>Signature</th>
            <th style={styles.header}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student) => (
            <tr key={student.enrollmentNumber}>
              <td style={styles.cell}>{student.enrollmentNumber}</td>
              <td style={styles.cell}>{student.name}</td>
              <td style={styles.cell}>{student.course}</td>
              <td style={styles.cell}>{student.department}</td>
              <td style={styles.cell}>
                {student.photo ? (
                  <div>
                    <img
                      src={student.photo}
                      alt="Student"
                      style={styles.image}
                    />
                    <button
                      style={styles.verifyButton}
                      onClick={async () => {
                        try {
                          const result = await verifyPhoto(student);
                          setSuccessMessage(
                            `Photo verification: ${result.isMatch ? 'Successful' : 'Failed'} - ${result.message}`
                          );
                        } catch (error) {
                          setError(error.message);
                        }
                      }}
                    >
                      Verify Photo
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      style={styles.captureButtonSmall}
                      onClick={() => openModal(student, "capture")}
                    >
                      Capture Photo
                    </button>
                  </div>
                )}
              </td>
              <td style={styles.cell}>
                {student.signature ? (
                  <div>
                    <img
                      src={student.signature}
                      alt="Signature"
                      style={styles.image}
                    />
                    <button
                      style={styles.verifyButton}
                      onClick={async () => {
                        try {
                          const result = await verifySignature(student);
                          setSuccessMessage(
                            `Signature verification: ${result.isValid ? 'Valid' : 'Invalid'} (${Math.round(result.similarity * 100)}% match)`
                          );
                        } catch (error) {
                          setError(error.message);
                        }
                      }}
                    >
                      Verify Sign
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      style={styles.captureButtonSmall}
                      onClick={() => openModal(student, "capture")}
                    >
                      Capture Sign
                    </button>
                  </div>
                )}
              </td>
              <td style={styles.cell}>
                <button
                  style={{ ...styles.button, backgroundColor: '#dc3545' }}
                  onClick={() => deleteStudent(student.enrollmentNumber)}
                >
                  Delete
                </button>
                <button
                  style={styles.editButton}
                  onClick={() => openModal(student, "edit")}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {modalType && selectedStudent && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>
              {modalType === "view" && "View Student"}
              {modalType === "capture" && "Capture Details"}
              {modalType === "edit" && "Edit Student"}
            </h3>

            {modalType === "capture" && (
              <div>
                <label>
                  Capture Photo:
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCapturePhoto}
                    style={styles.input}
                  />
                </label>
                <label>
                  Capture Signature:
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCaptureSignature}
                    style={styles.input}
                  />
                </label>
              </div>
            )}

            {modalType === "edit" && (
              <div>
                <label>
                  <strong>Enrollment Number:</strong>
                  <input
                    type="text"
                    name="enrollmentNumber"
                    value={selectedStudent.enrollmentNumber}
                    onChange={handleEditChange}
                    style={styles.input}
                  />
                </label>
                <label>
                  <strong>Name:</strong>
                  <input
                    type="text"
                    name="name"
                    value={selectedStudent.name}
                    onChange={handleEditChange}
                    style={styles.input}
                  />
                </label>
                <label>
                  <strong>Course:</strong>
                  <input
                    type="text"
                    name="course"
                    value={selectedStudent.course}
                    onChange={handleEditChange}
                    style={styles.input}
                  />
                </label>
                <label>
                  <strong>Department:</strong>
                  <input
                    type="text"
                    name="department"
                    value={selectedStudent.department}
                    onChange={handleEditChange}
                    style={styles.input}
                  />
                </label>
                <button style={styles.saveButton} onClick={saveChanges}>
                  Save Changes
                </button>
              </div>
            )}

            {error && <p style={{ color: "red" }}>{error}</p>}
            {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}

            <button style={styles.closeButton} onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    margin: "20px",
  },
  title: {
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  subtitle: {
    textAlign: "center",
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  input: {
    padding: "8px",
    marginBottom: "20px",
    width: "100%",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
  },
  header: {
    backgroundColor: "#f4f4f4",
    border: "1px solid #ddd",
    padding: "10px",
    textAlign: "center",
  },
  cell: {
    border: "1px solid #ddd",
    padding: "10px",
    textAlign: "center",
  },
  image: {
    width: "50px",
    height: "50px",
    objectFit: "cover",
    borderRadius: "4px",
  },
  placeholder: {
    color: "#888",
    fontStyle: "italic",
  },
  button: {
    padding: "5px 10px",
    margin: "0 5px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  captureButton: {
    padding: "5px 10px",
    margin: "0 5px",
    backgroundColor: "#28A745",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  editButton: {
    padding: "5px 10px",
    margin: "0 5px",
    backgroundColor: "#FFC107",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  saveButton: {
    padding: "5px 10px",
    marginTop: "10px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  closeButton: {
    padding: "5px 10px",
    marginTop: "10px",
    backgroundColor: "#FF4D4D",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    width: "400px",
    textAlign: "center",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  deleteButton: {
    padding: '5px 10px',
    margin: '0 5px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  captureButtonSmall: {
    padding: '3px 8px',
    margin: '5px',
    backgroundColor: '#28A745',
    color: '#fff',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'block',
    width: '100%',
  },
  roomList: {
    marginBottom: "20px",
    textAlign: "center",
  },
  roomButton: {
    padding: "10px 20px",
    margin: "5px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  report: {
    textAlign: "center",
    marginBottom: "20px",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "#f9f9f9",
    width: "100%",
    maxWidth: "600px",
    margin: "0 auto", 
  },
  verifyButton: {
    padding: '3px 8px',
    margin: '5px',
    backgroundColor: '#17a2b8',
    color: '#fff',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'block',
    width: '100%',
  }
};

export default AttendanceSheet;
