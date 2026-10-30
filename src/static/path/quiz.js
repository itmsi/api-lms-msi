/**
 * Swagger API Path Definitions for Quiz Module
 */
const { crudPaths, ref } = require('./_crud');

const quizPaths = crudPaths({
  tag: 'Quizzes',
  label: 'quiz',
  base: '/quizzes',
  schema: 'Quiz',
  detail: 'QuizDetail',
  createInput: 'QuizInput',
  updateInput: 'QuizUpdateInput',
  sortBy: ['title', 'start_date', 'end_date', 'created_at', 'updated_at'],
  listProps: {
    modules_id: { type: 'string', format: 'uuid', description: 'Filter berdasarkan module', example: '123e4567-e89b-12d3-a456-426614174000' },
    type: { type: 'string', enum: ['reguler', 'mt'], description: 'Filter quiz yang audiensnya mengandung nilai ini', example: 'reguler' }
  }
});

// create & update dikirim sebagai multipart/form-data karena mendukung upload file banner; update boleh parsial
quizPaths['/quizzes/create'].post.description = 'Create a new quiz. Dikirim sebagai multipart/form-data karena mendukung upload file banner (di-upload ke Nextcloud, hasilnya disimpan sebagai share link).';
quizPaths['/quizzes/create'].post.requestBody.content = { 'multipart/form-data': { schema: ref('QuizInput') } };
quizPaths['/quizzes/{id}'].put.requestBody.content = { 'multipart/form-data': { schema: ref('QuizUpdateInput') } };
quizPaths['/quizzes/{id}'].put.description = 'Update an existing quiz. Dikirim sebagai multipart/form-data, semua field opsional (update parsial). Banner lama dipertahankan jika tidak ada file baru; gunakan banner_delete=true untuk menghapus banner. Menghapus quiz ikut meng-soft-delete seluruh soalnya.';
quizPaths['/quizzes/{id}'].delete.description = 'Soft delete a quiz beserta seluruh soalnya';
quizPaths['/quizzes/{id}/restore'].post.description = 'Restore a soft-deleted quiz beserta soal-soal yang ikut terhapus bersamanya';

module.exports = quizPaths;
