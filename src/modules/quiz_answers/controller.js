const service = require('./service');
const { successResponse, errorResponse } = require('../../utils/response');

/**
 * Controller Layer - HTTP Request/Response Handler (quiz_answers)
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

const getQuizzes = async (req, res) => {
  try {
    const data = await service.getQuizzes(req.body);
    return successResponse(res, data);
  } catch (error) {
    return handleError(res, error);
  }
};

const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await service.getQuizById(id);
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
    const data = await service.createItem(req.body, req.file, req.user.id);
    return successResponse(res, data, 'Data berhasil disimpan', 201);
  } catch (error) {
    return handleError(res, error);
  }
};

const getQuestion = async (req, res) => {
  try {
    const data = await service.getQuestionWithAnswer(req.body);
    return successResponse(res, data);
  } catch (error) {
    return handleError(res, error);
  }
};

const getResults = async (req, res) => {
  try {
    const data = await service.getResults(req.body);
    return successResponse(res, data);
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
  getQuizzes,
  getQuizById,
  getById,
  create,
  getQuestion,
  getResults,
  remove,
  restore
};
