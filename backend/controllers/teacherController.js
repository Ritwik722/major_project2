const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Room = require('../models/Room');

// Get Teacher Profile
exports.getTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id).select('-password');
    res.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// Update Teacher Profile
exports.updateTeacherProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      department: req.body.department,
      subjects: req.body.subjects,
      classes: req.body.classes,
    };

    const teacher = await Teacher.findByIdAndUpdate(
      req.user.id,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// Get Students by Class
exports.getStudentsByClass = async (req, res) => {
  try {
    const { className } = req.params;
    const students = await Student.find({ 
      year: className.split('-')[0],
      section: className.split('-')[1]
    }).select('-password');

    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// Mark Attendance
exports.markAttendance = async (req, res) => {
  try {
    const { date, studentIds, status, subject } = req.body;
    
    // Validate required fields
    if (!date || !studentIds || !status || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Create attendance records
    const attendanceRecords = studentIds.map(studentId => ({
      student: studentId,
      teacher: req.user.id,
      date,
      status,
      subject,
    }));

    // Save attendance records
    await Attendance.insertMany(attendanceRecords);

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// Get Attendance Report
exports.getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, className, subject } = req.query;
    
    const query = {
      teacher: req.user.id,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (subject) query.subject = subject;

    const attendanceData = await Attendance.find(query)
      .populate('student', 'name enrollmentNumber')
      .sort({ date: 1 });

    res.json({
      success: true,
      count: attendanceData.length,
      data: attendanceData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};
