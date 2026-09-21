/**
 * Migration: Tambah kolom audit pada semua tabel
 * created_by, updated_by, deleted_by (uuid, nullable, refer ke users.id) dan is_delete (boolean)
 */

const TABLES = ['examples', 'roles', 'permissions', 'role_permissions', 'users'];

exports.up = async function(knex) {
  for (const name of TABLES) {
    await knex.schema.alterTable(name, (table) => {
      table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
      table.uuid('updated_by').nullable().references('id').inTable('users').onDelete('SET NULL');
      table.uuid('deleted_by').nullable().references('id').inTable('users').onDelete('SET NULL');
      table.boolean('is_delete').notNullable().defaultTo(false);

      table.index(['is_delete'], `idx_${name}_is_delete`);
    });
  }

  // Sinkronkan data lama yang sudah ter-soft-delete
  for (const name of TABLES.filter((t) => t !== 'role_permissions')) {
    await knex(name).whereNotNull('deleted_at').update({ is_delete: true });
  }
};

exports.down = async function(knex) {
  for (const name of [...TABLES].reverse()) {
    await knex.schema.alterTable(name, (table) => {
      table.dropIndex(['is_delete'], `idx_${name}_is_delete`);
      table.dropColumn('created_by');
      table.dropColumn('updated_by');
      table.dropColumn('deleted_by');
      table.dropColumn('is_delete');
    });
  }
};
