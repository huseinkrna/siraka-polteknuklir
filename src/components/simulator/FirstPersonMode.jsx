/* eslint-disable react-hooks/immutability */
// src/components/simulator/FirstPersonMode.jsx
// ============================================================
// Mode jalan orang-pertama (FPS) di dalam <Canvas>.
//  - W A S D jalan, Shift lari, Spasi lompat, mouse melihat (pointer lock)
//  - tidak menembus dinding/lantai (fisika di src/utils/fpsCore.js, data di public/models/kartini-collision.*)
//  - E / klik: buka-tutup pintu, atau lihat info komponen yang ditunjuk crosshair
//  - R: kembali ke titik awal
// Komponen ini hanya menggerakkan kamera & pintu; tampilan HUD ada di InteractiveReactor3D.jsx.
// ============================================================
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createWorld, stepPlayer, PLAYER } from '../../utils/fpsCore';
import { DOOR_SETS } from '../../data/doorSets';

const SPAWN = { x: -7, z: -28, yaw: Math.PI / 2 }; // di aula reaktor, menghadap reaktor
const REACH = 4.5; // jangkauan interaksi (meter)
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function FirstPerson({ prep, scene, collision, callbacks }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const cb = useRef(callbacks);
  useEffect(() => {
    cb.current = callbacks;
  });

  // seluruh keadaan pemain disimpan di ref (diubah tiap frame, tanpa render ulang React)
  const S = useRef({
    world: null, doorSets: [], P: { x: SPAWN.x, y: 1.05, z: SPAWN.z, vy: 0, onGround: true },
    yaw: SPAWN.yaw, pitch: 0, camY: 2.6, keys: {}, locked: false, target: null, lastInteract: 0,
    raycaster: new THREE.Raycaster(),
  });

  useEffect(() => {
    const s = S.current;
    const dom = gl.domElement;
    const controls = null; // OrbitControls dinonaktifkan oleh induk; kamera dikembalikan di cleanup
    void controls;

    // --- simpan & atur kamera ---
    const saved = {
      pos: camera.position.clone(), quat: camera.quaternion.clone(),
      fov: camera.fov, near: camera.near, far: camera.far, order: camera.rotation.order,
    };
    camera.fov = 72; camera.near = 0.05; camera.far = 600; camera.rotation.order = 'YXZ';
    camera.updateProjectionMatrix();

    // --- dunia tabrakan ---
    s.world = createWorld(collision.meta, collision.bits);
    for (const d of collision.doors) s.world.addDoor(d.key, d.vox, true);
    s.raycaster.firstHitOnly = true;

    // --- pintu ---
    const tmpSize = new THREE.Vector3();
    const pivots = [];
    s.doorSets = [];
    for (const def of DOOR_SETS) {
      const items = def.keys.map((k) => ({ key: k, mesh: prep.doorMeshByKey[k] })).filter((i) => i.mesh);
      if (!items.length) continue;
      const setBox = new THREE.Box3();
      items.forEach((i) => { i.box0 = new THREE.Box3().setFromObject(i.mesh); setBox.union(i.box0); });
      const sc = setBox.getCenter(new THREE.Vector3());
      for (const it of items) {
        const b = it.box0, c = b.getCenter(new THREE.Vector3());
        b.getSize(tmpSize);
        const pivot = new THREE.Group();
        if (def.type === 'roll') {
          pivot.position.set(c.x, b.max.y, c.z); it.kind = 'roll';
        } else {
          const longX = tmpSize.x >= tmpSize.z; it.longX = longX; it.kind = 'swing';
          const setC = longX ? sc.x : sc.z, mn = longX ? b.min.x : b.min.z, mx = longX ? b.max.x : b.max.z;
          let hinge = mn;
          if (items.length > 1) hinge = Math.abs(mn - setC) > Math.abs(mx - setC) ? mn : mx; // ujung terluar = engsel
          it.dir = hinge === mn ? 1 : -1;
          pivot.position.set(longX ? hinge : c.x, b.min.y, longX ? c.z : hinge);
        }
        scene.add(pivot); pivot.updateMatrixWorld(true); pivot.attach(it.mesh);
        it.pivot = pivot; pivots.push(pivot);
      }
      const set = { def, items, t: 0, target: 0 };
      items.forEach((i) => { i.mesh.userData.__doorSet = set; });
      s.doorSets.push(set);
    }

    const respawn = () => {
      s.P.x = SPAWN.x; s.P.z = SPAWN.z; s.P.y = s.world.ground(SPAWN.x, SPAWN.z, 1.05);
      s.P.vy = 0; s.P.onGround = true; s.yaw = SPAWN.yaw; s.pitch = 0; s.camY = s.P.y + PLAYER.eye;
    };
    respawn();

    const blockedByPlayer = (set) => set.items.some((it) => {
      const b = it.box0, P = s.P;
      return P.x > b.min.x - 0.7 && P.x < b.max.x + 0.7 && P.z > b.min.z - 0.7 && P.z < b.max.z + 0.7 && P.y < b.max.y && P.y + 1.7 > b.min.y;
    });
    const toggleDoor = (set) => {
      const P = s.P;
      if (set.target === 0) {
        set.target = 1;
        for (const it of set.items) {
          if (it.kind === 'swing') {
            const c = it.box0.getCenter(new THREE.Vector3());
            if (it.longX) { const sg = Math.sign(P.z - c.z) || 1; it.angleOpen = it.dir === sg ? Math.PI / 2 : -Math.PI / 2; }
            else { const sg = Math.sign(P.x - c.x) || 1; it.angleOpen = it.dir === -sg ? Math.PI / 2 : -Math.PI / 2; }
          }
          s.world.setDoor(it.key, false);
        }
        cb.current.onToast(`${set.def.label}: dibuka`);
      } else {
        if (blockedByPlayer(set)) { cb.current.onToast('Ada yang menghalangi di ambang pintu'); return; }
        set.target = 0;
        for (const it of set.items) s.world.setDoor(it.key, true);
        cb.current.onToast(`${set.def.label}: ditutup`);
      }
    };
    const interact = () => {
      const t = s.target;
      if (!t) { cb.current.onInspect(null); return; }
      if (t.type === 'door') toggleDoor(t.set);
      else cb.current.onInspect(t.key);
    };
    s.interact = interact;
    s.respawn = respawn;

    // --- input ---
    const onLock = () => {
      s.locked = document.pointerLockElement === dom;
      cb.current.onLockChange(s.locked);
    };
    const onMove = (e) => {
      if (!s.locked) return;
      s.yaw -= e.movementX * 0.0022;
      s.pitch = Math.max(-1.5, Math.min(1.5, s.pitch - e.movementY * 0.0022));
    };
    const onDown = () => { if (s.locked) interact(); };
    const onKeyDown = (e) => {
      s.keys[e.code] = true;
      if (!s.locked) return;
      if (e.code === 'KeyE') interact();
      if (e.code === 'KeyR') { respawn(); cb.current.onToast('Kembali ke titik awal'); }
      if (e.code === 'Space') e.preventDefault();
    };
    const onKeyUp = (e) => { s.keys[e.code] = false; };
    const onBlur = () => { s.keys = {}; };
    document.addEventListener('pointerlockchange', onLock);
    document.addEventListener('mousemove', onMove);
    dom.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('pointerlockchange', onLock);
      document.removeEventListener('mousemove', onMove);
      dom.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      if (document.pointerLockElement === dom) document.exitPointerLock();
      // kembalikan pintu ke posisi semula
      for (const set of s.doorSets) {
        for (const it of set.items) { it.pivot.rotation.set(0, 0, 0); it.pivot.scale.set(1, 1, 1); scene.attach(it.mesh); it.mesh.userData.__doorSet = null; }
      }
      pivots.forEach((p) => scene.remove(p));
      s.doorSets = []; s.world = null; s.locked = false;
      camera.fov = saved.fov; camera.near = saved.near; camera.far = saved.far; camera.rotation.order = saved.order;
      camera.position.copy(saved.pos); camera.quaternion.copy(saved.quat); camera.updateProjectionMatrix();
      cb.current.onPrompt(null); cb.current.onHover(null); cb.current.onLockChange(false);
    };
  }, [gl, camera, prep, scene, collision]);

  useFrame((state, delta) => {
    const s = S.current;
    if (!s.world) return;
    const dt = Math.min(delta, 0.05);
    const k = s.keys, P = s.P;
    if (s.locked) {
      const f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
      const r = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
      let fx = -Math.sin(s.yaw) * f + Math.cos(s.yaw) * r;
      let fz = -Math.cos(s.yaw) * f - Math.sin(s.yaw) * r;
      const len = Math.hypot(fx, fz);
      if (len > 1) { fx /= len; fz /= len; }
      stepPlayer(s.world, P, { fx, fz, speed: k.ShiftLeft || k.ShiftRight ? PLAYER.run : PLAYER.walk, jump: !!k.Space }, dt);
      if (P.y < -6) s.respawn();
    }
    // animasi pintu
    for (const set of s.doorSets) {
      if (set.t === set.target) continue;
      const d = dt / 0.7;
      set.t = set.target > set.t ? Math.min(1, set.t + d) : Math.max(0, set.t - d);
      const e = ease(set.t);
      for (const it of set.items) {
        if (it.kind === 'roll') it.pivot.scale.y = 1 - 0.94 * e;
        else it.pivot.rotation.y = (it.angleOpen || 0) * e;
      }
    }
    // kamera
    s.camY += (P.y + PLAYER.eye - s.camY) * Math.min(1, dt * 18);
    const cam = state.camera;
    cam.position.set(P.x, s.camY, P.z);
    cam.rotation.set(s.pitch, s.yaw, 0);
    // target interaksi (8x per detik)
    const now = performance.now();
    if (s.locked && now - s.lastInteract > 120) {
      s.lastInteract = now;
      s.raycaster.setFromCamera({ x: 0, y: 0 }, cam);
      s.raycaster.far = REACH;
      const hits = s.raycaster.intersectObjects(prep.meshes.filter((m) => m.visible), false);
      let target = null;
      for (const h of hits) {
        const u = h.object.userData;
        if (u.__doorSet) { target = { type: 'door', set: u.__doorSet }; break; }
        if (u.__struct) break; // dinding/lantai menghalangi
        target = { type: 'part', key: u.__key }; break;
      }
      s.target = target;
      cb.current.onHover(target && target.type === 'part' ? target.key : null);
      cb.current.onPrompt(target ? { door: target.type === 'door', open: target.type === 'door' ? target.set.target === 1 : false, label: target.type === 'door' ? target.set.def.label : target.key } : null);
    }
  });

  return null;
}
