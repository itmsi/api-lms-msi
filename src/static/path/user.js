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
  listParams: [
    { name: 'role_id', in: 'query', description: 'Filter berdasarkan role', required: false, schema: { type: 'string', format: 'uuid' } }
  ]
});
