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
  body("file_link")
    .optional({ nullable: true })
    .isString()
    .withMessage("file_link harus berupa teks")
    .trim(),
  body("type")
    .optional({ nullable: true })
    .isString()
    .withMessage("type harus berupa teks")
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
  body("sort_by").optional(),
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
  body("employee_id")
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage("Format employee_id tidak valid"),
  body("start_date")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("Format start_date tidak valid (gunakan YYYY-MM-DD)"),
  body("end_date")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("Format end_date tidak valid (gunakan YYYY-MM-DD)")
    .custom((value, { req }) => {
      const start = req.body.start_date;
      if (start && new Date(value) < new Date(start)) {
        throw new Error("end_date tidak boleh lebih kecil dari start_date");
      }
      return true;
    }),
];

module.exports = {
  createValidation,
  listValidation,
};
