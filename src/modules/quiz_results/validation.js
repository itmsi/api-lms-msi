const { body, param } = require('express-validator');

const idParam = param('id')
  .notEmpty()
  .withMessage('ID wajib diisi')
  .isUUID()
  .withMessage('Format ID tidak valid');

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
  listValidation
};
