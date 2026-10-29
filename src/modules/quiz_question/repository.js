const { pgCore: db } = require('../../config/database');
const { normalizeListParams } = require('../../utils/list_params');

const TABLE_NAME = 'quiz_questions';

/**
 * Repository Layer - Database Operations (quiz_question)
 */

const SORTABLE = {
  line: 'line',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

// image disimpan sebagai share link Nextcloud, '/preview' ditambahkan agar bisa dipakai langsung di <img>
const COLUMNS = [
  'id',
  'quizzes_id',
  'line',
  'type',
  'question',
  'estimated_time',
  'estimated_time_unit',
  'points',
  'options',
  db.raw(`CASE WHEN image IS NOT NULL AND image <> '' THEN concat_ws('', image, '/preview'::text) ELSE image END as image`),
  'created_at',
  'created_by',
  'updated_at',
  'updated_by',
  'deleted_at',
  'deleted_by',
  'is_delete'
];

const findAll = async (params = {}) => {
  const { page, limit, sortColumn, sortOrder, search } = normalizeListParams(params, {
    sortable: SORTABLE,
    defaultSort: 'line',
    defaultOrder: 'asc'
  });
  const offset = (page - 1) * limit;

  const base = () => {
    const q = db(TABLE_NAME).where({ is_delete: false });
    if (params.quizzes_id) q.andWhere('quizzes_id', params.quizzes_id);
    if (params.type) q.andWhere('type', params.type);
    if (search) q.andWhereILike('question', `%${search}%`);
    return q;
  };

  const items = await base()
    .select(COLUMNS)
    .orderBy(sortColumn, sortOrder)
    .orderBy('created_at', 'asc')
    .limit(limit)
    .offset(offset);

  const total = await base().count('id as count').first();

  return {
    items,
    pagination: {
      page,
      limit,
      total: parseInt(total.count),
      totalPages: Math.ceil(total.count / limit)
    }
  };
};

const findById = async (id) => {
  return await db(TABLE_NAME).where({ id, is_delete: false }).first(COLUMNS);
};

// baris mentah (image tanpa '/preview'), dipakai service untuk menggabungkan nilai lama saat update
const findRawById = async (id) => {
  return await db(TABLE_NAME).where({ id, is_delete: false }).first();
};

const nextLine = async (quizzesId) => {
  const row = await db(TABLE_NAME)
    .where({ quizzes_id: quizzesId, is_delete: false })
    .max('line as max')
    .first();
  return (parseInt(row.max, 10) || 0) + 1;
};

const create = async (data, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .insert({ ...data, created_by: actorId, created_at: db.fn.now(), updated_at: db.fn.now() })
    .returning('id');
  return await findById(result.id);
};

const update = async (id, data, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, is_delete: false })
    .update({ ...data, updated_by: actorId, updated_at: db.fn.now() })
    .returning('id');
  return result ? await findById(result.id) : null;
};

const remove = async (id, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, is_delete: false })
    .update({ is_delete: true, deleted_at: db.fn.now(), deleted_by: actorId })
    .returning('id');
  return result;
};

const restore = async (id, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, is_delete: true })
    .update({ is_delete: false, deleted_at: null, deleted_by: null, updated_at: db.fn.now(), updated_by: actorId })
    .returning('id');
  return result ? await findById(result.id) : null;
};

const quizExists = async (quizId) => {
  const item = await db('quizzes').where({ id: quizId, is_delete: false }).first('id');
  return !!item;
};

module.exports = {
  COLUMNS,
  findAll,
  findById,
  findRawById,
  nextLine,
  create,
  update,
  remove,
  restore,
  quizExists
};
