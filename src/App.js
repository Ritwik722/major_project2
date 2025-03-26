import React, { useState, useEffect } from "react";
import "./style.css";
import StudentPanel from "./components/StudentPanel";
import TeacherPanel from "./components/TeacherPanel";
import RoomList from "./components/RoomList";
import AttendanceSheet from "./components/Attendencesheet";

const generateEnrollmentNumbers = (range) => {
  const [start, end] = range.split("-").map(Number);
  const numbers = [];
  for (let i = start; i <= end; i++) {
    numbers.push(i);
  }
  return numbers;
};


const styles = {
  selector: {
    marginTop: "20px",
  },
  dropdown: {
    padding: "8px",
    marginRight: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  button: {
    padding: "8px 12px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  attendanceSheet: {
    marginTop: "20px",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
  },
};

const App = () => {
  const [selectedPanel, setSelectedPanel] = useState("");
  const [isTeacherLoggedIn, setIsTeacherLoggedIn] = useState(false);
  const [rooms, setRooms] = useState(
    JSON.parse(localStorage.getItem("rooms")) || []
  );
  const [selectedRange, setSelectedRange] = useState("");
  const [showAttendance, setShowAttendance] = useState(false);

  // Handle teacher login state
  const handleTeacherLogin = (isLoggedIn) => {
    setIsTeacherLoggedIn(isLoggedIn);
  };

  // Navigation function for attendance
  const navigateToAttendance = () => {
    setSelectedPanel("attendance");
  };

  // Handle room selection
  const handleRangeChange = (e) => {
    setSelectedRange(e.target.value);
    setShowAttendance(false);
  };

  // Open Attendance Sheet
  const handleOpenAttendance = () => {
    if (selectedRange) {
      setShowAttendance(true);
    } else {
      alert("Please select a range.");
    }
  };

  // Render the appropriate panel
  const renderPanel = () => {
    switch (selectedPanel) {
      case "student":
        return <StudentPanel />;
      case "teacher":
        return <TeacherPanel onLogin={handleTeacherLogin} />;
      case "roomlist":
        return <RoomList />
      case "attendance":
        return <AttendanceSheet />;
      default:
        return <div className="default-panel">Select a panel to access</div>;
    }
  };

  // Render navigation buttons
  const renderNavigationButtons = () => {
    const buttons = [
      { label: "Student Panel", value: "student" },
      { label: "Teacher Panel", value: "teacher" },
      { label: "Room List", value: "roomlist" },
      { label: "Attendance Sheet", value: "attendance" },
    ];

    return buttons.map((button) => (
      <button
        key={button.value}
        className={`nav-button ${selectedPanel === button.value ? "active" : ""}`}
        onClick={() => setSelectedPanel(button.value)}
      >
        {button.label}
      </button>
    ));
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Management System</h1>
        <nav className="navigation">{renderNavigationButtons()}</nav>
      </header>
      <main className="panel-container">{renderPanel()}</main>
    </div>
  );
};

export default App;