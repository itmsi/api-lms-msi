const { pgCore: db } = require('../../config/database');

const TABLE_NAME = 'permissions';

/**
 * Repository Layer - Database Operations (permissions)
 */

const findAll = async (page = 1, limit = 10, search = '') => {
  const offset = (page - 1) * limit;

  const base = () => {
    const q = db(TABLE_NAME).where({ deleted_at: null });
    if (search) {
      q.andWhere((b) => b
        .whereILike('name', `%${search}%`)
        .orWhereILike('code', `%${search}%`)
        .orWhereILike('endpoint', `%${search}%`));
    }
    return q;
  };

  const items = await base()
    .select('*')
    .orderBy('code', 'asc')
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

module.exports = {
  findAll,
  findById,
  findOne,
  create,
  update,
  remove,
  restore
};
