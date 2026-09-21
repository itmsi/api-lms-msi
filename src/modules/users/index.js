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
 * @route   GET /api/users
 * @desc    Get all users with pagination
 */
router.get('/', authorize, listValidation, validateMiddleware, controller.getAll);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 */
router.get('/:id', authorize, getByIdValidation, validateMiddleware, controller.getById);

/**
 * @route   POST /api/users
 * @desc    Create new user
 */
router.post('/', authorize, createValidation, validateMiddleware, controller.create);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 */
router.put('/:id', authorize, updateValidation, validateMiddleware, controller.update);

/**
 * @route   DELETE /api/users/:id
 * @desc    Soft delete user
 */
router.delete('/:id', authorize, getByIdValidation, validateMiddleware, controller.remove);

/**
 * @route   POST /api/users/:id/restore
 * @desc    Restore soft deleted user
 */
router.post('/:id/restore', authorize, getByIdValidation, validateMiddleware, controller.restore);

module.exports = router;
