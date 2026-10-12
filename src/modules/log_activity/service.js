const repository = require('./repository');

const FIELDS = ['created_by', 'modules_id', 'activity', 'file_name', 'type'];

// hanya field yang diizinkan yang boleh masuk ke database (cegah mass-assignment kolom audit)
const pick = (data = {}) => Object.fromEntries(
  FIELDS.filter((k) => data[k] !== undefined).map((k) => [k, data[k]])
);

/**
 * Service Layer - Business Logic (log activity)
 */

const assertModule = async (moduleId) => {
  if (!(await repository.moduleExists(moduleId))) {
    throw { message: 'Module tidak ditemukan', statusCode: 400 };
  }
};

const getAllItems = async (params = {}) => {
  return await repository.findAll(params);
};

const createItem = async (itemData, actorId) => {
  const payload = pick(itemData);

  if (payload.modules_id) {
    await assertModule(payload.modules_id);
  }

  return await repository.create(payload, actorId);
};

module.exports = {
  getAllItems,
  createItem
};
