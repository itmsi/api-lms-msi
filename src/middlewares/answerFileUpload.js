const multer = require('multer');
const path = require('path');

// Memory storage: file dipegang sebagai buffer, lalu di-upload langsung ke Nextcloud
const storage = multer.memoryStorage();

// File lampiran jawaban quiz: gambar dan dokumen umum
const allowedExtensions = [
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.zip'
];

const fileFilter = (req, file, cb) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  }
});

// Middleware wrapper untuk menangani error multer, file bersifat opsional
const createAnswerFileUploadHandler = (fieldName) => {
  const uploadFile = upload.single(fieldName);

  return (req, res, next) => {
    uploadFile(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Ukuran file terlalu besar. Maksimal 10MB.',
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

const handleAnswerFilesUpload = createAnswerFileUploadHandler('files');

module.exports = { handleAnswerFilesUpload };
