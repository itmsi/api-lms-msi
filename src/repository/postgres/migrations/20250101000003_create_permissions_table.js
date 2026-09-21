/**
 * Migration: Create permissions table (master hak akses per endpoint)
 */

exports.up = function(knex) {
  return knex.schema.createTable('permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.string('name', 100).notNullable();
    table.string('code', 100).notNullable().unique();
    table.string('method', 10).notNullable();
    table.string('endpoint', 255).notNullable();
    table.text('description').nullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    table.unique(['method', 'endpoint'], 'uq_permissions_method_endpoint');
    table.index(['deleted_at'], 'idx_permissions_deleted_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('permissions');
};
