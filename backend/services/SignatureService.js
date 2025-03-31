// services/SignatureService.js
const Jimp = require('jimp');
const crypto = require('crypto');
const Student = require('../models/Student');

class SignatureService {
  async verifySignature(studentId, imageBuffer) {
    try {
      const student = await Student.findOne({ student_id: studentId });
      if (!student) throw new Error('Student not found');

      // Cryptographic Verification
      const verifier = crypto.createVerify('SHA256');
      verifier.update(imageBuffer);
      const isValid = verifier.verify(
        student.public_key,
        student.digital_signature,
        'base64'
      );

      // Visual Verification
      const similarity = await this.compareSignatures(
        student.signature_path, 
        imageBuffer
      );

      return { isValid, similarity };
    } catch (error) {
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  async compareSignatures(storedPath, newBuffer) {
    const [storedImg, newImg] = await Promise.all([
      Jimp.read(storedPath),
      Jimp.read(newBuffer)
    ]);
    
    storedImg.resize(300, 150).grayscale();
    newImg.resize(300, 150).grayscale();

    let matchingPixels = 0;
    storedImg.scan(0, 0, storedImg.bitmap.width, storedImg.bitmap.height, (x, y, idx) => {
      if (Math.abs(storedImg.bitmap.data[idx] - newImg.bitmap.data[idx]) < 25) {
        matchingPixels++;
      }
    });

    return matchingPixels / (storedImg.bitmap.width * storedImg.bitmap.height);
  }
}

module.exports = new SignatureService();
