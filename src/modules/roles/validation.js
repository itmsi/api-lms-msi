const { body, param, query } = require('express-validator');

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
