const info = {
  description: "API Learning Management System (LMS) MSI",
  version: "1.0.0",
  title: "LMS API Documentation",
  contact: {
    email: "your-email@example.com",
  },
  license: {
    name: "MIT",
    url: "https://opensource.org/licenses/MIT",
  },
};

const servers = [
  {
    url: "/api/lms/",
    description: "Development server",
  },
  {
    url: "https://production-url.com/api/lms/",
    description: "Production server",
  },
];

// Import schemas
// Tambahkan schema module Anda di sini
const exampleSchema = require("./schema/example");
const commonSchema = require("./schema/common");
const authSchema = require("./schema/auth");
const roleSchema = require("./schema/role");
const permissionSchema = require("./schema/permission");
const userSchema = require("./schema/user");
const modulSchema = require("./schema/modul");
const chapterSchema = require("./schema/chapter");

// Import paths
// Tambahkan path module Anda di sini
const examplePaths = require("./path/example");
const authPaths = require("./path/auth");
const rolePaths = require("./path/role");
const permissionPaths = require("./path/permission");
const userPaths = require("./path/user");
const modulPaths = require("./path/modul");
const chapterPaths = require("./path/chapter");

// Combine all schemas
const schemas = {
  ...exampleSchema,
  ...commonSchema,
  ...authSchema,
  ...roleSchema,
  ...permissionSchema,
  ...userSchema,
  ...modulSchema,
  ...chapterSchema,
  // ...yourModuleSchema,
};

// Combine all paths
const paths = {
  ...examplePaths,
  ...authPaths,
  ...rolePaths,
  ...permissionPaths,
  ...userPaths,
  ...modulPaths,
  ...chapterPaths,
  // ...yourModulePaths,
};

const index = {
  openapi: "3.0.0",
  info,
  servers,
  security: [{ bearerAuth: [] }],
  paths,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas,
  },
};

module.exports = {
  index,
};
