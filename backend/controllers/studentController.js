const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
const forge = require('node-forge');

exports.registerStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET);
    res.status(201).json({ student, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.generateSignatureKeys = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const keyPair = student.generateKeyPair();
    await student.save();

    res.json({
      success: true,
      message: 'Digital signature keys generated successfully',
      publicKey: keyPair.publicKey
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating signature keys',
      error: error.message
    });
  }
};

exports.signDocument = async (req, res) => {
  try {
    const { documentData } = req.body;
    if (!documentData) {
      return res.status(400).json({
        success: false,
        message: 'Document data is required'
      });
    }

    const student = await Student.findById(req.user.id).select('+privateKey');
    
    if (!student || !student.privateKey) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or signature keys not generated'
      });
    }

    const signature = student.createDigitalSignature(documentData);
    student.digitalSignature = signature;
    student.isSignatureVerified = true;
    await student.save();

    res.json({
      success: true,
      message: 'Document signed successfully',
      signature: signature
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error signing document',
      error: error.message
    });
  }
};

exports.verifySignature = async (req, res) => {
  try {
    const { documentData, signature, studentId } = req.body;
    
    if (!documentData || !signature || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Document data, signature, and student ID are required'
      });
    }

    const student = await Student.findById(studentId);
    
    if (!student || !student.publicKey) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or signature keys not generated'
      });
    }

    const isValid = student.verifySignature(documentData, signature);

    res.json({
      success: true,
      isValid: isValid,
      message: isValid ? 'Signature is valid' : 'Signature is invalid'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying signature',
      error: error.message
    });
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
