const { pgCore: db } = require('../../config/database');
const { normalizeListParams } = require('../../utils/list_params');

const TABLE_NAME = 'examples';

/**
 * Repository Layer - Database Operations
 * 
 * Layer ini menangani semua operasi database.
 * Tidak ada business logic di sini, hanya CRUD operations.
 */

/**
 * Find all items with pagination
 */
const SORTABLE = {
  name: 'name',
  status: 'status',
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
    if (search) {
      q.andWhere((b) => b
        .whereILike('name', `%${search}%`)
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

/**
 * Find single item by ID
 */
const findById = async (id) => {
  return await db(TABLE_NAME)
    .where({ id, is_delete: false })
    .first();
};

/**
 * Find by custom condition
 */
const findOne = async (conditions) => {
  return await db(TABLE_NAME)
    .where({ ...conditions, is_delete: false })
    .first();
};

/**
 * Create new item
 */
const create = async (data, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .insert({
      ...data,
      created_by: actorId,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    })
    .returning('*');
  return result;
};

/**
 * Update existing item
 */
const update = async (id, data, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, is_delete: false })
    .update({
      ...data,
      updated_by: actorId,
      updated_at: db.fn.now()
    })
    .returning('*');
  return result;
};

/**
 * Soft delete item
 */
const remove = async (id, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, is_delete: false })
    .update({
      is_delete: true,
      deleted_at: db.fn.now(),
      deleted_by: actorId
    })
    .returning('*');
  return result;
};

/**
 * Restore soft deleted item
 */
const restore = async (id, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .where({ id })
    .where({ is_delete: true })
    .update({
      is_delete: false,
      deleted_at: null,
      deleted_by: null,
      updated_by: actorId,
      updated_at: db.fn.now()
    })
    .returning('*');
  return result;
};

/**
 * Hard delete item (permanent)
 */
const hardDelete = async (id) => {
  return await db(TABLE_NAME)
    .where({ id })
    .del();
};

module.exports = {
  findAll,
  findById,
  findOne,
  create,
  update,
  remove,
  restore,
  hardDelete
};

