// format link_materials: [{ "title": "Materi 1", "link": "https://..." }]

const isHttpUrl = (value) => {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

// request multipart/form-data mengirim link_materials sebagai string JSON array
const parseLinkMaterials = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    return JSON.parse(trimmed);
  } catch {
    // bukan JSON valid, biarkan gagal di validasi
    return value;
  }
};

// lempar Error jika format tidak sesuai; `field` dipakai untuk pesan error
const assertLinkMaterials = (items, field = "link_materials") => {
  if (!Array.isArray(items)) {
    throw new Error(`${field} harus berupa array [{ title, link }]`);
  }

  items.forEach((item, idx) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`${field}[${idx}] harus berupa objek { title, link }`);
    }
    if (typeof item.title !== "string" || !item.title.trim()) {
      throw new Error(`${field}[${idx}].title wajib diisi`);
    }
    if (typeof item.link !== "string" || !isHttpUrl(item.link.trim())) {
      throw new Error(`${field}[${idx}].link harus berupa URL yang valid`);
    }
  });

  return true;
};

// hanya simpan key title & link (buang key lain yang tidak dikenal)
const normalizeLinkMaterials = (items) =>
  Array.isArray(items)
    ? items.map((item) => ({
        title: String(item.title).trim(),
        link: String(item.link).trim(),
      }))
    : items;

module.exports = {
  parseLinkMaterials,
  assertLinkMaterials,
  normalizeLinkMaterials,
};
