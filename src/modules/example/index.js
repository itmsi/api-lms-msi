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
 * @route   GET /api/examples
 * @desc    Get all examples with pagination
 * @access  Protected (hak akses examples.*)
 */
router.get(
  '/',
  authorize,
  listValidation,
  validateMiddleware,
  controller.getAll
);

/**
 * @route   GET /api/examples/:id
 * @desc    Get example by ID
 * @access  Protected (hak akses examples.*)
 */
router.get(
  '/:id',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.getById
);

/**
 * @route   POST /api/examples
 * @desc    Create new example
 * @access  Protected (hak akses examples.*)
 */
router.post(
  '/',
  authorize,
  createValidation,
  validateMiddleware,
  controller.create
);

/**
 * @route   PUT /api/examples/:id
 * @desc    Update example
 * @access  Protected (hak akses examples.*)
 */
router.put(
  '/:id',
  authorize,
  updateValidation,
  validateMiddleware,
  controller.update
);

/**
 * @route   DELETE /api/examples/:id
 * @desc    Soft delete example
 * @access  Protected (hak akses examples.*)
 */
router.delete(
  '/:id',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.remove
);

/**
 * @route   POST /api/examples/:id/restore
 * @desc    Restore soft deleted example
 * @access  Protected (hak akses examples.*)
 */
router.post(
  '/:id/restore',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.restore
);

module.exports = router;

