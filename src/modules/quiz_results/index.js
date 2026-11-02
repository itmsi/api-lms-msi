const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { listValidation } = require("./validation");
const { validateMiddleware } = require("../../middlewares/validation");
const { authenticate, authorize } = require("../../middlewares/auth");

router.use(authenticate);

/**
 * @route   POST /api/lms/quiz_results/get
 * @desc    Get all hasil pengerjaan quiz (quiz_users join quizzes & modules) with pagination
 *          (filter opsional: quizzes_id, status)
 * @access  Protected (hak akses quiz-results.read)
 */
router.post(
  "/get",
  authorize,
  listValidation,
  validateMiddleware,
  controller.getAll,
);

module.exports = router;
