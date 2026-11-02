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

/**
 * Hitung ulang quizzes.max_points dan quiz_users.total_possible_points dari poin soal aktif,
 * dalam transaksi yang sama dengan perubahan soal.
 * Baris quiz dikunci dulu agar perubahan soal yang berjalan bersamaan dihitung bergantian dan tidak saling menimpa.
 * updated_at quiz_users tidak diubah karena perubahan soal bukan aktivitas peserta.
 */
const recalcMaxPoints = async (quizId, trx) => {
  await trx('quizzes').where({ id: quizId }).forNoKeyUpdate().first('id');

  const { total } = await trx(TABLE_NAME)
    .where({ quizzes_id: quizId, is_delete: false })
    .sum('points as total')
    .first();

  await trx('quizzes').where({ id: quizId }).update({ max_points: String(total || 0) });
  await trx('quiz_users').where({ quizze_id: quizId }).update({ total_possible_points: String(total || 0) });
};

const create = async (data, actorId = null) => {
  const id = await db.transaction(async (trx) => {
    const [result] = await trx(TABLE_NAME)
      .insert({ ...data, created_by: actorId, created_at: trx.fn.now(), updated_at: trx.fn.now() })
      .returning('id');
    await recalcMaxPoints(data.quizzes_id, trx);
    return result.id;
  });
  return await findById(id);
};

const update = async (id, data, actorId = null) => {
  const result = await db.transaction(async (trx) => {
    const [updated] = await trx(TABLE_NAME)
      .where({ id, is_delete: false })
      .update({ ...data, updated_by: actorId, updated_at: trx.fn.now() })
      .returning(['id', 'quizzes_id']);
    if (updated && data.points !== undefined) await recalcMaxPoints(updated.quizzes_id, trx);
    return updated;
  });
  return result ? await findById(result.id) : null;
};

const remove = async (id, actorId = null) => {
  return await db.transaction(async (trx) => {
    const [result] = await trx(TABLE_NAME)
      .where({ id, is_delete: false })
      .update({ is_delete: true, deleted_at: trx.fn.now(), deleted_by: actorId })
      .returning(['id', 'quizzes_id']);
    if (result) await recalcMaxPoints(result.quizzes_id, trx);
    return result;
  });
};

const restore = async (id, actorId = null) => {
  const result = await db.transaction(async (trx) => {
    const [restored] = await trx(TABLE_NAME)
      .where({ id, is_delete: true })
      .update({ is_delete: false, deleted_at: null, deleted_by: null, updated_at: trx.fn.now(), updated_by: actorId })
      .returning(['id', 'quizzes_id']);
    if (restored) await recalcMaxPoints(restored.quizzes_id, trx);
    return restored;
  });
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
