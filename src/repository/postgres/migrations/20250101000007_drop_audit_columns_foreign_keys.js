/**
 * Migration: Hapus foreign key constraint pada kolom audit (created_by, updated_by, deleted_by)
 * Kolom tetap ada, hanya relasi ke users.id yang dilepas karena nilainya sekarang bisa berasal
 * dari sistem lain (SSO), bukan hanya dari tabel users lokal.
 */

const TABLES = ['examples', 'roles', 'permissions', 'role_permissions', 'users'];
const AUDIT_COLUMNS = ['created_by', 'updated_by', 'deleted_by'];

exports.up = async function(knex) {
  for (const name of TABLES) {
    await knex.schema.alterTable(name, (table) => {
      for (const column of AUDIT_COLUMNS) {
        table.dropForeign(column);
      }
    });
  }
};

exports.down = async function(knex) {
  for (const name of [...TABLES].reverse()) {
    await knex.schema.alterTable(name, (table) => {
      for (const column of AUDIT_COLUMNS) {
        table.foreign(column).references('id').inTable('users').onDelete('SET NULL');
      }
    });
  }
};
