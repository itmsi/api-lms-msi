/**
 * Migration: Create modules table (materi pembelajaran LMS)
 */

exports.up = function(knex) {
  return knex.schema.createTable('modules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.string('title', 255).nullable();
    table.text('description').nullable();
    table.jsonb('link_materials').nullable();
    table.string('banner', 500).nullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by').nullable();
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();
    table.boolean('is_delete').notNullable().defaultTo(false);

    table.index(['is_delete'], 'idx_modules_is_delete');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('modules');
};
