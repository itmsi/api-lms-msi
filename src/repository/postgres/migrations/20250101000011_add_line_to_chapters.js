/**
 * Migration: Tambah kolom line pada tabel chapters
 * Nilai: integer, default 0, dipakai untuk urutan tampil chapter
 */

exports.up = function(knex) {
  return knex.schema.alterTable('chapters', (table) => {
    table.integer('line').notNullable().defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('chapters', (table) => {
    table.dropColumn('line');
  });
};
