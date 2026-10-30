const path = require('path');
const { v4: uuidv4 } = require('uuid');
const repository = require('./repository');
const { regradeQuestion } = require('../quiz_answers/grading');
const { assertOptions, normalizeOptions } = require('./options');
const {
  client,
  ensureDirectoryExists,
  generateShareLink,
  NEXTCLOUD_UPLOAD_DIR
} = require('../../utils/nextcloud');

// 'quizzes_id' hanya dipakai saat create (soal tidak bisa dipindah ke quiz lain);
// 'image' sengaja tidak masuk FIELDS: hanya boleh diisi lewat upload file atau dikosongkan lewat image_delete.
const FIELDS = ['type', 'question', 'line', 'estimated_time', 'estimated_time_unit', 'points', 'options'];

// hanya field yang diizinkan yang boleh masuk ke database (cegah mass-assignment kolom audit)
const pick = (data = {}) => Object.fromEntries(
  FIELDS.filter((k) => data[k] !== undefined).map((k) => [
    k,
    // kolom options bertipe jsonb, node-pg butuh string JSON, bukan array JS mentah
    k === 'options' ? JSON.stringify(data[k]) : data[k]
  ])
);

const IMAGE_DIR = `${NEXTCLOUD_UPLOAD_DIR}/quizzes`;

/**
 * Service Layer - Business Logic (quiz_question)
 */

/**
 * Upload gambar soal ke Nextcloud, kembalikan share link publik-nya
 */
const uploadImage = async (file) => {
  await ensureDirectoryExists(IMAGE_DIR);

  const extension = path.extname(file.originalname);
  const remotePath = `${IMAGE_DIR}/${Date.now()}_${uuidv4()}${extension}`;

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

  return data;
};

const createItem = async (itemData, file, actorId) => {
  if (!(await repository.quizExists(itemData.quizzes_id))) {
    throw { message: 'Quiz tidak ditemukan', statusCode: 400 };
  }

  const payload = pick(itemData);
  payload.quizzes_id = itemData.quizzes_id;

  if (payload.line === undefined) {
    payload.line = await repository.nextLine(itemData.quizzes_id);
  }

  if (file) {
    payload.image = await uploadImage(file);
  }

  return await repository.create(payload, actorId);
};

const updateItem = async (id, itemData, file, actorId) => {
  const existingItem = await repository.findRawById(id);
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  const payload = pick(itemData);

  // type dan options harus tetap konsisten satu sama lain, walau hanya salah satunya yang dikirim
  if (itemData.type !== undefined || itemData.options !== undefined) {
    const type = itemData.type ?? existingItem.type;
    const options = itemData.options ?? existingItem.options;

    try {
      assertOptions(type, options);
    } catch (error) {
      throw { message: error.message, statusCode: 400 };
    }

    payload.options = JSON.stringify(normalizeOptions(type, options));
  }

  if (file) {
    // upload file baru selalu menang, mengabaikan image_delete
    payload.image = await uploadImage(file);
  } else if (itemData.image_delete === true) {
    payload.image = null;
  }

  const data = await repository.update(id, payload, actorId);

  // kunci jawaban / poin / tipe soal berubah: nilai ulang semua jawaban soal ini
  if (['type', 'options', 'points'].some((k) => payload[k] !== undefined)) {
    await regradeQuestion(id);
  }

  return data;
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
