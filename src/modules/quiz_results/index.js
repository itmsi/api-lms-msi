const express = require("express");
const router = express.Router();
const controller = require("./controller");
const {
  getByIdValidation,
  updateAdminPointsValidation,
  listValidation,
} = require("./validation");
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

/**
 * @route   GET /api/lms/quiz_results/:id
 * @desc    Get hasil pengerjaan quiz by ID (quiz_users.id) beserta seluruh soal dan jawaban user
 * @access  Protected (hak akses quiz-results.detail)
 */
router.get(
  "/:id",
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.getById,
);

/**
 * @route   PUT /api/lms/quiz_results/:id
 * @desc    Update nilai beberapa jawaban oleh admin (id = quiz_users.id, body: array quiz_answer_id & admin_points),
 *          lalu rekap quiz_users dihitung ulang
 * @access  Protected (hak akses quiz-results.update)
 */
router.put(
  "/:id",
  authorize,
  updateAdminPointsValidation,
  validateMiddleware,
  controller.updateAdminPoints,
);

/**
 * @route   POST /api/lms/quiz_results/:id/regrade
 * @desc    Penilaian ulang seluruh jawaban pada hasil quiz (id = quiz_users.id), short_answer dikirim ulang ke API AI
 * @access  Protected (hak akses quiz-results.regrade)
 */
router.post(
  "/:id/regrade",
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.regrade,
);

module.exports = router;
