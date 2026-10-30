/**
 * Swagger API Path Definitions for Quiz Answers Module
 */
const { crudPaths, json, envelope, errorResponse, ref, authErrors } = require('./_crud');

const multipart = (schemaName) => ({ 'multipart/form-data': { schema: ref(schemaName) } });

const quizAnswersPaths = crudPaths({
  tag: 'Quiz Answers',
  label: 'quiz answer',
  base: '/quiz-answers',
  schema: 'QuizUser',
  detail: 'QuizUserDetail',
  createInput: 'QuizAnswerInput',
  sortBy: ['quiz_title', 'created_at', 'updated_at'],
  listProps: {
    quizze_id: { type: 'string', format: 'uuid', description: 'Filter berdasarkan quiz', example: '50f35b4f-7d45-4c9b-b58e-0c7f64e88f5e' },
    created_by: { type: 'string', format: 'uuid', description: 'Filter berdasarkan user yang mengerjakan', example: 'f0b57258-5f33-4e03-81f7-cd70d833b5c5' }
  }
});

// tidak ada endpoint update: create sudah melakukan upsert
delete quizAnswersPaths['/quiz-answers/{id}'].put;

const list = quizAnswersPaths['/quiz-answers/get'].post;
list.description = 'Daftar rekap pengerjaan quiz per user (quiz_users join quizzes) dengan pagination, sorting, dan search (judul quiz)';

quizAnswersPaths['/quiz-answers/{id}'].get.description = 'Detail rekap pengerjaan quiz (quiz_users) beserta jawaban user tersebut pada quiz ini';
quizAnswersPaths['/quiz-answers/{id}'].delete.description = 'Soft delete rekap pengerjaan quiz beserta jawaban user tersebut pada quiz ini';
quizAnswersPaths['/quiz-answers/{id}/restore'].post.description = 'Restore rekap pengerjaan quiz beserta jawaban yang ikut terhapus bersamanya';

const create = quizAnswersPaths['/quiz-answers/create'].post;
create.summary = 'Simpan jawaban quiz (upsert)';
create.description = [
  'Dikirim sebagai multipart/form-data karena ada upload file (field files, di-upload ke Nextcloud). Payload hanya quiz_question_id, answers, points, files, file_delete; user diambil dari token (created_by).',
  '1. quiz_answers dicari berdasarkan quiz_question_id + created_by. Jika sudah ada di-update, jika belum dibuat baru.',
  '2. quizze_id diambil dari quiz_questions.quizzes_id. Rekap dihitung ulang dari quiz_answers user pada quiz tersebut: total_point = jumlah points, completed_count = jumlah soal yang sudah dijawab, uncompleted_count = jumlah soal (aktif) yang belum dijawab.',
  '3. quiz_users dicari berdasarkan quizze_id + created_by. Jika belum ada, dibuat baru. Jika sudah ada, hanya di-update bila nilai rekap berubah; selain itu dilewati.',
  'File: upload baru selalu menggantikan file lama; file_delete=true mengosongkan file bila tidak ada upload baru.'
].join('\n\n');
create.requestBody = { required: true, content: multipart('QuizAnswerInput') };
create.responses = {
  ...authErrors,
  201: { description: 'Saved successfully', content: json(envelope(ref('QuizAnswerSaveResult'), 'Data berhasil disimpan')) },
  400: errorResponse('Validation error (mis. soal tidak ditemukan)')
};

quizAnswersPaths['/quiz-answers/questions'] = {
  post: {
    tags: ['Quiz Answers'],
    summary: 'Get soal beserta jawaban user',
    description: 'Mengambil soal (quiz_questions: line, type, question, estimated_time, estimated_time_unit, points, options, image) beserta jawaban user created_by untuk soal tersebut (quiz_answers: answers, points, admin_points, files). answer bernilai null jika user belum menjawab.',
    requestBody: { required: true, content: json(ref('QuizAnswerQuestionRequest')) },
    responses: {
      ...authErrors,
      200: { description: 'Success', content: json(envelope(ref('QuizAnswerQuestion'), 'Success')) },
      400: errorResponse('Validation error'),
      404: errorResponse('Soal quiz tidak ditemukan')
    }
  }
};

module.exports = quizAnswersPaths;
