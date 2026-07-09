// src/data/partNames.js
// ============================================================
// Mapping nama mesh dari Blender ke label yang ditampilkan
// Sesuaikan label dan warna sesuai kebutuhan
// ============================================================

export const partLabels = {
  // ============================================================
  // BANGUNAN UTAMA
  // ============================================================
  "01_Pondasi_Reaktor": {
    label: "01 - Pondasi Reaktor",
    color: "#6b7280", // abu-abu
  },
  "02_Bulk_Shielding_Luar": {
    label: "02 - Bulk Shielding Luar",
    color: "#9ca3af", // abu-abu terang
  },
  "03_Bulk_Shielding_Dalam": {
    label: "03 - Bulk Shielding Dalam",
    color: "#4b5563", // abu-abu gelap
  },
  "04_Tangki_Reaktor": {
    label: "04 - Tangki Reaktor",
    color: "#60a5fa", // biru
  },
  "05_Penyangga_Teras": {
    label: "05 - Penyangga Teras",
    color: "#a78bfa", // ungu
  },
  "06_Jembatan_Grafit": {
    label: "06 - Jembatan Grafit",
    color: "#9ca3af", // abu-abu
  },
  "07_Beam_Port": {
    label: "07 - Beam Port",
    color: "#f472b6", // pink
  },
  // "08" tidak ada (sesuai permintaan user)
  "09_Jembatan_Reaktor": {
    label: "09 - Jembatan Reaktor",
    color: "#8b5cf6", // ungu tua
  },
  "10_Aluminum_Luar_Dalam": {
    label: "10 - Aluminium Luar/Dalam",
    color: "#94a3b8", // abu-abu metalik
  },
  "11_Reflektor_Grafit": {
    label: "11 - Reflektor Grafit",
    color: "#9ca3af", // abu-abu
  },
  "12_Lazy_Susan": {
    label: "12 - Lazy Susan",
    color: "#f59e0b", // kuning
  },
  "13_Plat_Bawah_Atas": {
    label: "13 - Plat Bawah/Atas",
    color: "#64748b", // abu-abu tua
  },
  "14_Pengontrol_Rak_Lazy_Susan": {
    label: "14 - Pengontrol Lazy Susan",
    color: "#fcd34d", // kuning terang
  },

  // ============================================================
  // BAHAN BAKAR & TERAS
  // ============================================================
  "15_Elemen_Bahan_Bakar": {
    label: "15 - Elemen Bahan Bakar",
    color: "#fbbf24", // kuning emas
  },
  "16_Sumber_Neutron_AmBe": {
    label: "16 - Sumber Neutron Am-Be",
    color: "#f472b6", // pink
  },

  // ============================================================
  // BATANG PENGAMAN (SAFE ROD)
  // ============================================================
  "17_Pengarah_Batang_Pengaman": {
    label: "17 - Pengarah Safe Rod",
    color: "#fca5a5", // merah muda
  },
  "18_Batang_Pengaman": {
    label: "18 - Batang Pengaman (Safe)",
    color: "#ef4444", // MERAH
  },
  "19_Sambungan_Batang_Pengaman": {
    label: "19 - Sambungan Safe Rod",
    color: "#dc2626", // merah tua
  },
  "20_Rel_Batang_Pengaman": {
    label: "20 - Rel Safe Rod",
    color: "#b91c1c", // merah lebih tua
  },
  "21_Gear_Batang_Pengaman": {
    label: "21 - Gear Safe Rod",
    color: "#991b1b", // merah gelap
  },
  "22_Motor_Penggerak_Batang_Pengaman": {
    label: "22 - Motor Safe Rod",
    color: "#7f1d1d", // merah sangat gelap
  },
  "23_Rumah_Batang_Pengaman": {
    label: "23 - Rumah Safe Rod",
    color: "#450a0a", // merah kehitaman
  },

  // ============================================================
  // BATANG PENGATUR (REGULATING ROD)
  // ============================================================
  "24_Pengarah_Batang_Pengatur": {
    label: "24 - Pengarah Reg Rod",
    color: "#67e8f9", // cyan muda
  },
  "25_Batang_Pengatur": {
    label: "25 - Batang Pengatur (Reg)",
    color: "#22d3ee", // CYAN
  },
  "26_Sambungan_Batang_Pengatur": {
    label: "26 - Sambungan Reg Rod",
    color: "#06b6d4", // cyan tua
  },
  "27_Rel_Batang_Pengatur": {
    label: "27 - Rel Reg Rod",
    color: "#0891b2", // biru laut
  },
  "28_Gear_Batang_Pengatur": {
    label: "28 - Gear Reg Rod",
    color: "#0e7490", // biru laut tua
  },
  "29_Motor_Penggerak_Batang_Pengatur": {
    label: "29 - Motor Reg Rod",
    color: "#155e75", // biru laut gelap
  },
  "30_Rumah_Batang_Pengatur": {
    label: "30 - Rumah Reg Rod",
    color: "#164e63", // biru laut sangat gelap
  },

  // ============================================================
  // BATANG KOMPENSASI (SHIM ROD)
  // ============================================================
  "31_Pengarah_Batang_Kompensasi": {
    label: "31 - Pengarah Shim Rod",
    color: "#fcd34d", // kuning muda
  },
  "32_Batang_Kompensasi": {
    label: "32 - Batang Kompensasi (Shim)",
    color: "#f59e0b", // KUNING
  },
  "33_Sambungan_Batang_Kompensasi": {
    label: "33 - Sambungan Shim Rod",
    color: "#d97706", // kuning tua
  },
  "34_Rel_Batang_Kompensasi": {
    label: "34 - Rel Shim Rod",
    color: "#b45309", // coklat
  },
  "35_Gear_Batang_Kompensasi": {
    label: "35 - Gear Shim Rod",
    color: "#92400e", // coklat tua
  },
  "36_Motor_Penggerak_Batang_Kompensasi": {
    label: "36 - Motor Shim Rod",
    color: "#78350f", // coklat gelap
  },
  "37_Rumah_Batang_Kompensasi": {
    label: "37 - Rumah Shim Rod",
    color: "#451a03", // coklat kehitaman
  },

  // ============================================================
  // LAINNYA
  // ============================================================
  "38_Iradiasi_Pusat": {
    label: "38 - Iradiasi Pusat",
    color: "#34d399", // hijau zamrud
  },
  "39_Air_Moderator": {
    label: "39 - Air Moderator",
    color: "#3b82f6", // BIRU
  },
};