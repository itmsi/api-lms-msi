/**
 * Swagger Schema Definitions for Quiz Results Module
 */

const quizResultProps = {
  quiz_result_id: { type: 'string', format: 'uuid', description: 'quiz_users.id', example: '3c2b1a09-8f7e-4d6c-9b5a-4e3d2c1b0a99' },
  created_by_name: { type: 'string', nullable: true, description: 'gate_sso_employees.employee_name dari quiz_users.created_by', example: 'Budi Santoso' },
  updated_by_name: { type: 'string', nullable: true, description: 'gate_sso_employees.employee_name dari quiz_users.updated_by', example: 'Budi Santoso' },
  quizze_title: { type: 'string', nullable: true, description: 'quizzes.title', example: 'Ujian Pemahaman Onboarding Umum' },
  module_title: { type: 'string', nullable: true, description: 'modules.title', example: 'Pengenalan JavaScript' },
  completed_count: { type: 'string', nullable: true, description: 'quiz_users.completed_count', example: '8' },
  uncompleted_count: { type: 'string', nullable: true, description: 'quiz_users.uncompleted_count', example: '2' },
  status: { type: 'string', enum: ['completed', 'uncompleted'], description: 'completed jika uncompleted_count = 0, selain itu uncompleted', example: 'uncompleted' },
  status_proses: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED'], nullable: true, description: 'quiz_users.status_proses: rekap quiz_answers.ai_assessment_status, FAILED bila ada yang FAILED, lalu PENDING bila ada yang PENDING, lalu SUCCESS (status null tidak dihitung). null jika tidak ada jawaban yang berstatus', example: 'PENDING' },
  send_date: { type: 'string', format: 'date-time', nullable: true, description: 'quiz_users.send_date: waktu peserta mengirim jawaban terakhir, null jika belum dikirim', example: '2026-11-03T08:20:00.000Z' },
  updated_at: { type: 'string', format: 'date-time', nullable: true, description: 'quiz_users.updated_at', example: '2026-11-03T08:20:00.000Z' },
  total_point: { type: 'string', nullable: true, description: 'quiz_users.total_point', example: '80' },
  max_points: { type: 'string', nullable: true, description: 'quizzes.max_points: jumlah poin seluruh soal aktif quiz, dihitung ulang otomatis saat soal berubah', example: '100' },
  total_correct_points: { type: 'string', nullable: true, description: 'quiz_users.total_correct_points: jumlah quiz_answers.admin_points milik user', example: '80' },
  total_possible_points: { type: 'string', nullable: true, description: 'quiz_users.total_possible_points: jumlah quiz_questions.points dari soal aktif quiz', example: '100' }
};

const answerItemExample = [{ line: 2, text: 'Laporkan ke tim IT', is_correct: true }];

const quizResultsSchemas = {
  QuizResultAdminPointsInput: {
    type: 'array',
    minItems: 1,
    description: 'Daftar jawaban yang dinilai, quiz_answer_id tidak boleh duplikat',
    items: {
      type: 'object',
      required: ['quiz_answer_id', 'admin_points'],
      properties: {
        quiz_answer_id: { type: 'string', format: 'uuid', description: 'quiz_answers.id', example: '7d6c5b4a-3e2f-4a1b-9c8d-0e1f2a3b4c5d' },
        admin_points: { type: 'string', nullable: true, description: 'Nilai dari admin, angka bulat dari 0 sampai poin soal (quiz_questions.points). null atau kosong untuk mengosongkan nilai', example: '10' }
      }
    }
  },
  QuizResultAdminPointsResult: {
    type: 'object',
    properties: {
      quiz_result_id: { type: 'string', format: 'uuid', description: 'quiz_users.id', example: '3c2b1a09-8f7e-4d6c-9b5a-4e3d2c1b0a99' },
      total_point: { type: 'string', description: 'quiz_users.total_point setelah dihitung ulang', example: '15' },
      answers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            quiz_answer_id: { type: 'string', format: 'uuid', description: 'quiz_answers.id', example: '7d6c5b4a-3e2f-4a1b-9c8d-0e1f2a3b4c5d' },
            admin_points: { type: 'integer', description: 'quiz_answers.admin_points, 0 jika nilai dikosongkan', example: 10 },
            is_correct: { type: 'boolean', description: 'true jika admin_points terisi, false jika dikosongkan', example: true },
            updated_at: { type: 'string', format: 'date-time', example: '2026-11-03T08:20:00.000Z' },
            updated_by: { type: 'string', format: 'uuid', nullable: true, description: 'id admin yang menilai', example: 'f0b57258-5f33-4e03-81f7-cd70d833b5c5' }
          }
        }
      }
    }
  },
  QuizResultRegradeResult: {
    type: 'object',
    properties: {
      quiz_result_id: { type: 'string', format: 'uuid', description: 'quiz_users.id', example: '3c2b1a09-8f7e-4d6c-9b5a-4e3d2c1b0a99' },
      auto_graded_count: { type: 'integer', description: 'Jumlah jawaban multiple_choice, multiple_answers & true_false yang sudah dinilai ulang', example: 3 },
      ai_assessment_count: { type: 'integer', description: 'Jumlah jawaban short_answer yang dikirim ke queue penilaian AI, hasilnya menyusul', example: 1 }
    }
  },
  QuizResult: {
    type: 'object',
    description: 'Hasil pengerjaan quiz per user (quiz_users join quizzes & modules)',
    properties: quizResultProps
  },
  QuizResultDetail: {
    type: 'object',
    description: 'Hasil pengerjaan quiz per user beserta seluruh soal dan jawaban user',
    properties: {
      ...quizResultProps,
      question_answers: {
        type: 'array',
        description: 'Seluruh soal aktif quiz (urut berdasarkan line)',
        items: {
          type: 'object',
          properties: {
            quiz_question_id: { type: 'string', format: 'uuid', description: 'quiz_questions.id', example: '5a8d9e10-1b2c-4d3e-8f40-a1b2c3d4e5f6' },
            line: { type: 'integer', description: 'quiz_questions.line', example: 1 },
            type: { type: 'string', enum: ['multiple_choice', 'multiple_answers', 'true_false', 'short_answer'], description: 'quiz_questions.type', example: 'multiple_choice' },
            question: { type: 'string', description: 'quiz_questions.question', example: 'Anda menerima email yang meminta verifikasi kata sandi. Apa langkah yang paling tepat?' },
            question_point: { type: 'integer', description: 'quiz_questions.points', example: 10 },
            question_answer: { type: 'array', description: 'Kunci jawaban: quiz_questions.options dengan is_correct = true', items: { $ref: '#/components/schemas/QuizAnswerItem' }, example: answerItemExample },
            quiz_answer_id: { type: 'string', format: 'uuid', nullable: true, description: 'quiz_answers.id, null jika user belum menjawab', example: '7d6c5b4a-3e2f-4a1b-9c8d-0e1f2a3b4c5d' },
            user_answer: { type: 'array', nullable: true, description: 'quiz_answers.answers, null jika user belum menjawab', items: { $ref: '#/components/schemas/QuizAnswerItem' }, example: answerItemExample },
            user_answer_file: { type: 'string', nullable: true, description: 'quiz_answers.files, null jika user belum menjawab atau tidak melampirkan file', example: null },
            question_file: { type: 'string', nullable: true, description: 'quiz_questions.image (share link Nextcloud), null jika soal tidak punya gambar', example: null },
            answer_file: { type: 'string', nullable: true, description: 'quiz_answers.files (share link Nextcloud), null jika user belum menjawab atau tidak melampirkan file', example: null },
            user_point: { type: 'integer', description: 'quiz_answers.admin_points, 0 jika user belum menjawab', example: 10 },
            answer_status: { type: 'string', enum: ['correct', 'incorrect'], nullable: true, description: 'quiz_answers.is_correct: true = correct, false = incorrect, null jika user belum menjawab', example: 'correct' }
          }
        }
      }
    }
  }
};

module.exports = quizResultsSchemas;
