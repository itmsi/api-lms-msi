/**
 * Swagger Schema Definitions for Log Activity Module
 */

const logActivitySchemas = {
  LogActivity: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', description: 'Unique identifier', example: '323e4567-e89b-12d3-a456-426614174000' },
      modules_id: { type: 'string', format: 'uuid', nullable: true, description: 'id module terkait aktivitas ini', example: '123e4567-e89b-12d3-a456-426614174000' },
      activity: { type: 'string', nullable: true, description: 'Deskripsi aktivitas', example: 'Membuka materi Variabel dan Tipe Data' },
      file_name: { type: 'string', nullable: true, description: 'Nama file terkait aktivitas', example: 'chapter-1-materi.pdf' },
      type: { type: 'string', nullable: true, description: 'Tipe aktivitas', example: 'view' },
      created_at: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
      updated_at: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
      deleted_at: { type: 'string', format: 'date-time', nullable: true, example: null },
      created_by: { type: 'string', format: 'uuid', nullable: true, description: 'id pembuat data (bisa dari SSO)', example: null },
      created_by_name: { type: 'string', nullable: true, description: 'Nama employee pembuat data (dari SSO), hanya ada pada response get all', example: 'Budi Santoso' },
      updated_by: { type: 'string', format: 'uuid', nullable: true, description: 'id pengubah terakhir (bisa dari SSO)', example: null },
      deleted_by: { type: 'string', format: 'uuid', nullable: true, description: 'id penghapus data (bisa dari SSO)', example: null },
      is_delete: { type: 'boolean', description: 'Penanda soft delete', example: false }
    }
  },
  LogActivityInput: {
    type: 'object',
    properties: {
      created_by: { type: 'string', format: 'uuid', nullable: true, description: 'id pembuat data (default: user yang login)', example: null },
      modules_id: { type: 'string', format: 'uuid', nullable: true, example: '123e4567-e89b-12d3-a456-426614174000' },
      activity: { type: 'string', nullable: true, example: 'Membuka materi Variabel dan Tipe Data' },
      file_name: { type: 'string', nullable: true, example: 'chapter-1-materi.pdf' },
      type: { type: 'string', nullable: true, example: 'view' }
    }
  }
};

module.exports = logActivitySchemas;
