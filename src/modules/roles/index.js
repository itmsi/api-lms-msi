const express = require('express');
const router = express.Router();
const controller = require('./controller');
const {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation,
  syncPermissionsValidation
} = require('./validation');
const { validateMiddleware } = require('../../middlewares/validation');
const { authenticate, authorize } = require('../../middlewares/auth');

router.use(authenticate);

/**
 * @route   POST /api/roles/get
 * @desc    Get all roles with pagination
 */
router.post('/get', authorize, listValidation, validateMiddleware, controller.getAll);

/**
 * @route   GET /api/roles/:id
 * @desc    Get role by ID (termasuk daftar hak akses)
 */
router.get('/:id', authorize, getByIdValidation, validateMiddleware, controller.getById);

/**
 * @route   POST /api/roles/create
 * @desc    Create new role
 */
router.post('/create', authorize, createValidation, validateMiddleware, controller.create);

/**
 * @route   PUT /api/roles/:id
 * @desc    Update role
 */
router.put('/:id', authorize, updateValidation, validateMiddleware, controller.update);

/**
 * @route   PUT /api/roles/:id/permissions
 * @desc    Sync hak akses role
 */
router.put('/:id/permissions', authorize, syncPermissionsValidation, validateMiddleware, controller.syncPermissions);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Soft delete role
 */
router.delete('/:id', authorize, getByIdValidation, validateMiddleware, controller.remove);

/**
 * @route   POST /api/roles/:id/restore
 * @desc    Restore soft deleted role
 */
router.post('/:id/restore', authorize, getByIdValidation, validateMiddleware, controller.restore);

module.exports = router;
