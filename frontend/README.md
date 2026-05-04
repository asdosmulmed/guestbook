# 🎨 Frontend — Buku Tamu Digital SPA

Single Page Application (SPA) untuk sistem Buku Tamu Digital, dibangun dengan **React.js**, **Vite**, dan **Tailwind CSS v4**. Dirancang dengan tampilan profesional dan responsif yang optimal digunakan di tablet maupun laptop oleh petugas resepsionis.

---

## ⚙️ Tech Stack

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| React.js | 18.x | UI Framework |
| Vite | 6.x | Build tool & dev server |
| Tailwind CSS | 4.x | Utility-first styling |
| React Router DOM | 6.x | Client-side routing |
| Axios | 1.x | HTTP client untuk komunikasi API |
| Lucide React | - | Ikon SVG |
| SweetAlert2 | - | Dialog konfirmasi destruktif |

---

## 📂 Struktur Direktori

```
frontend/src/
├── components/
│   ├── CheckInModal.jsx        # Modal konfirmasi kehadiran tamu terdaftar
│   ├── EditCheckInModal.jsx    # Modal edit jumlah orang / batalkan kehadiran
│   ├── ManualCheckInModal.jsx  # Modal daftar & hadir tamu walk-in
│   ├── AdminEventModal.jsx     # Modal form tambah/edit event (admin)
│   ├── AdminUserModal.jsx      # Modal form tambah/edit petugas (admin)
│   └── Toast.jsx               # Notifikasi sukses sementara
├── layouts/
│   └── DashboardLayout.jsx     # Layout utama: sidebar navigasi + main content
├── pages/
│   ├── Login.jsx               # Halaman login
│   ├── Home.jsx                # Dashboard beranda (statistik kehadiran)
│   ├── GuestList.jsx           # Halaman daftar tamu (tabel + filter + pencarian)
│   ├── AdminEvents.jsx         # Halaman pilih event (khusus admin)
│   └── AdminManage.jsx         # Halaman kelola event & petugas (khusus admin)
├── services/
│   └── api.js                  # Instance Axios dengan base URL & interceptor token
├── index.css                   # Design system: variabel warna, komponen global
└── App.jsx                     # Konfigurasi routing aplikasi
```

---

## 🗺️ Alur Aplikasi & Routing

```
/login
  └── Login berhasil → redirect berdasarkan role:
        ├── Admin (tanpa event)  → /admin/events    (pilih event)
        └── Receptionist         → /dashboard/home

/admin/events
  └── Admin memilih event yang ingin dikelola → redirect ke /dashboard/home

/dashboard/                      (dilindungi, butuh autentikasi)
  ├── home                       → Statistik: Total Tamu, Hadir, Belum Hadir
  ├── guests                     → Daftar tamu semua kategori
  ├── guests?category=VIP        → Filter hanya tamu VIP
  ├── guests?category=Regular    → Filter hanya tamu Regular
  └── admin/manage               → Kelola Event & Petugas (admin only)
```

---

## 🧩 Penjelasan Komponen

### `DashboardLayout.jsx`
Layout pembungkus dashboard yang mengelola:
- **Sidebar navigasi** dengan dropdown (Daftar Tamu → VIP/Regular)
- **Collapsible sidebar** di desktop (bisa diperkecil jadi icon-only)
- **Mobile responsive** dengan tombol toggle hamburger
- **Data fetching global** (`guests`, `currentEvent`) yang dibagikan ke halaman anak via `useOutletContext`

### `GuestList.jsx`
Halaman utama operasional petugas:
- **Pencarian real-time** berdasarkan nama tanpa request API ulang
- **Filter kategori** via URL query params (`?category=VIP`)
- **Tabel** dengan kolom: Nama, Kategori, Alamat, Jumlah Orang, Aksi
- Tombol **"Hadir"** untuk membuka modal konfirmasi
- Tombol **"Edit"** untuk mengubah jumlah orang atau membatalkan kehadiran
- Tombol **"Tamu Manual"** untuk mendaftarkan walk-in guest

### `Home.jsx`
Dashboard beranda yang menampilkan 3 kartu statistik:
- Total tamu undangan
- Jumlah yang sudah hadir
- Jumlah yang belum hadir

Data diambil dari `guests` yang sudah di-fetch oleh `DashboardLayout`.

### `AdminManage.jsx`
Panel administrasi dengan dua tab:
- **Kelola Event**: Tambah, edit, hapus event. Status aktif/nonaktif.
- **Kelola Petugas**: Tambah, edit, hapus akun receptionist. Assign ke event tertentu.

---

## 🎨 Design System

File `src/index.css` mendefinisikan token desain global:

```css
@theme {
  --color-midnight: #F3F4F6;  /* Background abu-abu terang */
  --color-champagne: #2563EB; /* Aksen biru profesional */
  --color-ivory: #111827;     /* Teks gelap */
}
```

**Kelas komponen global:**

| Kelas | Fungsi |
|-------|--------|
| `.glass-panel` | Kartu putih dengan border tipis dan shadow halus |
| `.glass-input` | Input field standar dengan fokus biru |
| `.btn-primary` | Tombol utama biru |
| `.btn-outline` | Tombol outline abu-abu |

---

## 🔒 Autentikasi & Keamanan

- Token Sanctum disimpan di `localStorage` setelah login berhasil
- Instance Axios (`src/services/api.js`) secara otomatis menyisipkan header `Authorization: Bearer {token}` di setiap request
- Jika API mengembalikan status `401`, pengguna otomatis diarahkan ke halaman `/login`
- Halaman dashboard dilindungi oleh `ProtectedRoute` yang memeriksa keberadaan token

---

## 🚀 Instalasi & Setup

### Prasyarat
- Node.js 18+
- npm

### Langkah-langkah

```bash
# 1. Masuk ke direktori frontend
cd frontend

# 2. Install semua dependensi
npm install

# 3. Pastikan backend Laravel sudah berjalan di http://localhost:8000
#    (lihat README backend)

# 4. Jalankan development server
npm run dev
```

Aplikasi tersedia di: `http://localhost:5173`

### Build Produksi

```bash
npm run build
```

File hasil build akan tersimpan di direktori `dist/` dan siap dideploy ke web server.

---

## 🔑 Akun Default untuk Testing

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `password` |
| Receptionist | `receptionist@example.com` | `password` |
