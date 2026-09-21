/**
 * Helper untuk membangun definisi path Swagger CRUD dengan format yang sama
 * seperti path/example.js (dipakai module role, permission, dan user).
 */

const json = (schema) => ({ 'application/json': { schema } });

const envelope = (dataSchema, message) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: message },
    ...(dataSchema ? { data: dataSchema } : {}),
    timestamp: { type: 'string', format: 'date-time' }
  }
});

const errorResponse = (description) => ({
  description,
  content: json({ $ref: '#/components/schemas/ApiError' })
});

const idParam = (label) => ({
  name: 'id',
  in: 'path',
  required: true,
  description: `${label} UUID`,
  schema: { type: 'string', format: 'uuid' }
});

const authErrors = {
  401: errorResponse('Unauthorized (token tidak valid)'),
  403: errorResponse('Forbidden (tidak memiliki hak akses)')
};

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });

const paginated = (schemaName) => ({
  type: 'object',
  properties: {
    items: { type: 'array', items: ref(schemaName) },
    pagination: ref('Pagination')
  }
});

/**
 * @param {object} o
 * @param {string} o.tag        Nama tag Swagger
 * @param {string} o.label      Nama entitas (untuk deskripsi)
 * @param {string} o.base       Path dasar, mis. '/roles'
 * @param {string} o.schema     Schema entitas
 * @param {string} o.detail     Schema detail (GET by id)
 * @param {string} o.createInput
 * @param {string} o.updateInput
 * @param {object[]} o.listParams Query param tambahan untuk list
 */
const crudPaths = (o) => {
  const tags = [o.tag];
  const pageParams = [
    { name: 'page', in: 'query', description: 'Page number', required: false, schema: { type: 'integer', default: 1 } },
    { name: 'limit', in: 'query', description: 'Items per page', required: false, schema: { type: 'integer', default: 10 } },
    { name: 'search', in: 'query', description: 'Kata kunci pencarian', required: false, schema: { type: 'string' } },
    ...(o.listParams || [])
  ];

  return {
    [o.base]: {
      get: {
        tags,
        summary: `Get all ${o.label}`,
        description: `Retrieve all ${o.label} with pagination`,
        parameters: pageParams,
        responses: {
          ...authErrors,
          200: { description: 'Success', content: json(envelope(paginated(o.schema), 'Success')) }
        }
      },
      post: {
        tags,
        summary: `Create new ${o.label}`,
        description: `Create a new ${o.label}`,
        requestBody: { required: true, content: json(ref(o.createInput)) },
        responses: {
          ...authErrors,
          201: { description: 'Created successfully', content: json(envelope(ref(o.schema), 'Data berhasil dibuat')) },
          400: errorResponse('Validation error'),
          409: errorResponse('Conflict (data sudah ada)')
        }
      }
    },
    [`${o.base}/{id}`]: {
      get: {
        tags,
        summary: `Get ${o.label} by ID`,
        description: `Retrieve a single ${o.label} by ID`,
        parameters: [idParam(o.label)],
        responses: {
          ...authErrors,
          200: { description: 'Success', content: json(envelope(ref(o.detail || o.schema), 'Success')) },
          404: errorResponse('Not found')
        }
      },
      put: {
        tags,
        summary: `Update ${o.label}`,
        description: `Update an existing ${o.label}`,
        parameters: [idParam(o.label)],
        requestBody: { required: true, content: json(ref(o.updateInput)) },
        responses: {
          ...authErrors,
          200: { description: 'Updated successfully', content: json(envelope(ref(o.schema), 'Data berhasil diupdate')) },
          404: errorResponse('Not found'),
          409: errorResponse('Conflict (data sudah ada)')
        }
      },
      delete: {
        tags,
        summary: `Delete ${o.label}`,
        description: `Soft delete a ${o.label} (sets deleted_at timestamp)`,
        parameters: [idParam(o.label)],
        responses: {
          ...authErrors,
          200: { description: 'Deleted successfully', content: json(envelope(null, 'Data berhasil dihapus')) },
          404: errorResponse('Not found'),
          409: errorResponse('Conflict (data masih digunakan)')
        }
      }
    },
    [`${o.base}/{id}/restore`]: {
      post: {
        tags,
        summary: `Restore deleted ${o.label}`,
        description: `Restore a soft-deleted ${o.label}`,
        parameters: [idParam(o.label)],
        responses: {
          ...authErrors,
          200: { description: 'Restored successfully', content: json(envelope(ref(o.schema), 'Data berhasil direstore')) },
          404: errorResponse('Not found')
        }
      }
    }
  };
};

module.exports = { crudPaths, authErrors, json, envelope, errorResponse, idParam, ref };
