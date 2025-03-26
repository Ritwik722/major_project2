const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

exports.registerStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET);
    res.status(201).json({ student, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


exports.loginStudent = async (req, res) => {
  try {
    const { enrollmentNumber, password } = req.body;
    const student = await Student.findOne({ enrollmentNumber });

    if (!student || !(await student.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET);
    res.json({ student, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
