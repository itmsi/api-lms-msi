const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { loginValidation } = require('./validation');
const { validateMiddleware } = require('../../middlewares/validation');
const { authenticate } = require('../../middlewares/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Login dan dapatkan JWT
 * @access  Public
 */
router.post('/login', loginValidation, validateMiddleware, controller.login);

/**
 * @route   GET /api/auth/me
 * @desc    Profil user login beserta hak aksesnya
 * @access  Authenticated
 */
router.get('/me', authenticate, controller.me);

module.exports = router;
