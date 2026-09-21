/**
 * Konfigurasi CORS
 *
 * Env yang dibaca (semua opsional, dipisah koma bila berupa daftar):
 * - CORS_ORIGINS      origin yang diizinkan (default: daftar di bawah)
 * - CORS_METHODS      default GET,POST,PUT,PATCH,DELETE,OPTIONS
 * - CORS_HEADERS      default Content-Type,Authorization,X-Requested-With
 * - CORS_CREDENTIALS  default true (isi "false" untuk mematikan)
 * Request tanpa header Origin (curl, server-to-server, Swagger satu origin) tetap diizinkan,
 * karena CORS hanya berlaku untuk browser.
 */

const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:9561',
  'https://dev-lms.motorsights.com'
]

// Origin di header browser tidak memiliki trailing slash, jadi normalisasi konfigurasi
const normalize = (origin) => origin.trim().replace(/\/+$/, '')

const parseOrigins = (value) => (value || '')
  .split(',')
  .map(normalize)
  .filter(Boolean)

const parseList = (value, fallback) => {
  const list = (value || '').split(',').map((v) => v.trim()).filter(Boolean)
  return list.length ? list : fallback
}

const envOrigins = parseOrigins(process.env.CORS_ORIGINS)
const whitelist = envOrigins.length ? envOrigins : DEFAULT_ORIGINS

const origin = (requestOrigin, callback) => {
  // Tidak ada Origin (bukan request browser lintas-origin)
  if (!requestOrigin) return callback(null, true)
  // Origin tidak diizinkan: tidak menambahkan header CORS, browser akan memblokirnya
  return callback(null, whitelist.includes(normalize(requestOrigin)))
}

const corsOptions = {
  origin,
  methods: parseList(process.env.CORS_METHODS, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']),
  allowedHeaders: parseList(process.env.CORS_HEADERS, ['Content-Type', 'Authorization', 'X-Requested-With']),
  credentials: process.env.CORS_CREDENTIALS !== 'false',
  maxAge: 86400
}

module.exports = { corsOptions, whitelist }
