const repository = require('./repository');

const FIELDS = ['name', 'code', 'method', 'endpoint', 'description'];

// hanya field yang diizinkan yang boleh masuk ke database (cegah mass-assignment kolom audit)
const pick = (data = {}) => Object.fromEntries(
  FIELDS.filter((k) => data[k] !== undefined).map((k) => [k, data[k]])
);

/**
 * Service Layer - Business Logic (permissions)
 */

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

const createItem = async (itemData, actorId) => {
  const payload = pick({ ...itemData, method: itemData.method.toUpperCase() });
  await assertUnique(payload);
  return await repository.create(payload, actorId);
};

const updateItem = async (id, itemData, actorId) => {
  const existingItem = await repository.findById(id);
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  const payload = pick(itemData);
  if (payload.method) payload.method = payload.method.toUpperCase();

  await assertUnique({
    code: payload.code,
    method: payload.method || existingItem.method,
    endpoint: payload.endpoint || existingItem.endpoint
  }, id);

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
