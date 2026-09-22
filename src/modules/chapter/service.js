const repository = require('./repository');

const FIELDS = ['modules_id', 'title', 'description', 'link_materials'];

// hanya field yang diizinkan yang boleh masuk ke database (cegah mass-assignment kolom audit)
const pick = (data = {}) => Object.fromEntries(
  FIELDS.filter((k) => data[k] !== undefined).map((k) => [
    k,
    // kolom link_materials bertipe jsonb, node-pg butuh string JSON, bukan array JS mentah
    k === 'link_materials' ? JSON.stringify(data[k]) : data[k]
  ])
);

/**
 * Service Layer - Business Logic (chapter)
 */

const assertModule = async (moduleId) => {
  if (!(await repository.moduleExists(moduleId))) {
    throw { message: 'Module tidak ditemukan', statusCode: 400 };
  }
};

const getAllItems = async (params = {}) => {
  return await repository.findAll(params);
};

const getItemById = async (id) => {
  const data = await repository.findById(id);

  if (!data) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  return data;
};

const createItem = async (itemData, actorId) => {
  const payload = pick(itemData);

  if (payload.modules_id) {
    await assertModule(payload.modules_id);
  }

  return await repository.create(payload, actorId);
};

const updateItem = async (id, itemData, actorId) => {
  const existingItem = await repository.findById(id);
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  const payload = pick(itemData);

  if (payload.modules_id && payload.modules_id !== existingItem.modules_id) {
    await assertModule(payload.modules_id);
  }

  return await repository.update(id, payload, actorId);
};

const deleteItem = async (id, actorId) => {
  const existingItem = await repository.findById(id);
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  return await repository.remove(id, actorId);
};

const restoreItem = async (id, actorId) => {
  const data = await repository.restore(id, actorId);

  if (!data) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  return data;
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  restoreItem
};
