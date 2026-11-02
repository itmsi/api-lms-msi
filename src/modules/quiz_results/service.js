const repository = require('./repository');

/**
 * Service Layer - Business Logic (quiz_results)
 */

const getAllItems = async (params = {}) => {
  return await repository.findAll(params);
};

module.exports = {
  getAllItems
};
