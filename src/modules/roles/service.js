const repository = require('./repository');

const FIELDS = ['name', 'slug', 'description'];

// hanya field yang diizinkan yang boleh masuk ke database (cegah mass-assignment kolom audit)
const pick = (data = {}) => Object.fromEntries(
  FIELDS.filter((k) => data[k] !== undefined).map((k) => [k, data[k]])
);

/**
 * Service Layer - Business Logic (roles)
 */

const getAllItems = async (params = {}) => {
  return await repository.findAll(params);
};

const getItemById = async (id) => {
  const data = await repository.findById(id);

  if (!data) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  const permissions = await repository.findPermissions(id);
  return { ...data, permissions };
};

const createItem = async (itemData, actorId) => {
  const existing = await repository.findOne({ slug: itemData.slug });
  if (existing) {
    throw { message: 'Slug sudah digunakan', statusCode: 409 };
  }
  return await repository.create(pick(itemData), actorId);
};

const updateItem = async (id, itemData, actorId) => {
  const existingItem = await repository.findById(id);
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  if (itemData.slug && itemData.slug !== existingItem.slug) {
    const duplicate = await repository.findOne({ slug: itemData.slug });
    if (duplicate) {
      throw { message: 'Slug sudah digunakan', statusCode: 409 };
    }
  }

  return await repository.update(id, pick(itemData), actorId);
};

const deleteItem = async (id, actorId) => {
  const existingItem = await repository.findById(id);
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  const totalUsers = await repository.countUsers(id);
  if (totalUsers > 0) {
    throw { message: 'Role masih digunakan oleh user', statusCode: 409 };
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

/**
 * Atur (replace) hak akses pada sebuah role
 */
const syncPermissions = async (id, permissionIds = [], actorId) => {
  const existingItem = await repository.findById(id);
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  const uniqueIds = [...new Set(permissionIds)];
  const found = await repository.countExistingPermissions(uniqueIds);
  if (found !== uniqueIds.length) {
    throw { message: 'Terdapat hak akses yang tidak ditemukan', statusCode: 400 };
  }

  await repository.syncPermissions(id, uniqueIds, actorId);
  return await getItemById(id);
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  restoreItem,
  syncPermissions
};
