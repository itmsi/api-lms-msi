const repository = require('./repository');

/**
 * Service Layer - Business Logic (permissions)
 */

const getAllItems = async (page = 1, limit = 10, search = '') => {
  return await repository.findAll(page, limit, search);
};

const getItemById = async (id) => {
  const data = await repository.findById(id);

  if (!data) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  return data;
};

const assertUnique = async (data, currentId = null) => {
  if (data.code) {
    const byCode = await repository.findOne({ code: data.code });
    if (byCode && byCode.id !== currentId) {
      throw { message: 'Kode hak akses sudah digunakan', statusCode: 409 };
    }
  }
  if (data.method && data.endpoint) {
    const byRoute = await repository.findOne({ method: data.method, endpoint: data.endpoint });
    if (byRoute && byRoute.id !== currentId) {
      throw { message: 'Kombinasi method dan endpoint sudah terdaftar', statusCode: 409 };
    }
  }
};

const createItem = async (itemData) => {
  const payload = { ...itemData, method: itemData.method.toUpperCase() };
  await assertUnique(payload);
  return await repository.create(payload);
};

const updateItem = async (id, itemData) => {
  const existingItem = await repository.findById(id);
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  const payload = { ...itemData };
  if (payload.method) payload.method = payload.method.toUpperCase();

  await assertUnique({
    code: payload.code,
    method: payload.method || existingItem.method,
    endpoint: payload.endpoint || existingItem.endpoint
  }, id);

  return await repository.update(id, payload);
};

const deleteItem = async (id) => {
  const existingItem = await repository.findById(id);
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  return await repository.remove(id);
};

const restoreItem = async (id) => {
  const data = await repository.restore(id);

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
