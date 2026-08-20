import { PrimeFluidGain, FluidLoss } from '../types';

/**
 * Calculates Body Surface Area (BSA) using Mosteller formula:
 * BSA (m²) = sqrt( [Height (cm) × Weight (kg)] / 3600 )
 */
export function calculateBsaMosteller(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return 0;
  const bsa = Math.sqrt((heightCm * weightKg) / 3600);
  return Number(bsa.toFixed(2));
}

/**
 * Calculates Body Surface Area (BSA) using DuBois formula
 */
export function calculateBsaDuBois(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return 0;
  const bsa = 0.007184 * Math.pow(heightCm, 0.725) * Math.pow(weightKg, 0.425);
  return Number(bsa.toFixed(2));
}

/**
 * Calculates target cardiac perfusion flow rates (LPM) based on BSA:
 * Standard Adult Index = 2.4 L/min/m²
 * High Index / Pediatric/Normothermic = 3.0 L/min/m²
 */
export function calculateFlowRates(bsa: number): { flow24: number; flow30: number } {
  if (!bsa || bsa <= 0) return { flow24: 0, flow30: 0 };
  return {
    flow24: Number((bsa * 2.4).toFixed(2)),
    flow30: Number((bsa * 3.0).toFixed(2)),
  };
}

/**
 * Calculates Heparin initial loading dose (typically 300 - 400 IU / kg)
 */
export function calculateHeparinDose(weightKg: number, unitsPerKg: number = 350): number {
  if (!weightKg || weightKg <= 0) return 0;
  return Math.round(weightKg * unitsPerKg);
}

/**
 * Calculates Protamine reversal dose (1 mg per 100 IU Heparin)
 */
export function calculateProtamineDose(heparinUnits: number): number {
  if (!heparinUnits || heparinUnits <= 0) return 0;
  return Number((heparinUnits / 100).toFixed(1));
}

/**
 * Auto-calculates Prime totals, Fluid Gain, Fluid Loss and Net Balance
 */
export function calculateFluidBalance(
  primeGain: PrimeFluidGain,
  fluidLoss: FluidLoss
): {
  totalPrimeBefore: number;
  totalPrimeDuring: number;
  totalGain: number;
  totalLoss: number;
  netBalance: number;
} {
  const num = (v: string | number) => {
    const parsed = parseFloat(String(v || '0').replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  const pb =
    num(primeGain.plasmalyteBefore) +
    num(primeGain.albuminBefore) +
    num(primeGain.bicarbBefore) +
    num(primeGain.mannitolBefore) +
    num(primeGain.bloodBefore);

  const pd =
    num(primeGain.plasmalyteDuring) +
    num(primeGain.albuminDuring) +
    num(primeGain.bicarbDuring) +
    num(primeGain.mannitolDuring) +
    num(primeGain.bloodDuring);

  const gain = pb + pd;

  const loss =
    num(fluidLoss.postPerfVol) +
    num(fluidLoss.orLossSponges) +
    num(fluidLoss.urine) +
    num(fluidLoss.others) +
    num(fluidLoss.cufMuf);

  const balance = gain - loss;

  return {
    totalPrimeBefore: pb,
    totalPrimeDuring: pd,
    totalGain: gain,
    totalLoss: loss,
    netBalance: balance,
  };
}

/**
 * Generates an alphanumeric medical record ID (e.g. "MF-7K4P9X2A")
 */
export function generatePatientId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'MF-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
