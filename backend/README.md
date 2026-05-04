# 🛠️ Backend — Buku Tamu Digital API

REST API untuk sistem Buku Tamu Digital Multi-Tenant, dibangun dengan **Laravel 11** dan diamankan menggunakan **Laravel Sanctum**.

---

## ⚙️ Tech Stack

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Laravel | 11.x | Framework backend |
| PHP | 8.2+ | Runtime |
| MySQL | 8.x | Database |
| Laravel Sanctum | 3.x | Token-based authentication |

---

## 📂 Struktur Direktori Penting

```
backend/
├── app/
│   ├── Http/Controllers/Api/
│   │   ├── AuthController.php        # Login & logout
│   │   ├── GuestbookController.php   # Daftar tamu, check-in, undo, edit
│   │   └── AdminController.php       # Kelola event & user (admin only)
│   └── Models/
│       ├── User.php                  # Model user (admin/receptionist)
│       ├── Event.php                 # Model event
│       ├── Guest.php                 # Model tamu undangan
│       └── Attendance.php            # Model kehadiran
├── database/
│   ├── migrations/                   # Skema tabel database
│   └── seeders/
│       └── DatabaseSeeder.php        # Data awal (event, admin, receptionist)
└── routes/
    └── api.php                       # Definisi semua endpoint API
```

---

## 🗄️ Skema Database

```
events
├── id
├── title          (nama event)
├── event_date     (tanggal pelaksanaan)
├── is_active      (boolean)
└── timestamps

users
├── id
├── name
├── email
├── password
├── role           ('admin' | 'receptionist')
├── event_id       (nullable, FK ke events)
└── timestamps

guests
├── id
├── event_id       (FK ke events, cascade delete)
├── name           (nama tamu)
├── category       ('VIP' | 'Regular' | 'Walk-in')
├── address        (nullable, alamat tamu)
├── is_unregistered (boolean, true jika tamu walk-in)
└── timestamps

attendances
├── id
├── guest_id       (FK ke guests)
├── user_id        (FK ke users, petugas yang memproses)
├── pax            (jumlah orang)
├── check_in_time  (timestamp konfirmasi)
└── timestamps
```

---

## 🔗 API Endpoints

Semua endpoint (kecuali login) memerlukan header:
```
Authorization: Bearer {token}
```

### 🔐 Authentication

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `POST` | `/api/login` | Login, mendapatkan Bearer token |
| `POST` | `/api/logout` | Logout, mencabut token |

**Request login:**
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response login:**
```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "Admin User",
    "role": "admin",
    "event_id": null
  }
}
```

---

### 📋 Guestbook (Receptionist)

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `GET` | `/api/guests` | Ambil semua tamu berdasarkan event petugas |
| `POST` | `/api/check-in` | Konfirmasi kehadiran tamu terdaftar |
| `PUT` | `/api/check-in/{guestId}` | Update jumlah orang kehadiran |
| `DELETE` | `/api/check-in/{guestId}` | Batalkan konfirmasi kehadiran |
| `POST` | `/api/manual-check-in` | Daftarkan & konfirmasi tamu walk-in |

**Request `POST /api/check-in`:**
```json
{
  "guest_id": 5,
  "pax": 2
}
```

**Request `POST /api/manual-check-in`:**
```json
{
  "name": "Budi Santoso",
  "address": "Jl. Merdeka No. 1, Bandung",
  "pax": 3
}
```

**Response `GET /api/guests`:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Siti Rahayu",
      "category": "VIP",
      "address": "Jl. Sudirman No. 10",
      "is_attended": true,
      "attendance": {
        "pax": 2,
        "check_in_time": "2026-12-01T09:30:00Z"
      }
    }
  ],
  "event": {
    "id": 1,
    "title": "Romeo & Juliet Wedding",
    "event_date": "2026-12-01"
  }
}
```

---

### 👑 Admin — Kelola Event

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `GET` | `/api/admin/events` | Daftar semua event |
| `POST` | `/api/admin/events` | Buat event baru |
| `PUT` | `/api/admin/events/{id}` | Update data event |
| `DELETE` | `/api/admin/events/{id}` | Hapus event |
| `POST` | `/api/admin/set-event` | Set event aktif untuk admin |

**Request `POST /api/admin/events`:**
```json
{
  "title": "Pernikahan Budi & Ani",
  "event_date": "2026-08-17",
  "is_active": true
}
```

---

### 👑 Admin — Kelola Petugas

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `GET` | `/api/admin/users` | Daftar semua akun petugas |
| `POST` | `/api/admin/users` | Buat akun petugas baru |
| `PUT` | `/api/admin/users/{id}` | Update data petugas |
| `DELETE` | `/api/admin/users/{id}` | Hapus akun petugas |

**Request `POST /api/admin/users`:**
```json
{
  "name": "Receptionist Baru",
  "email": "resep2@example.com",
  "password": "password123",
  "event_id": 2
}
```

---

## 🚀 Instalasi & Setup

### Prasyarat
- PHP 8.2+
- Composer
- MySQL 8.x

### Langkah-langkah

```bash
# 1. Install dependensi PHP
composer install

# 2. Salin dan konfigurasi environment
cp .env.example .env
php artisan key:generate
```

Edit `.env` sesuaikan dengan konfigurasi database Anda:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=buku_tamu_digital
DB_USERNAME=root
DB_PASSWORD=
```

```bash
# 3. Buat database MySQL bernama 'buku_tamu_digital'
# (melalui phpMyAdmin, MySQL Workbench, atau CLI)

# 4. Jalankan migrasi dan seeder
php artisan migrate:fresh --seed

# 5. Jalankan server
php artisan serve
```

API tersedia di: `http://localhost:8000`

---

## 🔑 Akun Default (Seeder)

| Role | Email | Password | Keterangan |
|------|-------|----------|------------|
| Admin | `admin@example.com` | `password` | Akses penuh semua event |
| Receptionist | `receptionist@example.com` | `password` | Terikat ke event "Romeo & Juliet Wedding" |
