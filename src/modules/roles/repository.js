const { pgCore: db } = require('../../config/database');

const TABLE_NAME = 'roles';

/**
 * Repository Layer - Database Operations (roles)
 */

const findAll = async (page = 1, limit = 10, search = '') => {
  const offset = (page - 1) * limit;

  const base = () => {
    const q = db(TABLE_NAME).where({ deleted_at: null });
    if (search) {
      q.andWhere((b) => b.whereILike('name', `%${search}%`).orWhereILike('slug', `%${search}%`));
    }
    return q;
  };

  const items = await base()
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  const total = await base().count('id as count').first();

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
  return await db(TABLE_NAME).where({ id, deleted_at: null }).first();
};

const findOne = async (conditions) => {
  return await db(TABLE_NAME).where({ ...conditions, deleted_at: null }).first();
};

const findPermissions = async (roleId) => {
  return await db('role_permissions as rp')
    .join('permissions as p', 'p.id', 'rp.permission_id')
    .where({ 'rp.role_id': roleId, 'p.deleted_at': null })
    .select('p.id', 'p.name', 'p.code', 'p.method', 'p.endpoint')
    .orderBy('p.code', 'asc');
};

const create = async (data) => {
  const [result] = await db(TABLE_NAME)
    .insert({ ...data, created_at: db.fn.now(), updated_at: db.fn.now() })
    .returning('*');
  return result;
};

const update = async (id, data) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, deleted_at: null })
    .update({ ...data, updated_at: db.fn.now() })
    .returning('*');
  return result;
};

const remove = async (id) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, deleted_at: null })
    .update({ deleted_at: db.fn.now() })
    .returning('*');
  return result;
};

const restore = async (id) => {
  const [result] = await db(TABLE_NAME)
    .where({ id })
    .whereNotNull('deleted_at')
    .update({ deleted_at: null, updated_at: db.fn.now() })
    .returning('*');
  return result;
};

const countUsers = async (roleId) => {
  const row = await db('users').where({ role_id: roleId, deleted_at: null }).count('id as count').first();
  return parseInt(row.count);
};

const countExistingPermissions = async (ids) => {
  if (!ids.length) return 0;
  const row = await db('permissions').whereIn('id', ids).where({ deleted_at: null }).count('id as count').first();
  return parseInt(row.count);
};

/**
 * Replace seluruh hak akses milik role (dalam 1 transaksi)
 */
const syncPermissions = async (roleId, permissionIds) => {
  await db.transaction(async (trx) => {
    await trx('role_permissions').where({ role_id: roleId }).del();
    if (permissionIds.length) {
      await trx('role_permissions').insert(
        permissionIds.map((permission_id) => ({ role_id: roleId, permission_id }))
      );
    }
  });
};

module.exports = {
  findAll,
  findById,
  findOne,
  findPermissions,
  create,
  update,
  remove,
  restore,
  countUsers,
  countExistingPermissions,
  syncPermissions
};
