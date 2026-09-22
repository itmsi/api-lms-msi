const jwt = require('jsonwebtoken')

/**
 * Verifikasi token dari sistem SSO/eksternal.
 * Secret berbeda dengan token internal LMS (SECRET_KEY_AUTH_JWT).
 */
const verifySsoToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
}

module.exports = { verifySsoToken }
