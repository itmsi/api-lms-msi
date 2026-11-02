const service = require('./service');
const { successResponse, errorResponse } = require('../../utils/response');

/**
 * Controller Layer - HTTP Request/Response Handler (quiz_results)
 */

const handleError = (res, error) => {
  return errorResponse(res, error.message || 'Internal server error', error.statusCode || 500);
};

const getAll = async (req, res) => {
  try {
    const data = await service.getAllItems(req.body);
    return successResponse(res, data);
  } catch (error) {
    return handleError(res, error);
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await service.getItemById(id);
    return successResponse(res, data);
  } catch (error) {
    return handleError(res, error);
  }
};

const updateAdminPoints = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await service.updateAdminPoints(id, req.body, req.user.id);
    return successResponse(res, data, 'Data berhasil diupdate');
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  getAll,
  getById,
  updateAdminPoints
};
