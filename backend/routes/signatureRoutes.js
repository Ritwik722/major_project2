// routes/signatureRoutes.js
const express = require('express');
const router = express.Router();
const signatureController = require('../controllers/SignatureController');

router.post('/sign', signatureController.handleSignature);
router.post('/verify', signatureController.verifySignature);

module.exports = router;
