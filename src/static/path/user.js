/**
 * Swagger API Path Definitions for User Module
 */
const { crudPaths } = require('./_crud');

module.exports = crudPaths({
  tag: 'Users',
  label: 'user',
  base: '/users',
  schema: 'User',
  createInput: 'UserCreateInput',
  updateInput: 'UserUpdateInput',
  sortBy: ['name', 'email', 'status', 'role_name', 'created_at', 'updated_at'],
  listProps: {
    role_id: { type: 'string', format: 'uuid', description: 'Filter berdasarkan role' }
  }
});
