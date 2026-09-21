const repository = require('./repository');

const FIELDS = ['name', 'description', 'status'];

// hanya field yang diizinkan yang boleh masuk ke database (cegah mass-assignment kolom audit)
const pick = (data = {}) => Object.fromEntries(
  FIELDS.filter((k) => data[k] !== undefined).map((k) => [k, data[k]])
);

/**
 * Service Layer - Business Logic
 * 
 * Layer ini menangani semua business logic dan aturan bisnis.
 * Controller hanya memanggil service, dan service yang memanggil repository.
 */

/**
 * Get all items with pagination
 */
const getAllItems = async (params = {}) => {
  return await repository.findAll(params);
};

/**
 * Get single item by ID
 */
const getItemById = async (id) => {
  const data = await repository.findById(id);
  
  if (!data) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }
  
  return data;
};

/**
 * Create new item
 */
const createItem = async (itemData, actorId) => {
  return await repository.create(pick(itemData), actorId);
};

/**
 * Update existing item
 */
const updateItem = async (id, itemData, actorId) => {
  // Check if item exists
  const existingItem = await repository.findById(id);
  
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }
  
  return await repository.update(id, pick(itemData), actorId);
};

/**
 * Soft delete item
 */
const deleteItem = async (id, actorId) => {
  // Check if item exists
  const existingItem = await repository.findById(id);
  
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }
  
  const result = await repository.remove(id, actorId);
  return result;
};

/**
 * Restore soft deleted item
 */
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

