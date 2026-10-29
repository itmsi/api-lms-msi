const repository = require('./repository');

const FIELDS = ['modules_id', 'title', 'type', 'start_date', 'end_date'];

// hanya field yang diizinkan yang boleh masuk ke database (cegah mass-assignment kolom audit)
const pick = (data = {}) => Object.fromEntries(
  FIELDS.filter((k) => data[k] !== undefined).map((k) => [
    k,
    // kolom type bertipe jsonb, node-pg butuh string JSON, bukan array JS mentah
    k === 'type' ? JSON.stringify(data[k]) : data[k]
  ])
);

/**
 * Service Layer - Business Logic (quiz)
 */

const assertModule = async (moduleId) => {
  if (!(await repository.moduleExists(moduleId))) {
    throw { message: 'Module tidak ditemukan', statusCode: 400 };
  }
};

const assertPeriod = (start, end) => {
  if (start && end && end < start) {
    throw { message: 'end_date tidak boleh sebelum start_date', statusCode: 400 };
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

  const questions = await repository.findQuestions(id);
  return { ...data, questions };
};

const createItem = async (itemData, actorId) => {
  await assertModule(itemData.modules_id);
  assertPeriod(itemData.start_date, itemData.end_date);

  return await repository.create(pick(itemData), actorId);
};

const updateItem = async (id, itemData, actorId) => {
  const existingItem = await repository.findById(id);
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  if (itemData.modules_id && itemData.modules_id !== existingItem.modules_id) {
    await assertModule(itemData.modules_id);
  }

  assertPeriod(
    itemData.start_date !== undefined ? itemData.start_date : existingItem.start_date,
    itemData.end_date !== undefined ? itemData.end_date : existingItem.end_date
  );

  return await repository.update(id, pick(itemData), actorId);
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
