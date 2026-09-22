/**
 * Swagger API Path Definitions for Chapter Module
 */
const { crudPaths } = require('./_crud');

const chapterPaths = crudPaths({
  tag: 'Chapters',
  label: 'chapter',
  base: '/chapters',
  schema: 'Chapter',
  createInput: 'ChapterInput',
  updateInput: 'ChapterInput',
  sortBy: ['title', 'created_at', 'updated_at'],
  listProps: {
    modules_id: { type: 'string', format: 'uuid', description: 'Filter berdasarkan module', example: '123e4567-e89b-12d3-a456-426614174000' }
  }
});

module.exports = chapterPaths;
