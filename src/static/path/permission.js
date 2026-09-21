/**
 * Swagger API Path Definitions for Permission Module
 */
const { crudPaths } = require('./_crud');

module.exports = crudPaths({
  tag: 'Permissions',
  label: 'permission',
  base: '/permissions',
  schema: 'Permission',
  createInput: 'PermissionInput',
  updateInput: 'PermissionInput',
  sortBy: ['name', 'code', 'method', 'endpoint', 'created_at', 'updated_at'],
  defaultSort: 'code',
  defaultOrder: 'asc'
});
