/**
 * Swagger API Path Definitions for Quiz Results Module
 */
const { listRequest, json, envelope, errorResponse, ref, authErrors } = require('./_crud');

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
  }
};

module.exports = quizResultsPaths;
