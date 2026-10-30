/**
 * Migration: Create quiz_answers table (jawaban user per soal quiz)
 * Satu baris per kombinasi quiz_question_id + created_by (user yang menjawab)
 * answers: jsonb jawaban user, files: share link Nextcloud (opsional)
 */

exports.up = function(knex) {
  return knex.schema.createTable('quiz_answers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('quiz_question_id').nullable()
      .references('id').inTable('quiz_questions').onDelete('SET NULL');

    table.jsonb('answers').nullable();
    table.integer('points').notNullable().defaultTo(0);
    table.text('files').nullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by').nullable();
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();
    table.boolean('is_delete').notNullable().defaultTo(false);

    table.index(['quiz_question_id', 'created_by'], 'idx_quiz_answers_quiz_question_id_created_by');
    table.index(['is_delete'], 'idx_quiz_answers_is_delete');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('quiz_answers');
};
