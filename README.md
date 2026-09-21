# API LMS MSI

REST API untuk sistem Learning Management System (LMS) berbasis Express.js + PostgreSQL (Knex).
Berjalan di port **9561**.

## Fitur

- **Autentikasi JWT**: login dengan email dan password, token berlaku 12 jam.
- **RBAC (Role Based Access Control)**: hak akses diatur per endpoint (method + path).
  - Setiap **user** hanya memiliki **1 role**.
  - Setiap **role** dapat memiliki **banyak hak akses**.
- **Master data**: roles, permissions (hak akses), dan users.
- **Soft delete + restore** di semua master data.
- **Swagger / OpenAPI 3** di `/documentation`.
- Pendukung bawaan boilerplate: Prometheus, rate limiter, RabbitMQ, MinIO/S3, email, Docker.

## Menjalankan

### 1. Install

```bash
npm install
```

### 2. Environment

```bash
cp .env.sample .env
```

Variabel yang wajib diisi:

```env
APP_PORT=9561
NODE_ENV=development
SWAGGER_ENABLED=true

# Secret untuk sign/verify JWT login (gunakan nilai acak yang panjang)
SECRET_KEY_AUTH_JWT=isi-dengan-string-acak

# Database (environment development)
DB_CLIENT_DEV=pg
DB_HOST_DEV=localhost
DB_PORT_DEV=5432
DB_USER_DEV=postgres
DB_PASS_DEV=password
DB_NAME_DEV=db_lms
```

Buat string acak, misalnya: `node -e "console.log(require('crypto').randomUUID())"`.
Untuk `NODE_ENV=production` / `staging`, isi juga variabel `DB_*_PROD` / `DB_*_TEST`.

CORS diatur lewat `CORS_ORIGINS` (dipisah koma, tanpa trailing slash; `CORS_ENABLED=false` untuk mematikan).
Origin yang diizinkan secara default: `http://localhost:3000`, `http://localhost:4000`, `http://localhost:9561`,
`https://dev-lms.motorsights.com`. Origin lain tidak mendapat header CORS sehingga diblokir browser.
Request tanpa header `Origin` (curl, server-to-server) tidak terpengaruh. Konfigurasi ada di `src/utils/cors.js`.

> Swagger hanya aktif jika `SWAGGER_ENABLED=true` (atau `NODE_ENV=development`).
> Jangan pernah commit file `.env`.

### 3. Database

Buat database terlebih dahulu (`createdb db_lms`), lalu:

```bash
npm run migrate   # membuat tabel
npm run seed      # mengisi data contoh
```

> **Peringatan:** seeder `0002_roles_permissions_users_seeder.js` menghapus isi tabel
> `role_permissions`, `users`, `permissions`, dan `roles` sebelum mengisi ulang.
> Jangan dijalankan di database yang sudah berisi data nyata.

Perintah lain: `npm run migrate:rollback`, `npm run migrate:make <nama>`, `npm run seed:make <nama>`.

### 4. Start

```bash
npm run dev     # development (nodemon)
npm start       # production
```

- API: `http://localhost:9561/api/lms`
- Swagger: `http://localhost:9561/documentation`

## Data contoh (seeder)

Password semua user: **`Password123!`** (ganti di lingkungan selain development).

| Role | Email | Hak akses |
|---|---|---|
| Super Admin (`super-admin`) | superadmin@lms.test | Semua |
| Admin (`admin`) | admin@lms.test | Semua kecuali tambah/ubah/hapus/restore permissions, serta hapus/restore role |
| Instruktur (`instruktur`) | instruktur@lms.test | Baca roles, users, examples |
| Participant (`participant`) | participant@lms.test | Belum ada |

## Model data

```
roles 1 ──< users            (users.role_id, 1 user = 1 role)
roles >──< permissions       (lewat role_permissions, 1 role = banyak hak akses)
```

| Tabel | Kolom utama |
|---|---|
| `roles` | id, name, slug (unik), description |
| `permissions` | id, name, code (unik), method, endpoint (unik bersama method) |
| `role_permissions` | role_id, permission_id (unik berpasangan) |
| `users` | id, role_id, name, email (unik), password (bcrypt), status (`active`/`inactive`) |

Semua tabel memakai UUID dan kolom `created_at`, `updated_at`, `deleted_at`, serta kolom audit
(ditambahkan oleh migrasi `20250101000006_add_audit_columns.js`):

| Kolom | Tipe | Keterangan |
|---|---|---|
| `created_by` | uuid, nullable | `users.id` pembuat data |
| `updated_by` | uuid, nullable | `users.id` pengubah terakhir |
| `deleted_by` | uuid, nullable | `users.id` penghapus data |
| `is_delete` | boolean, default `false` | Penanda soft delete (semua query memfilter `is_delete = false`) |

Nilai `*_by` diisi otomatis dari `req.user.id`, yaitu `user_id` di payload JWT (= `users.id`).
Data hasil seeder memiliki `created_by` kosong. Pada `role_permissions`, mencabut hak akses berarti
`is_delete = true` + `deleted_by` (bukan hapus baris), dan memberikannya lagi mengaktifkan baris yang sama.

## Autentikasi dan hak akses

1. Login: `POST /api/lms/auth/login` dengan `{ "email", "password" }`.
2. Kirim token pada setiap request: `Authorization: Bearer <access_token>`.

```bash
curl -X POST http://localhost:9561/api/lms/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"superadmin@lms.test","password":"Password123!"}'
```

Payload JWT berisi `user_id` (= `users.id`) dan `role`. Token yang tidak memiliki `user_id` ditolak.

Middleware di `src/middlewares/auth.js`:

- `authenticate`: memverifikasi JWT, membaca `user_id`, lalu memastikan user masih ada, berstatus `active`, dan rolenya belum dihapus. Gagal → **401**.
- `authorize`: mencocokkan method dan path route (contoh `GET /api/lms/roles/:id`) dengan tabel `permissions`, lalu mengecek apakah role user memiliki hak akses tersebut. Gagal → **403**.

Pengecekan dilakukan ke database pada setiap request, sehingga perubahan hak akses berlaku langsung tanpa login ulang.

## Endpoint

Base URL: `http://localhost:9561/api/lms` (nilai `API_TAG` di `src/routes/V1/index.js`).
Semua endpoint (kecuali login) membutuhkan token dan hak akses yang sesuai.

| Endpoint | Keterangan |
|---|---|
| `POST /auth/login` | Login (publik) |
| `GET /auth/me` | Profil, role, dan hak akses user login |
| `POST /roles/get` | Daftar role (body list, lihat di bawah) |
| `POST /roles/create` | Tambah role |
| `GET /roles/:id` | Detail role, menyertakan hak akses |
| `PUT /roles/:id` | Ubah role |
| `DELETE /roles/:id` | Soft delete role |
| `POST /roles/:id/restore` | Restore role |
| `PUT /roles/:id/permissions` | Atur (ganti seluruh) hak akses role: `{ "permission_ids": [...] }` |
| `/permissions/...` | Master hak akses: `POST /get`, `POST /create`, `GET/PUT/DELETE /:id`, `POST /:id/restore` |
| `/users/...` | Master user: pola sama, `POST /get` juga menerima filter `role_id` |
| `/examples/...` | Module contoh: pola sama |

Pola URL setiap module: **list → `POST /get`**, **tambah → `POST /create`**, detail → `GET /:id`,
ubah → `PUT /:id`, hapus → `DELETE /:id`, restore → `POST /:id/restore`.

### Body endpoint list (`POST /get`)

```json
{
  "page": 1,
  "limit": 10,
  "sort_by": "created_at",
  "sort_order": "asc",
  "search": ""
}
```

Semua field opsional. `limit` maksimal 100, `sort_order` adalah `asc` atau `desc`, `search` mencari di kolom teks utama.
`sort_by` hanya boleh salah satu kolom berikut (selain itu ditolak):

| Module | `sort_by` yang diizinkan | Default |
|---|---|---|
| roles | name, slug, created_at, updated_at | created_at desc |
| permissions | name, code, method, endpoint, created_at, updated_at | code asc |
| users | name, email, status, role_name, created_at, updated_at | created_at desc |
| examples | name, status, created_at, updated_at | created_at desc |

Khusus users, body boleh menyertakan `"role_id": "<uuid>"` untuk memfilter berdasarkan role.

Contoh:

```bash
curl -X POST http://localhost:9561/api/lms/roles/get \
  -H "Authorization: Bearer <token>" -H 'Content-Type: application/json' \
  -d '{"page":1,"limit":10,"sort_by":"name","sort_order":"asc","search":""}'
```

Response list:

```json
{
  "success": true,
  "message": "Success",
  "data": { "items": [], "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 } },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

Format response lain:

```json
{ "success": true, "message": "Data berhasil dibuat", "data": {}, "timestamp": "..." }
{ "success": false, "message": "Data tidak ditemukan", "errors": null, "timestamp": "..." }
```

> Catatan: error validasi input memakai middleware bawaan boilerplate (`validateMiddleware`)
> yang membalas dengan status **201** dan pesan error pada body.

## Struktur proyek

```
src/
├── app.js, server.js
├── config/                     # database (pgCore), aws, minio, rabbitmq, ...
├── middlewares/
│   ├── auth.js                 # authenticate + authorize (RBAC)
│   └── validation.js           # validateMiddleware (express-validator)
├── modules/
│   ├── auth/                   # login, me
│   ├── roles/                  # master role + sync hak akses
│   ├── permissions/            # master hak akses
│   ├── users/                  # master user
│   └── example/                # template module
│       ├── index.js            # routes (+ authenticate/authorize)
│       ├── controller.js       # HTTP layer
│       ├── service.js          # business logic
│       ├── repository.js       # query database (Knex)
│       └── validation.js       # aturan express-validator
├── routes/V1/index.js          # registrasi module di /api/lms/*
├── repository/postgres/
│   ├── migrations/             # skema tabel
│   └── seeders/                # data contoh
├── static/                     # Swagger
│   ├── index.js                # gabungan schema + path
│   ├── path/                   # definisi endpoint (role, permission, user, auth, example)
│   └── schema/                 # definisi schema
└── utils/                      # response, list_params (sort/pagination), logger, dll.
```

## Membuat module baru

Gunakan `src/modules/example` (atau `roles`) sebagai template.

1. **Migrasi**: `npm run migrate:make create_<nama>_table`, lalu isi skema.
2. **Module** di `src/modules/<nama>/`: `index.js`, `controller.js`, `service.js`, `repository.js`, `validation.js`.
   - Repository memakai `const { pgCore: db } = require('../../config/database')`.
   - Controller memakai `successResponse` / `errorResponse` dari `utils/response`.
   - Service melempar error berbentuk `{ message, statusCode }`.
   - Controller meneruskan `req.user.id` ke service, dan repository mengisi `created_by` / `updated_by` / `deleted_by`.
   - Service hanya meneruskan field yang di-whitelist ke repository (jangan pass `req.body` mentah).
   - Soft delete: `is_delete = true`, `deleted_at`, `deleted_by`; query selalu filter `is_delete: false`.
3. **Proteksi**: di `index.js` pasang `router.use(authenticate)` dan `authorize` pada setiap route:
   ```js
   const { authenticate, authorize } = require('../../middlewares/auth');
   router.use(authenticate);
   router.get('/', authorize, listValidation, validateMiddleware, controller.getAll);
   ```
4. **Daftarkan route** di `src/routes/V1/index.js` (nama endpoint memakai bentuk jamak). Ikuti pola URL: list `POST /get`, tambah `POST /create`, detail `GET /:id`, ubah `PUT /:id`, hapus `DELETE /:id`, restore `POST /:id/restore`.
   Untuk list, pakai `normalizeListParams` dari `src/utils/list_params.js` (whitelist kolom `sort_by`, batas `limit`).
5. **Hak akses**: tambahkan resource baru ke `resources` pada seeder
   `0002_roles_permissions_users_seeder.js` (kode `<resource>.<aksi>`, contoh `courses.read`),
   lalu tentukan role mana yang memilikinya di `rolePermissionMap`.
   Tanpa baris di tabel `permissions`, endpoint baru akan selalu **403**, termasuk untuk super-admin.
   Kolom `endpoint` diisi path lengkap sesuai route, mis. `/api/lms/courses/get` (`API_PREFIX` di seeder harus sama dengan `API_TAG`).
   Untuk database yang sudah berjalan, tambahkan lewat `POST /api/lms/permissions/create` dan
   `PUT /api/lms/roles/:id/permissions` (tanpa seed ulang).
6. **Swagger**: buat `static/schema/<nama>.js` dan `static/path/<nama>.js`
   (helper `crudPaths` di `static/path/_crud.js` cocok untuk CRUD standar),
   lalu daftarkan di `static/index.js`.

## Docker

```bash
docker-compose up -d
```

Lihat `docker/` dan `docker-compose.yml` untuk konfigurasi lengkap.

## Lisensi

MIT
