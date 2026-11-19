// src/components/simulator/ReactorViewer3D.jsx
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

// Preload seluruh model 3D agar perpindahan antar model instan dan bebas lag
useGLTF.preload('/models/Dipersatukan.glb');
useGLTF.preload('/models/Teras Reaktor.glb');
useGLTF.preload('/models/Cerobong.glb');
useGLTF.preload('/models/Ruang Kontrol.glb');
useGLTF.preload('/models/reactor-core.glb');
useGLTF.preload('/models/cross-section.glb');

// Sub-komponen Model Renderer yang melakukan kloning aman tanpa merusak cache
function ModelRenderer({ url, controlsRef }) {
  const { scene } = useGLTF(url);
  const { camera } = useThree();

  // Kloning scene agar perubahan posisi/rotasi tidak mengubah cache asli
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    return scene.clone(true);
  }, [scene]);

  useEffect(() => {
    if (!clonedScene) return;

    // Reset transformasi sementara untuk mengukur bounding box akurat
    clonedScene.position.set(0, 0, 0);
    clonedScene.rotation.set(0, 0, 0);
    clonedScene.updateMatrixWorld(true);

    // Hitung ukuran dan pusat objek
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Posisikan tepat di pusat koordinat (0, 0, 0)
    clonedScene.position.sub(center);

    // Hitung jarak kamera optimal berdasarkan dimensi terbesar model
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const fov = camera.fov * (Math.PI / 180);
    let cameraDistance = (maxDim / 2) / Math.tan(fov / 2);
    cameraDistance = Math.max(cameraDistance * 1.5, 1.2);

    // Atur posisi kamera diagonal untuk sudut pandang isometrik terbaik
    camera.position.set(cameraDistance * 0.9, cameraDistance * 0.6, cameraDistance * 0.9);
    camera.near = Math.max(0.01, cameraDistance / 200);
    camera.far = Math.max(5000, cameraDistance * 200);
    camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
    // Catatan: JANGAN panggil geometry.dispose() pada unmount karena akan merusak cache useGLTF!
  }, [clonedScene, camera, controlsRef]);

  if (!clonedScene) return null;
  return <primitive object={clonedScene} />;
}

export default function ReactorViewer3D({ modelUrl, modelName, onResetCamera }) {
  const [hasError, setHasError] = useState(false);
  const controlsRef = useRef(null);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
    if (onResetCamera) onResetCamera();
  };

  if (hasError) {
    return (
      <div className="w-full h-full bg-[#08091C] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="text-3xl mb-2">⚠️</div>
        <h3 className="text-base font-bold text-red-400 mb-1">
          Gagal Memuat Model 3D: {modelName || 'Reaktor'}
        </h3>
        <p className="text-xs text-gray-400 max-w-sm mb-4">
          Terjadi kendala saat memuat aset model 3D atau WebGL.
        </p>
        <button
          onClick={() => setHasError(false)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold transition shadow-lg cursor-pointer"
        >
          🔄 Muat Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#070914] select-none">
      {/* KONTROL PANDUAN KAMERA */}
      <div className="absolute top-3 left-3 z-10 bg-gray-950/85 backdrop-blur-md text-white text-[0.65rem] p-2.5 rounded-xl border border-gray-700/80 shadow-lg pointer-events-auto flex flex-col gap-1">
        <div className="font-bold text-cyan-400 flex items-center justify-between gap-2 border-b border-gray-800 pb-1">
          <span>🎮 Kontrol 3D Reaktor</span>
          <button
            onClick={handleResetCamera}
            className="text-[0.6rem] bg-gray-800 hover:bg-gray-700 px-1.5 py-0.5 rounded text-gray-200 transition cursor-pointer"
            title="Reset Posisi Kamera"
          >
            🔄 Reset
          </button>
        </div>
        <div className="text-gray-300">🖱️ <strong>Klik Kiri + Geser:</strong> Rotasi 360°</div>
        <div className="text-gray-300">📜 <strong>Scroll:</strong> Zoom In / Out</div>
        <div className="text-gray-300">🖱️ <strong>Klik Kanan / Shift+Drag:</strong> Geser (Pan)</div>
      </div>

      {/* INDIKATOR MODEL AKTIF DI KANVAS */}
      <div className="absolute bottom-3 left-3 z-10 bg-gray-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-xs font-semibold text-cyan-300 shadow">
        Model Aktif: <strong className="text-white ml-1">{modelName}</strong>
      </div>

      {/* CANVAS THREE.JS / REACT THREE FIBER (PERSISTENT RENDERER TANPA DYNAMIC KEY) */}
      <Canvas
        style={{ width: '100%', height: '100%', display: 'block' }}
        camera={{ position: [5, 4, 6], fov: 45 }}
        gl={{
          powerPreference: "high-performance",
          alpha: false,
          antialias: true,
          failIfMajorPerformanceCaveat: false
        }}
        onError={(err) => {
          console.error("Canvas 3D Error:", err);
          setHasError(true);
        }}
      >
        <color attach="background" args={['#08091C']} />

        {/* PENCAHAYAAN OPTIMAL UNTUK DETAIL MODEL */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[10, 15, 10]} intensity={1.5} />
        <directionalLight position={[-10, -10, -10]} intensity={0.6} />
        <directionalLight position={[0, 10, -10]} intensity={0.8} />
        <pointLight position={[0, 5, 0]} intensity={0.6} />

        <Suspense fallback={null}>
          <ModelRenderer url={modelUrl} controlsRef={controlsRef} />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enableRotate={true}
          enableZoom={true}
          enablePan={true}
          zoomSpeed={1.0}
          panSpeed={0.8}
          dampingFactor={0.08}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
