const { body, param } = require('express-validator');
const {
  QUESTION_TYPES,
  TIME_UNITS,
  parseOptions,
  assertOptions,
  normalizeOptions
} = require('./options');

const idParam = param('id')
  .notEmpty()
  .withMessage('ID wajib diisi')
  .isUUID()
  .withMessage('Format ID tidak valid');

// Request create/update dikirim sebagai multipart/form-data (karena ada file image),
// sehingga angka datang sebagai string dan options sebagai string JSON array,
// mis. '[{"line":1,"text":"Klik tautannya","is_correct":false},{"line":2,"text":"Laporkan ke tim IT","is_correct":true}]'
const typeBody = (required) => {
  const chain = body('type');
  return (required ? chain.notEmpty().withMessage('type wajib diisi') : chain.optional())
    .isIn(QUESTION_TYPES)
    .withMessage(`type harus salah satu dari ${QUESTION_TYPES.join(', ')}`);
};

const questionBody = (required) => {
  const chain = body('question');
  return (required ? chain.notEmpty().withMessage('question wajib diisi') : chain.optional())
    .isString()
    .withMessage('question harus berupa teks')
    .trim()
    .notEmpty()
    .withMessage('question tidak boleh kosong');
};

// Pada create, options divalidasi terhadap type di body. Pada update, type bisa tidak dikirim;
// pengecekan terhadap type yang tersimpan dilakukan di service.
const optionsBody = (required) => {
  const chain = body('options');
  return (required ? chain.exists().withMessage('options wajib diisi') : chain.optional())
    .customSanitizer(parseOptions)
    .custom((options, { req }) => {
      if (req.body.type) return assertOptions(req.body.type, options);
      if (!Array.isArray(options)) throw new Error('options harus berupa array JSON');
      return true;
    })
    .bail()
    .customSanitizer((options, { req }) => (req.body.type ? normalizeOptions(req.body.type, options) : options));
};

const commonBody = [
  body('line')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('line harus berupa angka bulat >= 1')
    .toInt(),
  body('estimated_time')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('estimated_time harus berupa angka bulat >= 1')
    .toInt(),
  body('estimated_time_unit')
    .optional()
    .isIn(TIME_UNITS)
    .withMessage(`estimated_time_unit harus salah satu dari ${TIME_UNITS.join(', ')}`),
  body('points')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('points harus berupa angka bulat >= 0')
    .toInt()
];

const createValidation = [
  body('quizzes_id')
    .notEmpty()
    .withMessage('quizzes_id wajib diisi')
    .isUUID()
    .withMessage('Format quizzes_id tidak valid'),
  typeBody(true),
  questionBody(true),
  optionsBody(true),
  ...commonBody
];

const updateValidation = [
  idParam,
  typeBody(false),
  questionBody(false),
  optionsBody(false),
  ...commonBody,
  body('image_delete')
    .optional()
    .isBoolean()
    .withMessage('image_delete harus berupa boolean')
    .toBoolean()
];

const getByIdValidation = [idParam];

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
    .isIn(['line', 'created_at', 'updated_at'])
    .withMessage('sort_by harus salah satu dari line, created_at, updated_at'),
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
  body('quizzes_id')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Format quizzes_id tidak valid'),
  body('type')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(QUESTION_TYPES)
    .withMessage(`type harus salah satu dari ${QUESTION_TYPES.join(', ')}`)
];

module.exports = {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation
};
