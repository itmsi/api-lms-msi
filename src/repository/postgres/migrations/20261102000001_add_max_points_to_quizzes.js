/**
 * Migration: Tambah kolom max_points pada tabel quizzes
 * Nilai: string nullable, jumlah quiz_questions.points dari soal aktif quiz tersebut
 * Quiz yang sudah ada langsung diisi dari soal-soalnya
 */

exports.up = async function (knex) {
  await knex.schema.alterTable("quizzes", (table) => {
    table.string("max_points").nullable();
  });

  await knex.raw(`
    UPDATE quizzes
    SET max_points = (
      SELECT COALESCE(SUM(qq.points), 0)::text
      FROM quiz_questions qq
      WHERE qq.quizzes_id = quizzes.id AND qq.is_delete = false
    )
  `);
};

exports.down = function (knex) {
  return knex.schema.alterTable("quizzes", (table) => {
    table.dropColumn("max_points");
  });
};
