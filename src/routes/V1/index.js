const express = require("express");
// const { verifyToken } = require('../../middlewares')

const routing = express();
const API_TAG = "/api/lms";

/* RULE
naming convention endpoint: using plural
Example:
- POST /api/lms/examples/get      (list: body page, limit, sort_by, sort_order, search)
- POST /api/lms/examples/create
- GET /api/lms/examples/:id
- PUT /api/lms/examples/:id
- DELETE /api/lms/examples/:id

Catatan: nilai API_TAG harus sama dengan API_PREFIX di seeder permissions
(src/repository/postgres/seeders/0002_roles_permissions_users_seeder.js).
*/

// Example Module (Template untuk module Anda)
const exampleModule = require("../../modules/example");
routing.use(`${API_TAG}/examples`, exampleModule);

// LMS Modules
const authModule = require("../../modules/auth");
const roleModule = require("../../modules/roles");
const permissionModule = require("../../modules/permissions");
const userModule = require("../../modules/users");
routing.use(`${API_TAG}/auth`, authModule);
routing.use(`${API_TAG}/roles`, roleModule);
routing.use(`${API_TAG}/permissions`, permissionModule);
routing.use(`${API_TAG}/users`, userModule);

// Tambahkan routes module Anda di sini
// Example:
// const yourModule = require('../../modules/yourModule')
// routing.use(`${API_TAG}/your-endpoint`, yourModule)

module.exports = routing;
