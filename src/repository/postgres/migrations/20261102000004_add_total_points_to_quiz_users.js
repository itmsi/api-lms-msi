/**
 * Migration: Tambah kolom total_correct_points & total_possible_points pada tabel quiz_users
 * Nilai: string nullable
 * - total_correct_points : jumlah quiz_answers.points milik user pada soal aktif quiz
 * - total_possible_points: jumlah quiz_questions.points dari soal aktif quiz
 * Rekap aktif yang sudah ada langsung diisi
 */

exports.up = async function (knex) {
  await knex.schema.alterTable("quiz_users", (table) => {
    table.string("total_correct_points").nullable();
    table.string("total_possible_points").nullable();
  });

  await knex.raw(`
    UPDATE quiz_users
    SET
      total_correct_points = (
        SELECT COALESCE(SUM(qa.points), 0)::text
        FROM quiz_answers qa
        JOIN quiz_questions qq ON qq.id = qa.quiz_question_id
        WHERE qq.quizzes_id = quiz_users.quizze_id
          AND qq.is_delete = false
          AND qa.created_by = quiz_users.created_by
          AND qa.is_delete = false
      ),
      total_possible_points = (
        SELECT COALESCE(SUM(qq.points), 0)::text
        FROM quiz_questions qq
        WHERE qq.quizzes_id = quiz_users.quizze_id
          AND qq.is_delete = false
      )
    WHERE is_delete = false
  `);
};

exports.down = function (knex) {
  return knex.schema.alterTable("quiz_users", (table) => {
    table.dropColumn("total_correct_points");
    table.dropColumn("total_possible_points");
  });
};
