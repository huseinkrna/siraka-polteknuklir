// src/components/simulator/InteractiveReactor3D.jsx
// ============================================================
// Tampilan 3D interaktif Reaktor Kartini dengan dua mode:
//  1) ORBIT : klik komponen -> kamera terbang & fokus (bagian lain bisa disembunyikan/diredupkan)
//  2) JALAN : mode orang-pertama (FPS): WASD, lompat, tidak menembus dinding, buka pintu, info komponen
//             (logika jalan ada di FirstPersonMode.jsx, fisika di src/utils/fpsCore.js)
//
// Pengelompokan mesh menurut nama asli dari Blender:
//   - "15_Elemen_Bahan_Bakar.001" -> kunci "15_Elemen_Bahan_Bakar" (akhiran .001 dibuang, label dari partNames.js)
//   - "Dinding Gedung Reaktor"    -> kunci = nama itu sendiri
// Komponen baru otomatis bisa diklik: beri nama di Blender, ekspor ulang GLB.
// ============================================================
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useProgress, Bvh } from '@react-three/drei';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { partLabels } from '../../data/partNames';
import { partDescriptions } from '../../data/partDescriptions';
import { DOOR_GROUPS } from '../../data/doorSets';
import FirstPerson from './FirstPersonMode';

// ---------- PENGATURAN ----------
const MODEL_URL = '/models/kartini-full.glb';
const COLLISION_JSON = '/models/kartini-collision.json';
const COLLISION_BIN = '/models/kartini-collision.bin';
const BUILDING_MIN_SIZE = 15;     // meter. Kelompok tak bernomor lebih besar dari ini = gedung/lantai (disembunyikan di orbit)
const GHOST_OPACITY = 0.12;
const COLOR_SELECTED = '#38bdf8';
const COLOR_HOVER = '#fde047';
const HOME_DIR = new THREE.Vector3(0.9, 0.6, 1.1).normalize();
const QUICK_PICKS = ['16_Sumber_Neutron_AmBe', '23_Rumah_Batang_Pengaman', '22_Motor_Penggerak_Batang_Pengaman'];
// Kelompok yang dianggap struktur (tidak disorot saat mode jalan, menghalangi crosshair)
const STRUCT_NAME = /^(Lantai|Pondasi|Kaca|Kubah|Dinding|Tiang|Cerobong|Pembatas Tepi$|Ruang |Plane)/;

// ---------- UTIL NAMA ----------
const LABELED = /^\d{2}_/;
const originalName = (obj) => {
  for (let o = obj; o; o = o.parent) if (o.userData?.name) return o.userData.name;
  return obj.name || '';
};
const groupKeyOf = (name, uuid) => (LABELED.test(name) ? name.replace(/\.\d+$/, '') : name || uuid);
const prettify = (key) => key.replace(/[._]/g, ' ').trim();
const labelOf = (key) => partLabels[key]?.label ?? prettify(key);

// ---------- PERSIAPAN SCENE (sekali per model) ----------
function prepareScene(scene) {
  if (scene.userData.__prepared) return scene.userData.__prepared;
  scene.updateWorldMatrix(true, true);

  const meshes = [];
  const groups = new Map(); // key -> Mesh[]
  const doorMeshByKey = {};
  const doorCounters = {};
  const home = new THREE.Box3(); // gabungan semua bagian bernomor = area reaktor
  const all = new THREE.Box3();
  const size = new THREE.Vector3();

  scene.traverse((o) => {
    if (!o.isMesh) return;
    const name = originalName(o);
    const key = groupKeyOf(name, o.uuid);

    // Material hasil optimasi dipakai bersama; di-clone agar highlight tidak ikut bagian lain.
    const mat = o.material.clone();
    o.material = mat;

    const box = new THREE.Box3().setFromObject(o);
    all.union(box);
    if (LABELED.test(name)) home.union(box);

    o.userData.__key = key;
    o.userData.__orig = {
      emissive: mat.emissive.clone(), emissiveIntensity: mat.emissiveIntensity,
      transparent: mat.transparent, opacity: mat.opacity, depthWrite: mat.depthWrite,
    };
    if (DOOR_GROUPS.includes(name)) {
      const k = doorCounters[name] ?? 0;
      doorCounters[name] = k + 1;
      doorMeshByKey[`${name}#${k}`] = o;
    }
    meshes.push(o);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  });

  // gedung/lantai: kelompok tak bernomor dengan ukuran > 15 m; struktur: gedung + nama tertentu
  for (const [key, arr] of groups) {
    const gb = new THREE.Box3();
    arr.forEach((m) => gb.expandByObject(m));
    gb.getSize(size);
    const big = !LABELED.test(key) && Math.max(size.x, size.y, size.z) > BUILDING_MIN_SIZE;
    const struct = big || STRUCT_NAME.test(key);
    arr.forEach((m) => { m.userData.__building = big; m.userData.__struct = struct; });
  }

  if (home.isEmpty()) home.copy(all);
  const prepared = { scene, meshes, groups, home, all, doorMeshByKey };
  scene.userData.__prepared = prepared;
  return prepared;
}

const boxOfGroup = (prep, key) => {
  const box = new THREE.Box3();
  prep.groups.get(key)?.forEach((m) => box.expandByObject(m));
  return box;
};

// ---------- TAMPILAN (highlight, redup, gedung) ----------
function applyVisuals(meshes, { selected, hover, mode, showBuilding }) {
  for (const m of meshes) {
    const u = m.userData;
    const mat = m.material;
    const isSel = selected !== null && u.__key === selected;
    const isHover = !isSel && hover !== null && u.__key === hover;
    const other = selected !== null && !isSel;

    m.visible = (showBuilding || !u.__building) && !(mode === 'hide' && other);

    if (isSel) { mat.emissive.set(COLOR_SELECTED); mat.emissiveIntensity = 0.25; }
    else if (isHover) { mat.emissive.set(COLOR_HOVER); mat.emissiveIntensity = 0.45; }
    else { mat.emissive.copy(u.__orig.emissive); mat.emissiveIntensity = u.__orig.emissiveIntensity; }

    const ghost = mode === 'dim' && other;
    const transparent = ghost ? true : u.__orig.transparent;
    if (mat.transparent !== transparent) { mat.transparent = transparent; mat.needsUpdate = true; }
    mat.opacity = ghost ? Math.min(GHOST_OPACITY, u.__orig.opacity) : u.__orig.opacity;
    mat.depthWrite = ghost ? false : u.__orig.depthWrite;
  }
}

// ---------- MODEL ----------
function ReactorModel({ view, onReady, onHover, onSelect }) {
  const { scene } = useGLTF(MODEL_URL);
  const invalidate = useThree((s) => s.invalidate);
  const prep = useMemo(() => prepareScene(scene), [scene]);

  const viewRef = useRef(view);
  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { onReady(prep); }, [prep, onReady]);
  useEffect(() => { applyVisuals(prep.meshes, view); invalidate(); }, [prep, view, invalidate]);

  // Mesh mana yang boleh "kena" klik/hover: terlihat, bukan bagian redup.
  const firstPickable = (intersections) => {
    const v = viewRef.current;
    for (const hit of intersections) {
      const o = hit.object;
      const key = o.userData.__key;
      if (!key || !o.visible) continue;
      if (v.selected !== null && v.mode === 'dim' && key !== v.selected) continue;
      return key;
    }
    return null;
  };

  return (
    <Bvh firstHitOnly>
      <primitive
        object={scene}
        onPointerMove={(e) => {
          if (viewRef.current.fps) return;
          e.stopPropagation();
          onHover(firstPickable(e.intersections));
        }}
        onPointerOut={() => { if (!viewRef.current.fps) onHover(null); }}
        onClick={(e) => {
          if (viewRef.current.fps || e.delta > 4) return; // geseran (rotasi), bukan klik
          e.stopPropagation();
          onSelect(firstPickable(e.intersections));
        }}
      />
    </Bvh>
  );
}

// ---------- KAMERA ORBIT + KONTROL ----------
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function Rig({ request, enabled }) {
  const { camera, invalidate } = useThree();
  const controlsRef = useRef(null);
  const anim = useRef(null);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!request || !controls) return;
    const center = request.box.getCenter(new THREE.Vector3());
    const radius = Math.max(request.box.getBoundingSphere(new THREE.Sphere()).radius, 0.005);
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const dist = (radius / Math.sin(Math.min(vFov, hFov) / 2)) * request.margin;
    const dir = request.home ? HOME_DIR.clone() : camera.position.clone().sub(controls.target).normalize();
    if (!request.home) { dir.y = Math.max(dir.y, 0.25); dir.normalize(); }
    anim.current = {
      t: 0, dur: request.instant ? 0 : 0.9,
      fromPos: camera.position.clone(), fromTarget: controls.target.clone(),
      toTarget: center, toPos: center.clone().addScaledVector(dir, dist),
    };
    invalidate();
  }, [request, camera, invalidate]);

  useFrame((state, delta) => {
    const cam = state.camera;
    const c = controlsRef.current;
    if (!c || !enabled) return;
    const a = anim.current;
    if (a) {
      a.t = a.dur === 0 ? 1 : Math.min(1, a.t + delta / a.dur);
      const k = easeInOutCubic(a.t);
      cam.position.lerpVectors(a.fromPos, a.toPos, k);
      c.target.lerpVectors(a.fromTarget, a.toTarget, k);
      c.update();
      if (a.t >= 1) anim.current = null;
      invalidate();
    }
    // near/far mengikuti jarak agar komponen kecil tidak terpotong
    const d = cam.position.distanceTo(c.target);
    const near = THREE.MathUtils.clamp(d * 0.02, 0.002, 1);
    const far = Math.max(300, d * 40);
    if (Math.abs(near - cam.near) > near * 0.1 || far !== cam.far) {
      cam.near = near; cam.far = far; cam.updateProjectionMatrix();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={enabled}
      enableDamping
      dampingFactor={0.1}
      minDistance={0.01}
      maxDistance={150}
      zoomSpeed={1.2}
      onStart={() => { anim.current = null; }}
    />
  );
}

// Lampu yang mengikuti kamera (mode orbit) supaya bagian terfokus tidak gelap.
function Headlight({ intensity }) {
  const ref = useRef(null);
  useFrame((state) => { if (ref.current) ref.current.position.copy(state.camera.position); });
  return <pointLight ref={ref} intensity={intensity} distance={0} decay={0} />;
}

function LoadingOverlay() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
        Memuat model 3D... {Math.round(progress)}%
      </div>
    </div>
  );
}

// ---------- KOMPONEN UTAMA ----------
export default function InteractiveReactor3D() {
  const [prep, setPrep] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hover, setHover] = useState(null);
  const [mode, setMode] = useState('hide');
  const [showBuilding, setShowBuilding] = useState(false);
  const [request, setRequest] = useState(null);
  const [canvasKey, setCanvasKey] = useState(0);
  // mode jalan
  const [fps, setFps] = useState(false);
  const [locked, setLocked] = useState(false);
  const [collision, setCollision] = useState(null);
  const [collisionError, setCollisionError] = useState(false);
  const [prompt, setPrompt] = useState(null);
  const [toast, setToast] = useState(null);
  const requestId = useRef(0);
  const pointerDown = useRef({ x: 0, y: 0 });
  const glRef = useRef(null);
  const toastTimer = useRef(0);

  // Data tabrakan (dinding/lantai/pintu) dimuat di latar belakang
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const [meta, bin] = await Promise.all([
          fetch(COLLISION_JSON).then((r) => r.json()),
          fetch(COLLISION_BIN).then((r) => r.arrayBuffer()),
        ]);
        if (!dead) setCollision({ meta: meta.col, doors: meta.doors, bits: new Uint8Array(bin) });
      } catch (e) {
        console.error('Gagal memuat data tabrakan', e);
        if (!dead) setCollisionError(true);
      }
    })();
    return () => { dead = true; };
  }, []);

  const fly = useCallback((box, home, margin, instant = false) => {
    requestId.current += 1;
    setRequest({ id: requestId.current, box, home, margin, instant });
  }, []);

  const handleReady = useCallback((p) => { setPrep(p); fly(p.home, true, 1.25, true); }, [fly]);

  const focusOn = useCallback((key) => {
    if (!prep) return;
    if (key && prep.groups.has(key)) {
      if (prep.groups.get(key).some((m) => m.userData.__building)) setShowBuilding(true);
      setSelected(key); setHover(null);
      fly(boxOfGroup(prep, key), false, 1.6);
    } else {
      setSelected(null);
      fly(prep.home, true, 1.25);
    }
  }, [prep, fly]);

  const showAll = useCallback(() => {
    if (!prep) return;
    setSelected(null); setShowBuilding(true);
    fly(prep.all, true, 1.1);
  }, [prep, fly]);

  const enterFps = () => {
    if (!collision || !prep) return;
    setSelected(null); setHover(null); setPrompt(null);
    setFps(true);
    glRef.current?.domElement.requestPointerLock(); // harus dipanggil langsung dari klik pengguna
  };
  const exitFps = useCallback(() => { setFps(false); setSelected(null); setHover(null); setPrompt(null); }, []);

  const showToast = useCallback((text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  // Callback untuk mode jalan (dibuat stabil)
  const fpsCallbacks = useMemo(() => ({
    onHover: (k) => setHover((h) => (h === k ? h : k)),
    onInspect: (k) => setSelected(k),
    onPrompt: (p) => setPrompt((old) => {
      if (!p && !old) return old;
      if (p && old && p.door === old.door && p.open === old.open && p.label === old.label) return old;
      return p;
    }),
    onToast: showToast,
    onLockChange: setLocked,
  }), [showToast]);

  // Esc = kembali ke tampilan awal (mode orbit)
  useEffect(() => {
    if (fps) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') focusOn(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusOn, fps]);

  useEffect(() => {
    document.body.style.cursor = hover && !fps ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hover, fps]);

  const view = useMemo(
    () => ({ selected, hover, mode: fps ? 'none' : mode, showBuilding: fps ? true : showBuilding, fps }),
    [selected, hover, mode, showBuilding, fps]
  );

  const { numberedKeys, namedKeys } = useMemo(() => {
    if (!prep) return { numberedKeys: [], namedKeys: [] };
    const keys = [...prep.groups.keys()];
    return {
      numberedKeys: keys.filter((k) => LABELED.test(k)).sort(),
      namedKeys: keys.filter((k) => !LABELED.test(k) && /^[A-Z][a-z]/.test(k) && !/^(Cube|Cylinder|Sphere|Plane)/.test(k)).sort(),
    };
  }, [prep]);
  const quickPicks = prep ? QUICK_PICKS.filter((k) => prep.groups.has(k)) : [];

  const selectedLabel = selected ? labelOf(selected) : null;
  const selectedDesc = selected ? partDescriptions[selected] : null;
  const selectedCount = selected && prep ? prep.groups.get(selected)?.length ?? 0 : 0;

  const listRow = (k) => (
    <button
      key={k}
      onClick={() => { if (!fps) focusOn(k); }}
      onMouseEnter={() => { if (!fps) setHover(k); }}
      onMouseLeave={() => { if (!fps) setHover(null); }}
      className={`flex items-center gap-2 text-left px-2 py-1 rounded text-xs transition ${
        k === selected ? 'bg-sky-700 text-white' : 'text-gray-300 hover:bg-gray-700'
      }`}
    >
      <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: partLabels[k]?.color ?? '#9ca3af' }} />
      {labelOf(k)}
    </button>
  );

  return (
    <div
      className="w-full h-full relative bg-black"
      onPointerDownCapture={(e) => { pointerDown.current = { x: e.clientX, y: e.clientY }; }}
    >
      <LoadingOverlay />

      <Canvas
        key={canvasKey}
        style={{ background: 'black', display: 'block' }}
        camera={{ position: [0, 10, 25], fov: 40, near: 0.1, far: 1000 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        frameloop={fps ? 'always' : 'demand'}
        onCreated={({ gl }) => {
          glRef.current = gl;
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setTimeout(() => setCanvasKey((k) => k + 1), 500);
          });
        }}
        onPointerMissed={(e) => {
          if (fps) return;
          const moved = Math.hypot(e.clientX - pointerDown.current.x, e.clientY - pointerDown.current.y);
          if (moved <= 4) focusOn(null);
        }}
      >
        <color attach="background" args={[fps ? '#9ec7e8' : '#48494B']} />
        {fps && <fog attach="fog" args={['#9ec7e8', 70, 300]} />}
        {/* three r184 memakai satuan cahaya fisik: nilai dikali ±π agar setara dengan tampilan uji */}
        <ambientLight intensity={fps ? 2.8 : selected ? 3.1 : 2.2} />
        {fps && <hemisphereLight args={['#cfe8ff', '#6b7a5a', 1.9]} />}
        <directionalLight position={[10, 20, 10]} intensity={3.4} />
        <directionalLight position={[-10, 8, -6]} intensity={1.25} />
        <Headlight intensity={fps ? 0 : selected ? 2.8 : 1.1} />
        {fps && (
          <mesh rotation-x={-Math.PI / 2} position-y={-0.02}>
            <planeGeometry args={[900, 900]} />
            <meshLambertMaterial color="#7a8f68" />
          </mesh>
        )}
        <ReactorModel view={view} onReady={handleReady} onHover={setHover} onSelect={focusOn} />
        <Rig request={request} enabled={!fps} />
        {fps && prep && collision && (
          <FirstPerson prep={prep} scene={prep.scene} collision={collision} callbacks={fpsCallbacks} />
        )}
      </Canvas>

      {/* ---- Petunjuk mode orbit ---- */}
      {!fps && (
        <div className="hidden md:block absolute top-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-white text-[0.65rem] font-mono p-2 rounded-md border border-gray-600 pointer-events-none select-none">
          <div className="font-bold text-blue-300 mb-1">🎮 Kontrol</div>
          <div>👆 Klik komponen → fokus</div>
          <div>🖱️ Drag → Rotasi · Scroll → Zoom</div>
          <div>⎋ Esc / klik area kosong → kembali</div>
        </div>
      )}

      {/* ---- HUD mode jalan ---- */}
      {fps && (
        <div className="absolute inset-0 z-10 pointer-events-none select-none">
          <div className="absolute left-1/2 top-1/2 -ml-[7px] -mt-[7px] w-[14px] h-[14px]">
            <div className={`absolute left-[6px] top-0 w-[2px] h-[14px] ${prompt ? 'bg-yellow-300' : 'bg-white'}`} />
            <div className={`absolute top-[6px] left-0 h-[2px] w-[14px] ${prompt ? 'bg-yellow-300' : 'bg-white'}`} />
          </div>
          {prompt && (
            <div className="absolute left-1/2 top-[56%] -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1.5 rounded-md whitespace-nowrap">
              {prompt.door
                ? `E: ${prompt.open ? 'Tutup' : 'Buka'} ${prompt.label.toLowerCase()}`
                : `E: lihat info · ${labelOf(prompt.label)}`}
            </div>
          )}
          {toast && (
            <div className="absolute left-1/2 bottom-[12%] -translate-x-1/2 bg-black/80 text-white text-sm px-4 py-2 rounded-md">
              {toast}
            </div>
          )}
          <div className="hidden md:block absolute top-2 left-2 bg-black/60 text-white text-[0.65rem] font-mono p-2 rounded-md leading-relaxed">
            <div className="font-bold text-blue-300">Mode jalan</div>
            <div>W A S D = jalan · Shift = lari</div>
            <div>Spasi = lompat · Mouse = lihat</div>
            <div>E / klik = interaksi (pintu, info)</div>
            <div>R = titik awal · Esc = jeda</div>
          </div>
          {!locked && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center pointer-events-auto">
              <div className="bg-gray-800 text-white rounded-lg p-5 text-center max-w-xs">
                <div className="font-bold mb-1">Mode jalan dijeda</div>
                <div className="text-xs text-gray-300 mb-3">Klik “Lanjut”, lalu gunakan W A S D dan mouse.</div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => glRef.current?.domElement.requestPointerLock()}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-semibold"
                  >
                    ▶ Lanjut
                  </button>
                  <button onClick={exitFps} className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm font-semibold">
                    🔭 Keluar ke orbit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- Panel kanan (bawah di layar kecil) ---- */}
      <div className="absolute z-10 bottom-0 left-0 right-0 max-h-[45%] md:left-auto md:top-0 md:w-72 md:max-h-none bg-gray-900/95 border-t md:border-t-0 md:border-l border-gray-700 flex flex-col text-white">
        <div className="p-3 border-b border-gray-700 flex-shrink-0">
          <button
            onClick={() => (fps ? exitFps() : enterFps())}
            disabled={!fps && (!collision || !prep)}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-wait rounded text-sm font-semibold mb-3"
          >
            {fps ? '🔭 Kembali ke Mode Orbit' : collisionError ? 'Data tabrakan gagal dimuat' : collision ? '🚶 Mode Jalan (FPS)' : 'Memuat data tabrakan…'}
          </button>
          {selected ? (
            <>
              <div className="text-sm font-bold text-sky-300">{selectedLabel}</div>
              <div className="text-[0.65rem] text-gray-400 font-mono mt-0.5">
                {selected}{selectedCount > 1 ? ` · ${selectedCount} mesh` : ''}
              </div>
              <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                {selectedDesc ?? 'Belum ada deskripsi untuk bagian ini.'}
              </p>
            </>
          ) : (
            <div className="text-xs text-gray-300">
              {fps ? 'Arahkan crosshair ke komponen atau pintu, lalu tekan E.' : 'Klik sebuah komponen pada model, atau pilih dari daftar di bawah.'}
            </div>
          )}
          {!fps && (
            <>
              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={() => focusOn(null)} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-semibold">🏠 Tampilan awal</button>
                <button onClick={showAll} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-semibold">🏢 Seluruh gedung</button>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-300 mt-2 select-none">
                Bagian lain saat fokus:
                <select value={mode} onChange={(e) => setMode(e.target.value)} className="bg-gray-700 text-white rounded px-1 py-0.5 text-xs">
                  <option value="hide">Sembunyikan (paling jelas)</option>
                  <option value="dim">Redupkan</option>
                  <option value="none">Tetap tampil</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-300 mt-1 cursor-pointer select-none">
                <input type="checkbox" checked={showBuilding} onChange={(e) => setShowBuilding(e.target.checked)} />
                Tampilkan gedung &amp; lantai
              </label>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          {quickPicks.length > 0 && (
            <div className="mb-3">
              <div className="text-[0.65rem] uppercase tracking-wide text-gray-500 mb-1">Contoh komponen kecil</div>
              <div className="flex flex-wrap gap-1">
                {quickPicks.map((k) => (
                  <button key={k} onClick={() => { if (!fps) focusOn(k); }} className="px-2 py-1 bg-sky-900/60 hover:bg-sky-800 rounded text-[0.7rem]">
                    {labelOf(k)}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="text-[0.65rem] uppercase tracking-wide text-gray-500 mb-1">Komponen reaktor ({numberedKeys.length})</div>
          <div className="flex flex-col gap-0.5 mb-3">{numberedKeys.map(listRow)}</div>
          <div className="text-[0.65rem] uppercase tracking-wide text-gray-500 mb-1">Gedung &amp; ruangan ({namedKeys.length})</div>
          <div className="flex flex-col gap-0.5">{namedKeys.map(listRow)}</div>
        </div>
      </div>
    </div>
  );
}
