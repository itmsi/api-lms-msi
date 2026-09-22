const path = require('path');
const { v4: uuidv4 } = require('uuid');
const repository = require('./repository');
const { client, ensureDirectoryExists, generateShareLink, NEXTCLOUD_UPLOAD_DIR } = require('../../utils/nextcloud');

// 'banner' sengaja tidak masuk FIELDS: nilainya hanya boleh diisi lewat upload file
// (lihat uploadBanner) atau dikosongkan lewat flag banner_delete, bukan langsung dari body.
const FIELDS = ['title', 'description', 'link_materials', 'module_category'];

// hanya field yang diizinkan yang boleh masuk ke database (cegah mass-assignment kolom audit)
const pick = (data = {}) => Object.fromEntries(
  FIELDS.filter((k) => data[k] !== undefined).map((k) => [
    k,
    // kolom link_materials bertipe jsonb, node-pg butuh string JSON, bukan array JS mentah
    k === 'link_materials' ? JSON.stringify(data[k]) : data[k]
  ])
);

const BANNER_DIR = `${NEXTCLOUD_UPLOAD_DIR}/modules`;

/**
 * Service Layer - Business Logic (modul)
 */

/**
 * Upload file banner ke Nextcloud, kembalikan share link publik-nya
 */
const uploadBanner = async (file) => {
  await ensureDirectoryExists(BANNER_DIR);

  const extension = path.extname(file.originalname);
  const remotePath = `${BANNER_DIR}/${Date.now()}_${uuidv4()}${extension}`;

  await client.putFileContents(remotePath, file.buffer, { overwrite: true });
  return await generateShareLink(remotePath);
};

const getAllItems = async (params = {}) => {
  return await repository.findAll(params);
};

const getItemById = async (id) => {
  const data = await repository.findById(id);

  if (!data) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  const chapters = await repository.findChapters(id);
  return { ...data, chapters };
};

const createItem = async (itemData, file, actorId) => {
  const payload = pick(itemData);

  if (file) {
    payload.banner = await uploadBanner(file);
  }

  return await repository.create(payload, actorId);
};

const updateItem = async (id, itemData, file, actorId) => {
  const existingItem = await repository.findById(id);
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  const payload = pick(itemData);

  if (file) {
    // upload file baru selalu menang, mengabaikan banner_delete
    payload.banner = await uploadBanner(file);
  } else if (itemData.banner_delete === true) {
    payload.banner = null;
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
