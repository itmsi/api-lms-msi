/**
 * Migration: Tambah kolom status_proses pada tabel quiz_users
 * Nilai: string nullable, rekap quiz_answers.ai_assessment_status milik user pada soal aktif quiz
 * - FAILED  : ada jawaban FAILED
 * - PENDING : tidak ada FAILED, ada jawaban PENDING
 * - SUCCESS : selain itu, ada jawaban SUCCESS (status null tidak dihitung)
 * - null    : tidak ada jawaban yang berstatus
 * Rekap aktif yang sudah ada langsung diisi
 */

exports.up = async function (knex) {
  await knex.schema.alterTable("quiz_users", (table) => {
    table.string("status_proses").nullable();
  });

  await knex.raw(`
    UPDATE quiz_users
    SET status_proses = (
      SELECT CASE
        WHEN COUNT(*) FILTER (WHERE qa.ai_assessment_status = 'FAILED') > 0 THEN 'FAILED'
        WHEN COUNT(*) FILTER (WHERE qa.ai_assessment_status = 'PENDING') > 0 THEN 'PENDING'
        WHEN COUNT(*) FILTER (WHERE qa.ai_assessment_status = 'SUCCESS') > 0 THEN 'SUCCESS'
      END
      FROM quiz_answers qa
      JOIN quiz_questions qq ON qq.id = qa.quiz_question_id
      WHERE qq.quizzes_id = quiz_users.quizze_id
        AND qq.is_delete = false
        AND qa.created_by = quiz_users.created_by
        AND qa.is_delete = false
    )
    WHERE is_delete = false
  `);
};

exports.down = function (knex) {
  return knex.schema.alterTable("quiz_users", (table) => {
    table.dropColumn("status_proses");
  });
};
