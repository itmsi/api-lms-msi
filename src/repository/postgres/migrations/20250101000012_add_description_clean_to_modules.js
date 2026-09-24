/**
 * Migration: Tambah kolom description_clean pada tabel modules
 * Nilai: text nullable, diisi langsung dari input
 */

exports.up = function(knex) {
  return knex.schema.alterTable('modules', (table) => {
    table.text('description_clean').nullable().defaultTo(null);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('modules', (table) => {
    table.dropColumn('description_clean');
  });
};
