import { useState } from 'react';

const TimelineCard = ({ data }) => {
  const [isAfter, setIsAfter] = useState(false);

  // Menentukan gambar mana yang ditampilkan
  const currentImage = data.hasToggle 
    ? (isAfter ? data.images.sesudah : data.images.sebelum) 
    : data.images.default;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-16 px-8 border-b-2 border-gray-200">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Sisi Kiri: Konten Teks */}
        <div>
          <h3 className="text-2xl font-bold text-gray-400 mb-2">{data.year}</h3>
          <h2 className="text-4xl font-black mb-6 leading-tight uppercase">{data.title}</h2>
          <p className="text-lg text-gray-700 whitespace-pre-line mb-8 leading-relaxed">
            {data.description}
          </p>

          {/* Render Tombol Toggle Jika Data Membutuhkannya */}
          {data.hasToggle && (
            <div className="flex gap-4">
              <button
                onClick={() => setIsAfter(false)}
                className={`px-8 py-3 font-bold rounded-full transition-all ${
                  !isAfter 
                    ? 'bg-green-500 text-white shadow-lg scale-105' 
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }`}
              >
                Sebelum
              </button>
              <button
                onClick={() => setIsAfter(true)}
                className={`px-8 py-3 font-bold rounded-full transition-all ${
                  isAfter 
                    ? 'bg-green-500 text-white shadow-lg scale-105' 
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }`}
              >
                Sesudah
              </button>
            </div>
          )}
        </div>

        {/* Sisi Kanan: Konten Visual */}
        <div className="relative w-full h-[500px] bg-gray-100 rounded-xl overflow-hidden shadow-2xl border-8 border-white flex items-center justify-center">
          {/* Fallback teks jika gambar gagal load atau belum dimasukkan ke folder public */}
          <div className="absolute z-0 text-gray-400 text-center px-4">
            <p className="font-bold">Area Gambar</p>
            <p className="text-sm mt-2 font-mono break-all">{currentImage}</p>
          </div>
          
          <img 
            src={currentImage} 
            alt={`Visualisasi ${data.title}`}
            className="absolute z-10 w-full h-full object-cover transition-opacity duration-500"
            onError={(e) => e.target.style.opacity = 0} 
            onLoad={(e) => e.target.style.opacity = 1}
          />
        </div>

      </div>
    </div>
  );
};

export default TimelineCard;