const { body, param } = require('express-validator');

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const idParam = param('id')
  .notEmpty()
  .withMessage('ID wajib diisi')
  .isUUID()
  .withMessage('Format ID tidak valid');

const createValidation = [
  body('name')
    .notEmpty()
    .withMessage('Nama wajib diisi')
    .isLength({ min: 3, max: 100 })
    .withMessage('Nama harus antara 3-100 karakter')
    .trim(),
  body('code')
    .notEmpty()
    .withMessage('Kode wajib diisi')
    .isLength({ min: 3, max: 100 })
    .withMessage('Kode harus antara 3-100 karakter')
    .trim(),
  body('method')
    .notEmpty()
    .withMessage('Method wajib diisi')
    .customSanitizer((v) => (typeof v === 'string' ? v.toUpperCase() : v))
    .isIn(METHODS)
    .withMessage(`Method harus salah satu dari ${METHODS.join(', ')}`),
  body('endpoint')
    .notEmpty()
    .withMessage('Endpoint wajib diisi')
    .isLength({ max: 255 })
    .withMessage('Endpoint maksimal 255 karakter')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Deskripsi maksimal 500 karakter')
    .trim(),
];

const updateValidation = [
  idParam,
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Nama harus antara 3-100 karakter')
    .trim(),
  body('code')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Kode harus antara 3-100 karakter')
    .trim(),
  body('method')
    .optional()
    .customSanitizer((v) => (typeof v === 'string' ? v.toUpperCase() : v))
    .isIn(METHODS)
    .withMessage(`Method harus salah satu dari ${METHODS.join(', ')}`),
  body('endpoint')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Endpoint maksimal 255 karakter')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Deskripsi maksimal 500 karakter')
    .trim(),
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
    .isIn(['name', 'code', 'method', 'endpoint', 'created_at', 'updated_at'])
    .withMessage('sort_by harus salah satu dari name, code, method, endpoint, created_at, updated_at'),
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
