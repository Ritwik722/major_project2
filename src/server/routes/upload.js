const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads/studentPhotos'));
    },
    filename: (req, file, cb) => {
        const enrollmentNumber = req.body.enrollmentNumber || 'unknown';
        cb(null, `${enrollmentNumber}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

router.post('/upload-photo', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({
        message: 'Photo uploaded successfully',
        filepath: req.file.path
    });
});

module.exports = router;
