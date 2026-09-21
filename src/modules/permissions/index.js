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
 * @route   POST /api/permissions/get
 * @desc    Get all permissions with pagination
 */
router.post('/get', authorize, listValidation, validateMiddleware, controller.getAll);

/**
 * @route   GET /api/permissions/:id
 * @desc    Get permission by ID
 */
router.get('/:id', authorize, getByIdValidation, validateMiddleware, controller.getById);

/**
 * @route   POST /api/permissions/create
 * @desc    Create new permission
 */
router.post('/create', authorize, createValidation, validateMiddleware, controller.create);

/**
 * @route   PUT /api/permissions/:id
 * @desc    Update permission
 */
router.put('/:id', authorize, updateValidation, validateMiddleware, controller.update);

/**
 * @route   DELETE /api/permissions/:id
 * @desc    Soft delete permission
 */
router.delete('/:id', authorize, getByIdValidation, validateMiddleware, controller.remove);

/**
 * @route   POST /api/permissions/:id/restore
 * @desc    Restore soft deleted permission
 */
router.post('/:id/restore', authorize, getByIdValidation, validateMiddleware, controller.restore);

module.exports = router;
