const service = require('./service');
const { successResponse, errorResponse } = require('../../utils/response');

/**
 * Controller Layer - HTTP Request/Response Handler (chapter)
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

const create = async (req, res) => {
  try {
    const data = await service.createItem(req.body, req.user.id);
    return successResponse(res, data, 'Data berhasil dibuat', 201);
  } catch (error) {
    return handleError(res, error);
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await service.updateItem(id, req.body, req.user.id);
    return successResponse(res, data, 'Data berhasil diupdate');
  } catch (error) {
    return handleError(res, error);
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await service.deleteItem(id, req.user.id);
    return successResponse(res, null, 'Data berhasil dihapus');
  } catch (error) {
    return handleError(res, error);
  }
};

const restore = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await service.restoreItem(id, req.user.id);
    return successResponse(res, data, 'Data berhasil direstore');
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  restore
};
