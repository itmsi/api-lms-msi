/**
 * Migration: Create role_permissions table (1 role : banyak hak akses)
 */

exports.up = function(knex) {
  return knex.schema.createTable('role_permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('role_id').notNullable()
      .references('id').inTable('roles').onDelete('CASCADE');
    table.uuid('permission_id').notNullable()
      .references('id').inTable('permissions').onDelete('CASCADE');

    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['role_id', 'permission_id'], 'uq_role_permissions');
    table.index(['role_id'], 'idx_role_permissions_role_id');
    table.index(['permission_id'], 'idx_role_permissions_permission_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('role_permissions');
};
