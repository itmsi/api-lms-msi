const express = require('express');
const router = express.Router();
const controller = require('./controller');
const {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation
} = require('./validation');
const { validateMiddleware } = require('../../middlewares/validation');
const { authenticate, authorize } = require('../../middlewares/auth');
const { handleBannerUpload } = require('../../middlewares/imageUpload');

router.use(authenticate);

/**
 * @route   POST /api/lms/quizzes/get
 * @desc    Get all quizzes with pagination (filter opsional: modules_id, type)
 * @access  Protected (hak akses quizzes.*)
 */
router.post(
  '/get',
  authorize,
  listValidation,
  validateMiddleware,
  controller.getAll
);

/**
 * @route   GET /api/lms/quizzes/:id
 * @desc    Get quiz by ID
 * @access  Protected (hak akses quizzes.*)
 */
router.get(
  '/:id',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.getById
);

/**
 * @route   POST /api/lms/quizzes/create
 * @desc    Create new quiz (multipart/form-data, field file: banner)
 * @access  Protected (hak akses quizzes.*)
 */
router.post(
  '/create',
  authorize,
  handleBannerUpload,
  createValidation,
  validateMiddleware,
  controller.create
);

/**
 * @route   PUT /api/lms/quizzes/:id
 * @desc    Update quiz (multipart/form-data, field file: banner opsional)
 * @access  Protected (hak akses quizzes.*)
 */
router.put(
  '/:id',
  authorize,
  handleBannerUpload,
  updateValidation,
  validateMiddleware,
  controller.update
);

/**
 * @route   DELETE /api/lms/quizzes/:id
 * @desc    Soft delete quiz
 * @access  Protected (hak akses quizzes.*)
 */
router.delete(
  '/:id',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.remove
);

/**
 * @route   POST /api/lms/quizzes/:id/restore
 * @desc    Restore soft deleted quiz
 * @access  Protected (hak akses quizzes.*)
 */
router.post(
  '/:id/restore',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.restore
);

module.exports = router;
