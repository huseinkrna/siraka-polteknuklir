// src/pages/Home.jsx
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  // Hapus import useLanguage dan variabel lang/setLang karena tidak digunakan

  const content = {
    ID: {
      welcome: "Halo, Selamat Datang!",
      subtitle: "simulator reaktor kartini",
      btnSim: "Simulasi",
      btnGallery: "Galeri",
      btnTour: "Ikuti Tur",
      btn3D: "Tampilan 3D Reaktor"
    },
    EN: {
      welcome: "Hello, Welcome!",
      subtitle: "kartini reactor simulator",
      btnSim: "Simulation",
      btnGallery: "Gallery",
      btnTour: "Take a Tour",
      btn3D: "3D Reactor View"
    }
  };

  const activeLang = 'ID'; // Bisa diubah ke 'EN' jika ingin bahasa Inggris
  const text = content[activeLang];

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-black"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/assets/images/Cover.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="z-10 text-center text-white px-4">
        {/* LOGO DENGAN EFEK GLOW PUTIH */}
        <div className="flex justify-center items-center gap-6 mb-4">
          <img 
            src="/assets/images/brin.png" 
            alt="BRIN" 
            className="h-12 md:h-14 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]"
          />
          <img 
            src="/assets/images/poltek.png" 
            alt="Poltek Nuklir" 
            className="h-12 md:h-14 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]"
          />
        </div>

        <h2 className="text-xl md:text-3xl font-medium mb-2 tracking-wide drop-shadow-lg">
          {text.welcome}
        </h2>
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-2 drop-shadow-2xl">
          SIRAKA
        </h1>
        <p className="text-lg md:text-2xl tracking-[0.3em] uppercase mb-12 font-light drop-shadow-md">
          {text.subtitle}
        </p>
        
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <button 
            onClick={() => navigate('/tour')}
            className="w-44 border-2 border-white text-white px-6 py-2.5 font-semibold hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm text-sm"
          >
            {text.btnTour}
          </button>
          
          <button 
            onClick={() => navigate('/simulator')}
            className="w-56 md:w-64 bg-white text-black px-8 py-4 font-bold text-lg rounded-lg shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300"
          >
            {text.btnSim}
          </button>
          
          <button 
            onClick={() => navigate('/model3d')}
            className="w-56 md:w-64 bg-purple-600 text-white px-8 py-4 font-bold text-lg rounded-lg shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] hover:scale-105 transition-all duration-300"
          >
            {text.btn3D}
          </button>
          
          <button 
            onClick={() => navigate('/gallery')}
            className="w-44 border-2 border-purple-400 text-purple-300 px-6 py-2.5 font-semibold hover:bg-purple-400 hover:text-black transition-all duration-300 backdrop-blur-sm text-sm"
          >
            {text.btnGallery}
          </button>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
    </div>
  );
};

export default Home;