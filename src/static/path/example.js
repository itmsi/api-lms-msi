/**
 * Swagger API Path Definitions for Example Module
 */

const authErrors = {
  401: { description: 'Unauthorized (token tidak valid)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
  403: { description: 'Forbidden (tidak memiliki hak akses)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } }
};

const examplePaths = {
  '/examples/get': {
    post: {
      tags: ['Examples'],
      summary: 'Get all examples',
      description: 'Retrieve all examples with pagination',
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                page: { type: 'integer', minimum: 1, default: 1, example: 1 },
                limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, example: 10 },
                sort_by: { type: 'string', enum: ['name', 'status', 'created_at', 'updated_at'], default: 'created_at', example: 'created_at' },
                sort_order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', example: 'desc' },
                search: { type: 'string', maxLength: 100, example: '' }
              }
            }
          }
        }
      },
      responses: {
        ...authErrors,
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      items: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Example' }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/examples/create': {
    post: {
      tags: ['Examples'],
      summary: 'Create new example',
      description: 'Create a new example item',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ExampleInput' }
          }
        }
      },
      responses: {
        ...authErrors,
        201: {
          description: 'Created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Example' },
                  message: { type: 'string', example: 'Data berhasil dibuat' }
                }
              }
            }
          }
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/examples/{id}': {
    get: {
      tags: ['Examples'],
      summary: 'Get example by ID',
      description: 'Retrieve a single example by ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Example UUID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        ...authErrors,
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Example' }
                }
              }
            }
          }
        },
        404: {
          description: 'Not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    },
    put: {
      tags: ['Examples'],
      summary: 'Update example',
      description: 'Update an existing example',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Example UUID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ExampleInput' }
          }
        }
      },
      responses: {
        ...authErrors,
        200: {
          description: 'Updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Example' },
                  message: { type: 'string', example: 'Data berhasil diupdate' }
                }
              }
            }
          }
        },
        404: {
          description: 'Not found'
        }
      }
    },
    delete: {
      tags: ['Examples'],
      summary: 'Delete example',
      description: 'Soft delete an example (sets deleted_at timestamp)',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Example UUID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        ...authErrors,
        200: {
          description: 'Deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Data berhasil dihapus' }
                }
              }
            }
          }
        },
        404: {
          description: 'Not found'
        }
      }
    }
  },
  '/examples/{id}/restore': {
    post: {
      tags: ['Examples'],
      summary: 'Restore deleted example',
      description: 'Restore a soft-deleted example',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Example UUID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        ...authErrors,
        200: {
          description: 'Restored successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Example' },
                  message: { type: 'string', example: 'Data berhasil direstore' }
                }
              }
            }
          }
        },
        404: {
          description: 'Not found'
        }
      }
    }
  }
};

module.exports = examplePaths;

