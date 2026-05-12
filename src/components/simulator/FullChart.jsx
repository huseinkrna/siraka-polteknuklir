import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrasi modul Chart.js
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
);

export default function FullChart({ data }) {
  // Batasi sejarah memori agar browser tidak crash (Maksimal 60 titik ~ 3 detik data real-time)
  const MAX_DATA_POINTS = 60;
  const [history, setHistory] = useState([]);

  // Perhitungan Periode Reaktor (T) secara dinamis
  const [periode, setPeriode] = useState('∞');

  useEffect(() => {
    if (!data) return;

    setHistory((prev) => {
      const newHistory = [...prev, data];
      
      // Hitung Periode (T) dari 2 titik terakhir
      if (newHistory.length > 1) {
        const current = newHistory[newHistory.length - 1];
        const previous = newHistory[newHistory.length - 2];
        
        // T = dt / ln(N_current / N_prev)
        if (current.dayaRelatif !== previous.dayaRelatif && current.dayaRelatif > 0 && previous.dayaRelatif > 0) {
          const dt = current.time - previous.time;
          const calcT = dt / Math.log(current.dayaRelatif / previous.dayaRelatif);
          
          // Jika nilai sangat besar atau tidak terbatas, tampilkan tak hingga
          if (Math.abs(calcT) > 1000) {
            setPeriode('∞');
          } else {
            setPeriode(calcT.toFixed(2));
          }
        } else {
          setPeriode('∞');
        }
      }

      if (newHistory.length > MAX_DATA_POINTS) {
        return newHistory.slice(newHistory.length - MAX_DATA_POINTS);
      }
      return newHistory;
    });
  }, [data]);

  // Ekstraksi array waktu untuk sumbu X
  const labels = history.map(d => d.time.toFixed(1) + 's');

  // Opsi Global Chart (Matikan animasi untuk performa streaming 50ms)
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, 
    elements: {
      point: { radius: 0 } // Sembunyikan titik, hanya tampilkan garis
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false } // Matikan tooltip chart agar tidak berat
    },
    scales: {
      x: { 
        grid: { color: '#374151', drawBorder: false },
        ticks: { display: false } // Sembunyikan label X agar rapi
      },
      y: { 
        grid: { color: '#374151', drawBorder: false },
        ticks: { color: '#9CA3AF', font: { size: 9 } }
      }
    }
  };

  // Konfigurasi Data Kuadran 1: Daya Relatif
  const dataDaya = {
    labels,
    datasets: [{
      data: history.map(d => d.dayaRelatif),
      borderColor: '#3B82F6', // Blue-500
      borderWidth: 2,
      tension: 0.1
    }]
  };

  // Konfigurasi Data Kuadran 2: Reaktivitas
  const dataReaktivitas = {
    labels,
    datasets: [{
      data: history.map(d => d.reaktivitas),
      borderColor: '#F97316', // Orange-500
      borderWidth: 2,
      tension: 0.1
    }]
  };

  // Konfigurasi Data Kuadran 3: Prekursor (6 Garis)
  const dataPrekursor = {
    labels,
    datasets: [
      { data: history.map(d => d.prekursor[0]), borderColor: '#EF4444', borderWidth: 1.5, tension: 0.1 }, // Red
      { data: history.map(d => d.prekursor[1]), borderColor: '#F59E0B', borderWidth: 1.5, tension: 0.1 }, // Amber
      { data: history.map(d => d.prekursor[2]), borderColor: '#EAB308', borderWidth: 1.5, tension: 0.1 }, // Yellow
      { data: history.map(d => d.prekursor[3]), borderColor: '#22C55E', borderWidth: 1.5, tension: 0.1 }, // Green
      { data: history.map(d => d.prekursor[4]), borderColor: '#06B6D4', borderWidth: 1.5, tension: 0.1 }, // Cyan
      { data: history.map(d => d.prekursor[5]), borderColor: '#A855F7', borderWidth: 1.5, tension: 0.1 }, // Purple
    ]
  };

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg border border-gray-700 p-4 flex flex-col">
      <h2 className="text-lg font-bold text-emerald-400 mb-4 border-b border-gray-700 pb-2">
        Panel Analisis Kinetika Reaktor
      </h2>

      {/* GRID 2x2 UNTUK 4 KUADRAN GRAFIK */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4">
        
        {/* KUADRAN 1: Daya Relatif & Aktual */}
        <div className="bg-black border border-gray-800 rounded relative group p-3 flex flex-col">
          <div className="flex justify-between items-center mb-2 flex-shrink-0">
            <h3 className="text-xs font-bold text-blue-400 uppercase">Daya Relatif vs Waktu</h3>
            <span className="text-[0.6rem] text-gray-500 bg-gray-800 px-2 py-1 rounded cursor-help z-20">INFO</span>
          </div>
          <div className="flex-1 relative w-full h-full">
            <Line options={commonOptions} data={dataDaya} />
          </div>
          <div className="hidden group-hover:block absolute top-10 left-4 right-4 bg-gray-800 text-gray-300 text-xs p-3 rounded shadow-xl border border-blue-600 z-50">
            Menunjukkan korelasi langsung antara skala relatif simulasi (%) dengan output termal fisik reaktor (Watt/kW).
          </div>
        </div>

        {/* KUADRAN 2: Profil Reaktivitas */}
        <div className="bg-black border border-gray-800 rounded relative group p-3 flex flex-col">
          <div className="flex justify-between items-center mb-2 flex-shrink-0">
            <h3 className="text-xs font-bold text-orange-400 uppercase">Profil Reaktivitas (ρ)</h3>
            <span className="text-[0.6rem] text-gray-500 bg-gray-800 px-2 py-1 rounded cursor-help z-20">INFO</span>
          </div>
          <div className="flex-1 relative w-full h-full">
            <Line options={commonOptions} data={dataReaktivitas} />
          </div>
          <div className="hidden group-hover:block absolute top-10 left-4 right-4 bg-gray-800 text-gray-300 text-xs p-3 rounded shadow-xl border border-orange-600 z-50">
            Reaktivitas adalah ukuran simpangan dari kondisi kritis (ρ = 0). Jika nilai ρ melebihi batas Beta Efektif (β ≈ 0.0065), reaktor akan masuk ke kondisi bahaya Prompt Critical.
          </div>
        </div>

        {/* KUADRAN 3: Prekursor Neutron Tunda */}
        <div className="bg-black border border-gray-800 rounded relative group p-3 flex flex-col">
          <div className="flex justify-between items-center mb-2 flex-shrink-0">
            <h3 className="text-xs font-bold text-purple-400 uppercase">Konsentrasi Prekursor (C1-C6)</h3>
            <span className="text-[0.6rem] text-gray-500 bg-gray-800 px-2 py-1 rounded cursor-help z-20">INFO</span>
          </div>
          <div className="flex-1 relative w-full h-full">
            {/* Opsi khusus untuk prekursor: tampilkan legend kecil */}
            <Line options={{...commonOptions, plugins: { legend: { display: false }}}} data={dataPrekursor} />
          </div>
          <div className="hidden group-hover:block absolute bottom-10 left-4 right-4 bg-gray-800 text-gray-300 text-xs p-3 rounded shadow-xl border border-purple-600 z-50">
            Populasi isotop hasil fisi (6 kelompok) yang memancarkan neutron tunda. Mereka memegang peran vital sebagai 'rem alami' reaktor.
          </div>
        </div>

        {/* KUADRAN 4: Periode Reaktor */}
        <div className="bg-black border border-gray-800 rounded relative group p-3 flex flex-col justify-center items-center">
          <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-20">
            <h3 className="text-xs font-bold text-red-400 uppercase">Periode Reaktor (T)</h3>
            <span className="text-[0.6rem] text-gray-500 bg-gray-800 px-2 py-1 rounded cursor-help">INFO</span>
          </div>
          <div className="text-center mt-6">
            <span className={`text-5xl font-mono font-bold tracking-widest ${periode > 0 && periode < 3 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {periode}
            </span>
            <span className="text-xl text-gray-500 ml-2">s</span>
          </div>
          <div className="hidden group-hover:block absolute bottom-10 left-4 right-4 bg-gray-800 text-gray-300 text-xs p-3 rounded shadow-xl border border-red-600 z-50 text-left">
            Waktu yang dibutuhkan daya reaktor untuk meningkat e-kali lipat (2.718). Jika T &lt; 3 detik, sistem berisiko ekskursi daya fatal. Nilai negatif menunjukkan daya sedang turun.
          </div>
        </div>

      </div>
    </div>
  );
}