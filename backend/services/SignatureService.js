// services/SignatureService.js
const Jimp = require('jimp');
const Student = require('../models/Student');
const path = require('path');
const fs = require('fs');

class SignatureService {
  async verifySignature(studentId, imageBuffer) {
    try {
      // Find student by enrollment number
      const student = await Student.findOne({ enrollmentNumber: studentId });
      if (!student) {
        throw new Error('Student not found');
      }

      if (!student.signature) {
        throw new Error('No signature on file for this student');
      }

      // Visual Verification using image comparison
      const similarity = await this.compareSignatures(
        path.join(__dirname, '..', student.signature.replace(/^\//, '')), 
        imageBuffer
      );

      // Consider a signature valid if similarity is above 70%
      const isValid = similarity > 0.7;

      return { 
        isValid, 
        similarity,
        message: isValid ? 'Signature matches' : 'Signature does not match'
      };
    } catch (error) {
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  async compareSignatures(storedPath, newBuffer) {
    try {
      // Read stored image
      const storedBuffer = fs.readFileSync(storedPath);
      
      // Create Jimp images from buffers
      const storedImg = await Jimp.read(storedBuffer);
      const newImg = await Jimp.read(newBuffer);
      
      // Normalize both images to same size and convert to grayscale
      storedImg.resize(300, 150).grayscale();
      newImg.resize(300, 150).grayscale();

      let matchingPixels = 0;
      const totalPixels = 300 * 150;  // Based on our resize dimensions

      // Compare each pixel
      for (let x = 0; x < 300; x++) {
        for (let y = 0; y < 150; y++) {
          const pixel1 = Jimp.intToRGBA(storedImg.getPixelColor(x, y));
          const pixel2 = Jimp.intToRGBA(newImg.getPixelColor(x, y));
          
          // Compare grayscale values (since we converted to grayscale, R=G=B)
          if (Math.abs(pixel1.r - pixel2.r) < 25) {
            matchingPixels++;
          }
        }
      }

      return matchingPixels / totalPixels;
    } catch (error) {
      throw new Error(`Image comparison failed: ${error.message}`);
    }
  }
}

module.exports = new SignatureService();
