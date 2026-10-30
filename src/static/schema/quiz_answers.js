/**
 * Swagger Schema Definitions for Quiz Answers Module
 */

const auditProps = {
  created_at: { type: 'string', format: 'date-time', example: '2026-11-01T00:00:00.000Z' },
  created_by: { type: 'string', format: 'uuid', nullable: true, description: 'id user yang mengerjakan / menjawab', example: 'f0b57258-5f33-4e03-81f7-cd70d833b5c5' },
  updated_at: { type: 'string', format: 'date-time', example: '2026-11-01T00:00:00.000Z' },
  updated_by: { type: 'string', format: 'uuid', nullable: true, example: null },
  deleted_at: { type: 'string', format: 'date-time', nullable: true, example: null },
  deleted_by: { type: 'string', format: 'uuid', nullable: true, example: null },
  is_delete: { type: 'boolean', description: 'Penanda soft delete', example: false }
};

const quizUserProps = {
  id: { type: 'string', format: 'uuid', example: '3c2b1a09-8f7e-4d6c-9b5a-4e3d2c1b0a99' },
  quizze_id: { type: 'string', format: 'uuid', nullable: true, example: '50f35b4f-7d45-4c9b-b58e-0c7f64e88f5e' },
  quiz_title: { type: 'string', nullable: true, description: 'Judul quiz (hasil join)', example: 'Ujian Pemahaman Onboarding Umum' },
  quiz_type: { type: 'array', nullable: true, items: { type: 'string', enum: ['reguler', 'mt'] }, example: ['reguler', 'mt'] },
  quiz_start_date: { type: 'string', format: 'date', nullable: true, example: '2026-11-03' },
  quiz_end_date: { type: 'string', format: 'date', nullable: true, example: '2026-12-31' },
  total_point: { type: 'string', nullable: true, description: 'Dihitung backend: jumlah points jawaban user pada soal-soal quiz ini', example: '80' },
  completed_count: { type: 'string', nullable: true, description: 'Dihitung backend: jumlah soal quiz yang sudah dijawab user', example: '8' },
  uncompleted_count: { type: 'string', nullable: true, description: 'Dihitung backend: jumlah soal quiz yang belum dijawab user', example: '2' },
  ...auditProps
};

const quizAnswersSchemas = {
  QuizUser: {
    type: 'object',
    description: 'Rekap pengerjaan quiz per user (quiz_users join quizzes)',
    properties: quizUserProps
  },
  QuizAnswer: {
    type: 'object',
    description: 'Jawaban user untuk satu soal quiz',
    properties: {
      id: { type: 'string', format: 'uuid', example: '7d6c5b4a-3e2f-4a1b-9c8d-0e1f2a3b4c5d' },
      quiz_question_id: { type: 'string', format: 'uuid', nullable: true, example: '5a8d9e10-1b2c-4d3e-8f40-a1b2c3d4e5f6' },
      question_line: { type: 'integer', nullable: true, description: 'Urutan soal (hasil join)', example: 1 },
      question_type: { type: 'string', nullable: true, description: 'Tipe soal (hasil join)', example: 'multiple_choice' },
      question: { type: 'string', nullable: true, description: 'Teks soal (hasil join)', example: 'Apa langkah yang paling tepat?' },
      answers: { description: 'Jawaban user (jsonb, bebas: array/objek/teks)', nullable: true, example: [2] },
      points: { type: 'integer', example: 10 },
      admin_points: { type: 'string', nullable: true, description: 'Poin dari admin/penilai', example: null },
      files: { type: 'string', nullable: true, description: 'Share link file lampiran dari Nextcloud', example: null },
      ...auditProps
    }
  },
  QuizUserDetail: {
    type: 'object',
    properties: {
      ...quizUserProps,
      answers: { type: 'array', description: 'Jawaban user pada quiz ini (urut berdasarkan line soal)', items: { $ref: '#/components/schemas/QuizAnswer' } }
    }
  },
  QuizAnswerQuestionRequest: {
    type: 'object',
    required: ['quiz_question_id', 'created_by'],
    properties: {
      quiz_question_id: { type: 'string', format: 'uuid', example: '5a8d9e10-1b2c-4d3e-8f40-a1b2c3d4e5f6' },
      created_by: { type: 'string', format: 'uuid', description: 'id user yang menjawab', example: 'f0b57258-5f33-4e03-81f7-cd70d833b5c5' }
    }
  },
  QuizAnswerQuestion: {
    type: 'object',
    description: 'Soal quiz (quiz_questions) beserta jawaban user (quiz_answers)',
    properties: {
      id: { type: 'string', format: 'uuid', description: 'id soal', example: '5a8d9e10-1b2c-4d3e-8f40-a1b2c3d4e5f6' },
      line: { type: 'integer', example: 1 },
      type: { type: 'string', enum: ['multiple_choice', 'multiple_answers', 'true_false', 'short_answer'], example: 'multiple_choice' },
      question: { type: 'string', example: 'Anda menerima email yang meminta verifikasi kata sandi. Apa langkah yang paling tepat?' },
      estimated_time: { type: 'integer', nullable: true, example: 1 },
      estimated_time_unit: { type: 'string', enum: ['minutes', 'seconds'], example: 'minutes' },
      points: { type: 'integer', description: 'Poin soal', example: 2 },
      options: {
        type: 'array',
        description: 'Opsi jawaban tanpa kunci jawaban (is_correct tidak dikirim)',
        items: {
          type: 'object',
          properties: {
            line: { type: 'integer', example: 1 },
            text: { type: 'string', example: 'Laporkan ke tim IT' }
          }
        },
        example: [
          { line: 1, text: 'Klik tautannya' },
          { line: 2, text: 'Laporkan ke tim IT' }
        ]
      },
      image: { type: 'string', nullable: true, description: 'Link gambar soal (Nextcloud share link + /preview)', example: null },
      answer: {
        type: 'object',
        nullable: true,
        description: 'Jawaban user untuk soal ini, null jika belum menjawab',
        properties: {
          answers: { description: 'Jawaban user (jsonb)', nullable: true, example: [2] },
          points: { type: 'integer', description: 'Poin jawaban', example: 2 },
          admin_points: { type: 'string', nullable: true, description: 'Poin dari admin/penilai', example: null },
          files: { type: 'string', nullable: true, description: 'Share link file lampiran dari Nextcloud', example: null }
        }
      }
    }
  },
  QuizAnswerSaveResult: {
    type: 'object',
    properties: {
      quiz_user: { $ref: '#/components/schemas/QuizUser' },
      quiz_answer: { $ref: '#/components/schemas/QuizAnswer' }
    }
  },
  // dikirim sebagai multipart/form-data, jadi answers berupa string JSON
  QuizAnswerInput: {
    type: 'object',
    required: ['quiz_question_id'],
    properties: {
      quiz_question_id: { type: 'string', format: 'uuid', description: 'id soal yang dijawab. quizze_id diambil otomatis dari quiz_questions.quizzes_id', example: '5a8d9e10-1b2c-4d3e-8f40-a1b2c3d4e5f6' },
      answers: {
        type: 'string',
        description: 'Jawaban user sebagai string JSON (mis. [2] atau {"text":"<p>jawaban</p>"}). Teks non-JSON disimpan sebagai string JSON.',
        example: '[2]'
      },
      points: { type: 'integer', minimum: 0, default: 0, example: 10 },
      files: { type: 'string', format: 'binary', description: 'File lampiran opsional (gambar, pdf, doc/x, xls/x, ppt/x, txt, zip; maks 10MB). Jika dikirim, selalu menggantikan file lama.' },
      file_delete: {
        type: 'boolean',
        description: 'Jika true, hapus file jawaban yang ada (files jadi null). Jika false/tidak dikirim, file lama dipertahankan. Diabaikan jika ada file baru.',
        example: false
      }
    }
  }
};

module.exports = quizAnswersSchemas;
