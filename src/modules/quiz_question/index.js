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
const { handleImageUpload } = require('../../middlewares/imageUpload');

router.use(authenticate);

/**
 * @route   POST /api/lms/quiz-questions/get
 * @desc    Get all quiz questions with pagination (filter opsional: quizzes_id, type)
 * @access  Protected (hak akses quiz-questions.*)
 */
router.post(
  '/get',
  authorize,
  listValidation,
  validateMiddleware,
  controller.getAll
);

/**
 * @route   GET /api/lms/quiz-questions/:id
 * @desc    Get quiz question by ID
 * @access  Protected (hak akses quiz-questions.*)
 */
router.get(
  '/:id',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.getById
);

/**
 * @route   POST /api/lms/quiz-questions/create
 * @desc    Create new quiz question (multipart/form-data, field file: image)
 * @access  Protected (hak akses quiz-questions.*)
 */
router.post(
  '/create',
  authorize,
  handleImageUpload,
  createValidation,
  validateMiddleware,
  controller.create
);

/**
 * @route   PUT /api/lms/quiz-questions/:id
 * @desc    Update quiz question (multipart/form-data, field file: image)
 * @access  Protected (hak akses quiz-questions.*)
 */
router.put(
  '/:id',
  authorize,
  handleImageUpload,
  updateValidation,
  validateMiddleware,
  controller.update
);

/**
 * @route   DELETE /api/lms/quiz-questions/:id
 * @desc    Soft delete quiz question
 * @access  Protected (hak akses quiz-questions.*)
 */
router.delete(
  '/:id',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.remove
);

/**
 * @route   POST /api/lms/quiz-questions/:id/restore
 * @desc    Restore soft deleted quiz question
 * @access  Protected (hak akses quiz-questions.*)
 */
router.post(
  '/:id/restore',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.restore
);

module.exports = router;
