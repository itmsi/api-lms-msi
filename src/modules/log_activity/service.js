const ExcelJS = require('exceljs');
const repository = require('./repository');
const { fullDateFormat } = require('../../utils/date');
const {
  client,
  ensureDirectoryExists,
  generateShareLink,
  NEXTCLOUD_UPLOAD_DIR
} = require('../../utils/nextcloud');

const EXPORT_DIR = `${NEXTCLOUD_UPLOAD_DIR}/log-activity`;

const FIELDS = ['created_by', 'modules_id', 'activity', 'file_name', 'file_link', 'type'];

// hanya field yang diizinkan yang boleh masuk ke database (cegah mass-assignment kolom audit)
const pick = (data = {}) => Object.fromEntries(
  FIELDS.filter((k) => data[k] !== undefined).map((k) => [k, data[k]])
);

/**
 * Service Layer - Business Logic (log activity)
 */

const assertModule = async (moduleId) => {
  if (!(await repository.moduleExists(moduleId))) {
    throw { message: 'Module tidak ditemukan', statusCode: 400 };
  }
};

const getAllItems = async (params = {}) => {
  return await repository.findAll(params);
};

const EXPORT_COLUMNS = [
  { header: 'Datetime', key: 'created_at', width: 20 },
  { header: 'Nama Karyawan', key: 'employee_name', width: 30 },
  { header: 'Aktifitas', key: 'activity', width: 40 },
  { header: 'Subject', key: 'modul_title', width: 40 },
  { header: 'Title Materi', key: 'file_name', width: 40 },
  { header: 'Link Materi', key: 'file_link', width: 60 }
];

/**
 * Export log activity ke excel (semua data sesuai filter, tanpa pagination),
 * upload file-nya ke Nextcloud lalu kembalikan share link publik-nya.
 */
const exportExcel = async (params = {}) => {
  const items = await repository.findAllForExport(params);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Log Activity');
  sheet.columns = EXPORT_COLUMNS;
  sheet.getRow(1).font = { bold: true };

  items.forEach((item) => {
    sheet.addRow({
      created_at: fullDateFormat(item.created_at) || '',
      employee_name: item.created_by_name || '',
      activity: item.activity || '',
      modul_title: item.modul_title || '',
      file_name: item.file_name || '',
      file_link: item.file_link || ''
    });
  });

  sheet.eachRow((row) => {
    row.alignment = { vertical: 'top', wrapText: true };
  });

  const buffer = await workbook.xlsx.writeBuffer();

  const fileName = `log-activity-${Date.now()}.xlsx`;
  const remotePath = `${EXPORT_DIR}/${fileName}`;

  await ensureDirectoryExists(EXPORT_DIR);
  await client.putFileContents(remotePath, Buffer.from(buffer), { overwrite: true });
  const url = await generateShareLink(remotePath);
  if (!url) {
    throw { message: 'Gagal membuat share link file export', statusCode: 502 };
  }

  return { file_name: fileName, total: items.length, url };
};

const createItem = async (itemData, actorId) => {
  const payload = pick(itemData);

  if (payload.modules_id) {
    await assertModule(payload.modules_id);
  }

  return await repository.create(payload, actorId);
};

module.exports = {
  getAllItems,
  exportExcel,
  createItem
};
