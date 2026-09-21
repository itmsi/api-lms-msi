/**
 * Swagger Schema Definitions for Permission Module
 */

const permissionSchemas = {
  Permission: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', description: 'Unique identifier', example: '123e4567-e89b-12d3-a456-426614174000' },
      name: { type: 'string', description: 'Nama hak akses', example: 'Lihat daftar User' },
      code: { type: 'string', description: 'Kode unik hak akses', example: 'users.read' },
      method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], example: 'GET' },
      endpoint: { type: 'string', description: 'Endpoint yang dilindungi', example: '/api/users' },
      description: { type: 'string', nullable: true, example: 'Lihat daftar data User' },
      created_at: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
      updated_at: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
      deleted_at: { type: 'string', format: 'date-time', nullable: true, example: null },
      created_by: { type: 'string', format: 'uuid', nullable: true, description: 'users.id pembuat data', example: null },
      updated_by: { type: 'string', format: 'uuid', nullable: true, description: 'users.id pengubah terakhir', example: null },
      deleted_by: { type: 'string', format: 'uuid', nullable: true, description: 'users.id penghapus data', example: null },
      is_delete: { type: 'boolean', description: 'Penanda soft delete', example: false }
    }
  },
  PermissionSummary: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
      name: { type: 'string', example: 'Lihat daftar User' },
      code: { type: 'string', example: 'users.read' },
      method: { type: 'string', example: 'GET' },
      endpoint: { type: 'string', example: '/api/users' }
    }
  },
  PermissionInput: {
    type: 'object',
    required: ['name', 'code', 'method', 'endpoint'],
    properties: {
      name: { type: 'string', minLength: 3, maxLength: 100, example: 'Lihat daftar User' },
      code: { type: 'string', minLength: 3, maxLength: 100, example: 'users.read' },
      method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], example: 'GET' },
      endpoint: { type: 'string', maxLength: 255, example: '/api/users' },
      description: { type: 'string', maxLength: 500, example: 'Lihat daftar data User' }
    }
  }
};

module.exports = permissionSchemas;
