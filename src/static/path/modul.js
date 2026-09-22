/**
 * Swagger API Path Definitions for Modul (modules) Module
 */
const { authErrors, json, envelope, errorResponse, idParam, ref, listRequest } = require('./_crud');

const SORT_BY = ['title', 'created_at', 'updated_at'];

const paginated = (schemaName) => ({
  type: 'object',
  properties: {
    items: { type: 'array', items: ref(schemaName) },
    pagination: ref('Pagination')
  }
});

const modulPaths = {
  '/modules/get': {
    post: {
      tags: ['Modules'],
      summary: 'Get all modules',
      description: 'Retrieve all modules with pagination, sorting, and search',
      requestBody: { required: false, content: json(listRequest(SORT_BY)) },
      responses: {
        ...authErrors,
        200: { description: 'Success', content: json(envelope(paginated('Modul'), 'Success')) }
      }
    }
  },
  '/modules/create': {
    post: {
      tags: ['Modules'],
      summary: 'Create new module',
      description: 'Create a new module. Dikirim sebagai multipart/form-data karena mendukung upload file banner (di-upload ke Nextcloud, hasilnya disimpan sebagai share link).',
      requestBody: {
        required: true,
        content: { 'multipart/form-data': { schema: ref('ModulInput') } }
      },
      responses: {
        ...authErrors,
        201: { description: 'Created successfully', content: json(envelope(ref('Modul'), 'Data berhasil dibuat')) },
        400: errorResponse('Validation error')
      }
    }
  },
  '/modules/{id}': {
    get: {
      tags: ['Modules'],
      summary: 'Get module by ID',
      description: 'Retrieve a single module by ID beserta daftar chapter-nya',
      parameters: [idParam('module')],
      responses: {
        ...authErrors,
        200: { description: 'Success', content: json(envelope(ref('ModulDetail'), 'Success')) },
        404: errorResponse('Not found')
      }
    },
    put: {
      tags: ['Modules'],
      summary: 'Update module',
      description: 'Update an existing module. Dikirim sebagai multipart/form-data, field banner opsional (jika tidak dikirim, banner lama tetap dipakai). Gunakan banner_delete=true untuk menghapus banner tanpa mengupload file baru.',
      parameters: [idParam('module')],
      requestBody: {
        required: true,
        content: { 'multipart/form-data': { schema: ref('ModulInput') } }
      },
      responses: {
        ...authErrors,
        200: { description: 'Updated successfully', content: json(envelope(ref('Modul'), 'Data berhasil diupdate')) },
        404: errorResponse('Not found')
      }
    },
    delete: {
      tags: ['Modules'],
      summary: 'Delete module',
      description: 'Soft delete a module (sets deleted_at timestamp)',
      parameters: [idParam('module')],
      responses: {
        ...authErrors,
        200: { description: 'Deleted successfully', content: json(envelope(null, 'Data berhasil dihapus')) },
        404: errorResponse('Not found')
      }
    }
  },
  '/modules/{id}/restore': {
    post: {
      tags: ['Modules'],
      summary: 'Restore deleted module',
      description: 'Restore a soft-deleted module',
      parameters: [idParam('module')],
      responses: {
        ...authErrors,
        200: { description: 'Restored successfully', content: json(envelope(ref('Modul'), 'Data berhasil direstore')) },
        404: errorResponse('Not found')
      }
    }
  }
};

module.exports = modulPaths;
