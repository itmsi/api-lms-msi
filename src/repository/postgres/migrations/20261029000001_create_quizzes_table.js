/**
 * Migration: Create quizzes table (header kuis milik sebuah module)
 * type: jsonb array audiens, nilai yang diizinkan: "reguler", "mt"
 */

exports.up = function(knex) {
  return knex.schema.createTable('quizzes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('modules_id').nullable()
      .references('id').inTable('modules').onDelete('SET NULL');

    table.string('title', 255).notNullable();
    table.jsonb('type').notNullable().defaultTo('[]');
    table.date('start_date').nullable();
    table.date('end_date').nullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by').nullable();
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();
    table.boolean('is_delete').notNullable().defaultTo(false);

    table.index(['modules_id'], 'idx_quizzes_modules_id');
    table.index(['is_delete'], 'idx_quizzes_is_delete');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('quizzes');
};
