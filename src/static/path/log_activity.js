/**
 * Swagger API Path Definitions for Log Activity Module
 */
const { crudPaths } = require('./_crud');

const allPaths = crudPaths({
  tag: 'Log Activity',
  label: 'log activity',
  base: '/log-activity',
  schema: 'LogActivity',
  createInput: 'LogActivityInput',
  updateInput: 'LogActivityInput',
  sortBy: ['activity', 'file_name', 'created_at', 'updated_at'],
  listProps: {
    modules_id: { type: 'string', format: 'uuid', description: 'Filter berdasarkan module', example: '123e4567-e89b-12d3-a456-426614174000' },
    employee_id: { type: 'string', format: 'uuid', nullable: true, description: 'Filter berdasarkan employee', example: null },
    start_date: { type: 'string', format: 'date', nullable: true, description: 'Filter tanggal awal (created_at), format YYYY-MM-DD. Kosong = tanpa batas awal', example: '2025-01-01' },
    end_date: { type: 'string', format: 'date', nullable: true, description: 'Filter tanggal akhir (created_at, inklusif sampai akhir hari), format YYYY-MM-DD. Kosong = tanpa batas akhir', example: '2025-12-31' }
  }
});

// Module ini hanya menyediakan get dan create (tanpa get by id, update, delete, restore)
const logActivityPaths = {
  '/log-activity/get': allPaths['/log-activity/get'],
  '/log-activity/create': allPaths['/log-activity/create']
};

module.exports = logActivityPaths;
