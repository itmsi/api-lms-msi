/**
 * Swagger API Path Definitions for Role Module
 */
const { crudPaths, authErrors, json, envelope, errorResponse, idParam, ref } = require('./_crud');

const rolePaths = crudPaths({
  tag: 'Roles',
  label: 'role',
  base: '/roles',
  schema: 'Role',
  detail: 'RoleDetail',
  createInput: 'RoleInput',
  updateInput: 'RoleInput'
});

rolePaths['/roles/{id}/permissions'] = {
  put: {
    tags: ['Roles'],
    summary: 'Sync role permissions',
    description: 'Mengatur (menggantikan) seluruh hak akses milik sebuah role',
    parameters: [idParam('role')],
    requestBody: { required: true, content: json(ref('RolePermissionsInput')) },
    responses: {
      ...authErrors,
      200: {
        description: 'Updated successfully',
        content: json(envelope(ref('RoleDetail'), 'Hak akses role berhasil diupdate'))
      },
      400: errorResponse('Validation error / hak akses tidak ditemukan'),
      404: errorResponse('Not found')
    }
  }
};

module.exports = rolePaths;
