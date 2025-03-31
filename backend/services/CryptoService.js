// services/CryptoService.js
const crypto = require('crypto');
const fs = require('fs');
const Student = require('../models/Student'); // Adjust th

class CryptoService {
  async generateAndStoreKeys(studentId) {
    try {
      const existingStudent = await Student.findOne({ student_id: studentId });
      if (existingStudent) throw new Error('Student already exists');

      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });

      // Save to database
      const newStudent = new Student({
        student_id: studentId,
        public_key: publicKey,
        private_key: privateKey
      });
      await newStudent.save();

      // Save to filesystem
      fs.mkdirSync('keys', { recursive: true });
      fs.writeFileSync(`keys/${studentId}_private.pem`, privateKey);
      fs.writeFileSync(`keys/${studentId}_public.pem`, publicKey);

      return { publicKey, privateKey };
    } catch (error) {
      throw new Error(`Key generation failed: ${error.message}`);
    }
  }
}

module.exports = new CryptoService();
