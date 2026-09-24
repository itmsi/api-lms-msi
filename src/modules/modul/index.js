const express = require('express');
const router = express.Router();
const controller = require('./controller');
const {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation,
  createAllValidation,
  updateAllValidation,
  deleteAllValidation
} = require('./validation');
const { validateMiddleware } = require('../../middlewares/validation');
const { authenticate, authorize } = require('../../middlewares/auth');
const { handleBannerUpload } = require('../../middlewares/imageUpload');

router.use(authenticate);

/**
 * @route   POST /api/modules/get
 * @desc    Get all modules with pagination
 * @access  Protected (hak akses modules.*)
 */
router.post(
  '/get',
  authorize,
  listValidation,
  validateMiddleware,
  controller.getAll
);

/**
 * @route   POST /api/modules/get-list
 * @desc    Get all modules with pagination (sama seperti /get)
 * @access  Protected (hak akses modules.*)
 */
router.post(
  '/get-list',
  authorize,
  listValidation,
  validateMiddleware,
  controller.getAll
);

/**
 * @route   GET /api/modules/get/:id
 * @desc    Get module by ID beserta daftar chapter-nya (sama seperti GET /:id)
 * @access  Protected (hak akses modules.*)
 */
router.get(
  '/get/:id',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.getById
);

/**
 * @route   GET /api/modules/:id
 * @desc    Get module by ID (beserta daftar chapter-nya)
 * @access  Protected (hak akses modules.*)
 */
router.get(
  '/:id',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.getById
);

/**
 * @route   POST /api/modules/create
 * @desc    Create new module (multipart/form-data, field file: banner)
 * @access  Protected (hak akses modules.*)
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
 * @route   PUT /api/modules/:id
 * @desc    Update module (multipart/form-data, field file: banner opsional)
 * @access  Protected (hak akses modules.*)
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
 * @route   DELETE /api/modules/:id
 * @desc    Soft delete module
 * @access  Protected (hak akses modules.*)
 */
router.delete(
  '/:id',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.remove
);

/**
 * @route   POST /api/modules/:id/restore
 * @desc    Restore soft deleted module
 * @access  Protected (hak akses modules.*)
 */
router.post(
  '/:id/restore',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.restore
);

/**
 * @route   POST /api/modules/create-all
 * @desc    Create module + chapters sekaligus (multipart/form-data, field file: banner,
 *          field chapters: string JSON array chapter)
 * @access  Protected (hak akses modules.*)
 */
router.post(
  '/create-all',
  authorize,
  handleBannerUpload,
  createAllValidation,
  validateMiddleware,
  controller.createAll
);

/**
 * @route   PUT /api/modules/update-all/:id
 * @desc    Update module + upsert chapters sekaligus (multipart/form-data, field file: banner
 *          opsional, field chapters: string JSON array chapter, item ber-id = update, tanpa id = chapter baru)
 * @access  Protected (hak akses modules.*)
 */
router.put(
  '/update-all/:id',
  authorize,
  handleBannerUpload,
  updateAllValidation,
  validateMiddleware,
  controller.updateAll
);

/**
 * @route   DELETE /api/modules/delete-all/:id
 * @desc    Soft delete module beserta seluruh chapter-nya sekaligus
 * @access  Protected (hak akses modules.*)
 */
router.delete(
  '/delete-all/:id',
  authorize,
  deleteAllValidation,
  validateMiddleware,
  controller.removeAll
);

module.exports = router;
