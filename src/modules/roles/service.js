const repository = require('./repository');

/**
 * Service Layer - Business Logic (roles)
 */

const getAllItems = async (page = 1, limit = 10, search = '') => {
  return await repository.findAll(page, limit, search);
};

const getItemById = async (id) => {
  const data = await repository.findById(id);

  if (!data) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  const permissions = await repository.findPermissions(id);
  return { ...data, permissions };
};

const createItem = async (itemData) => {
  const existing = await repository.findOne({ slug: itemData.slug });
  if (existing) {
    throw { message: 'Slug sudah digunakan', statusCode: 409 };
  }
  return await repository.create(itemData);
};

const updateItem = async (id, itemData) => {
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

  return await repository.update(id, itemData);
};

const deleteItem = async (id) => {
  const existingItem = await repository.findById(id);
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  const totalUsers = await repository.countUsers(id);
  if (totalUsers > 0) {
    throw { message: 'Role masih digunakan oleh user', statusCode: 409 };
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

/**
 * Atur (replace) hak akses pada sebuah role
 */
const syncPermissions = async (id, permissionIds = []) => {
  const existingItem = await repository.findById(id);
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  const uniqueIds = [...new Set(permissionIds)];
  const found = await repository.countExistingPermissions(uniqueIds);
  if (found !== uniqueIds.length) {
    throw { message: 'Terdapat hak akses yang tidak ditemukan', statusCode: 400 };
  }

  await repository.syncPermissions(id, uniqueIds);
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
