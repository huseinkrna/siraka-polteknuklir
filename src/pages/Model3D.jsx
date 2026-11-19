// src/pages/Model3D.jsx
import { useState, Suspense, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Preload seluruh model 3D yang digunakan agar pemuatan instan
useGLTF.preload('/models/Dipersatukan.glb');
useGLTF.preload('/models/Cerobong.glb');
useGLTF.preload('/models/Teras Reaktor.glb');
useGLTF.preload('/models/Ruang Kontrol.glb');

// ============================================================
// DATA SELURUH 13 BAGIAN REAKTOR (10 BAGIAN ASLI + 3 BAGIAN BARU)
// Nomor 11 lama (Reaktor Secara Keseluruhan) sudah dihapus
// ============================================================

const reactorParts = [
  // --- Bagian 1 - 5 (Core 3D Asli) ---
  {
    id: 1,
    name: 'Tempat Bahan Bakar Reaktor',
    img: '/assets/images/bagian_reaktor/Core_Bahan Bakar Reaktor.png',
    desc: 'Bahan bakar TRIGA tipe 104/204 berisi paduan U-ZrH₁.₇ dengan pengayaan U-235 20%. Teras diisi 71 elemen bakar (69 tipe 104, 2 tipe 204) dengan kelongsong SS304, didistribusikan dalam 5 ring konsentris (B–F).'
  },
  {
    id: 2,
    name: 'Lazy Susan (Rak Putar)',
    img: '/assets/images/bagian_reaktor/Core_Lazy Susan.png',
    desc: 'Fasilitas iradiasi putar di bagian atas reflektor, terdiri dari 40 lubang tempat sampel (diameter 31,75 mm, kedalaman 27,4 cm) yang dapat diputar untuk iradiasi seragam.'
  },
  {
    id: 3,
    name: 'Reflektor Grafit',
    img: '/assets/images/bagian_reaktor/Core_Reflektor Grafit.png',
    desc: 'Silinder grafit setebal 30 cm, tinggi 55,9 cm, mengelilingi teras. Berfungsi memantulkan neutron kembali ke teras untuk meningkatkan fluks dan efisiensi reaksi fisi.'
  },
  {
    id: 4,
    name: 'Shielding Aluminium',
    img: '/assets/images/bagian_reaktor/Core_Shielding Alumunium.png',
    desc: 'Lapisan aluminium (grade Al 1050) setebal 6 mm yang melapisi reflektor dan dinding kolam reaktor, melindungi dari korosi dan memberikan perisai tambahan.'
  },
  {
    id: 5,
    name: 'Penampang Keseluruhan Core',
    img: '/assets/images/bagian_reaktor/Core_Penampang Keseluruhan.png',
    desc: 'Potongan melintang teras yang menunjukkan susunan 90 lubang kisi (grid plate) dengan 5 ring konsentris, posisi batang kendali (C5, C9, E1), dan central thimble.'
  },

  // --- Bagian 6 - 10 (Penampang 3D Asli) ---
  {
    id: 6,
    name: 'Penyangga Teras Reaktor',
    img: '/assets/images/bagian_reaktor/Reaktor_Penyangga Teras Reaktor.png',
    desc: 'Struktur penopang teras dan reflektor di dasar kolam, terbuat dari aluminium, mampu menahan beban teras (stress maks. 17,65 MPa) dan telah teruji terhadap fluence neutron hingga 10¹⁹ n/cm².'
  },
  {
    id: 7,
    name: 'Beam Port (Tabung Berkas Neutron)',
    img: '/assets/images/bagian_reaktor/Reaktor_Port Beam.png',
    desc: 'Empat tabung berkas neutron (3 radial, 1 tangensial) dengan diameter dalam 19,5 cm, menembus perisai beton dan reflektor, digunakan untuk eksperimen neutron radiografi, BNCT, dan reaktor subkritik.'
  },
  {
    id: 8,
    name: 'Jembatan Grafit / Bridge',
    img: '/assets/images/bagian_reaktor/Reaktor_Jembatan Grafit.png',
    desc: 'Struktur besi di atas kolam reaktor (panjang 251 cm, lebar 55 cm) sebagai platform untuk motor penggerak batang kendali, sensor suhu, dan akses loading/unloading bahan bakar.'
  },
  {
    id: 9,
    name: 'Tangki Reaktor (Kolam)',
    img: '/assets/images/bagian_reaktor/Reaktor_Tangki Reaktor.png',
    desc: 'Bejana aluminium (diameter 198 cm, tinggi 655 cm) berisi air demineralisasi setinggi 4,9 m di atas teras, berfungsi sebagai moderator, pendingin konveksi alam, dan perisai radiasi vertikal.'
  },
  {
    id: 10,
    name: 'Bulk Shielding',
    img: '/assets/images/bagian_reaktor/Reaktor_Bulk Shielding.png',
    desc: 'Kolam eksperimen perisai di sisi barat reaktor, berukuran 2,65 m x 2,40 m x 3,80 m, digunakan untuk eksperimen perisai radiasi dan penyimpanan bahan bakar bekas (3 tipe 104).'
  },

  // --- Bagian 11 - 13 (Tiga Bagian Menggunakan Cerobong.glb, Teras Reaktor.glb, Ruang Kontrol.glb) ---
  {
    id: 11,
    name: 'Cerobong',
    model: '/models/Cerobong.glb',
    desc: 'Cerobong ventilasi dan pembuangan udara gedung reaktor. Dilengkapi sistem filter radiasi aerosol serta detektor pemantauan radioaktivitas kontinu (airborne monitor) sebelum gas dialirkan ke lingkungan dengan aman.'
  },
  {
    id: 12,
    name: 'Teras Reaktor',
    model: '/models/Teras Reaktor.glb',
    desc: 'Teras Reaktor Kartini berdaya 100 kW termal tipe TRIGA Mark II. Memuat 71 elemen bakar berbahan U-ZrH₁.₇ dengan pengayaan U-235 20%, 3 batang kendali (Safe, Shim, Regulating), dummy grafit, serta fasilitas iradiasi pusat (central thimble).'
  },
  {
    id: 13,
    name: 'Ruang Kontrol',
    model: '/models/Ruang Kontrol.glb',
    desc: 'Ruang kendali operasi Reaktor Kartini. Memuat instrumen keselamatan, penampil daya reaktor real-time, sistem otomatisasi trip/SCRAM, serta tuas penggerak batang kendali yang diawasi langsung oleh supervisor operasi.'
  }
];

// ============================================================
// MODEL UTAMA 3D (SELALU DIPERSATUKAN.GLB PADA AREA KIRI)
// ============================================================

function MainReactorModel({ controlsRef }) {
  const { scene } = useGLTF('/models/Dipersatukan.glb');
  const { camera } = useThree();

  const clonedScene = useMemo(() => {
    if (!scene) return null;
    return scene.clone(true);
  }, [scene]);

  useEffect(() => {
    if (!clonedScene) return;

    clonedScene.position.set(0, 0, 0);
    clonedScene.rotation.set(0, 0, 0);
    clonedScene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    clonedScene.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const fov = camera.fov * (Math.PI / 180);
    let cameraDistance = (maxDim / 2) / Math.tan(fov / 2);
    cameraDistance = Math.max(cameraDistance * 1.55, 1.2);

    camera.position.set(cameraDistance * 0.9, cameraDistance * 0.6, cameraDistance * 0.9);
    camera.near = 0.05;
    camera.far = 4000;
    camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [clonedScene, camera, controlsRef]);

  if (!clonedScene) return null;
  return <primitive object={clonedScene} />;
}

// ============================================================
// PREVIEW 3D MODEL BAGIAN (UNTUK CEROBONG.GLB, TERAS REAKTOR.GLB, RUANG KONTROL.GLB)
// ============================================================

function PreviewModelRenderer({ url }) {
  const { scene } = useGLTF(url);
  const { camera } = useThree();

  const clonedScene = useMemo(() => {
    if (!scene) return null;
    return scene.clone(true);
  }, [scene]);

  useEffect(() => {
    if (!clonedScene) return;

    clonedScene.position.set(0, 0, 0);
    clonedScene.rotation.set(0, 0, 0);
    clonedScene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    clonedScene.position.sub(center);
    clonedScene.updateMatrixWorld(true);

    const centeredBox = new THREE.Box3().setFromObject(clonedScene);
    const sphere = new THREE.Sphere();
    centeredBox.getBoundingSphere(sphere);

    const fovRad = camera.fov * (Math.PI / 180);
    // Jarak kamera optimal berbasis radius sphere agar seluruh bagian model 100% masuk frame tanpa terpotong
    const distance = (sphere.radius / Math.sin(fovRad / 2)) * 1.15;

    // Sudut pandang isometrik 3/4 yang jelas dan konsisten untuk ketiganya
    const dir = new THREE.Vector3(1.0, 0.65, 1.0).normalize();
    // Offset target sedikit ke bawah agar model tidak tertutup overlay nama bagian di bawah
    const lookTarget = new THREE.Vector3(0, -sphere.radius * 0.1, 0);
    camera.position.copy(lookTarget.clone().add(dir.multiplyScalar(distance)));
    camera.lookAt(lookTarget);
    camera.near = 0.1;
    camera.far = distance * 5;
    camera.updateProjectionMatrix();
  }, [clonedScene, camera]);

  if (!clonedScene) return null;
  return <primitive object={clonedScene} />;
}

// ============================================================
// KOMPONEN UTAMA HALAMAN
// ============================================================

export default function Model3D() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const mainControlsRef = useRef(null);

  const total = reactorParts.length;
  const part = reactorParts[currentIndex];

  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  const handleNext = () => setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));

  const handleResetMainCamera = () => {
    if (mainControlsRef.current) {
      mainControlsRef.current.reset();
      mainControlsRef.current.target.set(0, 0, 0);
      mainControlsRef.current.update();
    }
  };

  return (
    <div className="h-screen w-full bg-black flex flex-col font-sans select-none overflow-hidden">
      {/* ============================================================
          HEADER UTAMA: GAMBAR 3D & TOMBOL BERANDA
          ============================================================ */}
      <div className="h-12 bg-gray-900 border-b border-gray-700 flex items-center px-4 justify-between flex-shrink-0 z-20">
        <h1 className="text-lg font-bold text-purple-400">Gambar 3D</h1>
        <button
          onClick={() => navigate('/')}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-xs font-semibold text-white transition cursor-pointer shadow"
        >
          Beranda
        </button>
      </div>

      {/* ============================================================
          PILIHAN TAMPILAN TUNGGAL
          ============================================================ */}
      <div className="flex justify-center p-2.5 bg-gray-800 border-b border-gray-700 flex-shrink-0 z-10 shadow-sm">
        <button className="px-6 py-1.5 rounded font-bold bg-blue-600 text-white shadow cursor-default">
          Gambar 3D
        </button>
      </div>

      {/* ============================================================
          AREA UTAMA: MODEL 3D KIRI + SIDEBAR KANAN
          ============================================================ */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* CONTAINER 3D UTAMA – SELALU MENAMPILKAN DIPERSATUKAN.GLB */}
        <div className="flex-1 h-full w-full relative min-h-0 bg-[#48494B]">
          {/* Kontrol Kamera Legend */}
          <div className="absolute top-3 left-3 z-10 bg-black/75 backdrop-blur-sm text-white text-[0.65rem] font-mono p-2.5 rounded-lg border border-gray-600 pointer-events-auto select-none shadow-lg flex flex-col gap-1">
            <div className="font-bold text-blue-300 flex items-center justify-between gap-3 border-b border-gray-700 pb-1">
              <span>🎮 Kontrol Kamera 360°</span>
              <button
                onClick={handleResetMainCamera}
                className="text-[0.6rem] bg-gray-800 hover:bg-gray-700 px-1.5 py-0.5 rounded text-gray-200 transition cursor-pointer"
                title="Reset Posisi Kamera Utama"
              >
                🔄 Reset
              </button>
            </div>
            <div>🖱️ Drag kiri → Rotasi 360°</div>
            <div>📜 Scroll → Zoom In/Out</div>
            <div>🖱️ Drag kanan (Shift+drag) → Geser (Pan)</div>
          </div>

          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center text-white bg-[#48494B]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                Memuat model utama 3D...
              </div>
            </div>
          }>
            <Canvas
              style={{ background: '#48494B', display: 'block', width: '100%', height: '100%' }}
              camera={{ position: [5, 4, 6], fov: 45 }}
              gl={{
                powerPreference: "high-performance",
                alpha: false,
                antialias: true,
              }}
            >
              <color attach="background" args={['#48494B']} />
              <ambientLight intensity={0.9} />
              <directionalLight position={[10, 15, 10]} intensity={1.5} />
              <directionalLight position={[-10, -10, -10]} intensity={0.6} />
              <directionalLight position={[0, 10, -10]} intensity={0.8} />
              <pointLight position={[0, 5, 0]} intensity={0.6} />

              <MainReactorModel controlsRef={mainControlsRef} />

              <OrbitControls
                ref={mainControlsRef}
                autoRotate={false}
                enableZoom={true}
                enablePan={true}
                makeDefault
              />
            </Canvas>
          </Suspense>
        </div>

        {/* ============================================================
            PANEL SEBELAH KANAN: GAMBAR 3D - BAGIAN
            ============================================================ */}
        <div
          className={`absolute right-0 top-0 h-full bg-gray-900 border-l border-gray-700 shadow-2xl transition-transform duration-300 ease-in-out z-10 w-80 sm:w-96 ${
            sidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col p-4 overflow-y-auto">
            {/* Judul Panel: Gambar 3D – Bagian */}
            <h2 className="text-white font-bold text-lg mb-3 border-b border-gray-600 pb-2 flex items-center gap-2">
              <span>⚛️</span>
              <span>Gambar 3D – Bagian</span>
            </h2>

            {/* Daftar Tombol Nomor Bagian (Langsung Tombol 1 s/d 13) */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {reactorParts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                    idx === currentIndex
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title={p.name}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Kotak Gambar Preview Statis (Tidak Bisa Zoom In / Zoom Out) */}
            <div className="relative flex-1 bg-black rounded border border-gray-600 overflow-hidden min-h-[260px] max-h-[360px] flex items-center justify-center mb-3">
              {part.model ? (
                /* Untuk Cerobong.glb, Teras Reaktor.glb, Ruang Kontrol.glb (Gambar Tetap Statis, Tidak Bisa Diubah atau Digeser) */
                <div className="w-full h-full relative bg-black pointer-events-none select-none">
                  <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-black">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400 mr-2"></div>
                      Memuat gambar...
                    </div>
                  }>
                    <Canvas
                      camera={{ position: [2, 1.5, 2.5], fov: 45 }}
                      style={{ width: '100%', height: '100%', display: 'block', background: '#000000', pointerEvents: 'none' }}
                      gl={{ powerPreference: 'high-performance', antialias: true }}
                    >
                      <color attach="background" args={['#000000']} />
                      <ambientLight intensity={1.3} />
                      <directionalLight position={[10, 15, 10]} intensity={1.8} />
                      <directionalLight position={[-10, -10, -10]} intensity={0.7} />
                      <directionalLight position={[0, 10, -10]} intensity={0.9} />
                      <pointLight position={[0, 3, 0]} intensity={0.9} />

                      {/* Render model 3D sebagai gambar tetap statis tanpa interaksi pergeseran */}
                      <PreviewModelRenderer url={part.model} />
                    </Canvas>
                  </Suspense>
                </div>
              ) : (
                /* Untuk Bagian 1-10 yang menggunakan gambar asli */
                <img
                  src={part.img}
                  alt={part.name}
                  className="w-full h-full object-contain p-2 select-none pointer-events-none"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/images/bagian_reaktor/Core_Bahan Bakar Reaktor.png';
                  }}
                />
              )}

              {/* Overlay Nama Bagian di Bawah Gambar */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-sm font-bold p-2 text-center pointer-events-none z-10">
                {part.name}
              </div>
            </div>

            {/* Deskripsi Penjelasan Bagian */}
            <div className="text-gray-300 text-sm leading-relaxed overflow-y-auto max-h-36 mb-3">
              {part.desc}
            </div>

            {/* Navigasi Sebelum & Sesudah */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-700 mt-auto">
              <button
                onClick={handlePrev}
                className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-bold transition flex items-center gap-1 cursor-pointer"
              >
                ◀ Sebelum
              </button>
              <span className="text-gray-400 text-xs font-mono">
                {currentIndex + 1} / {total}
              </span>
              <button
                onClick={handleNext}
                className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-bold transition flex items-center gap-1 cursor-pointer"
              >
                Sesudah ▶
              </button>
            </div>
          </div>
        </div>

        {/* Tombol Toggle Sidebar (Kanan) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`absolute top-1/2 transform -translate-y-1/2 z-20 bg-gray-800 hover:bg-gray-700 text-white p-1 rounded-l-md border border-gray-600 border-r-0 transition-all duration-300 cursor-pointer ${
            sidebarOpen ? 'right-80 sm:right-96' : 'right-0'
          }`}
          title={sidebarOpen ? "Sembunyikan Panel Bagian" : "Tampilkan Panel Bagian"}
        >
          {sidebarOpen ? '▸' : '◂'}
        </button>
      </div>
    </div>
  );
}
