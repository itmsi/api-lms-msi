/**
 * Migration: Create log_activity table (log aktivitas pada sebuah module)
 */

exports.up = function(knex) {
  return knex.schema.createTable('log_activity', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('modules_id').nullable()
      .references('id').inTable('modules').onDelete('SET NULL');

    table.text('activity').nullable();
    table.text('file_name').nullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by').nullable();
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();
    table.boolean('is_delete').notNullable().defaultTo(false);

    table.index(['modules_id'], 'idx_log_activity_modules_id');
    table.index(['is_delete'], 'idx_log_activity_is_delete');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('log_activity');
};
