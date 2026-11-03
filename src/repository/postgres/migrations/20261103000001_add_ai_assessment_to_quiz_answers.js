/**
 * Migration: Tambah kolom penilaian AI pada tabel quiz_answers (soal short_answer)
 * - ai_assessment_status : string nullable, PENDING / SUCCESS / FAILED
 * - ai_assessment_message: jsonb nullable, seluruh respon dari API AI, sukses maupun error
 */

exports.up = function (knex) {
  return knex.schema.alterTable("quiz_answers", (table) => {
    table.string("ai_assessment_status").nullable();
    table.jsonb("ai_assessment_message").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("quiz_answers", (table) => {
    table.dropColumn("ai_assessment_status");
    table.dropColumn("ai_assessment_message");
  });
};
