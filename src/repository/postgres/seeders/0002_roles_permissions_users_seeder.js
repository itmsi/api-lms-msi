/**
 * Seeder: Roles, Permissions, Role Permissions, dan Users
 * Password default semua user: Password123!
 */
const bcrypt = require('bcrypt');

const DEFAULT_PASSWORD = 'Password123!';

// Harus sama dengan API_TAG di src/routes/V1/index.js
// (authorize mencocokkan method + path lengkap dengan kolom permissions.endpoint)
const API_PREFIX = '/api/lms';

const roles = [
  { slug: 'super-admin', name: 'Super Admin', description: 'Akses penuh ke seluruh sistem' },
  { slug: 'admin', name: 'Admin', description: 'Pengelola sistem LMS' },
  { slug: 'instruktur', name: 'Instruktur', description: 'Pengajar pada sistem LMS' },
  { slug: 'participant', name: 'Participant', description: 'Peserta pembelajaran' }
];

const resources = [
  { key: 'roles', label: 'Role', endpoint: `${API_PREFIX}/roles` },
  { key: 'permissions', label: 'Hak Akses', endpoint: `${API_PREFIX}/permissions` },
  { key: 'users', label: 'User', endpoint: `${API_PREFIX}/users` },
  { key: 'examples', label: 'Example', endpoint: `${API_PREFIX}/examples` }
];

const actions = [
  { key: 'read', label: 'Lihat daftar', method: 'POST', suffix: '/get' },
  { key: 'detail', label: 'Lihat detail', method: 'GET', suffix: '/:id' },
  { key: 'create', label: 'Tambah', method: 'POST', suffix: '/create' },
  { key: 'update', label: 'Ubah', method: 'PUT', suffix: '/:id' },
  { key: 'delete', label: 'Hapus', method: 'DELETE', suffix: '/:id' },
  { key: 'restore', label: 'Restore', method: 'POST', suffix: '/:id/restore' }
];

const permissions = resources.flatMap((r) => actions.map((a) => ({
  code: `${r.key}.${a.key}`,
  name: `${a.label} ${r.label}`,
  method: a.method,
  endpoint: `${r.endpoint}${a.suffix}`,
  description: `${a.label} data ${r.label}`
})));

// Hak akses tambahan: sinkronisasi hak akses pada role
permissions.push({
  code: 'roles.sync-permissions',
  name: 'Atur Hak Akses Role',
  method: 'PUT',
  endpoint: `${API_PREFIX}/roles/:id/permissions`,
  description: 'Mengatur daftar hak akses pada sebuah role'
});

const rolePermissionMap = {
  'super-admin': permissions.map((p) => p.code),
  admin: permissions
    .map((p) => p.code)
    .filter((c) => !['permissions.create', 'permissions.update', 'permissions.delete', 'permissions.restore', 'roles.delete', 'roles.restore'].includes(c)),
  instruktur: ['roles.read', 'roles.detail', 'users.read', 'users.detail', 'examples.read', 'examples.detail'],
  participant: []
};

const users = [
  { name: 'Super Admin', email: 'superadmin@lms.test', role: 'super-admin' },
  { name: 'Admin', email: 'admin@lms.test', role: 'admin' },
  { name: 'Instruktur', email: 'instruktur@lms.test', role: 'instruktur' },
  { name: 'Participant', email: 'participant@lms.test', role: 'participant' }
];

exports.seed = async function(knex) {
  await knex('role_permissions').del();
  await knex('users').del();
  await knex('permissions').del();
  await knex('roles').del();

  const insertedRoles = await knex('roles').insert(roles).returning(['id', 'slug']);
  const insertedPermissions = await knex('permissions').insert(permissions).returning(['id', 'code']);

  const roleId = Object.fromEntries(insertedRoles.map((r) => [r.slug, r.id]));
  const permissionId = Object.fromEntries(insertedPermissions.map((p) => [p.code, p.id]));

  const rolePermissions = Object.entries(rolePermissionMap).flatMap(([slug, codes]) => codes.map((code) => ({
    role_id: roleId[slug],
    permission_id: permissionId[code]
  })));
  if (rolePermissions.length) {
    await knex('role_permissions').insert(rolePermissions);
  }

  const password = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  await knex('users').insert(users.map((u) => ({
    role_id: roleId[u.role],
    name: u.name,
    email: u.email,
    password,
    status: 'active'
  })));
};
