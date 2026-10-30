/**
 * Swagger API Path Definitions for Quiz Answers Module
 */
const { crudPaths, listRequest, json, envelope, errorResponse, idParam, ref, authErrors } = require('./_crud');

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
  'Format answers: [{"line":1,"text":"text jawab","is_correct":true}] (is_correct = true berarti opsi dipilih; [] = belum dijawab).',
  '1. quiz_answers dicari berdasarkan quiz_question_id + created_by. Jika sudah ada di-update, jika belum dibuat baru.',
  '2. Penilaian otomatis, kecuali soal short_answer: semua opsi quiz_questions.options dengan is_correct = true dibandingkan dengan line yang dipilih di answers. Jika sama persis, quiz_answers.points & admin_points = quiz_questions.points; jika tidak, 0.',
  '3. Rekap quiz_users (quizze_id dari quiz_questions.quizzes_id) dihitung ulang: total_point = jumlah admin_points, completed_count = jumlah jawaban dengan answers tidak [], uncompleted_count = jumlah jawaban dengan answers = []. quiz_users dibuat bila belum ada, dan hanya di-update bila nilainya berubah.',
  'Nilai ulang juga berjalan otomatis saat type/options/points soal diubah (PUT /quiz-questions/{id}).',
  'File: upload baru selalu menggantikan file lama; file_delete=true mengosongkan file bila tidak ada upload baru.'
].join('\n\n');
create.requestBody = { required: true, content: multipart('QuizAnswerInput') };
create.responses = {
  ...authErrors,
  201: { description: 'Saved successfully', content: json(envelope(ref('QuizAnswerSaveResult'), 'Data berhasil disimpan')) },
  400: errorResponse('Validation error (mis. soal tidak ditemukan)')
};

const quizzesRequest = listRequest(['title', 'start_date', 'end_date', 'created_at', 'updated_at'], 'created_at', 'desc', {
  modules_id: { type: 'string', format: 'uuid', description: 'Filter berdasarkan module', example: '' },
  type: { type: 'string', enum: ['reguler', 'mt'], description: 'Filter quiz yang audiensnya mengandung nilai ini', example: 'reguler' },
  created_by: { type: 'string', format: 'uuid', description: 'Wajib. id user yang rekap pengerjaannya ditampilkan', example: 'f0b57258-5f33-4e03-81f7-cd70d833b5c5' }
});
quizzesRequest.required = ['created_by'];

quizAnswersPaths['/quiz-answers/quizzes/get'] = {
  post: {
    tags: ['Quiz Answers'],
    summary: 'Get all quizzes beserta rekap pengerjaan user',
    description: 'Proses sama seperti POST /quizzes/get (pagination, sorting, search judul, filter modules_id & type), ditambah completed_count, uncompleted_count, total_point dari quiz_users milik created_by. Nilai rekap null jika user belum pernah menjawab quiz tersebut.',
    requestBody: { required: true, content: json(quizzesRequest) },
    responses: {
      ...authErrors,
      200: {
        description: 'Success',
        content: json(envelope({
          type: 'object',
          properties: {
            items: { type: 'array', items: ref('QuizWithProgress') },
            pagination: ref('Pagination')
          }
        }, 'Success'))
      },
      400: errorResponse('Validation error')
    }
  }
};

quizAnswersPaths['/quiz-answers/quizzes/get/{id}'] = {
  get: {
    tags: ['Quiz Answers'],
    summary: 'Get quiz by ID beserta soal',
    description: 'Detail quiz (sama seperti GET /quizzes/{id}) ditambah questions: daftar soal aktif (id, line, question) urut berdasarkan line. question berupa potongan teks soal tanpa tag HTML, maksimal 25 karakter lalu diakhiri "..." jika lebih panjang.',
    parameters: [idParam('quiz')],
    responses: {
      ...authErrors,
      200: { description: 'Success', content: json(envelope(ref('QuizAnswerQuizDetail'), 'Success')) },
      404: errorResponse('Not found')
    }
  }
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
