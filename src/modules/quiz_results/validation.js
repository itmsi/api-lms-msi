const { body, param } = require('express-validator');

const idParam = param('id')
  .notEmpty()
  .withMessage('ID wajib diisi')
  .isUUID()
  .withMessage('Format ID tidak valid');

const getByIdValidation = [idParam];

// batas kolom integer PostgreSQL
const MAX_ADMIN_POINTS = 2147483647;

// null / '' berarti nilai dikosongkan; selain itu harus angka bulat >= 0 (string atau number)
const assertAdminPoints = (value) => {
  if (value === null || value === '') return true;

  const isIntegerLike = ['string', 'number'].includes(typeof value) && /^\d+$/.test(String(value));
  if (!isIntegerLike || Number(value) > MAX_ADMIN_POINTS) {
    throw new Error('admin_points harus berupa angka bulat >= 0 atau null');
  }

  return true;
};

// body berupa array berisi minimal 1 jawaban, dan satu jawaban hanya boleh muncul sekali
const assertAnswerItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Body harus berupa array berisi minimal 1 jawaban');
  }

  const ids = items.map((item) => String(item?.quiz_answer_id).toLowerCase());
  if (new Set(ids).size !== ids.length) {
    throw new Error('quiz_answer_id tidak boleh duplikat');
  }

  return true;
};

const updateAdminPointsValidation = [
  idParam,
  body()
    .custom(assertAnswerItems),
  body('*.quiz_answer_id')
    .notEmpty()
    .withMessage('quiz_answer_id wajib diisi')
    .isUUID()
    .withMessage('Format quiz_answer_id tidak valid'),
  body('*.admin_points')
    .exists()
    .withMessage('admin_points wajib dikirim (kirim null untuk mengosongkan nilai)')
    .bail()
    .custom(assertAdminPoints)
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
    .isIn(['quizze_title', 'module_title', 'created_at', 'updated_at'])
    .withMessage('sort_by harus salah satu dari quizze_title, module_title, created_at, updated_at'),
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
  body('status')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['completed', 'uncompleted'])
    .withMessage('status harus completed atau uncompleted')
];

module.exports = {
  getByIdValidation,
  updateAdminPointsValidation,
  listValidation
};
