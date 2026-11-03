const repository = require('./repository');
const { joinTexts, assessShortAnswer } = require('../quiz_answers/ai_assessment');

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

/**
 * Penilaian ulang seluruh jawaban pada satu hasil quiz (id = quiz_users.id), termasuk nilai yang sudah diubah admin.
 * Soal otomatis langsung dinilai; short_answer selalu dikirim ulang ke queue penilaian AI dan hasilnya menyusul.
 * short_answer dengan jawaban kosong dilewati karena tidak ada yang dinilai.
 */
const regrade = async (quizUserId, authorization) => {
  const data = await repository.findById(quizUserId);

  if (!data) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }

  const answers = await repository.findAnswersToRegrade(data.quizze_id, data.created_by);
  const autoAnswers = answers.filter((answer) => answer.type !== 'short_answer');
  const aiAnswers = answers.filter((answer) => answer.type === 'short_answer' && joinTexts(answer.answers));

  await repository.regradeAnswers(
    data.quizze_id,
    data.created_by,
    autoAnswers.map((answer) => answer.quiz_question_id)
  );

  for (const answer of aiAnswers) {
    await assessShortAnswer(answer.id, authorization, { keepPoints: true });
  }

  return {
    quiz_result_id: quizUserId,
    auto_graded_count: autoAnswers.length,
    ai_assessment_count: aiAnswers.length
  };
};

module.exports = {
  getAllItems,
  getItemById,
  updateAdminPoints,
  regrade
};
