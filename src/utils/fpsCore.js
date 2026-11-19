// fpsCore.js
// ============================================================
// Fisika jalan orang-pertama untuk model reaktor. TANPA ketergantungan three.js,
// jadi dipakai sama persis di halaman uji dan di aplikasi React.
//
// Dunia tabrakan = grid voksel 0,1 m (permukaan semua mesh, dibuat offline dari GLB).
// Pemain = silinder (radius, tinggi). Bisa menaiki undakan <= STEP, melompat, meluncur
// di sepanjang dinding, dan terhalang pintu yang tertutup.
// ============================================================
export const PLAYER = { radius: 0.28, height: 1.7, eye: 1.6, step: 0.36, gravity: 20, jump: 6.2, walk: 3.2, run: 6.0 };
export const GROUND_Y = 0.0; // tanah virtual di luar gedung

export function createWorld(meta, bits) {
  const { res, ox, oy, oz, nx, ny, nz } = meta;
  const doorCount = new Map(); // indeks voksel -> jumlah pintu tertutup yang menempati
  const doors = new Map();     // key -> { vox:Int32Array, closed:boolean }

  const solidIdx = (i) => ((bits[i >> 3] >> (i & 7)) & 1) === 1 || (doorCount.size > 0 && doorCount.has(i));
  const solid = (ix, iy, iz) => {
    if (ix < 0 || iz < 0 || iy < 0 || ix >= nx || iz >= nz || iy >= ny) return false;
    return solidIdx((iy * nz + iz) * nx + ix);
  };
  const cx = (x) => Math.floor((x - ox) / res);
  const cy = (y) => Math.floor((y - oy) / res);
  const cz = (z) => Math.floor((z - oz) / res);

  function addDoor(key, vox, closed = true) {
    const d = { vox: Int32Array.from(vox), closed: false };
    doors.set(key, d);
    setDoor(key, closed);
  }
  function setDoor(key, closed) {
    const d = doors.get(key);
    if (!d || d.closed === closed) return;
    d.closed = closed;
    for (const i of d.vox) {
      const c = doorCount.get(i) || 0;
      if (closed) doorCount.set(i, c + 1);
      else if (c <= 1) doorCount.delete(i);
      else doorCount.set(i, c - 1);
    }
  }

  // Apakah badan pemain (kaki di y) menabrak sesuatu? (mengabaikan undakan <= step)
  function blocked(x, y, z, p = PLAYER) {
    const iy0 = cy(y + p.step), iy1 = cy(y + p.height);
    const ix0 = cx(x - p.radius), ix1 = cx(x + p.radius);
    const iz0 = cz(z - p.radius), iz1 = cz(z + p.radius);
    const r2 = (p.radius + res * 0.5) * (p.radius + res * 0.5);
    for (let iz = iz0; iz <= iz1; iz++) {
      const dz = oz + (iz + 0.5) * res - z;
      for (let ix = ix0; ix <= ix1; ix++) {
        const dx = ox + (ix + 0.5) * res - x;
        if (dx * dx + dz * dz > r2) continue;
        for (let iy = iy0; iy <= iy1; iy++) if (solid(ix, iy, iz)) return true;
      }
    }
    return false;
  }
  // Apakah kepala menabrak langit-langit (untuk melompat)?
  function headHit(x, y, z, p = PLAYER) {
    const iy = cy(y + p.height);
    const ix0 = cx(x - p.radius), ix1 = cx(x + p.radius);
    const iz0 = cz(z - p.radius), iz1 = cz(z + p.radius);
    for (let iz = iz0; iz <= iz1; iz++) for (let ix = ix0; ix <= ix1; ix++) if (solid(ix, iy, iz)) return true;
    return false;
  }
  // Tinggi permukaan tertinggi di bawah kaki (maks y+step), atau GROUND_Y.
  function ground(x, z, y, p = PLAYER) {
    const top = cy(y + p.step);
    const ix0 = cx(x - p.radius), ix1 = cx(x + p.radius);
    const iz0 = cz(z - p.radius), iz1 = cz(z + p.radius);
    const r2 = (p.radius + res * 0.5) * (p.radius + res * 0.5);
    let best = GROUND_Y;
    for (let iz = iz0; iz <= iz1; iz++) {
      const dz = oz + (iz + 0.5) * res - z;
      for (let ix = ix0; ix <= ix1; ix++) {
        const dx = ox + (ix + 0.5) * res - x;
        if (dx * dx + dz * dz > r2) continue;
        for (let iy = top; iy >= 0; iy--) {
          if (solid(ix, iy, iz)) {
            const h = oy + (iy + 0.5) * res;
            if (h > best) best = h;
            break;
          }
        }
      }
    }
    return best;
  }

  return { meta, solid, blocked, headHit, ground, addDoor, setDoor, doors };
}

// Gerakkan pemain satu langkah waktu. state = {x,y,z,vy,onGround}; input = {fx,fz (arah dunia, panjang<=1), speed, jump}
export function stepPlayer(world, s, input, dt, p = PLAYER) {
  // --- horizontal (substep agar tidak menembus dinding) ---
  const dist = Math.hypot(input.fx, input.fz) * input.speed * dt;
  const n = Math.max(1, Math.ceil(dist / 0.04));
  const mx = (input.fx * input.speed * dt) / n, mz = (input.fz * input.speed * dt) / n;
  for (let k = 0; k < n; k++) {
    if (mx === 0 && mz === 0) break;
    for (const [dx, dz] of [[mx, mz], [mx, 0], [0, mz]]) {   // coba diagonal, lalu geser per sumbu
      if (dx === 0 && dz === 0) continue;
      const nx = s.x + dx, nz = s.z + dz;
      const g = world.ground(nx, nz, s.y, p);
      if (g > s.y + p.step) continue;                       // terlalu tinggi
      const feet = Math.max(s.y, g);
      if (world.blocked(nx, feet, nz, p)) continue;
      s.x = nx; s.z = nz;
      if (s.onGround && g > s.y) s.y = g;                  // naik undakan/tangga
      break;
    }
  }
  // --- vertikal ---
  const g = world.ground(s.x, s.z, s.y, p);
  if (s.onGround && input.jump) { s.vy = p.jump; s.onGround = false; }
  if (s.onGround && g < s.y - 0.05) s.onGround = false;       // jatuh dari tepi
  if (s.onGround) { s.y = g; s.vy = 0; }
  else {
    s.vy -= p.gravity * dt;
    let ny = s.y + s.vy * dt;
    if (s.vy > 0 && world.headHit(s.x, ny, s.z, p)) s.vy = 0, ny = s.y;
    if (s.vy <= 0 && ny <= g) { ny = g; s.vy = 0; s.onGround = true; }
    s.y = ny;
  }
  return s;
}
