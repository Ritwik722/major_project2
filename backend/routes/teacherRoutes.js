const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { uploadDocument, handleUploadError } = require('../middleware/upload');
const auth = require('../middleware/auth');

// Middleware to check if user is a teacher
const isTeacher = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. Only teachers can access this route.' 
    });
  }
};

// Teacher Profile Routes
router.get('/profile', auth, isTeacher, teacherController.getTeacherProfile);
router.put('/profile', auth, isTeacher, teacherController.updateTeacherProfile);

// Class and Student Management Routes
router.get('/classes/:className/students', auth, isTeacher, teacherController.getStudentsByClass);

// Attendance Management Routes
router.post('/attendance', auth, isTeacher, teacherController.markAttendance);
router.get('/attendance/report', auth, isTeacher, teacherController.getAttendanceReport);

// Document Upload Routes
router.post(
  '/upload-document',
  auth,
  isTeacher,
  uploadDocument,
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a document'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          filename: req.file.filename,
          path: req.file.path
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error uploading document',
        error: error.message
      });
    }
  }
);

// Get Teacher's Schedule
router.get('/schedule', auth, isTeacher, async (req, res) => {
  try {
    // Implementation for getting teacher's schedule
    res.json({
      success: true,
      message: 'Schedule retrieved successfully',
      data: [] // Add your schedule data here
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving schedule',
      error: error.message
    });
  }
});

// Get Teacher's Classes
router.get('/classes', auth, isTeacher, async (req, res) => {
  try {
    // Implementation for getting teacher's classes
    res.json({
      success: true,
      message: 'Classes retrieved successfully',
      data: [] // Add your classes data here
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving classes',
      error: error.message
    });
  }
});

module.exports = router;