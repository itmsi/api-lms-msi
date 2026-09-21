const { pgCore: db } = require('../../config/database');

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

const findAll = async (page = 1, limit = 10, search = '', roleId = null) => {
  const offset = (page - 1) * limit;

  const base = () => {
    const q = withRole().where({ 'users.deleted_at': null });
    if (roleId) q.andWhere('users.role_id', roleId);
    if (search) {
      q.andWhere((b) => b
        .whereILike('users.name', `%${search}%`)
        .orWhereILike('users.email', `%${search}%`));
    }
    return q;
  };

  const items = await base()
    .select(COLUMNS)
    .orderBy('users.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  const total = await base().count('users.id as count').first();

  return {
    items,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total.count),
      totalPages: Math.ceil(total.count / limit)
    }
  };
};

const findById = async (id) => {
  return await withRole()
    .where({ 'users.id': id, 'users.deleted_at': null })
    .select(COLUMNS)
    .first();
};

const findOne = async (conditions) => {
  return await db(TABLE_NAME).where({ ...conditions, deleted_at: null }).first();
};

const create = async (data) => {
  const [result] = await db(TABLE_NAME)
    .insert({ ...data, created_at: db.fn.now(), updated_at: db.fn.now() })
    .returning('id');
  return await findById(result.id);
};

const update = async (id, data) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, deleted_at: null })
    .update({ ...data, updated_at: db.fn.now() })
    .returning('id');
  return result ? await findById(result.id) : undefined;
};

const remove = async (id) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, deleted_at: null })
    .update({ deleted_at: db.fn.now() })
    .returning('id');
  return result;
};

const restore = async (id) => {
  const [result] = await db(TABLE_NAME)
    .where({ id })
    .whereNotNull('deleted_at')
    .update({ deleted_at: null, updated_at: db.fn.now() })
    .returning('id');
  return result ? await findById(result.id) : undefined;
};

const roleExists = async (roleId) => {
  const role = await db('roles').where({ id: roleId, deleted_at: null }).first('id');
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
