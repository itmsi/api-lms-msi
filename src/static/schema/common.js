/**
 * Swagger Common Schema Definitions (LMS)
 */

const commonSchemas = {
  ApiError: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Data tidak ditemukan' },
      errors: { type: 'object', nullable: true, example: null },
      timestamp: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' }
    }
  }
};

module.exports = commonSchemas;
