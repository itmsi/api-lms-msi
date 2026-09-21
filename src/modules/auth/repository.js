const { pgCore: db } = require('../../config/database');

/**
 * Repository Layer - Database Operations (auth)
 */

const findUserByEmail = async (email) => {
  return await db('users')
    .join('roles', 'roles.id', 'users.role_id')
    .where({ 'users.email': email, 'users.is_delete': false, 'roles.is_delete': false })
    .first(
      'users.id',
      'users.name',
      'users.email',
      'users.password',
      'users.status',
      'users.role_id',
      'roles.name as role_name',
      'roles.slug as role_slug'
    );
};

const findUserById = async (id) => {
  return await db('users')
    .join('roles', 'roles.id', 'users.role_id')
    .where({ 'users.id': id, 'users.is_delete': false })
    .first(
      'users.id',
      'users.name',
      'users.email',
      'users.status',
      'users.role_id',
      'roles.name as role_name',
      'roles.slug as role_slug'
    );
};

const findPermissionsByRole = async (roleId) => {
  return await db('role_permissions as rp')
    .join('permissions as p', 'p.id', 'rp.permission_id')
    .where({ 'rp.role_id': roleId, 'rp.is_delete': false, 'p.is_delete': false })
    .select('p.code', 'p.method', 'p.endpoint')
    .orderBy('p.code', 'asc');
};

module.exports = { findUserByEmail, findUserById, findPermissionsByRole };
