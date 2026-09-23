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

const moduleCategoryBody = body('module_category')
  .optional({ nullable: true, checkFalsy: true })
  .isString()
  .withMessage('module_category harus berupa teks')
  .isLength({ max: 20 })
  .withMessage('module_category maksimal 20 karakter')
  .trim();

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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// request dikirim sebagai multipart/form-data (karena ada file banner), jadi chapters
// dikirim sebagai string JSON array, mis. '[{"title":"Bab 1","link_materials":["https://..."]}]'
// item yang punya `id` berarti update chapter yang sudah ada, tanpa `id` berarti chapter baru
const chaptersBody = body('chapters')
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
      // bukan JSON valid, biarkan gagal di validasi isArray di bawah
    }

    return value;
  })
  .isArray()
  .withMessage('chapters harus berupa array JSON')
  .bail()
  .custom((chapters) => {
    chapters.forEach((chapter, idx) => {
      if (!chapter || typeof chapter !== 'object' || Array.isArray(chapter)) {
        throw new Error(`chapters[${idx}] harus berupa objek`);
      }
      if (chapter.id && !UUID_REGEX.test(String(chapter.id))) {
        throw new Error(`chapters[${idx}].id harus berupa UUID yang valid`);
      }
      if (!chapter.id && (typeof chapter.title !== 'string' || chapter.title.trim().length < 3)) {
        throw new Error(`chapters[${idx}].title wajib diisi (minimal 3 karakter) untuk chapter baru`);
      }
      if (
        chapter.line !== undefined
        && chapter.line !== null
        && (!Number.isInteger(chapter.line) || chapter.line < 0)
      ) {
        throw new Error(`chapters[${idx}].line harus berupa angka bulat >= 0`);
      }
      if (chapter.link_materials !== undefined && !Array.isArray(chapter.link_materials)) {
        throw new Error(`chapters[${idx}].link_materials harus berupa array link`);
      }
    });
    return true;
  });

const createAllValidation = [
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
  chaptersBody,
];

const updateAllValidation = [
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
  chaptersBody,
];

const deleteAllValidation = [idParam];

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
  body('created_by')
    .customSanitizer((value) => {
      if (typeof value === 'string' && ['', 'null', 'nan'].includes(value.trim().toLowerCase())) return null;
      return value;
    })
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('created_by harus berupa UUID yang valid'),
];

module.exports = {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation,
  createAllValidation,
  updateAllValidation,
  deleteAllValidation
};
