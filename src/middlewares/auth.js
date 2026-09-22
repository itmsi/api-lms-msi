const jwt = require('jsonwebtoken')
const { pgCore: db } = require('../config/database')
const { unauthorizedResponse, forbiddenResponse, errorResponse } = require('../utils/response')
const { verifySsoToken } = require('./sso_token')

/**
 * Autentikasi: verifikasi JWT internal LMS, dengan fallback ke token SSO/sistem lain.
 * Token SSO tidak dicek ke tabel users, langsung diberi akses penuh (lihat authorize).
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
    } catch (internalErr) {
      try {
        decoded = verifySsoToken(token)
      } catch (ssoErr) {
        return unauthorizedResponse(res, 'Token tidak valid atau sudah kedaluwarsa')
      }

      req.user = {
        id: decoded.user_id ?? decoded.employee_id ?? decoded.customer_id,
        employee_id: decoded.employee_id,
        customer_id: decoded.customer_id,
        is_customer: decoded.is_customer,
        is_sso: true
      }
      return next()
    }

    // user_id di payload token = users.id
    const userId = decoded.user_id
    if (!userId) {
      return unauthorizedResponse(res, 'Token tidak valid')
    }

    const user = await db('users')
      .join('roles', 'roles.id', 'users.role_id')
      .where({ 'users.id': userId, 'users.is_delete': false, 'roles.is_delete': false })
      .first('users.id', 'users.name', 'users.email', 'users.status', 'users.role_id', 'roles.slug as role_slug')

    if (!user || user.status !== 'active') {
      return unauthorizedResponse(res, 'User tidak ditemukan atau tidak aktif')
    }

    // req.user.id dipakai module untuk kolom created_by / updated_by / deleted_by
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

    // Token dari SSO/sistem lain: akses penuh ke semua permission
    if (req.user.is_sso) {
      return next()
    }

    const routePath = req.route.path === '/' ? '' : req.route.path
    const endpoint = `${req.baseUrl}${routePath}`

    const granted = await db('role_permissions as rp')
      .join('permissions as p', 'p.id', 'rp.permission_id')
      .where({
        'rp.role_id': req.user.role_id,
        'p.method': req.method.toUpperCase(),
        'p.endpoint': endpoint,
        'rp.is_delete': false,
        'p.is_delete': false
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
