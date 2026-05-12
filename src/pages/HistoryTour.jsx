import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyData } from '../data/historyData';

const HistoryTour = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  const activeData = historyData[activeIndex];
  const currentImage = activeData.images.default || activeData.images.sebelum;

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col overflow-hidden font-sans">
      
      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0">
        <img 
          key={currentImage} 
          src={currentImage} 
          alt=""
          className="w-full h-full object-cover opacity-20 transition-opacity duration-1000"
          onError={(e) => { e.target.style.display = 'none'; }} // Menyembunyikan icon broken image
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black"></div>
      </div>

      {/* TOP BAR */}
      <header className="h-16 md:h-20 flex justify-between items-center px-6 md:px-12 z-20 shrink-0 border-b border-white/5">
        <h1 className="text-xl md:text-2xl font-black tracking-widest text-green-500 uppercase">SIRAKA</h1>
        <button 
          onClick={() => navigate('/')}
          className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-gray-400 hover:text-white transition-colors"
        >
          Beranda
        </button>
      </header>

      {/* MAIN STAGE (Dinamis: Mencegah teks terpotong) */}
      <main className="flex-grow flex items-center justify-center px-6 md:px-12 z-10 overflow-hidden relative py-4">
        <div className="max-w-7xl w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Text Content (Kiri) - Diberikan internal scroll jika teks terlalu panjang */}
          <div 
            className="lg:col-span-7 h-full max-h-[60vh] lg:max-h-[70vh] flex flex-col justify-center animate-slide-up overflow-y-auto no-scrollbar pr-4" 
            key={activeData.id}
          >
            <span className="text-green-500 font-mono text-sm md:text-base mb-2 block tracking-widest">
              {activeData.year}
            </span>
            {/* Ukuran font dikecilkan agar proporsional */}
            <h2 className="text-3xl md:text-5xl font-black mb-4 uppercase leading-tight drop-shadow-xl text-white">
              {activeData.title}
            </h2>
            <div className="w-12 h-1 bg-green-500 mb-6 shrink-0"></div>
            <p className="text-sm md:text-base lg:text-lg text-gray-300 leading-relaxed font-light">
              {activeData.description}
            </p>
          </div>

          {/* Image Frame (Kanan) */}
          <div className="hidden lg:flex lg:col-span-5 relative h-[300px] xl:h-[400px] w-full rounded-xl overflow-hidden border border-gray-800 shadow-2xl bg-gray-900/50 items-center justify-center">
            <img 
              key={`${currentImage}-frame`}
              src={currentImage} 
              className="w-full h-full object-cover animate-fade-in absolute inset-0 z-10"
              alt="Visual Sejarah"
              onError={(e) => { 
                e.target.style.display = 'none'; 
                // Menampilkan teks fallback jika gambar belum dimasukkan ke folder
                e.target.nextSibling.style.display = 'block';
              }}
            />
            {/* Fallback jika gambar tidak ada */}
            <div className="text-gray-600 font-mono text-sm hidden absolute z-0 text-center px-4">
              [Gambar Belum Tersedia]<br/>{currentImage}
            </div>
          </div>
          
        </div>
      </main>

      {/* TIMELINE NAVIGATION */}
      <footer className="h-28 md:h-32 bg-black/60 backdrop-blur-xl border-t border-white/10 flex items-center z-20 shrink-0">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 flex items-center justify-between gap-4">
          
          <div className="flex-grow flex items-center gap-6 md:gap-12 overflow-x-auto no-scrollbar py-4">
            {historyData.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setActiveIndex(index)}
                className="flex flex-col items-center group shrink-0 relative"
              >
                <span className={`text-[10px] md:text-xs font-bold mb-3 transition-all duration-300 ${
                  activeIndex === index ? 'text-green-400 scale-110' : 'text-gray-500 group-hover:text-gray-300'
                }`}>
                  {item.year.split(' - ')[0]}
                </span>
                
                <div className={`relative flex items-center justify-center transition-all duration-500 ${
                  activeIndex === index ? 'scale-125' : 'scale-100'
                }`}>
                  <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full z-10 ${
                    activeIndex === index ? 'bg-green-500 shadow-[0_0_15px_#22c55e]' : 'bg-gray-700 group-hover:bg-gray-500'
                  }`}></div>
                  {activeIndex === index && (
                    <div className="absolute w-5 h-5 md:w-6 md:h-6 border border-green-500 rounded-full animate-ping"></div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="shrink-0 ml-4 border-l border-white/10 pl-6">
            <button 
              onClick={() => navigate('/simulator')}
              className="bg-green-600 hover:bg-green-500 text-black px-4 py-2 md:px-6 md:py-3 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-tighter transition-all active:scale-95 whitespace-nowrap"
            >
              Simulasi
            </button>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default HistoryTour;