# ⚛️ SIRAKA – Simulator Reaktor Kartini

**SIRAKA** (Simulator Reaktor Kartini) adalah aplikasi web interaktif untuk mempelajari, memvisualisasikan, dan mensimulasikan operasi **Reaktor Kartini** – reaktor riset TRIGA Mark II yang dikelola oleh BRIN Yogyakarta.

Aplikasi ini menggabungkan simulasi fisika reaktor, visualisasi 3D, galeri sejarah, dan tur interaktif dalam satu platform edukatif.

🔗 **Akses langsung:** [siraka-polteknuklir.site](https://siraka-polteknuklir.site)

---

## 📌 Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🎮 **Simulator Interaktif** | Kontrol 3 batang kendali (Safe, Shim, Regulate) secara real-time menggunakan keyboard (SPACE + Q/W/E/A/S/D). Amati perubahan daya, reaktivitas, dan status reaktor. |
| 📊 **Grafik Daya & Reaktivitas** | Grafik daya (Watt) terhadap waktu dan nilai reaktivitas (ρ) yang diperbarui setiap 50 ms. |
| 🧊 **Tampilan 3D Reaktor** | Visualisasi 3D dari Core Reaktor dan Penampang Reaktor (cross-section) menggunakan Three.js. |
| 📖 **Tur Sejarah** | Linimasa perjalanan Reaktor Kartini dari konstruksi hingga operasi saat ini, dilengkapi foto-foto arsip. |
| 🖼️ **Galeri Foto** | Koleksi foto komponen dan fasilitas reaktor, dengan navigasi geser yang halus. |
| 🌐 **Dukungan Multi-Bahasa** | Tersedia dalam Bahasa Indonesia dan Inggris (siap dikembangkan). |

---

## 🛠️ Teknologi yang Digunakan

- **React 18** – UI library
- **Vite** – Build tool super cepat
- **Tailwind CSS** – Styling utility-first
- **Three.js / @react-three/fiber** – Rendering 3D
- **Chart.js** – Grafik interaktif
- **React Router DOM** – Navigasi SPA
- **GitHub Pages (opsional)** – Hosting statis

---

## 🚀 Cara Menjalankan di Lokal

### Prasyarat
- Node.js (v20+)
- npm atau yarn

### Langkah-langkah

```bash
# Clone repositori
git clone https://github.com/huseinkrna/siraka-polteknuklir.git
cd siraka-polteknuklir

# Install dependencies
npm install

# Jalankan development server
npm run dev
Akses http://localhost:5173 di browser Anda.

Build untuk produksi
bash
npm run build
Hasil build ada di folder dist/ dan siap di-deploy ke layanan hosting statis (Vercel, Netlify, dll.).

📁 Struktur Folder Penting
text
src/
├── components/         # Komponen reusable (3D, grafik, timeline, dll.)
├── data/               # Data statis (history, galeri, part names, dll.)
├── hooks/              # Custom hooks (useReactorPhysics)
├── pages/              # Halaman utama (Home, Simulator, Model3D, Gallery, HistoryTour)
├── context/            # Context API (Language, dll.)
├── assets/             # Gambar & aset statis
public/
├── assets/             # Gambar yang diakses publik (logo, foto, model 3D, dll.)
├── models/             # File GLB untuk 3D
└── ...
🧪 Simulator – Panduan Singkat
Tahan SPACE + Q → Naikkan Safe Rod (batang pengaman)

Tahan SPACE + A → Turunkan Safe Rod

Tahan SPACE + W → Naikkan Shim Rod (kompensasi)

Tahan SPACE + S → Turunkan Shim Rod

Tahan SPACE + E → Naikkan Regulating Rod (pengatur)

Tahan SPACE + D → Turunkan Regulating Rod

⚠️ Jika daya menembus 110 kW, sistem akan melakukan SCRAM otomatis dan semua batang akan jatuh ke posisi 0% setelah jeda 1,5 detik.

📷 Cuplikan Layar
Tambahkan screenshot di sini jika diperlukan.

🤝 Kontribusi
Kontribusi sangat terbuka! Silakan:

Fork repositori

Buat branch fitur (git checkout -b fitur-keren)

Commit perubahan (git commit -m "Tambahkan fitur XYZ")

Push ke branch (git push origin fitur-keren)

Buat Pull Request

📄 Lisensi
Proyek ini dilisensikan di bawah MIT License – lihat file LICENSE untuk detail.

🙏 Ucapan Terima Kasih
Badan Riset dan Inovasi Nasional (BRIN) – atas izin dan dukungan data Reaktor Kartini.

Politeknik Teknologi Nuklir Indonesia (Poltek Nuklir) – sebagai mitra edukasi.

Tim Pengelola Reaktor Kartini – atas bimbingan teknis.

Dibangun oleh tim SIRAKA
GitHub Repository

### 🧭 Instruksi Penggunaan

1.  Buat file baru bernama `README.md` di root folder proyek Anda (sama level dengan `package.json`).
2.  Salin semua konten di atas ke dalam file tersebut.
3.  Simpan.
4.  Jika ingin menambahkan screenshot, buat folder `screenshots/` dan tambahkan gambar, lalu sesuaikan path di bagian "Cuplikan Layar".
5.  Commit dan push ke GitHub:

```bash
git add README.md
git commit -m "Add README.md"
git push origin main

🔗 Tautan Live
Domain: siraka-polteknuklir.site
Repo GitHub: github.com/huseinkrna/siraka-polteknuklir