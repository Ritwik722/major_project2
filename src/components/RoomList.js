import React, { useState, useEffect } from "react";

const RoomList = ({ onOpenAttendanceSheet }) => {
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editRoom, setEditRoom] = useState(null);
  const [form, setForm] = useState({ number: "", range: "" });
  const [showModal, setShowModal] = useState(false);

  // Load rooms from the API on component mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/rooms", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        setRooms(Array.isArray(data) ? data : data.rooms || []);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };

    fetchRooms();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const calculateCapacity = (range) => {
    const [start, end] = range.split("-").map(Number);
    return end - start + 1;
  };

  const handleAddRoom = async () => {
    if (form.number && form.range) {
      const capacity = calculateCapacity(form.range);
      if (capacity > 50) {
        alert("Room capacity cannot exceed 50 students.");
        return;
      }
      try {
        const response = await fetch("http://localhost:5000/api/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ ...form, capacity }), // Add capacity
        });
        const newRoom = await response.json();
        setRooms((prevRooms) => [...prevRooms, newRoom]);
        setForm({ number: "", range: "" });
      } catch (error) {
        console.error("Error adding room:", error);
      }
    }
  };

  const handleEditRoom = (room) => {
    setEditRoom(room);
    setForm({ number: room.number, range: room.range });
    setShowModal(true);
  };

  const handleSaveEdit = async () => {
    const capacity = calculateCapacity(form.range);
    if (capacity > 50) {
      alert("Room capacity cannot exceed 50 students.");
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/rooms/${editRoom._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ...form, capacity }), // Add capacity
      });
      const updatedRoom = await response.json();
      setRooms((prevRooms) =>
        prevRooms.map((room) => (room._id === editRoom._id ? updatedRoom : room))
      );
      setEditRoom(null);
      setShowModal(false);
      setForm({ number: "", range: "" });
    } catch (error) {
      console.error("Error updating room:", error);
    }
  };
  

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      try {
        await fetch(`http://localhost:5000/api/rooms/${roomId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setRooms((prevRooms) => prevRooms.filter((room) => room._id !== roomId));
      } catch (error) {
        console.error("Error deleting room:", error);
      }
    }
  };

  const handleViewAttendance = (range) => {
    if (onOpenAttendanceSheet) {
      onOpenAttendanceSheet(range);
    }
  };

  const filteredRooms = Array.isArray(rooms) ? rooms.filter(
    (room) => room?.number?.toString().includes(searchTerm) || room?.range?.includes(searchTerm)
  ) : [];
  
  return (
    <div style={styles.container}>
      <h1>Room List</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by Room Number or Range"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.input}
      />

      {/* Add Room Form */}
      <div style={styles.form}>
        <input
          type="text"
          name="number"
          placeholder="Room Number"
          value={form.number}
          onChange={handleInputChange}
          style={styles.input}
        />
        <input
          type="text"
          name="range"
          placeholder="Enrollment Number Range (e.g., 1001-1100)"
          value={form.range}
          onChange={handleInputChange}
          style={styles.input}
        />
        <button onClick={handleAddRoom} style={styles.button}>
          Add Room
        </button>
      </div>

      {/* Room Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.header}>Room Number</th>
            <th style={styles.header}>Enrollment Range</th>
            <th style={styles.header}>Capacity</th>
            <th style={styles.header}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRooms.map((room, index) => (
            <tr key={index}>
              <td style={styles.cell}>{room.number}</td>
              <td style={styles.cell}>
                <button
                  onClick={() => handleViewAttendance(room.range)}
                  style={styles.linkButton}
                >
                  {room.range}
                </button>
              </td>
              <td style={styles.cell}>{calculateCapacity(room.range)}</td>
              <td style={styles.cell}>
                <button
                  onClick={() => handleEditRoom(room)}
                  style={styles.button}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteRoom(room._id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>Edit Room</h2>
            <input
              type="text"
              name="number"
              placeholder="Room Number"
              value={form.number}
              onChange={handleInputChange}
              style={styles.input}
            />
            <input
              type="text"
              name="range"
              placeholder="Enrollment Number Range"
              value={form.range}
              onChange={handleInputChange}
              style={styles.input}
            />
            <div>
              <button onClick={handleSaveEdit} style={styles.button}>
                Save
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
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
  form: {
    marginBottom: "20px",
  },
  input: {
    padding: "8px",
    marginRight: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  button: {
    padding: "8px 12px",
    margin: "0 5px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "8px 12px",
    margin: "0 5px",
    backgroundColor: "#FF4D4D",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  linkButton: {
    padding: "5px 10px",
    backgroundColor: "transparent",
    color: "#007BFF",
    border: "none",
    textDecoration: "underline",
    cursor: "pointer",
  },
  cancelButton: {
    padding: "8px 12px",
    backgroundColor: "#CCCCCC",
    color: "#000",
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
};

export default RoomList;