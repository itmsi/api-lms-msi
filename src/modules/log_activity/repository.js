const { pgCore: db } = require('../../config/database');
const { normalizeListParams } = require('../../utils/list_params');

const TABLE_NAME = 'log_activity';
const EMPLOYEE_TABLE = 'gate_sso_employees';

/**
 * Repository Layer - Database Operations (log activity)
 */

const SORTABLE = {
  activity: 'activity',
  file_name: 'file_name',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

// query dasar list log activity (filter + search), dipakai oleh findAll dan findAllForExport
const baseQuery = (params = {}, search = '') => {
  const q = db(TABLE_NAME).where({ is_delete: false });
  if (params.modules_id) q.andWhere('modules_id', params.modules_id);
  if (params.employee_id) q.andWhere('created_by', params.employee_id);
  // date range opsional pada created_at; end_date format YYYY-MM-DD dihitung sampai akhir hari tersebut
  if (params.start_date) q.andWhere('created_at', '>=', params.start_date);
  if (params.end_date) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(params.end_date)) {
      q.andWhereRaw(`created_at < (?::date + interval '1 day')`, [params.end_date]);
    } else {
      q.andWhere('created_at', '<=', params.end_date);
    }
  }
  if (search) {
    q.andWhere((b) => b
      .whereILike('activity', `%${search}%`)
      .orWhereILike('file_name', `%${search}%`));
  }
  return q;
};

const LIST_OPTIONS = {
  sortable: SORTABLE,
  defaultSort: 'created_at',
  defaultOrder: 'desc'
};

const findAll = async (params = {}) => {
  const { page, limit, sortColumn, sortOrder, search } = normalizeListParams(params, LIST_OPTIONS);
  const offset = (page - 1) * limit;

  // created_by_name diambil dari foreign table gate_sso_employees (FDW ke database gate_sso);
  // pakai subquery agar jumlah baris tidak berlipat bila employee_id duplikat
  const items = await baseQuery(params, search)
    .select(
      `${TABLE_NAME}.*`,
      db.raw(
        `(select e.employee_name from ${EMPLOYEE_TABLE} e where e.employee_id = ${TABLE_NAME}.created_by limit 1) as created_by_name`
      ),
      db.raw(
        `(select m.title from modules m where m.id = ${TABLE_NAME}.modules_id limit 1) as modul_title`
      )
    )
    .orderBy(sortColumn, sortOrder)
    .limit(limit)
    .offset(offset);

  const total = await baseQuery(params, search).count('id as count').first();

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

// semua data sesuai filter & sort (tanpa pagination) untuk export excel
const findAllForExport = async (params = {}) => {
  const { sortColumn, sortOrder, search } = normalizeListParams(params, LIST_OPTIONS);

  return await baseQuery(params, search)
    .select(
      `${TABLE_NAME}.created_at`,
      `${TABLE_NAME}.activity`,
      `${TABLE_NAME}.file_name`,
      `${TABLE_NAME}.file_link`,
      db.raw(
        `(select e.employee_name from ${EMPLOYEE_TABLE} e where e.employee_id = ${TABLE_NAME}.created_by limit 1) as created_by_name`
      ),
      db.raw(
        `(select m.title from modules m where m.id = ${TABLE_NAME}.modules_id limit 1) as modul_title`
      )
    )
    .orderBy(sortColumn, sortOrder);
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
  findAllForExport,
  create,
  moduleExists
};
