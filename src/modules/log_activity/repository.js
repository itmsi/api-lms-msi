const { pgCore: db } = require('../../config/database');
const { normalizeListParams } = require('../../utils/list_params');

const TABLE_NAME = 'log_activity';

/**
 * Repository Layer - Database Operations (log activity)
 */

const SORTABLE = {
  activity: 'activity',
  file_name: 'file_name',
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
    if (params.modules_id) q.andWhere('modules_id', params.modules_id);
    if (search) {
      q.andWhere((b) => b
        .whereILike('activity', `%${search}%`)
        .orWhereILike('file_name', `%${search}%`));
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

const create = async (data, actorId = null) => {
  const [result] = await db(TABLE_NAME)
    .insert({ ...data, created_by: data.created_by || actorId, created_at: db.fn.now(), updated_at: db.fn.now() })
    .returning('*');
  return result;
};

const moduleExists = async (moduleId) => {
  const item = await db('modules').where({ id: moduleId, is_delete: false }).first('id');
  return !!item;
};

module.exports = {
  findAll,
  create,
  moduleExists
};
