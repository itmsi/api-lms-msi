/**
 * Swagger API Path Definitions for Quiz Module
 */
const { crudPaths } = require('./_crud');

const quizPaths = crudPaths({
  tag: 'Quizzes',
  label: 'quiz',
  base: '/quizzes',
  schema: 'Quiz',
  detail: 'QuizDetail',
  createInput: 'QuizInput',
  updateInput: 'QuizInput',
  sortBy: ['title', 'start_date', 'end_date', 'created_at', 'updated_at'],
  listProps: {
    modules_id: { type: 'string', format: 'uuid', description: 'Filter berdasarkan module', example: '123e4567-e89b-12d3-a456-426614174000' },
    type: { type: 'string', enum: ['reguler', 'mt'], description: 'Filter quiz yang audiensnya mengandung nilai ini', example: 'reguler' }
  }
});

// GET /quizzes/{id} mengembalikan quiz beserta soalnya; update boleh parsial
quizPaths['/quizzes/{id}'].get.description = 'Retrieve a single quiz by ID beserta daftar soalnya (urut berdasarkan line)';
quizPaths['/quizzes/{id}'].put.description = 'Update an existing quiz. Semua field opsional (update parsial). Menghapus quiz ikut meng-soft-delete seluruh soalnya.';
quizPaths['/quizzes/{id}'].delete.description = 'Soft delete a quiz beserta seluruh soalnya';
quizPaths['/quizzes/{id}/restore'].post.description = 'Restore a soft-deleted quiz beserta soal-soal yang ikut terhapus bersamanya';

module.exports = quizPaths;
