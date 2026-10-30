const { body, param } = require('express-validator');
const { listValidation: quizListValidation } = require('../quiz/validation');

const idParam = param('id')
  .notEmpty()
  .withMessage('ID wajib diisi')
  .isUUID()
  .withMessage('Format ID tidak valid');

// request multipart/form-data mengirim answers sebagai string JSON array dengan format yang sama
// seperti options soal: '[{"line":1,"text":"text jawab","is_correct":true}]'
// is_correct = true berarti opsi tersebut dipilih user; [] berarti soal belum dijawab
const parseAnswers = (value) => {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    return JSON.parse(trimmed);
  } catch {
    // bukan JSON valid, biarkan gagal di validasi
    return value;
  }
};

const assertAnswers = (answers) => {
  if (!Array.isArray(answers)) {
    throw new Error('answers harus berupa array JSON, format: [{"line":1,"text":"","is_correct":true}]');
  }

  answers.forEach((answer, idx) => {
    if (answer === null || typeof answer !== 'object' || Array.isArray(answer)) {
      throw new Error(`answers[${idx}] harus berupa objek`);
    }
    if (!Number.isInteger(answer.line) || answer.line < 1) {
      throw new Error(`answers[${idx}].line harus berupa angka bulat >= 1`);
    }
    if (typeof answer.text !== 'string') {
      throw new Error(`answers[${idx}].text harus berupa teks`);
    }
    if (typeof answer.is_correct !== 'boolean') {
      throw new Error(`answers[${idx}].is_correct harus berupa boolean`);
    }
  });

  return true;
};

// simpan hanya field yang dikenal, sesuai format options soal
const normalizeAnswers = (answers) =>
  answers.map(({ line, text, is_correct }) => ({ line, text: text.trim(), is_correct }));

// quizze_id, total_point, completed_count, uncompleted_count dihitung di backend (lihat repository.upsert)
const createValidation = [
  body('quiz_question_id')
    .notEmpty()
    .withMessage('quiz_question_id wajib diisi')
    .isUUID()
    .withMessage('Format quiz_question_id tidak valid'),
  body('answers')
    .exists()
    .withMessage('answers wajib diisi (kirim [] jika belum dijawab)')
    .bail()
    .customSanitizer(parseAnswers)
    .custom(assertAnswers)
    .bail()
    .customSanitizer(normalizeAnswers),
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

// filter sama seperti POST /quizzes/get, ditambah created_by (wajib) untuk rekap pengerjaan user
const quizzesValidation = [
  ...quizListValidation,
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
  quizzesValidation,
  listValidation
};
