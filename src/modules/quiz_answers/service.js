const path = require('path');
const { v4: uuidv4 } = require('uuid');
const repository = require('./repository');
const {
  client,
  ensureDirectoryExists,
  generateShareLink,
  NEXTCLOUD_UPLOAD_DIR
} = require('../../utils/nextcloud');

// 'files' sengaja tidak masuk FIELDS: hanya boleh diisi lewat upload file atau dikosongkan lewat file_delete.
// Kolom quiz_users (quizze_id, total_point, completed_count, uncompleted_count) dihitung di backend.
const FIELDS = ['answers', 'points'];

// hanya field yang diizinkan yang boleh masuk ke database (cegah mass-assignment kolom audit)
const pick = (data = {}) => Object.fromEntries(
  FIELDS.filter((k) => data[k] !== undefined).map((k) => [
    k,
    // kolom answers bertipe jsonb, node-pg butuh string JSON, bukan nilai JS mentah
    k === 'answers' ? JSON.stringify(data[k]) : data[k]
  ])
);

const FILES_DIR = `${NEXTCLOUD_UPLOAD_DIR}/quiz_answers`;

/**
 * Service Layer - Business Logic (quiz_answers)
 */

/**
 * Upload file jawaban ke Nextcloud, kembalikan share link publik-nya
 */
const uploadFile = async (file) => {
  await ensureDirectoryExists(FILES_DIR);

  const extension = path.extname(file.originalname);
  const remotePath = `${FILES_DIR}/${Date.now()}_${uuidv4()}${extension}`;

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

  const answers = await repository.findAnswers(data.quizze_id, data.created_by);
  return { ...data, answers };
};

const createItem = async (itemData, file, actorId) => {
  // quizze_id diambil dari relasi soal (quiz_questions.quizzes_id)
  const question = await repository.findQuestion(itemData.quiz_question_id);
  if (!question) {
    throw { message: 'Soal quiz tidak ditemukan', statusCode: 400 };
  }

  const answerData = { ...pick(itemData), quiz_question_id: itemData.quiz_question_id };

  if (file) {
    // upload file baru selalu menang, mengabaikan file_delete
    answerData.files = await uploadFile(file);
  } else if (itemData.file_delete === true) {
    answerData.files = null;
  }

  return await repository.upsert(question.quizzes_id, answerData, actorId);
};

// soal beserta jawaban user (created_by) untuk soal tersebut; answer null jika user belum menjawab
const getQuestionWithAnswer = async ({ quiz_question_id: questionId, created_by: userId }) => {
  const question = await repository.findQuestionDetail(questionId);
  if (!question) {
    throw { message: 'Soal quiz tidak ditemukan', statusCode: 404 };
  }

  const answer = await repository.findAnswerOfUser(questionId, userId);
  return { ...question, answer: answer || null };
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
  getQuestionWithAnswer,
  deleteItem,
  restoreItem
};
