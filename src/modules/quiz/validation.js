const { body, param } = require('express-validator');

const QUIZ_AUDIENCES = ['reguler', 'mt'];

const idParam = param('id')
  .notEmpty()
  .withMessage('ID wajib diisi')
  .isUUID()
  .withMessage('Format ID tidak valid');

// format: ["reguler", "mt"] (minimal 1, tanpa duplikat)
const typeBody = (required) => {
  const chain = body('type');
  return (required ? chain.exists().withMessage('type wajib diisi') : chain.optional())
    .isArray({ min: 1 })
    .withMessage(`type harus berupa array minimal 1 item (${QUIZ_AUDIENCES.join(', ')})`)
    .bail()
    .custom((items) => {
      if (!items.every((item) => QUIZ_AUDIENCES.includes(item))) {
        throw new Error(`type hanya boleh berisi ${QUIZ_AUDIENCES.join(', ')}`);
      }
      return true;
    })
    .customSanitizer((items) => [...new Set(items)]);
};

const dateBody = (field, required) => {
  const chain = body(field);
  return (required ? chain.notEmpty().withMessage(`${field} wajib diisi`) : chain.optional({ nullable: true, checkFalsy: true }))
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage(`${field} harus berformat YYYY-MM-DD`)
    .bail()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage(`${field} harus berformat YYYY-MM-DD`);
};

// end_date tidak boleh sebelum start_date. Untuk update parsial, pengecekan nilai gabungan ada di service.
const endAfterStart = body('end_date')
  .optional({ nullable: true, checkFalsy: true })
  .custom((end, { req }) => {
    if (req.body.start_date && end < req.body.start_date) {
      throw new Error('end_date tidak boleh sebelum start_date');
    }
    return true;
  });

const createValidation = [
  body('title')
    .notEmpty()
    .withMessage('Judul wajib diisi')
    .isLength({ min: 3, max: 255 })
    .withMessage('Judul harus antara 3-255 karakter')
    .trim(),
  body('modules_id')
    .notEmpty()
    .withMessage('modules_id wajib diisi')
    .isUUID()
    .withMessage('Format modules_id tidak valid'),
  typeBody(true),
  dateBody('start_date', true),
  dateBody('end_date', true),
  endAfterStart
];

const updateValidation = [
  idParam,
  body('title')
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage('Judul harus antara 3-255 karakter')
    .trim(),
  body('modules_id')
    .optional()
    .isUUID()
    .withMessage('Format modules_id tidak valid'),
  typeBody(false),
  dateBody('start_date', false),
  dateBody('end_date', false),
  endAfterStart
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
    .isIn(['title', 'start_date', 'end_date', 'created_at', 'updated_at'])
    .withMessage('sort_by harus salah satu dari title, start_date, end_date, created_at, updated_at'),
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
  body('modules_id')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Format modules_id tidak valid'),
  body('type')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(QUIZ_AUDIENCES)
    .withMessage(`type harus salah satu dari ${QUIZ_AUDIENCES.join(', ')}`)
];

module.exports = {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation
};
