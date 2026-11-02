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

module.exports = {
  getAllItems,
  getItemById
};
