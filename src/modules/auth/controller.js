const service = require('./service');
const { successResponse, errorResponse } = require('../../utils/response');

/**
 * Controller Layer - HTTP Request/Response Handler (auth)
 */

const handleError = (res, error) => {
  return errorResponse(res, error.message || 'Internal server error', error.statusCode || 500);
};

const login = async (req, res) => {
  try {
    const data = await service.login(req.body);
    return successResponse(res, data, 'Login berhasil');
  } catch (error) {
    return handleError(res, error);
  }
};

const me = async (req, res) => {
  try {
    const data = await service.getProfile(req.user.id);
    return successResponse(res, data);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = { login, me };
