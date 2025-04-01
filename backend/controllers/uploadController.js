const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const studentId = req.body.studentId || 'unknown';
        const fileExt = path.extname(file.originalname);
        cb(null, `${studentId}-${Date.now()}${fileExt}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
});

exports.uploadFile = (req, res) => {
    const uploadSingle = upload.single('file');

    uploadSingle(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: `Multer upload error: ${err.message}`
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        // File upload successful
        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                filename: req.file.filename,
                path: req.file.path
            }
        });
    });
};