/**
 * Migration: Create users table (setiap user hanya memiliki 1 role)
 */

exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('role_id').notNullable()
      .references('id').inTable('roles').onDelete('RESTRICT');

    table.string('name', 100).notNullable();
    table.string('email', 150).notNullable().unique();
    table.string('password', 255).notNullable();
    table.string('status', 20).defaultTo('active');

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    table.index(['role_id'], 'idx_users_role_id');
    table.index(['status'], 'idx_users_status');
    table.index(['deleted_at'], 'idx_users_deleted_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
