/**
 * Migration: Tambah kolom send_date pada tabel quiz_users
 * Nilai: timestamp nullable, waktu peserta mengirim jawaban terakhir (null = belum dikirim)
 */

exports.up = function (knex) {
  return knex.schema.alterTable("quiz_users", (table) => {
    table.timestamp("send_date").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("quiz_users", (table) => {
    table.dropColumn("send_date");
  });
};
