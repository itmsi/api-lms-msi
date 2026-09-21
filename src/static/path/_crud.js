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

/**
 * Body standar untuk endpoint POST /get
 */
const listRequest = (sortBy, defaultSort = 'created_at', defaultOrder = 'desc', extra = {}) => ({
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1, example: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, example: 10 },
    sort_by: { type: 'string', enum: sortBy, default: defaultSort, example: defaultSort },
    sort_order: { type: 'string', enum: ['asc', 'desc'], default: defaultOrder, example: defaultOrder },
    search: { type: 'string', maxLength: 100, example: '' },
    ...extra
  }
});

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
 * @param {string[]} o.sortBy   Kolom yang boleh dipakai pada sort_by
 * @param {string} o.defaultSort / o.defaultOrder  Urutan default
 * @param {object} o.listProps  Properti body tambahan untuk POST /get
 */
const crudPaths = (o) => {
  const tags = [o.tag];
  const listBody = listRequest(o.sortBy, o.defaultSort, o.defaultOrder, o.listProps);

  return {
    [`${o.base}/get`]: {
      post: {
        tags,
        summary: `Get all ${o.label}`,
        description: `Retrieve all ${o.label} with pagination, sorting, and search`,
        requestBody: { required: false, content: json(listBody) },
        responses: {
          ...authErrors,
          200: { description: 'Success', content: json(envelope(paginated(o.schema), 'Success')) }
        }
      }
    },
    [`${o.base}/create`]: {
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

module.exports = { crudPaths, listRequest, authErrors, json, envelope, errorResponse, idParam, ref };
