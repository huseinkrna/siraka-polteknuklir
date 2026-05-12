import { useRef } from 'react';

const BETA_I = [0.000215, 0.001424, 0.001274, 0.002568, 0.000748, 0.000273];
const LAMBDA_I = [0.0124, 0.0305, 0.1115, 0.301, 1.138, 3.01];
const BETA = BETA_I.reduce((a, b) => a + b, 0); 
const LAMBDA = 1e-5;
const P0 = 1000; 

// PERBAIKAN MATEMATIKA: Menggunakan Integral dari persamaan Worth Batang
// Mengubah Differential Worth menjadi Absolute Integral Worth (Kurva S)
const calculateIntegralRho = (xn) => {
  const val = -21.526 * Math.pow(xn, 6) +
              55.99 * Math.pow(xn, 5) -
              53.76 * Math.pow(xn, 4) +
              19.431 * Math.pow(xn, 3) +
              0.6851 * Math.pow(xn, 2) -
              0.0029 * xn;
  // Normalisasi agar saat ditarik 100% (xn=1), nilainya bulat 1.0
  return val / 0.8172; 
};

export const useReactorPhysics = () => {
  const physicsState = useRef({
    n: 0.001, // Daya awal 1 Watt agar reaktor tidak "mati total" (Batas subkritis)
    C: BETA_I.map((beta_i, i) => (beta_i / (LAMBDA_I[i] * LAMBDA)) * 0.001),
    time: 0
  });

  const stepSimulation = (rods, dt_real = 0.05) => {
    const safe_xn = rods.safe / 100;
    const shim_xn = rods.shim / 100;
    const reg_xn = rods.regulate / 100;

    // KALIBRASI FISIKA SESUAI TUTORIAL
    const RHO_CORE = -0.060;  // Sub-kritis bawaan teras
    const WORTH_SAFE = 0.040; // Harga Safe Rod (Paling besar)
    const WORTH_SHIM = 0.020; // Harga Shim Rod
    const WORTH_REG = 0.005;  // Harga Regulate Rod (Kalibrasi halus)

    // Reaktivitas baru bernilai positif jika Safe ~100% dan Shim ~50%
    let rho_total = RHO_CORE + 
                    WORTH_SAFE * calculateIntegralRho(safe_xn) + 
                    WORTH_SHIM * calculateIntegralRho(shim_xn) + 
                    WORTH_REG * calculateIntegralRho(reg_xn);

    // Limitasi pengaman perhitungan
    if (rho_total > 0.005) rho_total = 0.005; 
    if (rho_total < -0.1) rho_total = -0.1;

    const SUB_STEPS = 500; 
    const dt = dt_real / SUB_STEPS;
    
    let { n, C, time } = physicsState.current;

    for (let s = 0; s < SUB_STEPS; s++) {
      let sumLambdaC = 0;
      let dC = new Array(6).fill(0);

      for (let i = 0; i < 6; i++) {
        sumLambdaC += LAMBDA_I[i] * C[i];
        dC[i] = (BETA_I[i] / LAMBDA) * n - LAMBDA_I[i] * C[i];
      }

      const dn = ((rho_total - BETA) / LAMBDA) * n + sumLambdaC;

      n += dn * dt;
      for (let i = 0; i < 6; i++) {
        C[i] += dC[i] * dt;
      }
      
      // Mengunci dasar daya pada 1 Watt agar reaksi bisa naik kembali
      if (isNaN(n) || !isFinite(n) || n < 0.001) n = 0.001; 
    }

    physicsState.current = { n, C, time: time + dt_real };

    return {
      time: physicsState.current.time,
      dayaRelatif: n,
      dayaWatt: n * P0,
      reaktivitas: rho_total,
      prekursor: C
    };
  };

  return { stepSimulation };
};