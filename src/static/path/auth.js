/**
 * Swagger API Path Definitions for Auth Module
 */
const { json, envelope, errorResponse, ref } = require('./_crud');

const authPaths = {
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login',
      description: 'Login dengan email dan password, mengembalikan JWT dan daftar hak akses',
      security: [],
      requestBody: { required: true, content: json(ref('LoginInput')) },
      responses: {
        200: { description: 'Login berhasil', content: json(envelope(ref('LoginResult'), 'Login berhasil')) },
        401: errorResponse('Email atau password salah'),
        403: errorResponse('Akun tidak aktif')
      }
    }
  },
  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Profil user login',
      description: 'Mengembalikan profil, role, dan hak akses user yang sedang login',
      responses: {
        200: { description: 'Success', content: json(envelope(ref('AuthProfile'), 'Success')) },
        401: errorResponse('Unauthorized (token tidak valid)')
      }
    }
  }
};

module.exports = authPaths;
