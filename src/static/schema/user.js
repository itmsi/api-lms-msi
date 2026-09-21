/**
 * Swagger Schema Definitions for User Module
 */

const userSchemas = {
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', description: 'Unique identifier', example: '123e4567-e89b-12d3-a456-426614174000' },
      role_id: { type: 'string', format: 'uuid', description: 'Role user (1 user hanya 1 role)', example: '123e4567-e89b-12d3-a456-426614174001' },
      role_name: { type: 'string', example: 'Instruktur' },
      role_slug: { type: 'string', example: 'instruktur' },
      name: { type: 'string', example: 'Instruktur' },
      email: { type: 'string', format: 'email', example: 'instruktur@lms.test' },
      status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
      created_at: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
      updated_at: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
      deleted_at: { type: 'string', format: 'date-time', nullable: true, example: null },
      created_by: { type: 'string', format: 'uuid', nullable: true, description: 'users.id pembuat data', example: null },
      updated_by: { type: 'string', format: 'uuid', nullable: true, description: 'users.id pengubah terakhir', example: null },
      deleted_by: { type: 'string', format: 'uuid', nullable: true, description: 'users.id penghapus data', example: null },
      is_delete: { type: 'boolean', description: 'Penanda soft delete', example: false }
    }
  },
  UserCreateInput: {
    type: 'object',
    required: ['role_id', 'name', 'email', 'password'],
    properties: {
      role_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174001' },
      name: { type: 'string', minLength: 3, maxLength: 100, example: 'Budi Santoso' },
      email: { type: 'string', format: 'email', example: 'budi@lms.test' },
      password: { type: 'string', minLength: 8, maxLength: 100, example: 'Password123!' },
      status: { type: 'string', enum: ['active', 'inactive'], example: 'active' }
    }
  },
  UserUpdateInput: {
    type: 'object',
    properties: {
      role_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174001' },
      name: { type: 'string', minLength: 3, maxLength: 100, example: 'Budi Santoso' },
      email: { type: 'string', format: 'email', example: 'budi@lms.test' },
      password: { type: 'string', minLength: 8, maxLength: 100, example: 'Password123!' },
      status: { type: 'string', enum: ['active', 'inactive'], example: 'active' }
    }
  }
};

module.exports = userSchemas;
