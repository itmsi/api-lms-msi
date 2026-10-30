const { body, param } = require('express-validator');

const idParam = param('id')
  .notEmpty()
  .withMessage('ID wajib diisi')
  .isUUID()
  .withMessage('Format ID tidak valid');

// request multipart/form-data mengirim answers sebagai string JSON,
// mis. '[1]' (line opsi yang dipilih) atau '{"text":"<p>jawaban</p>"}'
const parseAnswers = (value) => {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    // bukan JSON valid, simpan sebagai teks biasa (mis. jawaban singkat)
    return trimmed;
  }
};

// quizze_id, total_point, completed_count, uncompleted_count dihitung di backend (lihat repository.upsert)
const createValidation = [
  body('quiz_question_id')
    .notEmpty()
    .withMessage('quiz_question_id wajib diisi')
    .isUUID()
    .withMessage('Format quiz_question_id tidak valid'),
  body('answers')
    .optional({ nullable: true })
    .customSanitizer(parseAnswers),
  body('points')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('points harus berupa angka bulat >= 0')
    .toInt(),
  body('file_delete')
    .optional()
    .isBoolean()
    .withMessage('file_delete harus berupa boolean')
    .toBoolean()
];

const getByIdValidation = [idParam];

const questionValidation = [
  body('quiz_question_id')
    .notEmpty()
    .withMessage('quiz_question_id wajib diisi')
    .isUUID()
    .withMessage('Format quiz_question_id tidak valid'),
  body('created_by')
    .notEmpty()
    .withMessage('created_by wajib diisi')
    .isUUID()
    .withMessage('Format created_by tidak valid')
];

const listValidation = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page harus berupa angka positif'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit harus antara 1-100'),
  body('sort_by')
    .optional()
    .isIn(['quiz_title', 'created_at', 'updated_at'])
    .withMessage('sort_by harus salah satu dari quiz_title, created_at, updated_at'),
  body('sort_order')
    .optional()
    .customSanitizer((v) => (typeof v === 'string' ? v.toLowerCase() : v))
    .isIn(['asc', 'desc'])
    .withMessage('sort_order harus asc atau desc'),
  body('search')
    .optional()
    .isString()
    .withMessage('Search harus berupa teks')
    .isLength({ max: 100 })
    .withMessage('Search maksimal 100 karakter'),
  body('quizze_id')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Format quizze_id tidak valid'),
  body('created_by')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Format created_by tidak valid')
];

module.exports = {
  createValidation,
  getByIdValidation,
  questionValidation,
  listValidation
};
