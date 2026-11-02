/**
 * Swagger API Path Definitions for Quiz Results Module
 */
const { listRequest, json, envelope, errorResponse, idParam, ref, authErrors } = require('./_crud');

const quizResultsPaths = {
  '/quiz_results/get': {
    post: {
      tags: ['Quiz Results'],
      summary: 'Get all quiz results',
      description: 'Daftar hasil pengerjaan quiz per user (quiz_users join quizzes & modules) dengan pagination, sorting, search (judul quiz & judul module), serta filter quizzes_id dan status.',
      requestBody: {
        required: false,
        content: json(listRequest(['quizze_title', 'module_title', 'created_at', 'updated_at'], 'created_at', 'desc', {
          quizzes_id: { type: 'string', format: 'uuid', description: 'Filter berdasarkan quiz', example: '' },
          status: { type: 'string', enum: ['completed', 'uncompleted'], description: 'Filter berdasarkan status pengerjaan', example: '' }
        }))
      },
      responses: {
        ...authErrors,
        200: {
          description: 'Success',
          content: json(envelope({
            type: 'object',
            properties: {
              items: { type: 'array', items: ref('QuizResult') },
              pagination: ref('Pagination')
            }
          }, 'Success'))
        },
        400: errorResponse('Validation error')
      }
    }
  },
  '/quiz_results/{id}': {
    get: {
      tags: ['Quiz Results'],
      summary: 'Get quiz result by ID',
      description: 'Detail hasil pengerjaan quiz (id = quiz_users.id) beserta question_answers: seluruh soal aktif quiz (urut berdasarkan line) dan jawaban user. Kolom jawaban bernilai null dan user_point 0 jika soal belum dijawab. question_answer berisi kunci jawaban (opsi is_correct = true).',
      parameters: [idParam('quiz result')],
      responses: {
        ...authErrors,
        200: { description: 'Success', content: json(envelope(ref('QuizResultDetail'), 'Success')) },
        400: errorResponse('Validation error'),
        404: errorResponse('Not found')
      }
    }
  }
};

module.exports = quizResultsPaths;
