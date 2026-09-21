const { body, param, query } = require('express-validator');

const STATUSES = ['active', 'inactive'];

const idParam = param('id')
  .notEmpty()
  .withMessage('ID wajib diisi')
  .isUUID()
  .withMessage('Format ID tidak valid');

const createValidation = [
  body('role_id')
    .notEmpty()
    .withMessage('Role wajib diisi')
    .isUUID()
    .withMessage('Format role_id tidak valid'),
  body('name')
    .notEmpty()
    .withMessage('Nama wajib diisi')
    .isLength({ min: 3, max: 100 })
    .withMessage('Nama harus antara 3-100 karakter')
    .trim(),
  body('email')
    .notEmpty()
    .withMessage('Email wajib diisi')
    .isEmail()
    .withMessage('Format email tidak valid')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password wajib diisi')
    .isLength({ min: 8, max: 100 })
    .withMessage('Password harus antara 8-100 karakter'),
  body('status')
    .optional()
    .isIn(STATUSES)
    .withMessage('Status harus active atau inactive'),
];

const updateValidation = [
  idParam,
  body('role_id')
    .optional()
    .isUUID()
    .withMessage('Format role_id tidak valid'),
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Nama harus antara 3-100 karakter')
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Format email tidak valid')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8, max: 100 })
    .withMessage('Password harus antara 8-100 karakter'),
  body('status')
    .optional()
    .isIn(STATUSES)
    .withMessage('Status harus active atau inactive'),
];

const getByIdValidation = [idParam];

const listValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page harus berupa angka positif'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit harus antara 1-100'),
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search maksimal 100 karakter'),
  query('role_id')
    .optional()
    .isUUID()
    .withMessage('Format role_id tidak valid'),
];

module.exports = {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation
};
