// src/data/partDescriptions.js
// ============================================================
// Deskripsi singkat tiap bagian untuk panel info di tampilan 3D interaktif.
// Kunci = nama mesh di Blender TANPA akhiran ".001" (sama seperti partNames.js).
// Bagian tanpa deskripsi tetap bisa diklik; panel hanya menampilkan namanya.
// Teks di bawah diambil dari data yang sudah ada di Model3D.jsx / README.
// ============================================================

export const partDescriptions = {
  "02_Bulk_Shielding_Luar":
    "Kolam eksperimen perisai di sisi barat reaktor, digunakan untuk eksperimen perisai radiasi dan penyimpanan bahan bakar bekas.",
  "04_Tangki_Reaktor":
    "Bejana aluminium berisi air demineralisasi yang berfungsi sebagai moderator, pendingin konveksi alam, dan perisai radiasi vertikal.",
  "05_Penyangga_Teras":
    "Struktur penopang teras dan reflektor di dasar kolam, terbuat dari aluminium.",
  "07_Beam_Port":
    "Tabung berkas neutron yang menembus perisai beton dan reflektor, digunakan untuk eksperimen neutron radiografi, BNCT, dan reaktor subkritik.",
  "10_Aluminum_Luar_Dalam":
    "Lapisan aluminium yang melapisi reflektor dan dinding kolam reaktor, melindungi dari korosi dan memberikan perisai tambahan.",
  "11_Reflektor_Grafit":
    "Silinder grafit yang mengelilingi teras. Berfungsi memantulkan neutron kembali ke teras untuk meningkatkan fluks dan efisiensi reaksi fisi.",
  "12_Lazy_Susan":
    "Fasilitas iradiasi putar di bagian atas reflektor, memiliki lubang tempat sampel yang dapat diputar untuk iradiasi seragam.",
  "15_Elemen_Bahan_Bakar":
    "Elemen bahan bakar TRIGA berisi paduan U-ZrH dengan kelongsong SS304, tersusun dalam ring-ring konsentris di teras.",
  "18_Batang_Pengaman":
    "Safe Rod, salah satu batang kendali. Di Simulator dikendalikan dengan SPACE + Q (naik) dan SPACE + A (turun).",
  "25_Batang_Pengatur":
    "Regulating Rod, salah satu batang kendali. Di Simulator dikendalikan dengan SPACE + E (naik) dan SPACE + D (turun).",
  "32_Batang_Kompensasi":
    "Shim Rod, salah satu batang kendali. Di Simulator dikendalikan dengan SPACE + W (naik) dan SPACE + S (turun).",
};
