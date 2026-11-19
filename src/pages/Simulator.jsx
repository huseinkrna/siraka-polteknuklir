// src/pages/Simulator.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Line as ChartLine } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const miniChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  elements: { point: { radius: 0 } },
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false }
  },
  scales: {
    x: {
      type: 'linear',
      min: 0,
      display: true,
      grid: { color: '#374151', drawBorder: false },
      ticks: {
        color: '#9CA3AF',
        font: { size: 9 },
        callback: (value) => `${value}s`
      }
    },
    y: {
      min: 0,
      grid: { color: '#374151', drawBorder: false },
      ticks: { color: '#9CA3AF', font: { size: 9 } }
    }
  }
};

// Import Komponen
import FullChart from '../components/simulator/FullChart';
import HelpContent from '../components/help/HelpContent';
import { useReactorPhysics } from '../hooks/useReactorPhysics';

export default function Simulator() {
  const navigate = useNavigate();
  const location = useLocation();

  const [nickname] = useState(() => {
    return (
      location.state?.nickname ||
      location.state?.username ||
      localStorage.getItem('siraka_nickname') ||
      sessionStorage.getItem('siraka_nickname') ||
      ''
    );
  });

  const displayName = nickname
    ? nickname.charAt(0).toUpperCase() + nickname.slice(1)
    : 'Operator';

  const [activePOV, setActivePOV] = useState('main');
  const [warning, setWarning] = useState('');

  const [tutorialStep, setTutorialStep] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const { stepSimulation } = useReactorPhysics();

  const [rods, setRods] = useState({ safe: 0.0, shim: 0.0, regulate: 0.0 });
  const [simData, setSimData] = useState({
    time: 0, dayaRelatif: 1.0, dayaWatt: 0.1, reaktivitas: 0, prekursor: [0, 0, 0, 0, 0, 0]
  });

  const [chartHistory, setChartHistory] = useState([]);

  const activeKeys = useRef(new Set());
  const [uiKeys, setUiKeys] = useState({});

  const alarmAudio = useRef(null);

  const isScrammedRef = useRef(false);
  const tripTimeRef = useRef(null);
  const [isTripUI, setIsTripUI] = useState(false);

  useEffect(() => {
    alarmAudio.current = new Audio('/assets/alarm.mp3');
    alarmAudio.current.loop = true;
  }, []);

  useEffect(() => {
    if (isTripUI) {
      setShowAlert(true);
      alarmAudio.current?.play().catch(() => {});
    } else {
      setShowAlert(false);
      if (alarmAudio.current) {
        alarmAudio.current.pause();
        alarmAudio.current.currentTime = 0;
      }
    }
  }, [isTripUI]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      if (e.code === 'Space') e.preventDefault();
      activeKeys.current.add(e.code);
      setUiKeys(prev => ({ ...prev, [e.code]: true }));
    };

    const handleKeyUp = (e) => {
      activeKeys.current.delete(e.code);
      setUiKeys(prev => ({ ...prev, [e.code]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const interval = setInterval(() => {
      if (tutorialStep !== 0) return;

      const keys = activeKeys.current;
      const hasActionKey = ['KeyQ', 'KeyA', 'KeyW', 'KeyS', 'KeyE', 'KeyD'].some(k => keys.has(k));

      if (hasActionKey && !keys.has('Space')) {
        setWarning('Tahan SPACE terlebih dahulu untuk mengontrol batang kendali!');
        return;
      }
      setWarning('');

      setRods((prev) => {
        let nS = prev.safe;
        let nSh = prev.shim;
        let nR = prev.regulate;
        const speed = 1.845;
        const scramSpeed = 5.0;

        if (isScrammedRef.current) {
          const timeSinceTrip = Date.now() - tripTimeRef.current;
          if (timeSinceTrip > 1500) {
            nS = Math.max(0, nS - scramSpeed);
            nSh = Math.max(0, nSh - scramSpeed);
            nR = Math.max(0, nR - scramSpeed);
          }
        } else {
          if (keys.has('Space')) {
            if (keys.has('KeyQ')) nS = Math.min(100, nS + speed);
            if (keys.has('KeyA')) nS = Math.max(0, nS - speed);
            if (keys.has('KeyW')) nSh = Math.min(100, nSh + speed);
            if (keys.has('KeyS')) nSh = Math.max(0, nSh - speed);
            if (keys.has('KeyE')) nR = Math.min(100, nR + speed);
            if (keys.has('KeyD')) nR = Math.max(0, nR - speed);
          }
        }

        const res = stepSimulation({ safe: nS, shim: nSh, regulate: nR }, 0.05);

        if (res.dayaWatt >= 110000 && !isScrammedRef.current) {
          isScrammedRef.current = true;
          setIsTripUI(true);
          tripTimeRef.current = Date.now();
        }

        if (isScrammedRef.current && nS === 0 && nSh === 0 && nR === 0 && res.dayaWatt < 110000) {
          isScrammedRef.current = false;
          setIsTripUI(false);
          tripTimeRef.current = null;
        }

        setChartHistory((prevHistory) => {
          const nextHistory = [
            ...prevHistory,
            {
              time: parseFloat(res.time.toFixed(1)),
              dayaWatt: res.dayaWatt,
              reaktivitas: res.reaktivitas,
              dayaRelatif: res.dayaRelatif,
              prekursor: res.prekursor
            }
          ];
          if (nextHistory.length > 2400) {
            nextHistory.shift();
          }
          return nextHistory;
        });

        setSimData(res);
        return { safe: nS, shim: nSh, regulate: nR };
      });
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(interval);
    };
  }, [tutorialStep, stepSimulation]);

  const statusReaktor = isTripUI ? 'SCRAM' : (simData.dayaWatt > 1.5 ? 'CRITICAL' : 'SHUTDOWN');

  return (
    <div className="h-screen w-full bg-gray-950 flex flex-col font-sans text-white overflow-hidden p-0 select-none relative">

      {/* POP-UP TUTORIAL */}
      {tutorialStep > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-blue-500 p-6 rounded-xl max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold text-blue-400 mb-4 text-center">
              {tutorialStep === 1 ? "Informasi Simulasi" : "Langkah Operasi"}
            </h2>
            <div className="text-sm text-gray-300 space-y-4 text-justify">
              {tutorialStep === 1 ? (
                <>
                  <p>Simulator Reaktor Kartini dikembangkan sebagai media pembelajaran dan visualisasi operasi Reaktor Kartini, yaitu reaktor riset tipe TRIGA Mark II berdaya 100 kW termal dengan 68 elemen bakar, tiga batang kendali (Safety Rod, Shim Rod, dan Regulating Rod), serta sistem pendingin air tipe open pool.</p>
                  <p>Seluruh data yang ditampilkan merupakan hasil simulasi numerik dan bukan data operasi reaktor secara real-time. Perhitungan menggunakan Persamaan Kinetika Titik (PKE), enam kelompok neutron tunda, serta model umpan balik reaktivitas akibat perubahan temperatur bahan bakar dan densitas pendingin.</p>
                  <p>Simulator ini dikembangkan berdasarkan penelitian "Improvement of a Code-Based Kartini Reactor Simulator for Education and Training" dan ditujukan untuk mendukung kegiatan pendidikan, pelatihan, serta pemahaman prinsip operasi dan keselamatan reaktor nuklir.</p>
                  <p><strong>Catatan:</strong> Simulator masih dalam tahap pengembangan. Hasil simulasi merupakan pendekatan matematis dan dapat berbeda dari kondisi operasi Reaktor Kartini yang sebenarnya.</p>
                </>
              ) : (
                <>
                  <p>1. <strong>Tarik Safe Rod ke 100%:</strong> Tahan [SPACE] + Q.</p>
                  <p>2. <strong>Kompensasi Shim Rod:</strong> Tahan [SPACE] + W.</p>
                  <p>3. <strong>Operasional Regulating Rod:</strong> Tahan [SPACE] + E. Naikkan secara perlahan. Ini digunakan untuk mengatur daya reaktor.</p>
                  <p>4. <strong>Protokol SCRAM:</strong> Jika daya menembus 110kW (110.000W), alarm aktif. Setelah jeda mekanis 1.5 detik, semua batang akan dijatuhkan otomatis (SCRAM) ke batas 0% untuk menghentikan reaksi fisi secara paksa.</p>
                </>
              )}
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={() => setTutorialStep(0)} className="text-gray-500 hover:text-white">Skip</button>
              <button onClick={() => setTutorialStep(tutorialStep === 2 ? 0 : 2)} className="bg-blue-600 px-6 py-2 rounded font-bold hover:bg-blue-500 transition">
                {tutorialStep === 2 ? "Mulai Simulasi" : "Selanjutnya"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP TRIP */}
      {isTripUI && showAlert && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] w-80 bg-red-600 border-4 border-white p-4 rounded shadow-2xl animate-pulse">
          <button
            onClick={() => setShowAlert(false)}
            className="absolute top-1 right-2 font-bold text-white hover:text-black bg-red-800 rounded px-2"
          >X</button>
          <h2 className="text-center font-black text-white text-lg tracking-tighter">⚠ REACTOR SCRAM ⚠</h2>
          <p className="text-[0.65rem] text-center font-bold text-white uppercase mt-1">Automatic SCRAM Active</p>
        </div>
      )}

      {/* POP-UP PANEL HELP / BANTUAN (DARI TOMBOL BUKU KECIL) */}
      {showHelpModal && (
        <div 
          className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6"
          onClick={() => setShowHelpModal(false)}
        >
          <div 
            className="bg-[#0b0f19] border border-cyan-500/50 rounded-2xl w-full max-w-6xl xl:max-w-7xl w-[96vw] max-h-[94vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0f172a] flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📖</span>
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-poppins text-cyan-400">
                    Pusat Bantuan &amp; Panduan Simulator SIRAKA
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Dokumentasi resmi fitur dan langkah-langkah penggunaan Simulator Reaktor Kartini
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="w-8 h-8 rounded-full bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
                title="Tutup Panel Bantuan"
              >
                ✕
              </button>
            </div>

            {/* Konten Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#08091C]/95">
              <HelpContent />
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-3 border-t border-gray-800 bg-[#0f172a] flex justify-between items-center flex-shrink-0 text-xs text-gray-400">
              <span>Satu sumber data terintegrasi dengan halaman Help utama.</span>
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition shadow cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="h-12 bg-gray-900 border-b border-gray-700 flex items-center px-4 justify-between flex-shrink-0">
        <h1 className="text-lg font-bold text-blue-400">Simulator Reaktor Kartini</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHelpModal(true)} 
            className="px-3 py-1.5 bg-cyan-900/80 hover:bg-cyan-800 border border-cyan-600/60 rounded text-xs font-semibold text-cyan-200 transition flex items-center gap-1 cursor-pointer"
            title="Buka Pusat Bantuan"
          >
            <span>📖</span>
            <span className="hidden sm:inline">Bantuan</span>
          </button>
          <button 
            onClick={() => navigate('/model3d')} 
            className="px-3 py-1.5 bg-purple-900/80 hover:bg-purple-800 border border-purple-600/60 rounded text-xs font-semibold text-purple-200 transition cursor-pointer"
          >
            Model 3D
          </button>
          <button 
            onClick={() => navigate('/')} 
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-xs font-semibold cursor-pointer transition"
          >
            Beranda
          </button>
        </div>
      </div>

      {/* AREA UTAMA (UKURAN DAN PROPORSI ASLI SESUAI VERSI AWAL) */}
      <div className="flex-1 grid grid-cols-12 gap-1 p-1 overflow-hidden">

        {/* KOLOM KIRI (Visual Simulator) */}
        <div className="col-span-8 bg-black relative flex items-center justify-center border border-gray-800 rounded">

          {/* TULISAN HELLO PERMANEN DI KIRI, TEPAT DI BAWAH TULISAN SIMULATOR REAKTOR KARTINI */}
          <div className="absolute top-1 sm:top-1.5 left-3 z-30 pointer-events-none select-none text-left">
            <span className="font-serif font-normal text-base sm:text-lg md:text-[1.15rem] text-white tracking-normal leading-none drop-shadow-sm inline-block">
              Hello, {displayName}
            </span>
          </div>

          {/* TOMBOL BUKU PANDUAN KIRI BAWAH */}
          <div className="absolute bottom-4 left-4 z-40">
            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center justify-center bg-blue-900/80 hover:bg-blue-700 text-blue-100 p-2 rounded-full border border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all group backdrop-blur-sm cursor-pointer"
              title="Buka Buku Panduan / Help"
            >
              <span className="text-lg">📖</span>
              <span className="w-0 overflow-hidden group-hover:w-20 group-hover:ml-2 text-[0.6rem] font-bold text-left transition-all duration-300 whitespace-nowrap">
                Panduan
              </span>
            </button>
          </div>

          {activePOV === 'main' && (
            <div className="relative w-full max-w-5xl xl:max-w-6xl max-h-[92vh] flex items-center justify-center">
              {/* Background SVG Reaktor */}
              <img 
                src="/assets/images/reaktor-bg.svg" 
                alt="Reaktor 2D" 
                className="w-full h-auto max-h-[90vh] object-contain opacity-95 select-none pointer-events-none" 
              />
              
              {/* ============================================================
                  🎯 BATANG KENDALI (OVERLAY) - KOORDINAT SUDAH DISESUAIKAN
                  ============================================================ */}
              
              {/* Safe Rod - merah */}
              <div 
                className="absolute w-[1.8%] bg-red-600 z-10 transition-none rounded-full shadow-[0_0_10px_rgba(255,0,0,0.5)]" 
                style={{ 
                  left: '13.7%', 
                  bottom: `${17 + (rods.safe / 100) * 11}%`, 
                  height: '17%' 
                }}
              />
              
              {/* Shim Rod - kuning */}
              <div 
                className="absolute w-[1.8%] bg-yellow-500 z-10 transition-none rounded-full shadow-[0_0_10px_rgba(255,200,0,0.5)]" 
                style={{ 
                  left: '19.2%', 
                  bottom: `${17 + (rods.shim / 100) * 11}%`, 
                  height: '18%' 
                }}
              />
              
              {/* Regulating Rod - cyan */}
              <div 
                className="absolute w-[1.8%] bg-cyan-400 z-10 transition-none rounded-full shadow-[0_0_10px_rgba(0,255,255,0.5)]" 
                style={{ 
                  left: '24.8%', 
                  bottom: `${17 + (rods.regulate / 100) * 11}%`, 
                  height: '17%' 
                }}
              />

              {/* ============================================================
                  🎯 LABEL PERSENTASE BATANG KENDALI
                  ============================================================ */}
              
              <div 
                className="absolute text-[0.6rem] font-mono font-bold text-cyan-300 z-20 transform -translate-x-1/2" 
                style={{ 
                  left: '14.5%', 
                  bottom: `calc(${17 + (rods.safe / 100) * 11}% + 17% + 2%)`
                }}
              >
                {rods.safe.toFixed(1)}%
              </div>

              <div 
                className="absolute text-[0.6rem] font-mono font-bold text-cyan-300 z-20 transform -translate-x-1/2" 
                style={{ 
                  left: '20.5%', 
                  bottom: `calc(${17 + (rods.shim / 100) * 11}% + 18% + 2%)`
                }}
              >
                {rods.shim.toFixed(1)}%
              </div>

              <div 
                className="absolute text-[0.6rem] font-mono font-bold text-cyan-300 z-20 transform -translate-x-1/2" 
                style={{ 
                  left: '26.5%', 
                  bottom: `calc(${17 + (rods.regulate / 100) * 11}% + 17% + 2%)`
                }}
              >
                {rods.regulate.toFixed(1)}%
              </div>

              {/* ============================================================
                  🎯 HOTSPOT INTERAKTIF (HANYA NAMA KOMPONEN, TANPA DESKRIPSI PANJANG)
                  ============================================================ */}

              {/* 1. ROD DRIVE MECHANISM */}
              <div className="absolute z-30 group hover:z-[100]" style={{ left: '18.3%', top: '27%' }}>
                <span className="bg-gray-800 text-[0.55rem] px-2 py-0.5 rounded-full border border-yellow-400 cursor-help font-bold text-yellow-300 hover:bg-yellow-400/20 transition">⛰️</span>
                <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2.5 py-1 bg-gray-900 border border-yellow-400 rounded shadow-xl text-center whitespace-nowrap z-50 pointer-events-none">
                  <h3 className="text-yellow-400 font-bold text-[0.7rem]">Rod Drive Mechanism</h3>
                </div>
              </div>

              {/* 2A. SAFE ROD */}
              <div className="absolute z-30 group hover:z-[100]" style={{ left: '13%', top: '14%' }}>
                <span className="bg-gray-800 text-[0.55rem] px-2 py-0.5 rounded-full border border-red-400 cursor-help font-bold text-red-300 hover:bg-red-400/20 transition">🛡️</span>
                <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2.5 py-1 bg-gray-900 border border-red-400 rounded shadow-xl text-center whitespace-nowrap z-50 pointer-events-none">
                  <h3 className="text-red-400 font-bold text-[0.7rem]">Safe Rod (SCRAM)</h3>
                </div>
              </div>

              {/* 2B. SHIM ROD */}
              <div className="absolute z-30 group hover:z-[100]" style={{ left: '18.3%', top: '14%' }}>
                <span className="bg-gray-800 text-[0.55rem] px-2 py-0.5 rounded-full border border-yellow-400 cursor-help font-bold text-yellow-300 hover:bg-yellow-400/20 transition">⚙️</span>
                <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2.5 py-1 bg-gray-900 border border-yellow-400 rounded shadow-xl text-center whitespace-nowrap z-50 pointer-events-none">
                  <h3 className="text-yellow-400 font-bold text-[0.7rem]">Shim Rod (Kompensasi)</h3>
                </div>
              </div>

              {/* 2C. REGULATING ROD */}
              <div className="absolute z-30 group hover:z-[100]" style={{ left: '24%', top: '14%' }}>
                <span className="bg-gray-800 text-[0.55rem] px-2 py-0.5 rounded-full border border-cyan-400 cursor-help font-bold text-cyan-300 hover:bg-cyan-400/20 transition">🎯</span>
                <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2.5 py-1 bg-gray-900 border border-cyan-400 rounded shadow-xl text-center whitespace-nowrap z-50 pointer-events-none">
                  <h3 className="text-cyan-400 font-bold text-[0.7rem]">Regulating Rod (Pengatur)</h3>
                </div>
              </div>

              {/* 3. JEMBATAN REAKTOR */}
              <div className="absolute z-30 group hover:z-[100]" style={{ left: '32.3%', top: '29%' }}>
                <span className="bg-gray-800 text-[0.55rem] px-2 py-0.5 rounded-full border border-blue-400 cursor-help font-bold text-blue-300 hover:bg-blue-400/20 transition">🌉</span>
                <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2.5 py-1 bg-gray-900 border border-blue-400 rounded shadow-xl text-center whitespace-nowrap z-50 pointer-events-none">
                  <h3 className="text-blue-400 font-bold text-[0.7rem]">Jembatan Reaktor (Bridge)</h3>
                </div>
              </div>

              {/* 4. PERISAI RADIASI */}
              <div className="absolute z-30 group hover:z-[100]" style={{ left: '30%', top: '38%' }}>
                <span className="bg-gray-800 text-[0.55rem] px-2 py-0.5 rounded-full border border-purple-400 cursor-help font-bold text-purple-300 hover:bg-purple-400/20 transition">🧱</span>
                <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2.5 py-1 bg-gray-900 border border-purple-400 rounded shadow-xl text-center whitespace-nowrap z-50 pointer-events-none">
                  <h3 className="text-purple-400 font-bold text-[0.7rem]">Perisai Radiasi (Biological Shielding)</h3>
                </div>
              </div>

              {/* 5. KOLAM REAKTOR + AIR MODERATOR */}
              <div className="absolute z-30 group hover:z-[100]" style={{ left: '27%', top: '48.8%' }}>
                <span className="bg-gray-800 text-[0.55rem] px-2 py-0.5 rounded-full border border-sky-400 cursor-help font-bold text-sky-300 hover:bg-sky-400/20 transition">💧</span>
                <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2.5 py-1 bg-gray-900 border border-sky-400 rounded shadow-xl text-center whitespace-nowrap z-50 pointer-events-none">
                  <h3 className="text-sky-400 font-bold text-[0.7rem]">Kolam Reaktor &amp; Air Moderator</h3>
                </div>
              </div>

              {/* 6. TERAS REAKTOR */}
              <div className="absolute z-30 group hover:z-[100]" style={{ left: '18.4%', top: '82.8%' }}>
                <span className="bg-gray-800 text-[0.55rem] px-2 py-0.5 rounded-full border border-orange-400 cursor-help font-bold text-orange-300 hover:bg-orange-400/20 transition">☢️</span>
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2.5 py-1 bg-gray-900 border border-orange-400 rounded shadow-xl text-center whitespace-nowrap z-50 pointer-events-none">
                  <h3 className="text-orange-400 font-bold text-[0.7rem]">Teras Reaktor (Core)</h3>
                </div>
              </div>

              {/* 7. PIPA PENDINGIN */}
              <div className="absolute z-30 group hover:z-[100]" style={{ left: '48.6%', top: '39.1%' }}>
                <span className="bg-gray-800 text-[0.55rem] px-2 py-0.5 rounded-full border border-amber-400 cursor-help font-bold text-amber-300 hover:bg-amber-400/20 transition">🔁</span>
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2.5 py-1 bg-gray-900 border border-amber-400 rounded shadow-xl text-center whitespace-nowrap z-50 pointer-events-none">
                  <h3 className="text-amber-400 font-bold text-[0.7rem]">Pipa Pendingin Primer</h3>
                </div>
              </div>

              {/* 8. POMPA SIRKULASI */}
              <div className="absolute z-30 group hover:z-[100]" style={{ left: '60.1%', top: '39.8%' }}>
                <span className="bg-gray-800 text-[0.55rem] px-2 py-0.5 rounded-full border border-emerald-400 cursor-help font-bold text-emerald-300 hover:bg-emerald-400/20 transition">🔄</span>
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2.5 py-1 bg-gray-900 border border-emerald-400 rounded shadow-xl text-center whitespace-nowrap z-50 pointer-events-none">
                  <h3 className="text-emerald-400 font-bold text-[0.7rem]">Pompa Sirkulasi</h3>
                </div>
              </div>

            </div>
          )}

          {activePOV === 'grafik' && <FullChart historyData={chartHistory} currentData={simData} />}

          {warning && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-500 px-4 py-1.5 rounded-full text-xs animate-pulse z-50">
              {warning}
            </div>
          )}
        </div>

        {/* KOLOM KANAN (Dashboard) */}
        <div className="col-span-4 bg-gray-900 flex flex-col p-2 space-y-2 h-full overflow-hidden">

          <div className="bg-gray-800 p-2 rounded border border-gray-700 flex-shrink-0">
            <h2 className="text-[0.6rem] font-bold text-gray-400 mb-1 uppercase">Camera POV</h2>
            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => setActivePOV('main')} className={`py-1.5 rounded text-[0.6rem] font-bold ${activePOV === 'main' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>MAIN</button>
              <button onClick={() => setActivePOV('grafik')} className={`py-1.5 rounded text-[0.6rem] font-bold ${activePOV === 'grafik' ? 'bg-emerald-600' : 'bg-gray-700 hover:bg-gray-600'}`}>GRAFIK FULL</button>
            </div>
          </div>

          {/* KONTROL BATANG KENDALI */}
          <div className="bg-gray-800 p-2 rounded border border-gray-700 flex-shrink-0">
            <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-1">
              <h2 className="text-[0.65rem] font-bold text-gray-400 uppercase">Kontrol Batang Kendali</h2>
              <div className="relative group cursor-help z-50">
                <span className="bg-gray-700 text-gray-300 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[0.55rem] font-bold border border-gray-500">?</span>
                <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-56 bg-gray-900 border border-blue-500 p-2 rounded shadow-xl text-left">
                  <p className="text-[0.55rem] text-gray-300 mb-1">Intervensi Manual Operator. Gunakan kombinasi <strong>SPACE + Huruf</strong>.</p>
                  <ul className="text-[0.55rem] text-gray-400 list-disc list-inside">
                    <li><strong className="text-red-400">Safe:</strong> Batang SCRAM.</li>
                    <li><strong className="text-yellow-400">Shim:</strong> Kompensator reaktivitas.</li>
                    <li><strong className="text-cyan-400">Reg:</strong> Pengatur halus daya.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center">
              {/* Safe */}
              <div className="flex flex-col space-y-1">
                <span className="text-[0.55rem] font-bold text-gray-400 uppercase">Safe (Q/A)</span>
                <button
                  onPointerDown={() => { setUiKeys(p => ({ ...p, KeyQ: true })); activeKeys.current.add('Space'); activeKeys.current.add('KeyQ'); }}
                  onPointerUp={() => { setUiKeys(p => ({ ...p, KeyQ: false })); activeKeys.current.delete('Space'); activeKeys.current.delete('KeyQ'); }}
                  onPointerLeave={() => { setUiKeys(p => ({ ...p, KeyQ: false })); activeKeys.current.delete('Space'); activeKeys.current.delete('KeyQ'); }}
                  className={`rounded py-1.5 text-xs select-none transition-all duration-100 ${uiKeys['KeyQ'] ? 'bg-blue-600 scale-90 shadow-inner' : 'bg-gray-700 hover:bg-gray-600'}`}
                >▲</button>
                <button
                  onPointerDown={() => { setUiKeys(p => ({ ...p, KeyA: true })); activeKeys.current.add('Space'); activeKeys.current.add('KeyA'); }}
                  onPointerUp={() => { setUiKeys(p => ({ ...p, KeyA: false })); activeKeys.current.delete('Space'); activeKeys.current.delete('KeyA'); }}
                  onPointerLeave={() => { setUiKeys(p => ({ ...p, KeyA: false })); activeKeys.current.delete('Space'); activeKeys.current.delete('KeyA'); }}
                  className={`rounded py-1.5 text-xs select-none transition-all duration-100 ${uiKeys['KeyA'] ? 'bg-blue-600 scale-90 shadow-inner' : 'bg-gray-700 hover:bg-gray-600'}`}
                >▼</button>
              </div>

              {/* Shim */}
              <div className="flex flex-col space-y-1">
                <span className="text-[0.55rem] font-bold text-gray-400 uppercase">Shim (W/S)</span>
                <button
                  onPointerDown={() => { setUiKeys(p => ({ ...p, KeyW: true })); activeKeys.current.add('Space'); activeKeys.current.add('KeyW'); }}
                  onPointerUp={() => { setUiKeys(p => ({ ...p, KeyW: false })); activeKeys.current.delete('Space'); activeKeys.current.delete('KeyW'); }}
                  onPointerLeave={() => { setUiKeys(p => ({ ...p, KeyW: false })); activeKeys.current.delete('Space'); activeKeys.current.delete('KeyW'); }}
                  className={`rounded py-1.5 text-xs select-none transition-all duration-100 ${uiKeys['KeyW'] ? 'bg-blue-600 scale-90 shadow-inner' : 'bg-gray-700 hover:bg-gray-600'}`}
                >▲</button>
                <button
                  onPointerDown={() => { setUiKeys(p => ({ ...p, KeyS: true })); activeKeys.current.add('Space'); activeKeys.current.add('KeyS'); }}
                  onPointerUp={() => { setUiKeys(p => ({ ...p, KeyS: false })); activeKeys.current.delete('Space'); activeKeys.current.delete('KeyS'); }}
                  onPointerLeave={() => { setUiKeys(p => ({ ...p, KeyS: false })); activeKeys.current.delete('Space'); activeKeys.current.delete('KeyS'); }}
                  className={`rounded py-1.5 text-xs select-none transition-all duration-100 ${uiKeys['KeyS'] ? 'bg-blue-600 scale-90 shadow-inner' : 'bg-gray-700 hover:bg-gray-600'}`}
                >▼</button>
              </div>

              {/* Regulate */}
              <div className="flex flex-col space-y-1">
                <span className="text-[0.55rem] font-bold text-gray-400 uppercase">Reg (E/D)</span>
                <button
                  onPointerDown={() => { setUiKeys(p => ({ ...p, KeyE: true })); activeKeys.current.add('Space'); activeKeys.current.add('KeyE'); }}
                  onPointerUp={() => { setUiKeys(p => ({ ...p, KeyE: false })); activeKeys.current.delete('Space'); activeKeys.current.delete('KeyE'); }}
                  onPointerLeave={() => { setUiKeys(p => ({ ...p, KeyE: false })); activeKeys.current.delete('Space'); activeKeys.current.delete('KeyE'); }}
                  className={`rounded py-1.5 text-xs select-none transition-all duration-100 ${uiKeys['KeyE'] ? 'bg-blue-600 scale-90 shadow-inner' : 'bg-gray-700 hover:bg-gray-600'}`}
                >▲</button>
                <button
                  onPointerDown={() => { setUiKeys(p => ({ ...p, KeyD: true })); activeKeys.current.add('Space'); activeKeys.current.add('KeyD'); }}
                  onPointerUp={() => { setUiKeys(p => ({ ...p, KeyD: false })); activeKeys.current.delete('Space'); activeKeys.current.delete('KeyD'); }}
                  onPointerLeave={() => { setUiKeys(p => ({ ...p, KeyD: false })); activeKeys.current.delete('Space'); activeKeys.current.delete('KeyD'); }}
                  className={`rounded py-1.5 text-xs select-none transition-all duration-100 ${uiKeys['KeyD'] ? 'bg-blue-600 scale-90 shadow-inner' : 'bg-gray-700 hover:bg-gray-600'}`}
                >▼</button>
              </div>
            </div>
          </div>

          <div className={`p-2 rounded border text-center transition-colors flex-shrink-0 ${isTripUI ? 'bg-red-900 border-red-500' : 'bg-gray-800 border-gray-700'}`}>
            <h2 className="text-[0.55rem] text-gray-400 uppercase tracking-wider">Status Reaktor</h2>
            <div className={`text-xl font-black tracking-widest ${isTripUI ? 'text-red-500' : (statusReaktor === 'CRITICAL' ? 'text-emerald-400' : 'text-gray-500')}`}>
              {statusReaktor}
            </div>
          </div>

          {/* PANEL GRAFIK KANAN BAWAH */}
          <div className="flex-1 bg-black rounded border border-gray-700 p-2 flex flex-col relative min-h-0">
            <div className="flex justify-between items-center mb-1 border-b border-gray-800 pb-1 flex-shrink-0">
              <h2 className="text-[0.65rem] font-bold text-cyan-400">GRAFIK DAYA AKTUAL (W) VS WAKTU</h2>
              <span className="text-[0.6rem] text-white font-mono font-bold">
                {simData.dayaWatt.toFixed(1)} W
              </span>
            </div>

            <div className="flex-1 w-full min-h-0">
              <ChartLine
                options={miniChartOptions}
                data={{
                  datasets: [{
                    data: chartHistory.map(d => ({ x: d.time, y: d.dayaWatt })),
                    borderColor: '#22d3ee',
                    borderWidth: 1.5,
                    tension: 0.1
                  }]
                }}
              />
            </div>

            <div className="text-[0.5rem] text-gray-500 font-mono text-center mt-1">
              ρ: {simData.reaktivitas.toFixed(6)}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
