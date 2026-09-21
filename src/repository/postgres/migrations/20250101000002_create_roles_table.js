/**
 * Migration: Create roles table (master role)
 */

exports.up = function(knex) {
  return knex.schema.createTable('roles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.string('name', 100).notNullable();
    table.string('slug', 100).notNullable().unique();
    table.text('description').nullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    table.index(['deleted_at'], 'idx_roles_deleted_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('roles');
};
