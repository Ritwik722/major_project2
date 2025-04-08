const express = require('express');
const router = express.Router();
const SignatureService = require('../services/SignatureService');
const CryptoService = require('../services/CryptoService');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, 'unknown-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Upload signature
router.post('/upload', upload.single('signature'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No signature file uploaded'
      });
    }

    res.json({
      success: true,
      message: 'Signature uploaded successfully',
      filePath: '/' + req.file.path.replace(/\\/g, '/')
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Verify student signature
router.post('/verify', async (req, res) => {
  try {
    const { studentId, signature } = req.body;
    
    if (!studentId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and signature are required'
      });
    }

    let signatureBuffer;
    
    // Handle file path (with or without leading slash)
    if (signature.includes('uploads/') || signature.includes('uploads\\')) {
      // Remove leading slash if present and normalize path
      const normalizedPath = signature.replace(/^\//, '');
      const filePath = path.join(__dirname, '..', normalizedPath);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('Signature file not found');
      }
      
      signatureBuffer = fs.readFileSync(filePath);
    }
    // Handle base64 data
    else if (signature.startsWith('data:')) {
      signatureBuffer = Buffer.from(signature.split(',')[1], 'base64');
    } else {
      throw new Error('Invalid signature format');
    }
    
    const result = await SignatureService.verifySignature(studentId, signatureBuffer);
    
    res.json({
      success: true,
      isValid: result.isValid,
      similarity: result.similarity,
      message: `Signature verification ${result.isValid ? 'successful' : 'failed'}`
    });
  } catch (error) {
    console.error('Signature verification error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Signature verification failed'
    });
  }
});

// Generate new keys for a student
router.post('/generate-keys', async (req, res) => {
  try {
    const { studentId } = req.body;
    const keys = await CryptoService.generateAndStoreKeys(studentId);
    
    res.json({
      success: true,
      message: 'Keys generated successfully',
      publicKey: keys.publicKey
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;