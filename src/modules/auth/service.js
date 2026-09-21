const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const repository = require('./repository');

const TOKEN_TTL_SECONDS = 12 * 60 * 60;

/**
 * Service Layer - Business Logic (auth)
 */

const login = async ({ email, password }) => {
  const user = await repository.findUserByEmail(email);

  // pesan sama untuk email/password salah agar tidak membocorkan keberadaan akun
  const invalid = { message: 'Email atau password salah', statusCode: 401 };
  if (!user) throw invalid;

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw invalid;

  if (user.status !== 'active') {
    throw { message: 'Akun tidak aktif', statusCode: 403 };
  }

  const token = jwt.sign(
    { user_id: user.id, role: user.role_slug },
    process.env.SECRET_KEY_AUTH_JWT,
    { algorithm: 'HS256', expiresIn: TOKEN_TTL_SECONDS }
  );

  const { password: _password, ...safeUser } = user;
  const permissions = await repository.findPermissionsByRole(user.role_id);

  return {
    access_token: token,
    token_type: 'Bearer',
    expires_in: TOKEN_TTL_SECONDS,
    user: safeUser,
    permissions
  };
};

const getProfile = async (userId) => {
  const user = await repository.findUserById(userId);
  if (!user) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }
  const permissions = await repository.findPermissionsByRole(user.role_id);
  return { ...user, permissions };
};

module.exports = { login, getProfile };
