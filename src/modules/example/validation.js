const { body, param } = require('express-validator');

/**
 * Validation rules for creating item
 */
const createValidation = [
  body('name')
    .notEmpty()
    .withMessage('Nama wajib diisi')
    .isLength({ min: 3, max: 100 })
    .withMessage('Nama harus antara 3-100 karakter')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Deskripsi maksimal 500 karakter')
    .trim(),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status harus active atau inactive'),
];

/**
 * Validation rules for updating item
 */
const updateValidation = [
  param('id')
    .notEmpty()
    .withMessage('ID wajib diisi')
    .isUUID()
    .withMessage('Format ID tidak valid'),
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Nama harus antara 3-100 karakter')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Deskripsi maksimal 500 karakter')
    .trim(),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status harus active atau inactive'),
];

/**
 * Validation rules for getting item by ID
 */
const getByIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('ID wajib diisi')
    .isUUID()
    .withMessage('Format ID tidak valid'),
];

/**
 * Validation rules for list with pagination
 */
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
    .isIn(['name', 'status', 'created_at', 'updated_at'])
    .withMessage('sort_by harus salah satu dari name, status, created_at, updated_at'),
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
];

module.exports = {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation
};

