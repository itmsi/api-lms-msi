/**
 * Migration: Tambah kolom module_category pada tabel modules
 * Nilai: 'mt', 'nonmt', 'division' (nullable, default null)
 */

exports.up = function(knex) {
  return knex.schema.alterTable('modules', (table) => {
    table.string('module_category', 20).nullable().defaultTo(null);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('modules', (table) => {
    table.dropColumn('module_category');
  });
};
