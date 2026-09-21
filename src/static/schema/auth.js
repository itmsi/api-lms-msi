/**
 * Swagger Schema Definitions for Auth Module
 */

const authSchemas = {
  LoginInput: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'superadmin@lms.test' },
      password: { type: 'string', example: 'Password123!' }
    }
  },
  AuthPermission: {
    type: 'object',
    properties: {
      code: { type: 'string', example: 'users.read' },
      method: { type: 'string', example: 'GET' },
      endpoint: { type: 'string', example: '/api/users' }
    }
  },
  AuthProfile: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
      name: { type: 'string', example: 'Super Admin' },
      email: { type: 'string', format: 'email', example: 'superadmin@lms.test' },
      status: { type: 'string', example: 'active' },
      role_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174001' },
      role_name: { type: 'string', example: 'Super Admin' },
      role_slug: { type: 'string', example: 'super-admin' },
      permissions: { type: 'array', items: { $ref: '#/components/schemas/AuthPermission' } }
    }
  },
  LoginResult: {
    type: 'object',
    properties: {
      access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
      token_type: { type: 'string', example: 'Bearer' },
      expires_in: { type: 'integer', example: 43200 },
      user: { $ref: '#/components/schemas/AuthProfile' },
      permissions: { type: 'array', items: { $ref: '#/components/schemas/AuthPermission' } }
    }
  }
};

module.exports = authSchemas;
