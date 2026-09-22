/**
 * Migration: Create chapters table (sub-materi milik sebuah module)
 */

exports.up = function(knex) {
  return knex.schema.createTable('chapters', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('modules_id').nullable()
      .references('id').inTable('modules').onDelete('SET NULL');

    table.string('title', 255).nullable();
    table.text('description').nullable();
    table.jsonb('link_materials').nullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by').nullable();
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();
    table.boolean('is_delete').notNullable().defaultTo(false);

    table.index(['modules_id'], 'idx_chapters_modules_id');
    table.index(['is_delete'], 'idx_chapters_is_delete');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('chapters');
};
