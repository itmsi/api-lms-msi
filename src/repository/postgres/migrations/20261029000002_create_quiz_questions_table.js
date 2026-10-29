/**
 * Migration: Create quiz_questions table (soal milik sebuah quiz)
 * type: multiple_choice | multiple_answers | true_false | short_answer
 * options: jsonb array [{ line, text, is_correct }]
 * image: share link Nextcloud (opsional)
 */

exports.up = function(knex) {
  return knex.schema.createTable('quiz_questions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('quizzes_id').notNullable()
      .references('id').inTable('quizzes').onDelete('CASCADE');

    table.integer('line').notNullable().defaultTo(1);
    table.string('type', 30).notNullable();
    table.text('question').notNullable();
    table.integer('estimated_time').nullable();
    table.string('estimated_time_unit', 10).notNullable().defaultTo('minutes');
    table.integer('points').notNullable().defaultTo(0);
    table.jsonb('options').notNullable().defaultTo('[]');
    table.text('image').nullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by').nullable();
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();
    table.boolean('is_delete').notNullable().defaultTo(false);

    table.index(['quizzes_id'], 'idx_quiz_questions_quizzes_id');
    table.index(['is_delete'], 'idx_quiz_questions_is_delete');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('quiz_questions');
};
