const { body, param } = require('express-validator');

const idParam = param('id')
  .notEmpty()
  .withMessage('ID wajib diisi')
  .isUUID()
  .withMessage('Format ID tidak valid');

const linkMaterialsBody = body('link_materials')
  .optional()
  .isArray()
  .withMessage('link_materials harus berupa array link');

const createValidation = [
  body('modules_id')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Format modules_id tidak valid'),
  body('title')
    .notEmpty()
    .withMessage('Judul wajib diisi')
    .isLength({ min: 3, max: 255 })
    .withMessage('Judul harus antara 3-255 karakter')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Deskripsi maksimal 2000 karakter')
    .trim(),
  linkMaterialsBody,
  body('link_materials.*')
    .optional()
    .isURL()
    .withMessage('Setiap link_materials harus berupa URL yang valid'),
];

const updateValidation = [
  idParam,
  body('modules_id')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Format modules_id tidak valid'),
  body('title')
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage('Judul harus antara 3-255 karakter')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Deskripsi maksimal 2000 karakter')
    .trim(),
  linkMaterialsBody,
  body('link_materials.*')
    .optional()
    .isURL()
    .withMessage('Setiap link_materials harus berupa URL yang valid'),
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
    .isIn(['title', 'created_at', 'updated_at'])
    .withMessage('sort_by harus salah satu dari title, created_at, updated_at'),
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
];

module.exports = {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation
};
