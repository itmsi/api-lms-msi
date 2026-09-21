const express = require('express')
// const { verifyToken } = require('../../middlewares')

const routing = express();
const API_TAG = '/api';

/* RULE
naming convention endpoint: using plural
Example:
- GET /api/examples
- POST /api/examples
- GET /api/examples/:id
- PUT /api/examples/:id
- DELETE /api/examples/:id
*/

// Example Module (Template untuk module Anda)
const exampleModule = require('../../modules/example')
routing.use(`${API_TAG}/examples`, exampleModule)

// LMS Modules
const authModule = require('../../modules/auth')
const roleModule = require('../../modules/roles')
const permissionModule = require('../../modules/permissions')
const userModule = require('../../modules/users')
routing.use(`${API_TAG}/auth`, authModule)
routing.use(`${API_TAG}/roles`, roleModule)
routing.use(`${API_TAG}/permissions`, permissionModule)
routing.use(`${API_TAG}/users`, userModule)

// Tambahkan routes module Anda di sini
// Example:
// const yourModule = require('../../modules/yourModule')
// routing.use(`${API_TAG}/your-endpoint`, yourModule)

module.exports = routing;
