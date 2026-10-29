const multer = require('multer');
const path = require('path');

// Memory storage: file dipegang sebagai buffer, lalu di-upload langsung ke Nextcloud
const storage = multer.memoryStorage();

const allowedTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const fileFilter = (req, file, cb) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
});

// Middleware wrapper untuk menangani error multer, file bersifat opsional
const createImageUploadHandler = (fieldName) => {
  const uploadFile = upload.single(fieldName);

  return (req, res, next) => {
    uploadFile(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Ukuran file terlalu besar. Maksimal 5MB.',
            timestamp: new Date().toISOString()
          });
        }
        return res.status(400).json({
          success: false,
          message: `Gagal upload ${fieldName}`,
          errors: err.message,
          timestamp: new Date().toISOString()
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: `Format file ${fieldName} tidak valid`,
          errors: err.message,
          timestamp: new Date().toISOString()
        });
      }
      next();
    });
  };
};

const handleBannerUpload = createImageUploadHandler('banner');
const handleImageUpload = createImageUploadHandler('image');

module.exports = { handleBannerUpload, handleImageUpload };
