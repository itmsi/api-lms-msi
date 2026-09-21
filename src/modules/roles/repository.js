const { pgCore: db } = require('../../config/database');
const { normalizeListParams } = require('../../utils/list_params');

const TABLE_NAME = 'roles';

/**
 * Repository Layer - Database Operations (roles)
 */

const SORTABLE = {
  name: 'name',
  slug: 'slug',
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
        .orWhereILike('slug', `%${search}%`));
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

const findOne = async (conditions) => {
  return await db(TABLE_NAME).where({ ...conditions, is_delete: false }).first();
};

const findPermissions = async (roleId) => {
  return await db('role_permissions as rp')
    .join('permissions as p', 'p.id', 'rp.permission_id')
    .where({ 'rp.role_id': roleId, 'rp.is_delete': false, 'p.is_delete': false })
    .select('p.id', 'p.name', 'p.code', 'p.method', 'p.endpoint')
    .orderBy('p.code', 'asc');
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

const countUsers = async (roleId) => {
  const row = await db('users').where({ role_id: roleId, is_delete: false }).count('id as count').first();
  return parseInt(row.count);
};

const countExistingPermissions = async (ids) => {
  if (!ids.length) return 0;
  const row = await db('permissions').whereIn('id', ids).where({ is_delete: false }).count('id as count').first();
  return parseInt(row.count);
};

/**
 * Sinkronisasi hak akses role (dalam 1 transaksi), dengan jejak audit:
 * - hak akses yang dicabut  -> is_delete = true, deleted_by = actorId
 * - hak akses yang ditambah -> insert baru (created_by) atau aktifkan kembali baris lama
 */
const syncPermissions = async (roleId, permissionIds, actorId = null) => {
  await db.transaction(async (trx) => {
    const rows = await trx('role_permissions').where({ role_id: roleId });
    const active = new Set(rows.filter((r) => !r.is_delete).map((r) => r.permission_id));
    const inactive = new Set(rows.filter((r) => r.is_delete).map((r) => r.permission_id));
    const wanted = new Set(permissionIds);

    const toRemove = [...active].filter((id) => !wanted.has(id));
    const toRestore = [...wanted].filter((id) => inactive.has(id));
    const toInsert = [...wanted].filter((id) => !active.has(id) && !inactive.has(id));

    if (toRemove.length) {
      await trx('role_permissions')
        .where({ role_id: roleId })
        .whereIn('permission_id', toRemove)
        .update({ is_delete: true, deleted_by: actorId, updated_by: actorId });
    }
    if (toRestore.length) {
      await trx('role_permissions')
        .where({ role_id: roleId })
        .whereIn('permission_id', toRestore)
        .update({ is_delete: false, deleted_by: null, updated_by: actorId });
    }
    if (toInsert.length) {
      await trx('role_permissions').insert(
        toInsert.map((permission_id) => ({ role_id: roleId, permission_id, created_by: actorId }))
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
