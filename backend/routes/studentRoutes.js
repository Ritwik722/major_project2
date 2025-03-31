const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const Student = require('../models/Student');

router.post('/register', studentController.registerStudent);
router.post('/login', studentController.loginStudent);
router.put('/update', auth, studentController.updateStudent);

// Fetch all students
router.get('/', authController.getAllStudents);
router.delete('/:enrollmentNumber', authController.deleteStudent);

// Remove or comment out the existing update route that's not working
// router.put('/students/:enrollmentNumber' ...)

// Fix the update route path
router.put('/update/:enrollmentNumber', async (req, res) => {
  try {
    const { enrollmentNumber } = req.params;
    const updateData = req.body;

    const updatedStudent = await Student.findOneAndUpdate(
      { enrollmentNumber },
      updateData,
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Student updated successfully',
      data: updatedStudent 
    });
    
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating student',
      error: error.message 
    });
  }
});

module.exports = router;