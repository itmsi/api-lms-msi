/**
 * Swagger API Path Definitions for Quiz Question Module
 */
const { crudPaths, json, envelope, errorResponse, ref, authErrors } = require('./_crud');

const multipart = (schemaName) => ({ 'multipart/form-data': { schema: ref(schemaName) } });

const quizQuestionPaths = crudPaths({
  tag: 'Quiz Questions',
  label: 'quiz question',
  base: '/quiz-questions',
  schema: 'QuizQuestion',
  createInput: 'QuizQuestionInput',
  updateInput: 'QuizQuestionInput',
  sortBy: ['line', 'created_at', 'updated_at'],
  defaultSort: 'line',
  defaultOrder: 'asc',
  listProps: {
    quizzes_id: { type: 'string', format: 'uuid', description: 'Filter berdasarkan quiz', example: '9b1f2c34-5d6e-4f70-8a91-b2c3d4e5f607' },
    type: { type: 'string', enum: ['multiple_choice', 'multiple_answers', 'true_false', 'short_answer'], description: 'Filter berdasarkan tipe soal', example: 'multiple_choice' }
  }
});

// create & update dikirim sebagai multipart/form-data karena ada upload gambar
const create = quizQuestionPaths['/quiz-questions/create'].post;
create.description = 'Create a new quiz question. Dikirim sebagai multipart/form-data; field image opsional (di-upload ke Nextcloud, disimpan sebagai share link). options dikirim sebagai string JSON array dan divalidasi sesuai type.';
create.requestBody = { required: true, content: multipart('QuizQuestionInput') };
create.responses = {
  ...authErrors,
  201: { description: 'Created successfully', content: json(envelope(ref('QuizQuestion'), 'Data berhasil dibuat')) },
  400: errorResponse('Validation error (mis. options tidak sesuai type, quiz tidak ditemukan)')
};

const update = quizQuestionPaths['/quiz-questions/{id}'].put;
update.description = 'Update an existing quiz question. Dikirim sebagai multipart/form-data, semua field opsional (update parsial); quizzes_id diabaikan. Jika type atau options dikirim, keduanya divalidasi bersama nilai yang tersimpan. Field image opsional (jika tidak dikirim, gambar lama tetap dipakai); gunakan image_delete=true untuk menghapus gambar tanpa upload baru.';
update.requestBody = { required: true, content: multipart('QuizQuestionInput') };
update.responses = {
  ...authErrors,
  200: { description: 'Updated successfully', content: json(envelope(ref('QuizQuestion'), 'Data berhasil diupdate')) },
  400: errorResponse('Validation error'),
  404: errorResponse('Not found')
};

module.exports = quizQuestionPaths;
