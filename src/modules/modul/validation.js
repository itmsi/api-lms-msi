const { body, param } = require('express-validator');

const idParam = param('id')
  .notEmpty()
  .withMessage('ID wajib diisi')
  .isUUID()
  .withMessage('Format ID tidak valid');

// request dikirim sebagai multipart/form-data (karena ada file banner), jadi link_materials
// dikirim sebagai string: baik JSON array ('["https://...","https://..."]')
// maupun list dipisah koma ('https://..., https://...')
const linkMaterialsBody = body('link_materials')
  .optional()
  .customSanitizer((value) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return value;

    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // bukan JSON, lanjut coba parse sebagai list dipisah koma
    }

    return trimmed.split(',').map((v) => v.trim()).filter(Boolean);
  })
  .isArray()
  .withMessage('link_materials harus berupa array link')
  .bail();

const MODULE_CATEGORIES = ['mt', 'nonmt', 'division'];

const moduleCategoryBody = body('module_category')
  .optional({ nullable: true, checkFalsy: true })
  .isIn(MODULE_CATEGORIES)
  .withMessage(`module_category harus salah satu dari ${MODULE_CATEGORIES.join(', ')}`);

const createValidation = [
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
  moduleCategoryBody,
];

const updateValidation = [
  idParam,
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
  moduleCategoryBody,
  body('banner_delete')
    .optional()
    .isBoolean()
    .withMessage('banner_delete harus berupa boolean')
    .toBoolean(),
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
  moduleCategoryBody,
];

module.exports = {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation
};
