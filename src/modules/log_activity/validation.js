const { body } = require("express-validator");

const createValidation = [
  body("created_by")
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage("Format created_by tidak valid"),
  body("modules_id")
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage("Format modules_id tidak valid"),
  body("activity")
    .optional({ nullable: true })
    .isString()
    .withMessage("activity harus berupa teks")
    .trim(),
  body("file_name")
    .optional({ nullable: true })
    .isString()
    .withMessage("file_name harus berupa teks")
    .trim(),
];

const listValidation = [
  body("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page harus berupa angka positif"),
  body("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit harus antara 1-100"),
  body("sort_by")
    .optional()
    .isIn(["activity", "file_name", "created_at", "updated_at"])
    .withMessage("sort_by harus salah satu dari activity, file_name, created_at, updated_at"),
  body("sort_order")
    .optional()
    .customSanitizer((v) => (typeof v === "string" ? v.toLowerCase() : v))
    .isIn(["asc", "desc"])
    .withMessage("sort_order harus asc atau desc"),
  body("search")
    .optional()
    .isString()
    .withMessage("Search harus berupa teks")
    .isLength({ max: 100 })
    .withMessage("Search maksimal 100 karakter"),
  body("modules_id")
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage("Format modules_id tidak valid"),
];

module.exports = {
  createValidation,
  listValidation,
};
