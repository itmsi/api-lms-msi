/**
 * Migration: Tambah kolom is_correct pada tabel quiz_answers
 * Nilai: boolean, default false
 */

exports.up = function (knex) {
  return knex.schema.alterTable("quiz_answers", (table) => {
    table.boolean("is_correct").notNullable().defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("quiz_answers", (table) => {
    table.dropColumn("is_correct");
  });
};
