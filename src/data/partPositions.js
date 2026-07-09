// src/data/partPositions.js
// ============================================================
// 🟢 DI SINI KAMU BISA UBAH KOORDINAT LABEL
// ============================================================
// Format: "NamaMesh_DiBlender": [x, y, z]
// Untuk mendapatkan koordinat yang pas, gunakan inspect element
// atau console.log di browser.
// ============================================================

export const partPositions = {
  // === STRUKTUR UTAMA ===
  "01_Pondasi_Reaktor": [0, 0, 0],
  "02_Bulk_Shielding_Luar": [0, 0, 0],
  "03_Bulk_Shielding_Dalam": [0, 0, 0],
  "04_Tangki_Reaktor": [0, 0, 0],
  "05_Penyangga_Teras": [0, 0, 0],
  "06_Jembatan_Grafit": [0, 0, 0],
  "07_Beam_Port": [0, 0, 0],
  "09_Jembatan_Reaktor": [0, 0, 0],
  "10_Aluminum_Luar_Dalam": [0, 0, 0],
  "11_Reflektor_Grafit": [0, 0, 0],
  "12_Lazy_Susan": [0, 0, 0],
  "13_Plat_Bawah_Atas": [0, 0, 0],
  "14_Pengontrol_Rak_Lazy_Susan": [0, 0, 0],

  // === BAHAN BAKAR & TERAS ===
  "15_Elemen_Bahan_Bakar": [0, 0, 0],
  "16_Sumber_Neutron_AmBe": [0, 0, 0],

  // === BATANG PENGAMAN (SAFE) ===
  "17_Pengarah_Batang_Pengaman": [0, 0, 0],
  "18_Batang_Pengaman": [0, 0, 0],
  "19_Sambungan_Batang_Pengaman": [0, 0, 0],
  "20_Rel_Batang_Pengaman": [0, 0, 0],
  "21_Gear_Batang_Pengaman": [0, 0, 0],
  "22_Motor_Penggerak_Batang_Pengaman": [0, 0, 0],
  "23_Rumah_Batang_Pengaman": [0, 0, 0],

  // === BATANG PENGATUR (REGULATING) ===
  "24_Pengarah_Batang_Pengatur": [0, 0, 0],
  "25_Batang_Pengatur": [0, 0, 0],
  "26_Sambungan_Batang_Pengatur": [0, 0, 0],
  "27_Rel_Batang_Pengatur": [0, 0, 0],
  "28_Gear_Batang_Pengatur": [0, 0, 0],
  "29_Motor_Penggerak_Batang_Pengatur": [0, 0, 0],
  "30_Rumah_Batang_Pengatur": [0, 0, 0],

  // === BATANG KOMPENSASI (SHIM) ===
  "31_Pengarah_Batang_Kompensasi": [0, 0, 0],
  "32_Batang_Kompensasi": [0, 0, 0],
  "33_Sambungan_Batang_Kompensasi": [0, 0, 0],
  "34_Rel_Batang_Kompensasi": [0, 0, 0],
  "35_Gear_Batang_Kompensasi": [0, 0, 0],
  "36_Motor_Penggerak_Batang_Kompensasi": [0, 0, 0],
  "37_Rumah_Batang_Kompensasi": [0, 0, 0],

  // === LAINNYA ===
  "38_Iradiasi_Pusat": [0, 0, 0],
  "39_Air_Moderator": [0, 0, 0],
};