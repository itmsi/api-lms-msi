/**
 * Swagger Schema Definitions for Modul (modules) Module
 */

const modulSchemas = {
  Modul: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', description: 'Unique identifier', example: '123e4567-e89b-12d3-a456-426614174000' },
      title: { type: 'string', nullable: true, description: 'Judul module', example: 'Pengenalan JavaScript' },
      description: { type: 'string', nullable: true, description: 'Deskripsi module', example: 'Materi dasar bahasa pemrograman JavaScript' },
      module_category: { type: 'string', nullable: true, enum: ['mt', 'nonmt', 'division'], description: 'Kategori module', example: 'mt' },
      link_materials: {
        type: 'array',
        nullable: true,
        description: 'Daftar link materi module',
        items: { type: 'string', format: 'uri' },
        example: ['https://example.com/materi-1.pdf', 'https://example.com/materi-2.pdf']
      },
      banner: { type: 'string', nullable: true, description: 'Share link banner dari Nextcloud', example: 'https://cloud.inlinegroupdc.com/s/AbCdEfGh' },
      created_at: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
      updated_at: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
      deleted_at: { type: 'string', format: 'date-time', nullable: true, example: null },
      created_by: { type: 'string', format: 'uuid', nullable: true, description: 'id pembuat data (bisa dari SSO)', example: null },
      updated_by: { type: 'string', format: 'uuid', nullable: true, description: 'id pengubah terakhir (bisa dari SSO)', example: null },
      deleted_by: { type: 'string', format: 'uuid', nullable: true, description: 'id penghapus data (bisa dari SSO)', example: null },
      is_delete: { type: 'boolean', description: 'Penanda soft delete', example: false }
    }
  },
  ModulDetail: {
    allOf: [
      { $ref: '#/components/schemas/Modul' },
      {
        type: 'object',
        properties: {
          chapters: {
            type: 'array',
            description: 'Daftar chapter milik module ini',
            items: { $ref: '#/components/schemas/Chapter' }
          }
        }
      }
    ]
  },
  ModulInput: {
    type: 'object',
    required: ['title'],
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 255, example: 'Pengenalan JavaScript' },
      description: { type: 'string', maxLength: 2000, example: 'Materi dasar bahasa pemrograman JavaScript' },
      module_category: { type: 'string', nullable: true, enum: ['mt', 'nonmt', 'division'], example: 'mt' },
      link_materials: {
        type: 'string',
        description: 'Daftar link materi (dikirim via multipart/form-data), boleh string JSON array atau list dipisah koma',
        example: 'https://example.com/materi-1.pdf,https://example.com/materi-2.pdf'
      },
      banner: {
        type: 'string',
        format: 'binary',
        description: 'File gambar banner (jpg/jpeg/png/webp/gif, maksimal 5MB). Jika dikirim, selalu menggantikan banner lama.'
      },
      banner_delete: {
        type: 'boolean',
        default: false,
        description: 'Hanya berlaku pada update. Jika true, hapus banner yang ada (banner jadi null). Jika false/tidak dikirim dan tidak ada file baru, banner lama tetap dipertahankan.'
      }
    }
  }
};

module.exports = modulSchemas;
