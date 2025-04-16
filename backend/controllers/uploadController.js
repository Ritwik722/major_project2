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

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        fieldSize: 100 * 1024 * 1024 // 100MB limit for form fields
    },
    fileFilter: fileFilter
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

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // File upload successful
        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                originalname: req.file.originalname,
                filename: req.file.filename,
                path: `/uploads/${req.file.filename}`,
                mimetype: req.file.mimetype,
                size: req.file.size
            }
        });
    });
};

// Add new endpoint for student photo upload
exports.uploadStudentPhoto = (req, res) => {
    const uploadPhoto = upload.single('studentPhoto');

    uploadPhoto(req, res, function (err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err instanceof multer.MulterError ? 
                    `Upload error: ${err.message}` : err.message
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No photo uploaded'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Student photo uploaded successfully',
            file: {
                originalname: req.file.originalname,
                filename: req.file.filename,
                path: `/uploads/photos/${req.file.filename}`,
                mimetype: req.file.mimetype,
                size: req.file.size
            }
        });
    });
};