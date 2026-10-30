/**
 * Migration: Create quiz_users table (rekap pengerjaan quiz per user)
 * Satu baris per kombinasi quizze_id + created_by (user yang mengerjakan)
 */

exports.up = function(knex) {
  return knex.schema.createTable('quiz_users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('quizze_id').nullable()
      .references('id').inTable('quizzes').onDelete('SET NULL');

    table.string('total_point').nullable();
    table.string('completed_count').nullable();
    table.string('uncompleted_count').nullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by').nullable();
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();
    table.boolean('is_delete').notNullable().defaultTo(false);

    table.index(['quizze_id', 'created_by'], 'idx_quiz_users_quizze_id_created_by');
    table.index(['is_delete'], 'idx_quiz_users_is_delete');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('quiz_users');
};
