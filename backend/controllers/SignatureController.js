// controllers/SignatureController.js
const CryptoService = require('../services/CryptoService');
const SignatureService = require('../services/SignatureService');
const Student = require('../models/Student');

exports.handleSignature = async (req, res) => {
  try {
    const { studentId, signatureData } = req.body;
    const imageBuffer = Buffer.from(signatureData, 'base64');

    // Generate keys if new student
    if (!await Student.exists({ student_id: studentId })) {
      await CryptoService.generateAndStoreKeys(studentId);
    }

    // Save signature
    const signaturePath = `signatures/${studentId}.png`;
    await require('fs').promises.writeFile(signaturePath, imageBuffer);
    
    await Student.updateOne(
      { student_id: studentId },
      { $set: { signature_path: signaturePath } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifySignature = async (req, res) => {
  try {
    const { studentId, signatureData } = req.body;
    const result = await SignatureService.verifySignature(
      studentId,
      Buffer.from(signatureData, 'base64')
    );
    
    res.json({
      valid: result.isValid && result.similarity > 0.7,
      similarity: result.similarity
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
