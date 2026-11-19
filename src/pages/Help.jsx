// src/pages/Help.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import HelpContent from '../components/help/HelpContent';

export default function Help() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#08091C] text-white flex flex-col font-sans">
      {/* HEADER */}
      <header className="h-14 bg-gray-900/90 border-b border-gray-700/80 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-lg md:text-xl font-serif font-bold text-cyan-400 hover:text-cyan-300 transition"
          >
            SIRAKA
          </button>
          <span className="text-gray-500">|</span>
          <h1 className="text-sm md:text-base font-semibold text-gray-200">
            Panduan &amp; Bantuan Penggunaan
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/simulator')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold transition shadow"
          >
            Buka Simulator
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-semibold transition"
          >
            Beranda
          </button>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
            DOKUMENTASI SISTEM RESMI
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-poppins mt-1 text-white">
            Fitur &amp; Langkah Penggunaan Simulator Reaktor Kartini
          </h2>
          <p className="text-sm sm:text-base text-gray-300 mt-2 leading-relaxed">
            Informasi lengkap mengenai komponen, sistem kendali, prosedur keselamatan, dan operasional Simulator SIRAKA.
          </p>
        </div>

        <HelpContent />
      </main>

      {/* FOOTER */}
      <footer className="py-4 border-t border-gray-800 text-center text-xs text-gray-500">
        &copy; 2026 SIRAKA &ndash; Simulator Reaktor Kartini. Poltek Nuklir BRIN.
      </footer>
    </div>
  );
}
