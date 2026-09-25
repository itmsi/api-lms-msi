/**
 * Swagger Schema Definitions for Modul (modules) Module
 */

const modulSchemas = {
  ModuleCategoryFilter: {
    type: "array",
    description: "Filter berdasarkan satu atau beberapa kategori module",
    items: { type: "string", maxLength: 20 },
    example: ["reguler", "onboarding", "mt"],
  },
  Modul: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        description: "Unique identifier",
        example: "123e4567-e89b-12d3-a456-426614174000",
      },
      title: {
        type: "string",
        nullable: true,
        description: "Judul module",
        example: "Pengenalan JavaScript",
      },
      description: {
        type: "string",
        nullable: true,
        description: "Deskripsi module",
        example: "Materi dasar bahasa pemrograman JavaScript",
      },
      description_clean: {
        type: "string",
        nullable: true,
        description: "Deskripsi module versi plain text",
        example: "Materi dasar bahasa pemrograman JavaScript",
      },
      module_category: {
        type: "string",
        nullable: true,
        description: "Kategori module",
        example: "reguler",
      },
      link_materials: {
        type: "array",
        nullable: true,
        description: "Daftar link materi module",
        items: { type: "string", format: "uri" },
        example: [
          "https://example.com/materi-1.pdf",
          "https://example.com/materi-2.pdf",
        ],
      },
      banner: {
        type: "string",
        nullable: true,
        description: "Share link banner dari Nextcloud",
        example: "https://cloud.inlinegroupdc.com/s/AbCdEfGh",
      },
      created_at: {
        type: "string",
        format: "date-time",
        example: "2025-01-01T00:00:00.000Z",
      },
      updated_at: {
        type: "string",
        format: "date-time",
        example: "2025-01-01T00:00:00.000Z",
      },
      deleted_at: {
        type: "string",
        format: "date-time",
        nullable: true,
        example: null,
      },
      created_by: {
        type: "string",
        format: "uuid",
        nullable: true,
        description: "id pembuat data (bisa dari SSO)",
        example: null,
      },
      updated_by: {
        type: "string",
        format: "uuid",
        nullable: true,
        description: "id pengubah terakhir (bisa dari SSO)",
        example: null,
      },
      deleted_by: {
        type: "string",
        format: "uuid",
        nullable: true,
        description: "id penghapus data (bisa dari SSO)",
        example: null,
      },
      is_delete: {
        type: "boolean",
        description: "Penanda soft delete",
        example: false,
      },
    },
  },
  ModulDetail: {
    allOf: [
      { $ref: "#/components/schemas/Modul" },
      {
        type: "object",
        properties: {
          chapters: {
            type: "array",
            description: "Daftar chapter milik module ini",
            items: { $ref: "#/components/schemas/Chapter" },
          },
        },
      },
    ],
  },
  ModulInput: {
    type: "object",
    required: ["title"],
    properties: {
      title: {
        type: "string",
        minLength: 3,
        maxLength: 255,
        example: "Pengenalan JavaScript",
      },
      description: {
        type: "string",
        maxLength: 2000,
        description: "Deskripsi module, boleh berisi HTML",
        example:
          "<p>Materi dasar bahasa pemrograman <strong>JavaScript</strong></p>",
      },
      description_clean: {
        type: "string",
        nullable: true,
        description: "Deskripsi module versi plain text",
        example: "Materi dasar bahasa pemrograman JavaScript",
      },
      module_category: {
        type: "string",
        nullable: true,
        example: "reguler",
      },
      link_materials: {
        type: "string",
        description:
          "Daftar link materi (dikirim via multipart/form-data), boleh string JSON array atau list dipisah koma",
        example:
          "https://example.com/materi-1.pdf,https://example.com/materi-2.pdf",
      },
      banner: {
        type: "string",
        format: "binary",
        description:
          "File gambar banner (jpg/jpeg/png/webp/gif, maksimal 5MB). Jika dikirim, selalu menggantikan banner lama.",
      },
      banner_delete: {
        type: "boolean",
        default: false,
        description:
          "Hanya berlaku pada update. Jika true, hapus banner yang ada (banner jadi null). Jika false/tidak dikirim dan tidak ada file baru, banner lama tetap dipertahankan.",
      },
    },
  },
  ChapterAllInput: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        nullable: true,
        description:
          "Isi dengan id chapter yang sudah ada untuk meng-update chapter tersebut. Kosongkan (string kosong) untuk membuat chapter baru.",
        example: "",
      },
      line: {
        type: "integer",
        minimum: 0,
        default: 0,
        description: "Urutan tampil chapter",
        example: 1,
      },
      title: {
        type: "string",
        minLength: 3,
        maxLength: 255,
        description: "Wajib diisi untuk chapter baru (tanpa id)",
        example: "Variabel dan Tipe Data",
      },
      description: {
        type: "string",
        maxLength: 2000,
        example: "Mengenal variabel, tipe data, dan operator di JavaScript",
      },
      link_materials: {
        type: "array",
        items: { type: "string", format: "uri" },
        example: ["https://example.com/chapter-1-materi.pdf"],
      },
    },
  },
  ModulCreateAllInput: {
    type: "object",
    required: ["title"],
    properties: {
      title: {
        type: "string",
        minLength: 3,
        maxLength: 255,
        example: "Pengenalan JavaScript",
      },
      description: {
        type: "string",
        maxLength: 2000,
        description: "Deskripsi module, boleh berisi HTML",
        example:
          "<p>Materi dasar bahasa pemrograman <strong>JavaScript</strong></p>",
      },
      description_clean: {
        type: "string",
        nullable: true,
        description: "Deskripsi module versi plain text",
        example: "Materi dasar bahasa pemrograman JavaScript",
      },
      module_category: {
        type: "string",
        nullable: true,
        example: "reguler",
      },
      link_materials: {
        type: "string",
        description:
          "Daftar link materi (dikirim via multipart/form-data), boleh string JSON array atau list dipisah koma",
        example:
          "https://example.com/materi-1.pdf,https://example.com/materi-2.pdf",
      },
      banner: {
        type: "string",
        format: "binary",
        description: "File gambar banner (jpg/jpeg/png/webp/gif, maksimal 5MB)",
      },
      chapters: {
        type: "string",
        description:
          "Daftar chapter, dikirim via multipart/form-data sebagai string JSON array of ChapterAllInput. Semua item dianggap chapter baru (id dikosongkan).",
        example: JSON.stringify([
          {
            id: "",
            line: 1,
            title: "Variabel dan Tipe Data",
            description: "Mengenal variabel",
            link_materials: ["https://example.com/chapter-1-materi.pdf"],
          },
          {
            id: "",
            line: 2,
            title: "Variabel dan Tipe Data",
            description: "Mengenal variabel",
            link_materials: ["https://example.com/chapter-1-materi.pdf"],
          },
        ]),
      },
    },
  },
  ModulUpdateAllInput: {
    type: "object",
    properties: {
      title: {
        type: "string",
        minLength: 3,
        maxLength: 255,
        example: "Pengenalan JavaScript",
      },
      description: {
        type: "string",
        maxLength: 2000,
        description: "Deskripsi module, boleh berisi HTML",
        example:
          "<p>Materi dasar bahasa pemrograman <strong>JavaScript</strong></p>",
      },
      description_clean: {
        type: "string",
        nullable: true,
        description: "Deskripsi module versi plain text",
        example: "Materi dasar bahasa pemrograman JavaScript",
      },
      module_category: {
        type: "string",
        nullable: true,
        example: "reguler",
      },
      link_materials: {
        type: "string",
        description:
          "Daftar link materi (dikirim via multipart/form-data), boleh string JSON array atau list dipisah koma",
        example:
          "https://example.com/materi-1.pdf,https://example.com/materi-2.pdf",
      },
      banner: {
        type: "string",
        format: "binary",
        description:
          "File gambar banner baru (opsional). Jika dikirim, selalu menggantikan banner lama.",
      },
      banner_delete: {
        type: "boolean",
        default: false,
        description:
          "Jika true, hapus banner yang ada (banner jadi null), diabaikan jika ada file banner baru.",
      },
      chapters: {
        type: "string",
        description:
          'Daftar chapter, dikirim via multipart/form-data sebagai string JSON array of ChapterAllInput. Item ber-`id` akan di-update, item dengan `id` kosong ("") akan dibuat sebagai chapter baru. Chapter lama yang tidak disertakan TIDAK dihapus.',
        example: JSON.stringify([
          {
            id: "223e4567-e89b-12d3-a456-426614174000",
            line: 1,
            title: "Variabel dan Tipe Data",
            description: "Mengenal variabel",
            link_materials: ["https://example.com/chapter-1-materi.pdf"],
          },
          {
            id: "",
            line: 2,
            title: "Variabel dan Tipe Data",
            description: "Mengenal variabel",
            link_materials: ["https://example.com/chapter-1-materi.pdf"],
          },
        ]),
      },
    },
  },
};

module.exports = modulSchemas;
