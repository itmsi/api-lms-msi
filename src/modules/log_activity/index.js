const express = require('express');
const router = express.Router();
const controller = require('./controller');
const {
  createValidation,
  listValidation
} = require('./validation');
const { validateMiddleware } = require('../../middlewares/validation');
const { authenticate, authorize } = require('../../middlewares/auth');

router.use(authenticate);

/**
 * @route   POST /api/log-activity/get
 * @desc    Get all log activity with pagination (filter opsional: modules_id)
 * @access  Protected (hak akses log-activity.*)
 */
router.post(
  '/get',
  authorize,
  listValidation,
  validateMiddleware,
  controller.getAll
);

/**
 * @route   POST /api/log-activity/create
 * @desc    Create new log activity
 * @access  Protected (hak akses log-activity.*)
 */
router.post(
  '/create',
  authorize,
  createValidation,
  validateMiddleware,
  controller.create
);

module.exports = router;
