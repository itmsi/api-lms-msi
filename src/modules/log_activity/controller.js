const service = require('./service');
const { successResponse, errorResponse } = require('../../utils/response');

/**
 * Controller Layer - HTTP Request/Response Handler (log activity)
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

const exportExcel = async (req, res) => {
  try {
    const data = await service.exportExcel(req.body);
    return successResponse(res, data, 'Export excel berhasil');
  } catch (error) {
    return handleError(res, error);
  }
};

const create = async (req, res) => {
  try {
    const data = await service.createItem(req.body, req.user.id);
    return successResponse(res, data, 'Data berhasil dibuat', 201);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  getAll,
  exportExcel,
  create
};
