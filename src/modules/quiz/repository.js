const { pgCore: db } = require("../../config/database");
const { normalizeListParams } = require("../../utils/list_params");

const TABLE_NAME = "quizzes";

/**
 * Repository Layer - Database Operations (quiz)
 */

const SORTABLE = {
  title: "quizzes.title",
  start_date: "quizzes.start_date",
  end_date: "quizzes.end_date",
  created_at: "quizzes.created_at",
  updated_at: "quizzes.updated_at",
};

// kolom date dikembalikan sebagai string YYYY-MM-DD (hindari konversi timezone ke objek Date)
const BASE_COLUMNS = [
  "quizzes.id",
  "quizzes.title",
  "quizzes.modules_id",
  "modules.title as module_title",
  "quizzes.type",
  db.raw(`to_char(quizzes.start_date, 'YYYY-MM-DD') as start_date`),
  db.raw(`to_char(quizzes.end_date, 'YYYY-MM-DD') as end_date`),
  db.raw(
    `(SELECT count(*)::int FROM quiz_questions qq WHERE qq.quizzes_id = quizzes.id AND qq.is_delete = false) as question_count`,
  ),
  db.raw(
    `CASE WHEN quizzes.banner IS NOT NULL AND quizzes.banner <> '' THEN concat_ws('', quizzes.banner, '/preview'::text) ELSE quizzes.banner END as banner`,
  ),
];

// kolom untuk list (GET /quizzes)
const LIST_COLUMNS = [...BASE_COLUMNS, "quizzes.created_at", "quizzes.updated_at"];

// kolom untuk detail (GET /quizzes/{id}, hasil create/update/restore)
const DETAIL_COLUMNS = [
  ...BASE_COLUMNS,
  "quizzes.created_at",
  "quizzes.created_by",
  "quizzes.updated_at",
  "quizzes.updated_by",
  "quizzes.deleted_at",
  "quizzes.deleted_by",
  "quizzes.is_delete",
];

const baseQuery = () =>
  db(TABLE_NAME).leftJoin("modules", "modules.id", "quizzes.modules_id");

const findAll = async (params = {}) => {
  const { page, limit, sortColumn, sortOrder, search } = normalizeListParams(
    params,
    {
      sortable: SORTABLE,
      defaultSort: "created_at",
      defaultOrder: "desc",
    },
  );
  const offset = (page - 1) * limit;

  const base = () => {
    const q = baseQuery().where("quizzes.is_delete", false);
    if (params.modules_id) q.andWhere("quizzes.modules_id", params.modules_id);
    if (params.type)
      q.andWhereRaw("quizzes.type @> ?::jsonb", [
        JSON.stringify([params.type]),
      ]);
    if (search) q.andWhereILike("quizzes.title", `%${search}%`);
    return q;
  };

  const items = await base()
    .select(LIST_COLUMNS)
    .orderBy(sortColumn, sortOrder)
    .limit(limit)
    .offset(offset);

  const total = await base().count("quizzes.id as count").first();

  return {
    items,
    pagination: {
      page,
      limit,
      total: parseInt(total.count),
      totalPages: Math.ceil(total.count / limit),
    },
  };
};

const findById = async (id) => {
  return await baseQuery()
    .where({ "quizzes.id": id, "quizzes.is_delete": false })
    .first(DETAIL_COLUMNS);
};

const create = async (data, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .insert({
      ...data,
      created_by: actorId,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning("id");
  return await findById(result.id);
};

const update = async (id, data, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, is_delete: false })
    .update({ ...data, updated_by: actorId, updated_at: db.fn.now() })
    .returning("id");
  return result ? await findById(result.id) : null;
};

/**
 * Soft delete quiz beserta seluruh soalnya dalam satu transaksi.
 * deleted_at soal = deleted_at quiz (trx.fn.now() konstan dalam transaksi), dipakai restore
 * untuk hanya memulihkan soal yang ikut terhapus bersama quiz.
 */
const remove = async (id, actorId = null) => {
  return await db.transaction(async (trx) => {
    const [quiz] = await trx(TABLE_NAME)
      .where({ id, is_delete: false })
      .update({
        is_delete: true,
        deleted_at: trx.fn.now(),
        deleted_by: actorId,
      })
      .returning("id");

    if (!quiz) return null;

    await trx("quiz_questions")
      .where({ quizzes_id: id, is_delete: false })
      .update({
        is_delete: true,
        deleted_at: trx.fn.now(),
        deleted_by: actorId,
      });

    return quiz;
  });
};

const restore = async (id, actorId = null) => {
  const restored = await db.transaction(async (trx) => {
    const deleted = await trx(TABLE_NAME)
      .where({ id, is_delete: true })
      .first("id", "deleted_at");
    if (!deleted) return null;

    await trx(TABLE_NAME).where({ id }).update({
      is_delete: false,
      deleted_at: null,
      deleted_by: null,
      updated_at: trx.fn.now(),
      updated_by: actorId,
    });

    await trx("quiz_questions")
      .where({
        quizzes_id: id,
        is_delete: true,
        deleted_at: deleted.deleted_at,
      })
      .update({
        is_delete: false,
        deleted_at: null,
        deleted_by: null,
        updated_at: trx.fn.now(),
        updated_by: actorId,
      });

    return deleted.id;
  });

  return restored ? await findById(restored) : null;
};

const moduleExists = async (moduleId) => {
  const item = await db("modules")
    .where({ id: moduleId, is_delete: false })
    .first("id");
  return !!item;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  restore,
  moduleExists,
};
