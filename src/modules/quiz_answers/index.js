const express = require('express');
const router = express.Router();
const controller = require('./controller');
const {
  createValidation,
  getByIdValidation,
  questionValidation,
  listValidation
} = require('./validation');
const { validateMiddleware } = require('../../middlewares/validation');
const { authenticate, authorize } = require('../../middlewares/auth');
const { handleAnswerFilesUpload } = require('../../middlewares/answerFileUpload');

router.use(authenticate);

/**
 * @route   POST /api/lms/quiz-answers/get
 * @desc    Get all rekap pengerjaan quiz (quiz_users join quizzes) with pagination
 *          (filter opsional: quizze_id, created_by)
 * @access  Protected (hak akses quiz-answers.*)
 */
router.post(
  '/get',
  authorize,
  listValidation,
  validateMiddleware,
  controller.getAll
);

/**
 * @route   POST /api/lms/quiz-answers/questions
 * @desc    Get soal quiz beserta jawaban user (body: quiz_question_id, created_by)
 * @access  Protected (hak akses quiz-answers.questions)
 */
router.post(
  '/questions',
  authorize,
  questionValidation,
  validateMiddleware,
  controller.getQuestion
);

/**
 * @route   GET /api/lms/quiz-answers/:id
 * @desc    Get rekap pengerjaan quiz by ID (quiz_users) beserta jawaban user tersebut
 * @access  Protected (hak akses quiz-answers.*)
 */
router.get(
  '/:id',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.getById
);

/**
 * @route   POST /api/lms/quiz-answers/create
 * @desc    Simpan jawaban soal quiz (multipart/form-data, field file: files).
 *          quiz_users & quiz_answers di-upsert berdasarkan user yang login.
 * @access  Protected (hak akses quiz-answers.*)
 */
router.post(
  '/create',
  authorize,
  handleAnswerFilesUpload,
  createValidation,
  validateMiddleware,
  controller.create
);

/**
 * @route   DELETE /api/lms/quiz-answers/:id
 * @desc    Soft delete rekap pengerjaan quiz beserta jawabannya
 * @access  Protected (hak akses quiz-answers.*)
 */
router.delete(
  '/:id',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.remove
);

/**
 * @route   POST /api/lms/quiz-answers/:id/restore
 * @desc    Restore soft deleted rekap pengerjaan quiz beserta jawabannya
 * @access  Protected (hak akses quiz-answers.*)
 */
router.post(
  '/:id/restore',
  authorize,
  getByIdValidation,
  validateMiddleware,
  controller.restore
);

module.exports = router;
