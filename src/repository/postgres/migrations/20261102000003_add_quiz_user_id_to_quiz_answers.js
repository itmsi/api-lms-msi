/**
 * Migration: Tambah kolom quiz_user_id pada tabel quiz_answers
 * Nilai: uuid nullable, relasi ke quiz_users.id
 */

exports.up = function (knex) {
  return knex.schema.alterTable("quiz_answers", (table) => {
    table.uuid("quiz_user_id").nullable()
      .references("id").inTable("quiz_users").onDelete("SET NULL");

    table.index(["quiz_user_id"], "idx_quiz_answers_quiz_user_id");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("quiz_answers", (table) => {
    table.dropIndex(["quiz_user_id"], "idx_quiz_answers_quiz_user_id");
    table.dropForeign(["quiz_user_id"]);
    table.dropColumn("quiz_user_id");
  });
};
