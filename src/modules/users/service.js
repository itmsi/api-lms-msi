const bcrypt = require('bcrypt');
const repository = require('./repository');

const FIELDS = ['role_id', 'name', 'email', 'password', 'status'];

// hanya field yang diizinkan yang boleh masuk ke database (cegah mass-assignment kolom audit)
const pick = (data = {}) => Object.fromEntries(
  FIELDS.filter((k) => data[k] !== undefined).map((k) => [k, data[k]])
);

const SALT_ROUNDS = 10;

/**
 * Service Layer - Business Logic (users)
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

const assertRole = async (roleId) => {
  if (!(await repository.roleExists(roleId))) {
    throw { message: 'Role tidak ditemukan', statusCode: 400 };
  }
};

const assertEmailUnique = async (email, currentId = null) => {
  const existing = await repository.findOne({ email });
  if (existing && existing.id !== currentId) {
    throw { message: 'Email sudah digunakan', statusCode: 409 };
  }
};

const createItem = async (itemData, actorId) => {
  await assertRole(itemData.role_id);
  await assertEmailUnique(itemData.email);

  const password = await bcrypt.hash(itemData.password, SALT_ROUNDS);
  return await repository.create(pick({ ...itemData, password }), actorId);
};

const updateItem = async (id, itemData, actorId) => {
  const existingItem = await repository.findById(id);
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  const payload = pick(itemData);

  if (payload.role_id && payload.role_id !== existingItem.role_id) {
    await assertRole(payload.role_id);
  }
  if (payload.email && payload.email !== existingItem.email) {
    await assertEmailUnique(payload.email, id);
  }
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, SALT_ROUNDS);
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
