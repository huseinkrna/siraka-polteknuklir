// src/pages/Home.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HelpContent from '../components/help/HelpContent';

export default function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('siraka_nickname') || sessionStorage.getItem('siraka_nickname') || '';
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const mulaiSimulasi = () => {
    const nama = username.trim();
    if (nama.length < 4) {
      setErrorMessage('Nickname minimal 4 karakter!');
      alert('Nickname minimal 4 karakter!');
      return;
    }
    setErrorMessage('');
    localStorage.setItem('siraka_nickname', nama);
    sessionStorage.setItem('siraka_nickname', nama);
    navigate('/simulator', {
      state: { username: nama, nickname: nama }
    });
  };

  return (
    <div className="h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#08091C] font-sans select-none">
      {/* LATAR BELAKANG HALAMAN DINAMIS & ATMOSFERIK */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-30 filter blur-lg scale-105"
        style={{ backgroundImage: `url('/assets/figma/Group-1.svg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#08091C] via-transparent to-[#08091C]/70 pointer-events-none" />

      {/* QUICK NAV: LOGO DI KIRI ATAS */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-3">
        <img
          src="/assets/images/brin.png"
          alt="BRIN"
          className="h-8 md:h-10 w-auto object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]"
        />
        <img
          src="/assets/images/poltek.png"
          alt="Poltek Nuklir"
          className="h-8 md:h-10 w-auto object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]"
        />
      </div>

      {/* QUICK NAV: MENU NAVIGASI TAMBAHAN DI KANAN ATAS */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => setShowHelp(true)}
          className="px-3.5 py-1.5 rounded-full bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 text-xs font-semibold tracking-wider uppercase transition shadow-lg hover:border-cyan-400 cursor-pointer backdrop-blur-md"
        >
          Bantuan
        </button>
        <button
          onClick={() => navigate('/gallery')}
          className="px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white/90 text-xs font-semibold tracking-wider uppercase transition shadow-lg hover:border-white/40 cursor-pointer"
        >
          Galeri
        </button>
        <button
          onClick={() => navigate('/model3d')}
          className="px-3.5 py-1.5 rounded-full bg-purple-950/80 hover:bg-purple-900 backdrop-blur-md border border-purple-500/50 text-purple-200 text-xs font-semibold tracking-wider uppercase transition shadow-lg hover:border-purple-400 cursor-pointer"
        >
          Model 3D
        </button>
      </div>

      {/* ============================================================
          CONTAINER UTAMA: DESAIN GROUP-1.SVG LANGSUNG SECARA PENUH & RESPONSIF
          ============================================================ */}
      <div
        className="relative flex items-center justify-center z-10 select-none p-0 flex-shrink-0"
        style={{
          width: 'min(100vw, calc(100vh * (2162 / 972)))',
          height: 'min(100vh, calc(100vw * (972 / 2162)))',
          aspectRatio: '2162 / 972'
        }}
      >
        {/* Gambar Vektor Asli Group-1.svg dari Figma */}
        <img
          src="/assets/figma/Group-1.svg"
          alt="SIRAKA - Simulator Reaktor Kartini"
          className="w-full h-full block pointer-events-none select-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
        />

        {/* OVERLAY INPUT NICKNAME */}
        <div
          style={{
            left: '35.48%',
            top: '54.12%',
            width: '29.09%',
            height: '8.33%'
          }}
          className="absolute z-20 flex items-center pl-[5%] pr-3"
        >
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errorMessage && e.target.value.trim().length >= 4) {
                setErrorMessage('');
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') mulaiSimulasi();
            }}
            placeholder="Masukkan nickname..."
            maxLength={20}
            className="w-full h-full bg-transparent outline-none text-gray-900 font-bold text-[clamp(11px,1.4vw,22px)] placeholder:text-gray-500"
          />
        </div>

        {/* PESAN VALIDASI NICKNAME MINIMAL 4 KARAKTER */}
        {errorMessage && (
          <div
            style={{
              left: '35.48%',
              top: '63.5%',
              width: '29.09%'
            }}
            className="absolute z-20 text-center text-red-400 font-bold text-xs sm:text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] animate-pulse pointer-events-none"
          >
            {errorMessage}
          </div>
        )}

        {/* OVERLAY TOMBOL 1 (KIRI): BANTUAN (?) */}
        <button
          onClick={() => setShowHelp(true)}
          title="Buka Panduan & Bantuan"
          style={{
            left: `${(814 / 2162) * 100}%`,
            top: `${(691 / 972) * 100}%`,
            width: `${(105 / 2162) * 100}%`,
            height: `${(95 / 972) * 100}%`,
            borderRadius: '23.8% / 26.3%'
          }}
          className="absolute z-20 hover:ring-[3.5px] hover:ring-inset hover:ring-cyan-400 hover:bg-cyan-400/10 active:scale-95 transition-all duration-150 cursor-pointer"
        />

        {/* OVERLAY TOMBOL 2 (TENGAH): MULAI SIMULASI (▶) */}
        <button
          onClick={mulaiSimulasi}
          title="Mulai Simulator Reaktor Kartini"
          style={{
            left: `${(1028 / 2162) * 100}%`,
            top: `${(691 / 972) * 100}%`,
            width: `${(105 / 2162) * 100}%`,
            height: `${(95 / 972) * 100}%`,
            borderRadius: '23.8% / 26.3%'
          }}
          className="absolute z-20 hover:ring-[3.5px] hover:ring-inset hover:ring-cyan-400 hover:bg-cyan-400/10 active:scale-95 transition-all duration-150 cursor-pointer"
        />

        {/* OVERLAY TOMBOL 3 (KANAN): IKUTI TUR (📖) */}
        <button
          onClick={() => navigate('/tour')}
          title="Ikuti Tur Sejarah Reaktor Kartini"
          style={{
            left: `${(1242 / 2162) * 100}%`,
            top: `${(691 / 972) * 100}%`,
            width: `${(105 / 2162) * 100}%`,
            height: `${(95 / 972) * 100}%`,
            borderRadius: '23.8% / 26.3%'
          }}
          className="absolute z-20 hover:ring-[3.5px] hover:ring-inset hover:ring-cyan-400 hover:bg-cyan-400/10 active:scale-95 transition-all duration-150 cursor-pointer"
        />
      </div>

      {/* POPUP MODAL HELP / PANDUAN (SINGLE SOURCE OF TRUTH DARI INFO_4_ID.HTML) */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-[#0b0f19] border border-cyan-500/50 rounded-2xl w-full max-w-6xl xl:max-w-7xl w-[96vw] max-h-[94vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex justify-between items-center px-6 py-4 bg-[#0f172a] border-b border-gray-800 flex-shrink-0">
              <div>
                <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase">
                  PANDUAN SISTEM SIRAKA
                </p>
                <h2 className="text-xl sm:text-2xl font-bold font-poppins text-white mt-0.5">
                  Fitur &amp; Langkah Penggunaan
                </h2>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="w-9 h-9 rounded-full bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center font-bold text-base transition cursor-pointer shadow"
                title="Tutup Panduan"
              >
                ✕
              </button>
            </div>

            {/* Konten Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#08091C]/95">
              <HelpContent />
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-3.5 border-t border-gray-800 bg-[#0f172a] flex justify-between items-center flex-shrink-0 text-xs sm:text-sm text-gray-400">
              <button
                onClick={() => {
                  setShowHelp(false);
                  navigate('/help');
                }}
                className="text-cyan-400 hover:underline cursor-pointer font-medium"
              >
                Buka Halaman Bantuan Penuh ↗
              </button>
              <button
                onClick={() => setShowHelp(false)}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition shadow"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
