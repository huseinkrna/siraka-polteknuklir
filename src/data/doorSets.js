// src/data/doorSets.js
// Pintu yang bisa dibuka/ditutup dengan tombol E pada mode jalan (model "Sudah Disatukan").
// Kunci pintu = "NamaNodeDiGLB#nomorUrutMesh". Pintu lain (daun pintu yang di model sudah
// terbuka/miring, mis. sisi "Kanan" pintu gedung reaktor dan pintu ruang kontrol) tetap padat.
export const DOOR_GROUPS = [
  'Pintu Masuk 1 Cadangan Gedung Reaktor Kiri',
  'Pintu Masuk Gedung Reaktor Kiri',
  'Pintu Masuk 3 Cadangan Gedung Reaktor Kiri',
  'Pintu Masuk Gedung Transit Kanan',
  'Pintu Masuk Gedung Transit Kiri',
  'Pintu Keluar Darurat Ruang Kendali Utama',
];

export const DOOR_SETS = [
  { id: 'reaktor1', label: 'Pintu masuk gedung reaktor (lantai 1)', type: 'swing', keys: ['Pintu Masuk 1 Cadangan Gedung Reaktor Kiri#0'] },
  { id: 'reaktor2', label: 'Pintu masuk gedung reaktor (lantai 2)', type: 'swing', keys: ['Pintu Masuk Gedung Reaktor Kiri#0'] },
  { id: 'reaktor3', label: 'Pintu masuk gedung reaktor (lantai 3)', type: 'swing', keys: ['Pintu Masuk 3 Cadangan Gedung Reaktor Kiri#0'] },
  { id: 'transitA', label: 'Pintu kaca gedung transit (kanan)', type: 'swing', keys: ['Pintu Masuk Gedung Transit Kanan#0'] },
  { id: 'transitB', label: 'Pintu kaca gedung transit (kiri)', type: 'swing', keys: ['Pintu Masuk Gedung Transit Kiri#0'] },
  { id: 'darurat', label: 'Pintu keluar darurat ruang kendali utama', type: 'swing', keys: ['Pintu Keluar Darurat Ruang Kendali Utama#0'] },
];
