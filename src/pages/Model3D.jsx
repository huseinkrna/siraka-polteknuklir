// src/pages/Model3D.jsx
import { useState, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Core3D from '../components/simulator/Core3D';
import CrossSection3D from '../components/simulator/CrossSection3D';

// ============================================================
// DATA BAGIAN REAKTOR
// ============================================================

const coreParts = [
  {
    name: 'Tempat Bahan Bakar Reaktor',
    img: '/assets/images/bagian_reaktor/Core_Bahan Bakar Reaktor.png',
    desc: 'Bahan bakar TRIGA tipe 104/204 berisi paduan U-ZrH₁.₇ dengan pengayaan U-235 20%. Teras diisi 71 elemen bakar (69 tipe 104, 2 tipe 204) dengan kelongsong SS304, didistribusikan dalam 5 ring konsentris (B–F).'
  },
  {
    name: 'Lazy Susan (Rak Putar)',
    img: '/assets/images/bagian_reaktor/Core_Lazy Susan.png',
    desc: 'Fasilitas iradiasi putar di bagian atas reflektor, terdiri dari 40 lubang tempat sampel (diameter 31,75 mm, kedalaman 27,4 cm) yang dapat diputar untuk iradiasi seragam.'
  },
  {
    name: 'Reflektor Grafit',
    img: '/assets/images/bagian_reaktor/Core_Reflektor Grafit.png',
    desc: 'Silinder grafit setebal 30 cm, tinggi 55,9 cm, mengelilingi teras. Berfungsi memantulkan neutron kembali ke teras untuk meningkatkan fluks dan efisiensi reaksi fisi.'
  },
  {
    name: 'Shielding Aluminium',
    img: '/assets/images/bagian_reaktor/Core_Shielding Alumunium.png',
    desc: 'Lapisan aluminium (grade Al 1050) setebal 6 mm yang melapisi reflektor dan dinding kolam reaktor, melindungi dari korosi dan memberikan perisai tambahan.'
  },
  {
    name: 'Penampang Keseluruhan Core',
    img: '/assets/images/bagian_reaktor/Core_Penampang Keseluruhan.png',
    desc: 'Potongan melintang teras yang menunjukkan susunan 90 lubang kisi (grid plate) dengan 5 ring konsentris, posisi batang kendali (C5, C9, E1), dan central thimble.'
  }
];

const crossParts = [
  {
    name: 'Penyangga Teras Reaktor',
    img: '/assets/images/bagian_reaktor/Reaktor_Penyangga Teras Reaktor.png',
    desc: 'Struktur penopang teras dan reflektor di dasar kolam, terbuat dari aluminium, mampu menahan beban teras (stress maks. 17,65 MPa) dan telah teruji terhadap fluence neutron hingga 10¹⁹ n/cm².'
  },
  {
    name: 'Beam Port (Tabung Berkas Neutron)',
    img: '/assets/images/bagian_reaktor/Reaktor_Port Beam.png',
    desc: 'Empat tabung berkas neutron (3 radial, 1 tangensial) dengan diameter dalam 19,5 cm, menembus perisai beton dan reflektor, digunakan untuk eksperimen neutron radiografi, BNCT, dan reaktor subkritik.'
  },
  {
    name: 'Jembatan Grafit / Bridge',
    img: '/assets/images/bagian_reaktor/Reaktor_Jembatan Grafit.png',
    desc: 'Struktur besi di atas kolam reaktor (panjang 251 cm, lebar 55 cm) sebagai platform untuk motor penggerak batang kendali, sensor suhu, dan akses loading/unloading bahan bakar.'
  },
  {
    name: 'Tangki Reaktor (Kolam)',
    img: '/assets/images/bagian_reaktor/Reaktor_Tangki Reaktor.png',
    desc: 'Bejana aluminium (diameter 198 cm, tinggi 655 cm) berisi air demineralisasi setinggi 4,9 m di atas teras, berfungsi sebagai moderator, pendingin konveksi alam, dan perisai radiasi vertikal.'
  },
  {
    name: 'Bulk Shielding',
    img: '/assets/images/bagian_reaktor/Reaktor_Bulk Shielding.png',
    desc: 'Kolam eksperimen perisai di sisi barat reaktor, berukuran 2,65 m x 2,40 m x 3,80 m, digunakan untuk eksperimen perisai radiasi dan penyimpanan bahan bakar bekas (3 tipe 104).'
  },
  {
    name: 'Reaktor Secara Keseluruhan',
    img: '/assets/images/bagian_reaktor/Reaktor_Penampang Keseluruhan.png',
    desc: 'Tampilan utuh Reaktor Kartini (TRIGA Mark II) yang mencakup kolam, perisai beton barit, teras, reflektor, beam port, thermal column, dan sistem pendingin.'
  }
];

// ============================================================
// KOMPONEN UTAMA
// ============================================================

export default function Model3D() {
  const navigate = useNavigate();
  const [view, setView] = useState('core');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentCoreIndex, setCurrentCoreIndex] = useState(0);
  const [currentCrossIndex, setCurrentCrossIndex] = useState(0);

  const currentParts = view === 'core' ? coreParts : crossParts;
  const currentIndex = view === 'core' ? currentCoreIndex : currentCrossIndex;
  const setCurrentIndex = view === 'core' ? setCurrentCoreIndex : setCurrentCrossIndex;

  const total = currentParts.length;
  const part = currentParts[currentIndex];

  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  const handleNext = () => setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));

  return (
    <div className="h-screen w-full bg-black flex flex-col">
      {/* Header */}
      <div className="h-12 bg-gray-900 border-b border-gray-700 flex items-center px-4 justify-between flex-shrink-0">
        <h1 className="text-lg font-bold text-purple-400">Tampilan 3D Reaktor</h1>
        <button onClick={() => navigate('/')} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-xs font-semibold">
          Beranda
        </button>
      </div>

      {/* Pilihan tampilan */}
      <div className="flex justify-center gap-4 p-3 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <button
          onClick={() => { setView('core'); setSidebarOpen(true); }}
          className={`px-6 py-2 rounded font-bold transition ${view === 'core' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          Core 3D
        </button>
        <button
          onClick={() => { setView('cross'); setSidebarOpen(true); }}
          className={`px-6 py-2 rounded font-bold transition ${view === 'cross' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          Penampang 3D
        </button>
      </div>

      {/* Area utama: 3D + Sidebar */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Container 3D – selalu full width */}
        <div className="flex-1 h-full w-full relative min-h-0">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center text-white bg-black">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                Memuat model 3D...
              </div>
            </div>
          }>
            {view === 'core' ? <Core3D /> : <CrossSection3D />}
          </Suspense>
        </div>

        {/* Sidebar – menggunakan transform translateX untuk animasi */}
        <div
          className={`absolute right-0 top-0 h-full bg-gray-900 border-l border-gray-700 shadow-2xl transition-transform duration-300 ease-in-out z-10 w-80 ${
            sidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col p-4 overflow-y-auto">
            <h2 className="text-white font-bold text-lg mb-3 border-b border-gray-600 pb-2">
              {view === 'core' ? '⚛️ Core 3D' : '📐 Penampang 3D'} – Bagian
            </h2>

            {/* Daftar tombol bagian */}
            <div className="flex flex-wrap gap-1 mb-3">
              {currentParts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`px-2 py-1 text-xs rounded transition ${
                    idx === currentIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Gambar bagian */}
            <div className="relative flex-1 bg-black rounded border border-gray-600 overflow-hidden min-h-[200px]">
              <img
                src={part.img}
                alt={part.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/images/placeholder.png';
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-sm font-bold p-2 text-center">
                {part.name}
              </div>
            </div>

            {/* Deskripsi */}
            <div className="mt-3 text-gray-300 text-sm leading-relaxed overflow-y-auto max-h-32">
              {part.desc}
            </div>

            {/* Navigasi */}
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-700">
              <button
                onClick={handlePrev}
                className="px-4 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-bold transition"
              >
                ◀ Sebelum
              </button>
              <span className="text-gray-400 text-xs">
                {currentIndex + 1} / {total}
              </span>
              <button
                onClick={handleNext}
                className="px-4 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-bold transition"
              >
                Sesudah ▶
              </button>
            </div>
          </div>
        </div>

        {/* Tombol toggle – selalu di sisi kanan layar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`absolute top-1/2 transform -translate-y-1/2 z-20 bg-gray-800 hover:bg-gray-700 text-white p-1 rounded-l-md border border-gray-600 border-r-0 transition-all duration-300 ${
            sidebarOpen ? 'right-[320px]' : 'right-0'
          }`}
        >
          {sidebarOpen ? '▸' : '◂'}
        </button>
      </div>
    </div>
  );
}