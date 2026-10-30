/**
 * Migration: Tambah kolom banner pada tabel quizzes
 * Nilai: text nullable, share link Nextcloud file banner
 */

exports.up = function(knex) {
  return knex.schema.alterTable('quizzes', (table) => {
    table.text('banner').nullable().defaultTo(null);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('quizzes', (table) => {
    table.dropColumn('banner');
  });
};
