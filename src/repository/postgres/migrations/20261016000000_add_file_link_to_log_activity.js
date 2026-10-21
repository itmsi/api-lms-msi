/**
 * Migration: Tambah kolom file_link pada tabel log_activity
 * Nilai: text nullable, link file terkait aktivitas (mis. share link Nextcloud)
 */

exports.up = function(knex) {
  return knex.schema.alterTable('log_activity', (table) => {
    table.text('file_link').nullable().defaultTo(null);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('log_activity', (table) => {
    table.dropColumn('file_link');
  });
};
