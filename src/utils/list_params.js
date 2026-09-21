/**
 * Normalisasi body request untuk endpoint list (POST /get):
 * { page, limit, sort_by, sort_order, search }
 *
 * sort_by hanya boleh salah satu key di `sortable` (key -> nama kolom di database),
 * sehingga input klien tidak pernah langsung dipakai sebagai nama kolom SQL.
 */
const normalizeListParams = (params = {}, { sortable, defaultSort, defaultOrder = 'desc' }) => {
  const page = Math.max(parseInt(params.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(params.limit, 10) || 10, 1), 100);
  const sortKey = Object.prototype.hasOwnProperty.call(sortable, params.sort_by) ? params.sort_by : defaultSort;
  const sortOrder = String(params.sort_order || defaultOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';
  const search = typeof params.search === 'string' ? params.search.trim() : '';

  return { page, limit, sortColumn: sortable[sortKey], sortOrder, search };
};

module.exports = { normalizeListParams };
