const { pgCore: db } = require('../../config/database');
const { normalizeListParams } = require('../../utils/list_params');

const TABLE_NAME = 'modules';

/**
 * Repository Layer - Database Operations (modul)
 */

const SORTABLE = {
  title: 'title',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

const findAll = async (params = {}) => {
  const { page, limit, sortColumn, sortOrder, search } = normalizeListParams(params, {
    sortable: SORTABLE,
    defaultSort: 'created_at',
    defaultOrder: 'desc'
  });
  const offset = (page - 1) * limit;

  const base = () => {
    const q = db(TABLE_NAME).where({ is_delete: false });
    if (params.module_category) q.andWhere('module_category', params.module_category);
    if (params.created_by) q.andWhere('created_by', params.created_by);
    if (search) {
      q.andWhere((b) => b
        .whereILike('title', `%${search}%`)
        .orWhereILike('description', `%${search}%`));
    }
    return q;
  };

  const items = await base()
    .select('*')
    .orderBy(sortColumn, sortOrder)
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
  return await db(TABLE_NAME).where({ id, is_delete: false }).first();
};

const findChapters = async (moduleId) => {
  return await db('chapters')
    .where({ modules_id: moduleId, is_delete: false })
    .orderBy('created_at', 'asc');
};

const create = async (data, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .insert({ ...data, created_by: actorId, created_at: db.fn.now(), updated_at: db.fn.now() })
    .returning('*');
  return result;
};

const update = async (id, data, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, is_delete: false })
    .update({ ...data, updated_by: actorId, updated_at: db.fn.now() })
    .returning('*');
  return result;
};

const remove = async (id, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, is_delete: false })
    .update({ is_delete: true, deleted_at: db.fn.now(), deleted_by: actorId })
    .returning('*');
  return result;
};

const restore = async (id, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .where({ id })
    .where({ is_delete: true })
    .update({ is_delete: false, deleted_at: null, deleted_by: null, updated_at: db.fn.now(), updated_by: actorId })
    .returning('*');
  return result;
};

module.exports = {
  findAll,
  findById,
  findChapters,
  create,
  update,
  remove,
  restore
};
