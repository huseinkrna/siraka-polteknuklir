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

// Konfigurasi Hotspot Komponen Reaktor (Koordinat presisi dalam viewBox 1440x1024)
const HOTSPOTS_CONFIG = [
  {
    id: 'safe-rod',
    x: 205,
    y: 168,
    icon: '🛡️',
    title: 'Safe Rod (SCRAM)',
    color: '#38bdf8',
    placement: 'bottom'
  },
  {
    id: 'shim-rod',
    x: 285,
    y: 168,
    icon: '⚙️',
    title: 'Shim Rod (Kompensasi)',
    color: '#eab308',
    placement: 'bottom'
  },
  {
    id: 'reg-rod',
    x: 368,
    y: 168,
    icon: '🎯',
    title: 'Regulating Rod (Pengatur)',
    color: '#06b6d4',
    placement: 'bottom'
  },
  {
    id: 'rod-drive',
    x: 284,
    y: 292,
    icon: '⛰️',
    title: 'Rod Drive Mechanism',
    color: '#eab308',
    placement: 'top'
  },
  {
    id: 'bridge',
    x: 485,
    y: 312,
    icon: '🌉',
    title: 'Jembatan Reaktor (Bridge)',
    color: '#3b82f6',
    placement: 'top'
  },
  {
    id: 'shield',
    x: 452,
    y: 405,
    icon: '🧱',
    title: 'Perisai Radiasi (Biological Shielding)',
    color: '#c084fc',
    placement: 'top'
  },
  {
    id: 'pool',
    x: 408,
    y: 515,
    icon: '💧',
    title: 'Kolam Reaktor & Air Moderator',
    color: '#38bdf8',
    placement: 'top'
  },
  {
    id: 'core',
    x: 288,
    y: 848,
    icon: '☢️',
    title: 'Teras Reaktor (Core)',
    color: '#f97316',
    placement: 'bottom'
  },
  {
    id: 'pipe',
    x: 721,
    y: 416,
    icon: '🔁',
    title: 'Pipa Pendingin Primer',
    color: '#fbbf24',
    placement: 'top'
  },
  {
    id: 'pump',
    x: 889,
    y: 425,
    icon: '🔄',
    title: 'Pompa Sirkulasi',
    color: '#34d399',
    placement: 'top'
  }
];

// Posisi Y Batang Kendali dalam viewBox 1440x1024
// Tinggi rod = 174. 0% (inserted) Y = 681 (bottom = 855). 100% (withdrawn) Y = 568.36 (travel = 112.64, bottom = 742.36)
const getRodY = (pct) => 681 - (pct / 100) * 112.64;

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
    : '';

  const [activePOV, setActivePOV] = useState('main');
  const [warning, setWarning] = useState('');

  const [tutorialStep, setTutorialStep] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);

  // Greeting Hello Operator / Nickname di bagian atas tengah presisi
  const [showGreeting, setShowGreeting] = useState(true);
  const [greetingFade, setGreetingFade] = useState(false);

  useEffect(() => {
    // Mulai memudar setelah tepat 3 detik
    const fadeTimer = setTimeout(() => {
      setGreetingFade(true);
    }, 3000);

    // Hapus dari render setelah transisi fade-out selesai
    const removeTimer = setTimeout(() => {
      setShowGreeting(false);
    }, 3700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  const handleDismissGreeting = () => {
    setGreetingFade(true);
    setTimeout(() => setShowGreeting(false), 500);
  };

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
      <div className="flex-1 grid grid-cols-12 gap-1 p-1 overflow-hidden min-h-0">

        {/* KOLOM KIRI (Visual Simulator) */}
        <div className="col-span-8 bg-black relative flex items-center justify-center border border-gray-800 rounded overflow-hidden min-h-0 min-w-0">

          {/* GREETING HELLO OPERATOR / NICKNAME - DI ATAS TENGAH PRESISI & HILANG OTOMATIS 3 DETIK */}
          {showGreeting && (
            <div
              onClick={handleDismissGreeting}
              className={`absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 ease-out cursor-pointer select-none ${
                greetingFade
                  ? 'opacity-0 -translate-y-4 scale-95 blur-sm pointer-events-none'
                  : 'opacity-100 translate-y-0 scale-100 blur-0'
              }`}
              title="Klik untuk menutup ucapan"
            >
              <div className="relative overflow-hidden flex items-center gap-2.5 sm:gap-3 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-r from-slate-950/95 via-[#0A1628]/95 to-slate-950/95 backdrop-blur-xl border border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.35),0_10px_25px_rgba(0,0,0,0.8)] transition-all group hover:border-cyan-300">
                {/* Indikator Ping Radar Cyan */}
                <div className="relative flex h-2.5 w-2.5 items-center justify-center flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                </div>

                {/* Teks Ucapan Hello + Nickname */}
                <span className="font-poppins text-xs sm:text-sm font-medium text-slate-200 tracking-wide flex items-center gap-1.5">
                  <span>Hello{displayName ? ',' : '!'}</span>
                  {displayName && (
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-100 to-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]">
                      {displayName}
                    </span>
                  )}
                  <span className="text-sm sm:text-base animate-bounce">👋</span>
                </span>

                {/* Tombol Tutup Mini */}
                <span className="text-slate-500 group-hover:text-cyan-300 text-xs ml-0.5 transition-colors pl-1">
                  ✕
                </span>

                {/* 3-Detik Countdown Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-800/80 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 shadow-[0_0_8px_#22d3ee] animate-toast-countdown" />
                </div>
              </div>
            </div>
          )}

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
            <div className="w-full h-full flex items-center justify-center p-0 sm:p-1 overflow-hidden select-none">
              <svg 
                viewBox="0 0 1440 1024" 
                className="w-full h-full select-none"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <filter id="glow-safe" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ef4444" floodOpacity="0.85" />
                  </filter>
                  <filter id="glow-shim" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#eab308" floodOpacity="0.85" />
                  </filter>
                  <filter id="glow-reg" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#06b6d4" floodOpacity="0.85" />
                  </filter>
                  <filter id="tooltip-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.9" />
                  </filter>
                  <filter id="badge-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#000000" floodOpacity="0.8" />
                  </filter>
                </defs>

                {/* Background SVG Reaktor */}
                <image 
                  href="/assets/images/reaktor-bg.svg" 
                  width="1440" 
                  height="1024" 
                  className="select-none pointer-events-none"
                />

                {/* ============================================================
                    🎯 BATANG KENDALI (RODS) - VEKTOR SVG PRESISI (1440x1024)
                    ============================================================ */}

                {/* Safe Rod (Merah) */}
                <rect 
                  x="199.25"
                  y={getRodY(rods.safe)}
                  width="22"
                  height="174"
                  rx="11"
                  fill="#dc2626"
                  filter="url(#glow-safe)"
                />

                {/* Shim Rod (Kuning) */}
                <rect 
                  x="279.25"
                  y={getRodY(rods.shim)}
                  width="22"
                  height="174"
                  rx="11"
                  fill="#eab308"
                  filter="url(#glow-shim)"
                />

                {/* Regulating Rod (Cyan) */}
                <rect 
                  x="359.25"
                  y={getRodY(rods.regulate)}
                  width="22"
                  height="174"
                  rx="11"
                  fill="#22d3ee"
                  filter="url(#glow-reg)"
                />

                {/* ============================================================
                    🎯 LABEL PERSENTASE BATANG KENDALI
                    ============================================================ */}
                <g className="select-none pointer-events-none">
                  {/* Safe Rod % */}
                  <text 
                    x="210.25" 
                    y={getRodY(rods.safe) - 10} 
                    textAnchor="middle" 
                    fill="#38bdf8" 
                    fontSize="13" 
                    fontFamily="monospace" 
                    fontWeight="bold"
                  >
                    {rods.safe.toFixed(1)}%
                  </text>

                  {/* Shim Rod % */}
                  <text 
                    x="290.25" 
                    y={getRodY(rods.shim) - 10} 
                    textAnchor="middle" 
                    fill="#38bdf8" 
                    fontSize="13" 
                    fontFamily="monospace" 
                    fontWeight="bold"
                  >
                    {rods.shim.toFixed(1)}%
                  </text>

                  {/* Regulating Rod % */}
                  <text 
                    x="370.25" 
                    y={getRodY(rods.regulate) - 10} 
                    textAnchor="middle" 
                    fill="#38bdf8" 
                    fontSize="13" 
                    fontFamily="monospace" 
                    fontWeight="bold"
                  >
                    {rods.regulate.toFixed(1)}%
                  </text>
                </g>

                {/* ============================================================
                    🎯 HOTSPOTS INTERAKTIF (HANYA KETERANGAN / NAMA, TANPA DESKRIPSI)
                    ============================================================ */}
                <g>
                  {HOTSPOTS_CONFIG.map((h) => {
                    const isHovered = hoveredHotspot === h.id;
                    const tooltipWidth = Math.max(130, h.title.length * 8.5);
                    const tooltipX = Math.max(10, Math.min(1440 - tooltipWidth - 10, h.x - tooltipWidth / 2));
                    const tooltipY = h.placement === 'bottom' ? h.y + 16 : h.y - 32;

                    return (
                      <g 
                        key={h.id}
                        onMouseEnter={() => setHoveredHotspot(h.id)}
                        onMouseLeave={() => setHoveredHotspot(null)}
                        className="cursor-pointer"
                      >
                        {/* Pill Background */}
                        <rect 
                          x={h.x - 20} 
                          y={h.y - 11} 
                          width="40" 
                          height="22" 
                          rx="11" 
                          fill="#070a14" 
                          stroke={h.color} 
                          strokeWidth={isHovered ? 2.2 : 1.4}
                          filter="url(#badge-glow)"
                          className="transition-all duration-150"
                        />

                        {/* Icon */}
                        <text 
                          x={h.x} 
                          y={h.y + 4.5} 
                          fontSize="13" 
                          textAnchor="middle" 
                          className="select-none pointer-events-none"
                        >
                          {h.icon}
                        </text>

                        {/* Tooltip Keterangan (HANYA NAMA, TANPA DESKRIPSI PANJANG) */}
                        {isHovered && (
                          <g className="pointer-events-none select-none" filter="url(#tooltip-shadow)">
                            <rect 
                              x={tooltipX} 
                              y={tooltipY} 
                              width={tooltipWidth} 
                              height="24" 
                              rx="5" 
                              fill="#0b1120" 
                              fillOpacity="0.96" 
                              stroke={h.color} 
                              strokeWidth="1.2" 
                            />
                            <text 
                              x={tooltipX + tooltipWidth / 2} 
                              y={tooltipY + 16} 
                              fill="#ffffff" 
                              fontSize="11.5" 
                              fontWeight="bold"
                              textAnchor="middle"
                              fontFamily="system-ui, -apple-system, sans-serif"
                            >
                              {h.title}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
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
