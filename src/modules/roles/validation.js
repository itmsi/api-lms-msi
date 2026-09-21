const { body, param } = require('express-validator');

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
  body('slug')
    .notEmpty()
    .withMessage('Slug wajib diisi')
    .isSlug()
    .withMessage('Slug hanya boleh huruf kecil, angka dan tanda hubung')
    .isLength({ max: 100 })
    .withMessage('Slug maksimal 100 karakter'),
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
  body('slug')
    .optional()
    .isSlug()
    .withMessage('Slug hanya boleh huruf kecil, angka dan tanda hubung')
    .isLength({ max: 100 })
    .withMessage('Slug maksimal 100 karakter'),
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
    .isIn(['name', 'slug', 'created_at', 'updated_at'])
    .withMessage('sort_by harus salah satu dari name, slug, created_at, updated_at'),
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

const syncPermissionsValidation = [
  idParam,
  body('permission_ids')
    .isArray()
    .withMessage('permission_ids harus berupa array'),
  body('permission_ids.*')
    .isUUID()
    .withMessage('Format permission id tidak valid'),
];

module.exports = {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation,
  syncPermissionsValidation
};
