/**
 * Migration: Tambah kolom admin_points pada tabel quiz_answers
 * Nilai: string nullable, poin yang diberikan admin/penilai
 */

exports.up = function(knex) {
  return knex.schema.alterTable('quiz_answers', (table) => {
    table.string('admin_points').nullable().defaultTo(null);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('quiz_answers', (table) => {
    table.dropColumn('admin_points');
  });
};
