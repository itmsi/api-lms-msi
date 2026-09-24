const { pgCore: db } = require("../../config/database");
const { normalizeListParams } = require("../../utils/list_params");

const TABLE_NAME = "modules";

/**
 * Repository Layer - Database Operations (modul)
 */

const SORTABLE = {
  title: "title",
  created_at: "created_at",
  updated_at: "updated_at",
};

const LIST_COLUMNS = [
  "id",
  "title",
  "description_clean as description",
  "link_materials",
  db.raw(
    `CASE WHEN banner IS NOT NULL AND banner <> '' THEN concat_ws('', banner, '/preview'::text) ELSE banner END as banner`,
  ),
  "created_at",
  "created_by",
  "updated_at",
  "updated_by",
  "deleted_at",
  "deleted_by",
  "is_delete",
  "module_category",
];

const LIST_COLUMNS_DETAIL = [
  "id",
  "title",
  "description",
  "description_clean",
  "link_materials",
  db.raw(
    `CASE WHEN banner IS NOT NULL AND banner <> '' THEN concat_ws('', banner, '/preview'::text) ELSE banner END as banner`,
  ),
  "created_at",
  "created_by",
  "updated_at",
  "updated_by",
  "deleted_at",
  "deleted_by",
  "is_delete",
  "module_category",
];

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
    const q = db(TABLE_NAME).where({ is_delete: false });
    if (params.module_category)
      q.andWhere("module_category", params.module_category);
    if (params.created_by) q.andWhere("created_by", params.created_by);
    if (search) {
      q.andWhere((b) =>
        b
          .whereILike("title", `%${search}%`)
          .orWhereILike("description", `%${search}%`),
      );
    }
    return q;
  };

  const items = await base()
    .select(LIST_COLUMNS)
    .orderBy(sortColumn, sortOrder)
    .limit(limit)
    .offset(offset);

  const total = await base().count("id as count").first();

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
  return await db(TABLE_NAME)
    .select(LIST_COLUMNS_DETAIL)
    .where({ id, is_delete: false })
    .first();
};

const findChapters = async (moduleId, trx = db) => {
  return await trx("chapters")
    .where({ modules_id: moduleId, is_delete: false })
    .orderBy([
      { column: "line", order: "asc" },
      { column: "created_at", order: "asc" },
    ]);
};

const create = async (data, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .insert({
      ...data,
      created_by: actorId,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning("*");
  return result;
};

const update = async (id, data, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, is_delete: false })
    .update({ ...data, updated_by: actorId, updated_at: db.fn.now() })
    .returning("*");
  return result;
};

const remove = async (id, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, is_delete: false })
    .update({ is_delete: true, deleted_at: db.fn.now(), deleted_by: actorId })
    .returning("*");
  return result;
};

const restore = async (id, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .where({ id })
    .where({ is_delete: true })
    .update({
      is_delete: false,
      deleted_at: null,
      deleted_by: null,
      updated_at: db.fn.now(),
      updated_by: actorId,
    })
    .returning("*");
  return result;
};

/**
 * Create module + chapters sekaligus dalam satu transaksi (endpoint /create-all)
 */
const createWithChapters = async (data, chapters = [], actorId = null) => {
  return await db.transaction(async (trx) => {
    const [modul] = await trx(TABLE_NAME)
      .insert({
        ...data,
        created_by: actorId,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning("*");

    let insertedChapters = [];
    if (chapters.length > 0) {
      insertedChapters = await trx("chapters")
        .insert(
          chapters.map((chapter) => ({
            ...chapter,
            modules_id: modul.id,
            created_by: actorId,
            created_at: trx.fn.now(),
            updated_at: trx.fn.now(),
          })),
        )
        .returning("*");
    }

    return { ...modul, chapters: insertedChapters };
  });
};

/**
 * Update module + upsert chapters sekaligus dalam satu transaksi (endpoint /update-all/:id)
 * chapters yang punya `id` di-update, yang tidak punya `id` dibuat sebagai chapter baru
 */
const updateWithChapters = async (
  id,
  data,
  chapters = null,
  actorId = null,
) => {
  return await db.transaction(async (trx) => {
    const [modul] = await trx(TABLE_NAME)
      .where({ id, is_delete: false })
      .update({ ...data, updated_by: actorId, updated_at: trx.fn.now() })
      .returning("*");

    if (!modul) return null;

    if (Array.isArray(chapters)) {
      for (const chapter of chapters) {
        const { id: chapterId, ...chapterData } = chapter;
        if (chapterId) {
          await trx("chapters")
            .where({ id: chapterId, modules_id: id, is_delete: false })
            .update({
              ...chapterData,
              updated_by: actorId,
              updated_at: trx.fn.now(),
            });
        } else {
          await trx("chapters").insert({
            ...chapterData,
            modules_id: id,
            created_by: actorId,
            created_at: trx.fn.now(),
            updated_at: trx.fn.now(),
          });
        }
      }
    }

    const refreshedChapters = await findChapters(id, trx);
    return { ...modul, chapters: refreshedChapters };
  });
};

/**
 * Soft delete module + seluruh chapter-nya sekaligus dalam satu transaksi (endpoint /delete-all/:id)
 */
const removeWithChapters = async (id, actorId = null) => {
  return await db.transaction(async (trx) => {
    const [modul] = await trx(TABLE_NAME)
      .where({ id, is_delete: false })
      .update({
        is_delete: true,
        deleted_at: trx.fn.now(),
        deleted_by: actorId,
      })
      .returning("*");

    if (!modul) return null;

    await trx("chapters").where({ modules_id: id, is_delete: false }).update({
      is_delete: true,
      deleted_at: trx.fn.now(),
      deleted_by: actorId,
    });

    return modul;
  });
};

module.exports = {
  findAll,
  findById,
  findChapters,
  create,
  update,
  remove,
  restore,
  createWithChapters,
  updateWithChapters,
  removeWithChapters,
};
