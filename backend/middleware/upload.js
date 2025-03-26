const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let uploadPath = 'uploads/';
    
    // Set different paths based on file type
    if (file.fieldname === 'studentPhoto') {
      uploadPath += 'photos/';
    } else if (file.fieldname === 'signature') {
      uploadPath += 'signatures/';
    } else if (file.fieldname === 'document') {
      uploadPath += 'documents/';
    }
    
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'studentPhoto' || file.fieldname === 'signature') {
    // Allow only image files for photos and signatures
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Please upload an image file'), false);
    }
  } else if (file.fieldname === 'document') {
    // Allow PDF and document files
    if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
      return cb(new Error('Please upload a PDF or document file'), false);
    }
  }
  cb(null, true);
};

// Configure upload settings
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload middleware functions
exports.uploadStudentPhoto = upload.single('studentPhoto');
exports.uploadSignature = upload.single('signature');
exports.uploadDocument = upload.single('document');

// Multiple file upload
exports.uploadMultiple = upload.fields([
  { name: 'studentPhoto', maxCount: 1 },
  { name: 'signature', maxCount: 1 }
]);

// Error handling middleware
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size is too large. Max limit is 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Clean filename for security
exports.cleanFileName = (fileName) => {
  return fileName.replace(/[^a-zA-Z0-9]/g, '_');
};

// Get file path
exports.getFilePath = (fileName, type) => {
  let basePath = 'uploads/';
  switch(type) {
    case 'photo':
      basePath += 'photos/';
      break;
    case 'signature':
      basePath += 'signatures/';
      break;
    case 'document':
      basePath += 'documents/';
      break;
    default:
      throw new Error('Invalid file type');
  }
  return path.join(basePath, fileName);
};

