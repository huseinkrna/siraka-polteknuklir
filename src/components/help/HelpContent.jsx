// src/components/help/HelpContent.jsx
import React from 'react';

export default function HelpContent() {
  return (
    <div className="w-full text-gray-100 font-sans space-y-8 select-text">
      {/* SEKSI 1: FITUR */}
      <section className="bg-gray-900/80 rounded-2xl p-5 sm:p-7 border border-gray-700/80 shadow-lg">
        <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-4 pb-2 border-b border-gray-700">
          Fitur
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Gambar Fitur - Diperbesar */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="rounded-xl overflow-hidden border border-gray-700 bg-black/60 shadow-md w-full">
              <img
                src="/help/Panel Fitur info 1.png"
                alt="Fitur Simulator Reaktor Kartini"
                className="w-full h-auto object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/help/fitur.png';
                }}
              />
            </div>
          </div>

          {/* Daftar Fitur (1-10) - Font Diperbesar & Jelas */}
          <div className="lg:col-span-6">
            <ol className="list-decimal pl-6 space-y-3 text-sm sm:text-base text-gray-200 leading-relaxed">
              <li>
                <strong className="text-white">Safe Rod (SCRAM):</strong> Batang pengaman B₄C yang menghentikan reaktor otomatis saat daya melebihi 110 kW.
              </li>
              <li>
                <strong className="text-white">Shim Rod (Kompensasi):</strong> Menyesuaikan reaktivitas akibat perubahan bahan bakar dan temperatur.
              </li>
              <li>
                <strong className="text-white">Regulating Rod (Pengatur):</strong> Mengatur daya reaktor secara halus hingga daya nominal 100 kW.
              </li>
              <li>
                <strong className="text-white">Rod Drive Mechanism:</strong> Mekanisme motor dan kopling magnetik penggerak batang kendali; memungkinkan batang jatuh saat SCRAM.
              </li>
              <li>
                <strong className="text-white">Jembatan Reaktor (Bridge):</strong> Penyangga penggerak batang kendali, sensor, dan akses penanganan bahan bakar.
              </li>
              <li>
                <strong className="text-white">Perisai Radiasi (Biological Shielding):</strong> Beton barit yang mengurangi paparan radiasi neutron dan gamma.
              </li>
              <li>
                <strong className="text-white">Kolam Reaktor &amp; Air Moderator:</strong> Kolam berisi air demineralisasi sebagai moderator, pendingin, dan perisai radiasi.
              </li>
              <li>
                <strong className="text-white">Teras Reaktor (Core):</strong> Tempat elemen bahan bakar, grafit, batang kendali, dan sumber neutron.
              </li>
              <li>
                <strong className="text-white">Pipa Pendingin Primer:</strong> Menyalurkan air pendingin dari kolam ke penukar panas (heat exchanger).
              </li>
              <li>
                <strong className="text-white">Pompa Sirkulasi:</strong> Mengalirkan pendingin sekunder melalui penukar panas untuk membuang panas reaktor.
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* SEKSI 2: LANGKAH-LANGKAH PENGGUNAAN */}
      <section className="bg-gray-900/80 rounded-2xl p-5 sm:p-7 border border-gray-700/80 shadow-lg">
        <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-4 pb-2 border-b border-gray-700">
          Langkah-Langkah Penggunaan
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Gambar Panduan (Langkah 1 - 5) - Diperbesar */}
          <div className="lg:col-span-6 max-h-[620px] overflow-y-auto space-y-4 pr-2 rounded-xl bg-black/40 p-3 border border-gray-800">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="rounded-lg overflow-hidden border border-gray-700 bg-black shadow">
                <img
                  src={`/help/images/PanelInfo_Int${num}_id.png`}
                  alt={`Langkah ${num}`}
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `/assets/help/langkah${num}.png`;
                  }}
                />
              </div>
            ))}
          </div>

          {/* Kolom Penjelasan Langkah (1-7) - Font Diperbesar & Jelas */}
          <div className="lg:col-span-6">
            <ol className="list-decimal pl-6 space-y-4 text-sm sm:text-base text-gray-200 leading-relaxed">
              <li>
                <strong className="text-white">Safe Rod</strong> merupakan batang kendali yang digunakan untuk mengendalikan kondisi keselamatan reaktor. Safe Rod harus dinaikkan terlebih dahulu hingga posisi 100% sebelum batang kendali lainnya dapat dioperasikan.
                <ul className="list-disc pl-5 mt-2 space-y-1.5 text-cyan-300 text-sm sm:text-base">
                  <li><strong className="text-white">Naik:</strong> Space + Q</li>
                  <li><strong className="text-white">Turun:</strong> Space + A</li>
                </ul>
              </li>

              <li>
                <strong className="text-white">Shim Rod</strong> merupakan batang kendali yang digunakan untuk mengatur reaktivitas dan kondisi daya reaktor.
                <ul className="list-disc pl-5 mt-2 space-y-1.5 text-yellow-300 text-sm sm:text-base">
                  <li><strong className="text-white">Naik:</strong> Space + W</li>
                  <li><strong className="text-white">Turun:</strong> Space + S</li>
                </ul>
              </li>

              <li>
                <strong className="text-white">Regulating Rod</strong> Batang ini berfungsi untuk mengatur reaktivitas dan daya reaktor secara lebih halus. Perubahan posisi batang kendali akan memengaruhi indikator daya dan status reaktor.
                <ul className="list-disc pl-5 mt-2 space-y-1.5 text-emerald-300 text-sm sm:text-base">
                  <li><strong className="text-white">Naik:</strong> Space + E</li>
                  <li><strong className="text-white">Turun:</strong> Space + D</li>
                </ul>
              </li>

              <li>
                <strong className="text-white">Protokol SCRAM:</strong> Jika daya menembus 110 kW (110.000 W), alarm akan aktif. Setelah jeda mekanis selama 1,5 detik, semua batang kendali akan dijatuhkan secara otomatis hingga batas 0% untuk menghentikan reaksi fisi secara paksa.
              </li>

              <li>
                <strong className="text-white">Daya Aktual vs Waktu:</strong> Menunjukkan perubahan daya termal reaktor dalam satuan Watt (W) terhadap waktu secara real-time.
              </li>

              <li>
                <strong className="text-white">Profil Reaktivitas:</strong> Reaktivitas (ρ) menunjukkan kondisi reaktor, apakah daya stabil, meningkat, atau menurun. Saat ρ = 0, reaktor berada dalam keadaan seimbang dan daya tetap stabil. Jika reaktivitas meningkat melebihi Beta Efektif (β), reaktor dapat memasuki kondisi <em>Prompt Critical</em>, yaitu saat daya meningkat sangat cepat sehingga sistem keselamatan harus segera menghentikan reaksi untuk menjaga keamanan.
              </li>

              <li>
                <strong className="text-white">Konsentrasi Prekursor:</strong> Kelompok isotop hasil fisi yang menghasilkan neutron tunda. Neutron tunda berfungsi sebagai “rem alami” reaktor karena memperlambat perubahan daya, sehingga reaktor dapat dikendalikan dengan aman.
              </li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
