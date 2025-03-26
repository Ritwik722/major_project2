const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

exports.loginTeacher = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    // Check if teacher exists
    const teacher = await Teacher.findOne({ employeeId });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ id: teacher._id, role: 'teacher' }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(200).json({ success: true, token, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Register Student
exports.registerStudent = async (req, res) => {
  try {
    const { enrollmentNumber, email } = req.body;

    // Check if student already exists
    const studentExists = await Student.findOne({ 
      $or: [{ enrollmentNumber }, { email }] 
    });

    if (studentExists) {
      return res.status(400).json({
        success: false,
        message: 'Student already exists with this enrollment number or email',
      });
    }

    const student = await Student.create(req.body);
    
    const token = generateToken(student._id, 'student');

    res.status(201).json({
      success: true,
      data: {
        _id: student._id,
        name: student.name,
        enrollmentNumber: student.enrollmentNumber,
        email: student.email,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// Login User (Student/Teacher)
exports.login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    let user;
    if (role === 'student') {
      user = await Student.findOne({ enrollmentNumber: username });
    } else if (role === 'teacher') {
      user = await Teacher.findOne({ employeeId: username });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Update last login time for teachers
    if (role === 'teacher') {
      user.lastLogin = new Date();
      await user.save();
    }

    const token = generateToken(user._id, role);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    let user;
    if (req.user.role === 'student') {
      user = await Student.findById(req.user.id).select('-password');
    } else {
      user = await Teacher.findById(req.user.id).select('-password');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    let user;
    if (req.user.role === 'student') {
      user = await Student.findById(req.user.id);
    } else {
      user = await Teacher.findById(req.user.id);
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};
