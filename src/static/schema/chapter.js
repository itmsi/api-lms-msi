/**
 * Swagger Schema Definitions for Chapter Module
 */

const chapterSchemas = {
  Chapter: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', description: 'Unique identifier', example: '223e4567-e89b-12d3-a456-426614174000' },
      modules_id: { type: 'string', format: 'uuid', nullable: true, description: 'id module pemilik chapter ini', example: '123e4567-e89b-12d3-a456-426614174000' },
      title: { type: 'string', nullable: true, description: 'Judul chapter', example: 'Variabel dan Tipe Data' },
      description: { type: 'string', nullable: true, description: 'Deskripsi chapter', example: 'Mengenal variabel, tipe data, dan operator di JavaScript' },
      link_materials: {
        type: 'array',
        nullable: true,
        description: 'Daftar link materi chapter',
        items: { type: 'string', format: 'uri' },
        example: ['https://example.com/chapter-1-materi.pdf']
      },
      created_at: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
      updated_at: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
      deleted_at: { type: 'string', format: 'date-time', nullable: true, example: null },
      created_by: { type: 'string', format: 'uuid', nullable: true, description: 'id pembuat data (bisa dari SSO)', example: null },
      updated_by: { type: 'string', format: 'uuid', nullable: true, description: 'id pengubah terakhir (bisa dari SSO)', example: null },
      deleted_by: { type: 'string', format: 'uuid', nullable: true, description: 'id penghapus data (bisa dari SSO)', example: null },
      is_delete: { type: 'boolean', description: 'Penanda soft delete', example: false }
    }
  },
  ChapterInput: {
    type: 'object',
    required: ['title'],
    properties: {
      modules_id: { type: 'string', format: 'uuid', nullable: true, example: '123e4567-e89b-12d3-a456-426614174000' },
      title: { type: 'string', minLength: 3, maxLength: 255, example: 'Variabel dan Tipe Data' },
      description: { type: 'string', maxLength: 2000, example: 'Mengenal variabel, tipe data, dan operator di JavaScript' },
      link_materials: {
        type: 'array',
        items: { type: 'string', format: 'uri' },
        example: ['https://example.com/chapter-1-materi.pdf']
      }
    }
  }
};

module.exports = chapterSchemas;
