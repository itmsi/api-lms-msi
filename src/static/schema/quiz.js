/**
 * Swagger Schema Definitions for Quiz Module
 */

const auditProps = {
  created_at: { type: 'string', format: 'date-time', example: '2026-11-01T00:00:00.000Z' },
  created_by: { type: 'string', format: 'uuid', nullable: true, description: 'id pembuat data (bisa dari SSO)', example: null },
  updated_at: { type: 'string', format: 'date-time', example: '2026-11-01T00:00:00.000Z' },
  updated_by: { type: 'string', format: 'uuid', nullable: true, description: 'id pengubah terakhir (bisa dari SSO)', example: null },
  deleted_at: { type: 'string', format: 'date-time', nullable: true, example: null },
  deleted_by: { type: 'string', format: 'uuid', nullable: true, description: 'id penghapus data (bisa dari SSO)', example: null },
  is_delete: { type: 'boolean', description: 'Penanda soft delete', example: false }
};

const quizProps = {
  id: { type: 'string', format: 'uuid', description: 'Unique identifier', example: '9b1f2c34-5d6e-4f70-8a91-b2c3d4e5f607' },
  title: { type: 'string', description: 'Judul quiz', example: 'Ujian Pemahaman Onboarding Umum' },
  modules_id: { type: 'string', format: 'uuid', nullable: true, description: 'id module pemilik quiz ini', example: '123e4567-e89b-12d3-a456-426614174000' },
  module_title: { type: 'string', nullable: true, description: 'Judul module (hasil join)', example: 'Onboarding Umum' },
  type: {
    type: 'array',
    description: 'Audiens quiz',
    items: { type: 'string', enum: ['reguler', 'mt'] },
    example: ['reguler', 'mt']
  },
  start_date: { type: 'string', format: 'date', nullable: true, description: 'Tanggal mulai (YYYY-MM-DD)', example: '2026-11-03' },
  end_date: { type: 'string', format: 'date', nullable: true, description: 'Tanggal berakhir (YYYY-MM-DD)', example: '2026-12-31' },
  question_count: { type: 'integer', description: 'Jumlah soal aktif pada quiz ini', example: 10 },
  banner: {
    type: 'string',
    nullable: true,
    description: 'Share link banner dari Nextcloud (preview)',
    example: 'https://cloud.example.com/s/AbCdEfGh/preview'
  }
};

const typeInput = {
  type: 'array',
  description: 'Audiens quiz, minimal 1 item. Di multipart/form-data dikirim sebagai field berulang (type=reguler&type=mt), string JSON array, atau string dipisah koma.',
  items: { type: 'string', enum: ['reguler', 'mt'] },
  example: ['reguler', 'mt']
};

const bannerInput = {
  type: 'string',
  format: 'binary',
  description: 'File gambar banner (jpg/jpeg/png/webp/gif, maksimal 5MB). Jika dikirim, selalu menggantikan banner lama.'
};

const quizSchemas = {
  Quiz: {
    type: 'object',
    description: 'Item list quiz',
    properties: { ...quizProps, created_at: auditProps.created_at, updated_at: auditProps.updated_at }
  },
  QuizDetail: {
    type: 'object',
    properties: { ...quizProps, ...auditProps }
  },
  QuizDetailWithQuestions: {
    type: 'object',
    description: 'Detail quiz beserta daftar soal ringkas (urut berdasarkan line)',
    properties: {
      ...quizProps,
      ...auditProps,
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '5a8d9e10-1b2c-4d3e-8f40-a1b2c3d4e5f6' },
            line: { type: 'integer', example: 1 }
          }
        }
      }
    }
  },
  QuizInput: {
    type: 'object',
    required: ['title', 'modules_id', 'type', 'start_date', 'end_date'],
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 255, example: 'Ujian Pemahaman Onboarding Umum' },
      modules_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
      type: { ...typeInput, minItems: 1 },
      start_date: { type: 'string', format: 'date', example: '2026-11-03' },
      end_date: { type: 'string', format: 'date', description: 'Tidak boleh sebelum start_date', example: '2026-12-31' },
      banner: bannerInput
    }
  },
  QuizUpdateInput: {
    type: 'object',
    description: 'Semua field opsional (update parsial)',
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 255, example: 'Ujian Pemahaman Onboarding Umum' },
      modules_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
      type: typeInput,
      start_date: { type: 'string', format: 'date', example: '2026-11-03' },
      end_date: { type: 'string', format: 'date', description: 'Tidak boleh sebelum start_date', example: '2026-12-31' },
      banner: bannerInput,
      banner_delete: {
        type: 'boolean',
        description: 'Jika true, hapus banner yang ada (banner jadi null). Jika false/tidak dikirim, banner lama dipertahankan. Diabaikan jika ada file banner baru.',
        example: false
      }
    }
  }
};

module.exports = quizSchemas;
