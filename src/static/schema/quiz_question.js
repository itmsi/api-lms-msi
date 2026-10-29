/**
 * Swagger Schema Definitions for Quiz Question Module
 */

const QUESTION_TYPES = ['multiple_choice', 'multiple_answers', 'true_false', 'short_answer'];

const quizQuestionSchemas = {
  QuizQuestionOption: {
    type: 'object',
    required: ['text'],
    properties: {
      line: { type: 'integer', minimum: 1, description: 'Urutan opsi (diisi otomatis 1..n bila tidak dikirim)', example: 1 },
      text: { type: 'string', description: 'Teks opsi / jawaban', example: 'Laporkan ke tim IT' },
      is_correct: { type: 'boolean', description: 'Penanda jawaban benar (short_answer: selalu dianggap benar)', example: true }
    }
  },
  QuizQuestion: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', description: 'Unique identifier', example: '5a8d9e10-1b2c-4d3e-8f40-a1b2c3d4e5f6' },
      quizzes_id: { type: 'string', format: 'uuid', description: 'id quiz pemilik soal', example: '9b1f2c34-5d6e-4f70-8a91-b2c3d4e5f607' },
      line: { type: 'integer', description: 'Urutan soal dalam quiz', example: 1 },
      type: { type: 'string', enum: QUESTION_TYPES, example: 'multiple_choice' },
      question: { type: 'string', example: 'Anda menerima email yang meminta verifikasi kata sandi. Apa langkah yang paling tepat?' },
      estimated_time: { type: 'integer', nullable: true, description: 'Estimasi waktu mengerjakan', example: 1 },
      estimated_time_unit: { type: 'string', enum: ['minutes', 'seconds'], example: 'minutes' },
      points: { type: 'integer', description: 'Poin soal', example: 2 },
      options: {
        type: 'array',
        items: { $ref: '#/components/schemas/QuizQuestionOption' },
        example: [
          { line: 1, text: 'Klik tautannya', is_correct: false },
          { line: 2, text: 'Laporkan ke tim IT', is_correct: true }
        ]
      },
      image: { type: 'string', nullable: true, description: 'Link gambar soal (Nextcloud share link + /preview)', example: null },
      created_at: { type: 'string', format: 'date-time', example: '2026-11-01T00:00:00.000Z' },
      created_by: { type: 'string', format: 'uuid', nullable: true, example: null },
      updated_at: { type: 'string', format: 'date-time', example: '2026-11-01T00:00:00.000Z' },
      updated_by: { type: 'string', format: 'uuid', nullable: true, example: null },
      deleted_at: { type: 'string', format: 'date-time', nullable: true, example: null },
      deleted_by: { type: 'string', format: 'uuid', nullable: true, example: null },
      is_delete: { type: 'boolean', example: false }
    }
  },
  // dikirim sebagai multipart/form-data, jadi options berupa string JSON array
  QuizQuestionInput: {
    type: 'object',
    required: ['quizzes_id', 'type', 'question', 'options'],
    properties: {
      quizzes_id: { type: 'string', format: 'uuid', description: 'Wajib saat create, diabaikan saat update', example: '9b1f2c34-5d6e-4f70-8a91-b2c3d4e5f607' },
      line: { type: 'integer', minimum: 1, description: 'Urutan soal. Jika tidak dikirim saat create, otomatis = line terakhir + 1', example: 1 },
      type: {
        type: 'string',
        enum: QUESTION_TYPES,
        description: [
          'Aturan options per type:',
          '- multiple_choice: minimal 2 opsi, tepat 1 is_correct=true',
          '- multiple_answers: minimal 2 opsi, minimal 1 is_correct=true',
          '- true_false: tepat 2 opsi (mis. Benar/Salah), tepat 1 is_correct=true',
          '- short_answer: minimal 1 opsi = jawaban yang diterima (semua dianggap benar)'
        ].join('\n'),
        example: 'multiple_choice'
      },
      question: { type: 'string', example: 'Anda menerima email yang meminta verifikasi kata sandi. Apa langkah yang paling tepat?' },
      estimated_time: { type: 'integer', minimum: 1, example: 1 },
      estimated_time_unit: { type: 'string', enum: ['minutes', 'seconds'], default: 'minutes', example: 'minutes' },
      points: { type: 'integer', minimum: 0, default: 0, example: 2 },
      options: {
        type: 'string',
        description: 'String JSON array: [{ "line": 1, "text": "", "is_correct": false }]',
        example: '[{"line":1,"text":"Klik tautannya","is_correct":false},{"line":2,"text":"Laporkan ke tim IT","is_correct":true}]'
      },
      image: { type: 'string', format: 'binary', description: 'File gambar opsional (jpg, jpeg, png, webp, gif; maks 5MB)' },
      image_delete: { type: 'boolean', description: 'Hanya untuk update: true untuk menghapus gambar tanpa upload baru', example: false }
    }
  }
};

module.exports = quizQuestionSchemas;
