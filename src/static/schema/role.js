/**
 * Swagger Schema Definitions for Role Module
 */

const roleSchemas = {
  Role: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', description: 'Unique identifier', example: '123e4567-e89b-12d3-a456-426614174000' },
      name: { type: 'string', description: 'Nama role', example: 'Instruktur' },
      slug: { type: 'string', description: 'Slug unik role', example: 'instruktur' },
      description: { type: 'string', nullable: true, description: 'Deskripsi role', example: 'Pengajar pada sistem LMS' },
      created_at: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
      updated_at: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
      deleted_at: { type: 'string', format: 'date-time', nullable: true, example: null },
      created_by: { type: 'string', format: 'uuid', nullable: true, description: 'users.id pembuat data', example: null },
      updated_by: { type: 'string', format: 'uuid', nullable: true, description: 'users.id pengubah terakhir', example: null },
      deleted_by: { type: 'string', format: 'uuid', nullable: true, description: 'users.id penghapus data', example: null },
      is_delete: { type: 'boolean', description: 'Penanda soft delete', example: false }
    }
  },
  RoleDetail: {
    allOf: [
      { $ref: '#/components/schemas/Role' },
      {
        type: 'object',
        properties: {
          permissions: {
            type: 'array',
            description: 'Daftar hak akses milik role',
            items: { $ref: '#/components/schemas/PermissionSummary' }
          }
        }
      }
    ]
  },
  RoleInput: {
    type: 'object',
    required: ['name', 'slug'],
    properties: {
      name: { type: 'string', minLength: 3, maxLength: 100, example: 'Instruktur' },
      slug: { type: 'string', maxLength: 100, example: 'instruktur' },
      description: { type: 'string', maxLength: 500, example: 'Pengajar pada sistem LMS' }
    }
  },
  RolePermissionsInput: {
    type: 'object',
    required: ['permission_ids'],
    properties: {
      permission_ids: {
        type: 'array',
        description: 'Daftar id hak akses (menggantikan seluruh hak akses role)',
        items: { type: 'string', format: 'uuid' },
        example: ['123e4567-e89b-12d3-a456-426614174000']
      }
    }
  }
};

module.exports = roleSchemas;
