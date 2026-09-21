const jwt = require('jsonwebtoken')
const { pgCore: db } = require('../config/database')
const { unauthorizedResponse, forbiddenResponse, errorResponse } = require('../utils/response')

/**
 * Autentikasi: verifikasi JWT, pastikan user masih aktif, lalu isi req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || ''
    const [scheme, token] = header.split(' ')
    if (scheme !== 'Bearer' || !token) {
      return unauthorizedResponse(res, 'Token wajib diisi')
    }

    let decoded
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY_AUTH_JWT, { algorithms: ['HS256'] })
    } catch (err) {
      return unauthorizedResponse(res, 'Token tidak valid atau sudah kedaluwarsa')
    }

    const user = await db('users')
      .join('roles', 'roles.id', 'users.role_id')
      .where({ 'users.id': decoded.sub, 'users.deleted_at': null, 'roles.deleted_at': null })
      .first('users.id', 'users.name', 'users.email', 'users.status', 'users.role_id', 'roles.slug as role_slug')

    if (!user || user.status !== 'active') {
      return unauthorizedResponse(res, 'User tidak ditemukan atau tidak aktif')
    }

    req.user = user
    return next()
  } catch (error) {
    return errorResponse(res, error.message || 'Internal server error', 500)
  }
}

/**
 * Otorisasi: cek apakah role user punya hak akses untuk method + endpoint route ini.
 * Endpoint dicocokkan dengan kolom permissions.endpoint, mis. "/api/roles/:id".
 * Pasang SETELAH authenticate dan di level route.
 */
const authorize = async (req, res, next) => {
  try {
    if (!req.user) {
      return unauthorizedResponse(res, 'Token wajib diisi')
    }

    const routePath = req.route.path === '/' ? '' : req.route.path
    const endpoint = `${req.baseUrl}${routePath}`

    const granted = await db('role_permissions as rp')
      .join('permissions as p', 'p.id', 'rp.permission_id')
      .where({
        'rp.role_id': req.user.role_id,
        'p.method': req.method.toUpperCase(),
        'p.endpoint': endpoint,
        'p.deleted_at': null
      })
      .first('p.id')

    if (!granted) {
      return forbiddenResponse(res, 'Anda tidak memiliki hak akses ke endpoint ini')
    }

    return next()
  } catch (error) {
    return errorResponse(res, error.message || 'Internal server error', 500)
  }
}

module.exports = { authenticate, authorize }
