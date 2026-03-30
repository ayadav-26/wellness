const multer = require('multer');

/**
 * Multer configuration for profile image uploads
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Supported formats: JPG, JPEG, PNG
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, JPEG, and PNG are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit
    }
});

module.exports = upload;
