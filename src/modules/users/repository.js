const { pgCore: db } = require('../../config/database');
const { normalizeListParams } = require('../../utils/list_params');

const TABLE_NAME = 'users';

// password tidak pernah dikembalikan ke client
const COLUMNS = [
  'users.id',
  'users.role_id',
  'roles.name as role_name',
  'roles.slug as role_slug',
  'users.name',
  'users.email',
  'users.status',
  'users.created_at',
  'users.updated_at',
  'users.deleted_at'
];

/**
 * Repository Layer - Database Operations (users)
 */

const withRole = () => db(TABLE_NAME).leftJoin('roles', 'roles.id', 'users.role_id');

const SORTABLE = {
  name: 'users.name',
  email: 'users.email',
  status: 'users.status',
  role_name: 'roles.name',
  created_at: 'users.created_at',
  updated_at: 'users.updated_at'
};

const findAll = async (params = {}) => {
  const { page, limit, sortColumn, sortOrder, search } = normalizeListParams(params, {
    sortable: SORTABLE,
    defaultSort: 'created_at',
    defaultOrder: 'desc'
  });
  const offset = (page - 1) * limit;

  const base = () => {
    const q = withRole().where({ 'users.is_delete': false });
    if (params.role_id) q.andWhere('users.role_id', params.role_id);
    if (search) {
      q.andWhere((b) => b
        .whereILike('users.name', `%${search}%`)
        .orWhereILike('users.email', `%${search}%`));
    }
    return q;
  };

  const items = await base()
    .select(COLUMNS)
    .orderBy(sortColumn, sortOrder)
    .limit(limit)
    .offset(offset);

  const total = await base().count('users.id as count').first();

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
  return await withRole()
    .where({ 'users.id': id, 'users.is_delete': false })
    .select(COLUMNS)
    .first();
};

const findOne = async (conditions) => {
  return await db(TABLE_NAME).where({ ...conditions, is_delete: false }).first();
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
  return result ? await findById(result.id) : undefined;
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
    .where({ id })
    .where({ is_delete: true })
    .update({ is_delete: false, deleted_at: null, deleted_by: null, updated_at: db.fn.now(), updated_by: actorId })
    .returning('id');
  return result ? await findById(result.id) : undefined;
};

const roleExists = async (roleId) => {
  const role = await db('roles').where({ id: roleId, is_delete: false }).first('id');
  return !!role;
};

module.exports = {
  findAll,
  findById,
  findOne,
  create,
  update,
  remove,
  restore,
  roleExists
};
