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

router.use(authenticate);

/**
 * @route   POST /api/chapters/get
 * @desc    Get all chapters with pagination (filter opsional: modules_id)
 * @access  Protected (hak akses chapters.*)
 */
router.post(
  '/get',
  authorize,
  listValidation,
  validateMiddleware,
  controller.getAll
);

/**
 * @route   GET /api/chapters/:id
 * @desc    Get chapter by ID
 * @access  Protected (hak akses chapters.*)
 */
router.get(
  '/:id',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.getById
);

/**
 * @route   POST /api/chapters/create
 * @desc    Create new chapter
 * @access  Protected (hak akses chapters.*)
 */
router.post(
  '/create',
  authorize,
  createValidation,
  validateMiddleware,
  controller.create
);

/**
 * @route   PUT /api/chapters/:id
 * @desc    Update chapter
 * @access  Protected (hak akses chapters.*)
 */
router.put(
  '/:id',
  authorize,
  updateValidation,
  validateMiddleware,
  controller.update
);

/**
 * @route   DELETE /api/chapters/:id
 * @desc    Soft delete chapter
 * @access  Protected (hak akses chapters.*)
 */
router.delete(
  '/:id',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.remove
);

/**
 * @route   POST /api/chapters/:id/restore
 * @desc    Restore soft deleted chapter
 * @access  Protected (hak akses chapters.*)
 */
router.post(
  '/:id/restore',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.restore
);

module.exports = router;
