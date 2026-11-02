const repository = require('./repository');

/**
 * Service Layer - Business Logic (quiz_results)
 */

const getAllItems = async (params = {}) => {
  return await repository.findAll(params);
};

// detail hasil quiz beserta seluruh soal; question_answer hanya berisi opsi kunci jawaban (is_correct = true)
const getItemById = async (id) => {
  const data = await repository.findById(id);

  if (!data) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  const { quizze_id: quizId, created_by: userId, ...result } = data;
  const rows = await repository.findQuestionAnswers(quizId, userId);

  return {
    ...result,
    question_answers: rows.map((row) => ({
      ...row,
      question_answer: (row.question_answer || []).filter((option) => option.is_correct === true)
    }))
  };
};

// admin_points terisi: is_correct = true; kosong (null / ''): is_correct = false.
// Kolom admin_points NOT NULL, sehingga nilai kosong disimpan sebagai 0 (sama seperti jawaban yang belum dinilai).
const updateAdminPoints = async (quizUserId, items, actorId) => {
  const answers = items.map(({ quiz_answer_id: id, admin_points: adminPoints }) => {
    const isFilled = adminPoints !== null && adminPoints !== '';

    return {
      id,
      admin_points: isFilled ? Number(adminPoints) : 0,
      is_correct: isFilled
    };
  });

  const data = await repository.updateAdminPoints(quizUserId, answers, actorId);

  if (!data) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  return data;
};

module.exports = {
  getAllItems,
  getItemById,
  updateAdminPoints
};
