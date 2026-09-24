const { createClient } = require("webdav");
const axios = require("axios");

const NEXTCLOUD_URL =
  process.env.NEXTCLOUD_URL || "https://cloud.inlinegroupdc.com";
const NEXTCLOUD_USERNAME =
  process.env.NEXTCLOUD_USERNAME || "admin_netsuite_dev";
const NEXTCLOUD_PASSWORD = process.env.NEXTCLOUD_PASSWORD || "Rubysa179596";
const NEXTCLOUD_WEBDAV_PATH =
  process.env.NEXTCLOUD_WEBDAV_PATH || "/remote.php/webdav";
const NEXTCLOUD_SHARE_API_PATH =
  process.env.NEXTCLOUD_SHARE_API_PATH ||
  "/ocs/v1.php/apps/files_sharing/api/v1/shares";
const NEXTCLOUD_UPLOAD_DIR = process.env.NEXTCLOUD_UPLOAD_DIR || "/Temp";
// Grup yang beranggotakan seluruh user Nextcloud (harus dibuat & diisi manual
// di admin Nextcloud, atau pakai grup default seperti "everyone" bila ada).
const NEXTCLOUD_ALL_USERS_GROUP =
  process.env.NEXTCLOUD_ALL_USERS_GROUP || "everyone";

const client = createClient(`${NEXTCLOUD_URL}${NEXTCLOUD_WEBDAV_PATH}`, {
  username: NEXTCLOUD_USERNAME,
  password: NEXTCLOUD_PASSWORD,
});

/**
 * Convert a snake_case/kebab-case/space-separated string into PascalCase,
 * e.g. "transfer_order" -> "TransferOrder"
 * @param {string} value
 * @returns {string}
 */
const toPascalCase = (value) => {
  if (!value) return value;
  return String(value)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
};

/**
 * Ensures a directory exists in Nextcloud
 * @param {string} dirPath Directory path
 */
const ensureDirectoryExists = async (dirPath) => {
  const parts = dirPath.split("/").filter(Boolean);
  let currentPath = "";

  for (const part of parts) {
    currentPath += `/${part}`;
    const exists = await client.exists(currentPath);
    if (!exists) {
      await client.createDirectory(currentPath);
    }
  }
};

/**
 * Move/rename a file within Nextcloud
 * @param {string} fromPath Current path of the file
 * @param {string} toPath Destination path
 */
const moveFile = async (fromPath, toPath) => {
  await client.moveFile(fromPath, toPath);
};

/**
 * Copy a file within Nextcloud, keeping the source intact
 * @param {string} fromPath Current path of the file
 * @param {string} toPath Destination path
 */
const copyFile = async (fromPath, toPath) => {
  await client.copyFile(fromPath, toPath);
};

/**
 * Generate a public share link using Nextcloud OCS API
 * @param {string} path Path to the file in Nextcloud
 * @returns {string} Public share URL
 */
const generateShareLink = async (path) => {
  try {
    const response = await axios.post(
      `${NEXTCLOUD_URL}${NEXTCLOUD_SHARE_API_PATH}`,
      {
        path: path,
        shareType: 3, // 3 = public link
        permissions: 1, // 1 = read only
      },
      {
        headers: {
          "OCS-APIRequest": "true",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        auth: {
          username: NEXTCLOUD_USERNAME,
          password: NEXTCLOUD_PASSWORD,
        },
      },
    );

    if (response.data && response.data.ocs && response.data.ocs.data) {
      return response.data.ocs.data.url;
    }
    throw new Error("Failed to parse share URL from response");
  } catch (error) {
    console.error(
      "Error generating share link:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

/**
 * Resolve the Nextcloud internal fileid of a file via WebDAV PROPFIND.
 * fileid dipakai untuk membentuk internal link (/index.php/f/{fileid}) yang
 * otomatis mewajibkan login sebelum file bisa dibuka.
 * @param {string} path Path to the file in Nextcloud
 * @returns {Promise<string>} fileid
 */
const getFileId = async (path) => {
  const response = await axios.request({
    method: "PROPFIND",
    url: `${NEXTCLOUD_URL}${NEXTCLOUD_WEBDAV_PATH}${path}`,
    headers: {
      Depth: "0",
      "Content-Type": "application/xml",
    },
    auth: {
      username: NEXTCLOUD_USERNAME,
      password: NEXTCLOUD_PASSWORD,
    },
    data: `<?xml version="1.0"?>
<d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
  <d:prop>
    <oc:fileid />
  </d:prop>
</d:propfind>`,
  });

  const match = String(response.data).match(/<oc:fileid>(\d+)<\/oc:fileid>/);
  if (!match) {
    throw new Error("Failed to resolve fileid from PROPFIND response");
  }
  return match[1];
};

/**
 * Generate a private (internal) share link. Opening this link while logged
 * out redirects the browser to the Nextcloud login page instead of showing
 * the file publicly (unlike generateShareLink).
 *
 * Catatan: link ini hanya bisa dibuka oleh user yang memang sudah punya akses
 * ke file tsb di Nextcloud (pemilik, atau user/grup yang di-share manual).
 * Kalau butuh SEMUA pemilik akun Nextcloud bisa akses, pakai
 * generateShareLinkPrivateAll.
 * @param {string} path Path to the file in Nextcloud
 * @returns {string} Internal file URL (login required)
 */
const generateShareLinkPrivate = async (path) => {
  try {
    const fileId = await getFileId(path);
    return `${NEXTCLOUD_URL}/index.php/f/${fileId}`;
  } catch (error) {
    console.error(
      "Error generating private share link:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

/**
 * Generate an internal share link that can be opened by ANY Nextcloud
 * account holder, not just specific users. Karena OCS Share API tidak punya
 * shareType "semua user di instance", caranya adalah men-share file ke grup
 * yang beranggotakan seluruh user (NEXTCLOUD_ALL_USERS_GROUP, default
 * "everyone") lalu mengembalikan internal link-nya. Grup ini harus dibuat di
 * admin Nextcloud dan seluruh user perlu jadi anggotanya (atau pakai fitur
 * "circle"/grup bawaan yang otomatis berisi semua user, kalau tersedia di
 * instance-nya).
 *
 * shareType yang tersedia di Nextcloud OCS Share API:
 * - 0 = user tertentu
 * - 1 = grup (kekuranganya harus add user ke group itu sendiri)
 * - 3 = public link (tanpa login sama sekali, dipakai generateShareLink)
 * - 4 = email
 * - 6 = federated (user Nextcloud instance lain)
 * - 7 = circle (kalau app Circles aktif) mirip kaya group tapi ini fitur Circles di nexcloudnya
 *
 * @param {string} path Path to the file in Nextcloud
 * @returns {string} Internal file URL yang bisa diakses semua akun Nextcloud
 */
const generateShareLinkPrivateAll = async (path) => {
  try {
    await axios.post(
      `${NEXTCLOUD_URL}${NEXTCLOUD_SHARE_API_PATH}`,
      {
        path: path,
        shareType: 1, // 1 = share ke grup
        shareWith: NEXTCLOUD_ALL_USERS_GROUP,
        permissions: 1, // 1 = read only
      },
      {
        headers: {
          "OCS-APIRequest": "true",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        auth: {
          username: NEXTCLOUD_USERNAME,
          password: NEXTCLOUD_PASSWORD,
        },
      },
    );

    // Group share tidak menghasilkan URL publik (hanya muncul di Files app
    // user terkait), jadi tetap pakai internal link (/index.php/f/{fileid})
    // supaya bisa dibuka langsung dari browser/new tab.
    const fileId = await getFileId(path);
    return `${NEXTCLOUD_URL}/index.php/f/${fileId}`;
  } catch (error) {
    console.error(
      "Error generating private share link for all users:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

/**
 * ShareType
Nilai	Arti
0	Share ke user tertentu
1	Share ke grup
3	Public link (siapa saja, tanpa login) — dipakai generateShareLink
4	Share via email
6	Federated (user dari instance Nextcloud lain)
7	Circle (kalau app Circles aktif)
 */

module.exports = {
  client,
  toPascalCase,
  ensureDirectoryExists,
  moveFile,
  copyFile,
  generateShareLink,
  generateShareLinkPrivate,
  generateShareLinkPrivateAll,
  NEXTCLOUD_UPLOAD_DIR,
};
