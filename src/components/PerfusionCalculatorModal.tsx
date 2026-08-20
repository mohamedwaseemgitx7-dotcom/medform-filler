import React, { useState } from 'react';
import {
  calculateBsaMosteller,
  calculateBsaDuBois,
  calculateFlowRates,
  calculateHeparinDose,
  calculateProtamineDose,
} from '../utils/calculator';
import { Calculator, X, Sparkles, Check, Heart, Droplet, Shield, RefreshCw } from 'lucide-react';

interface PerfusionCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyValues?: (values: {
    height: string;
    weight: string;
    bsa: string;
    flow30: string;
    flow24: string;
    hepDose: string;
  }) => void;
  initialHeight?: string;
  initialWeight?: string;
}

export const PerfusionCalculatorModal: React.FC<PerfusionCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyValues,
  initialHeight = '170',
  initialWeight = '70',
}) => {
  const [height, setHeight] = useState(initialHeight);
  const [weight, setWeight] = useState(initialWeight);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [heparinTarget, setHeparinTarget] = useState('350'); // 300 - 400 IU/kg
  const [preCpbHb, setPreCpbHb] = useState('14.0');
  const [primeVol, setPrimeVol] = useState('1200');

  if (!isOpen) return null;

  const hNum = parseFloat(height) || 0;
  const wNum = parseFloat(weight) || 0;
  const bsaMosteller = calculateBsaMosteller(hNum, wNum);
  const bsaDuBois = calculateBsaDuBois(hNum, wNum);
  const flows = calculateFlowRates(bsaMosteller);
  const hepDoseUnits = calculateHeparinDose(wNum, parseFloat(heparinTarget) || 350);
  const protamineMg = calculateProtamineDose(hepDoseUnits);

  // Est Total Blood Volume (TBV): Male ~70 mL/kg, Female ~65 mL/kg, Ped ~80 mL/kg
  const tbvFactor = gender === 'male' ? 70 : 65;
  const tbvMl = Math.round(wNum * tbvFactor);

  // Dilution Hb calculation: (TBV * PreHb) / (TBV + PrimeVol)
  const preHbNum = parseFloat(preCpbHb) || 14;
  const primeNum = parseFloat(primeVol) || 1200;
  const estimatedDilutionHb = tbvMl > 0 ? ((tbvMl * preHbNum) / (tbvMl + primeNum)).toFixed(1) : '0.0';

  const handleApply = () => {
    if (onApplyValues) {
      onApplyValues({
        height: String(hNum),
        weight: String(wNum),
        bsa: String(bsaMosteller),
        flow30: String(flows.flow30),
        flow24: String(flows.flow24),
        hepDose: `${hepDoseUnits.toLocaleString()} IU`,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Perfusion Clinical Calculator</h2>
              <p className="text-xs text-slate-500">
                Validated hemodynamics, BSA, flow index & anticoagulation dosing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Patient Biometrics Inputs */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              Patient Physical Metrics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="170"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="70"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="male">Male (70 mL/kg)</option>
                  <option value="female">Female (65 mL/kg)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Core Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* BSA Card */}
            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Body Surface Area (BSA)</span>
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-extrabold text-blue-900 tracking-tight">
                {bsaMosteller} <span className="text-sm font-semibold text-blue-700">m²</span>
              </div>
              <div className="text-[11px] text-blue-700/80 mt-1">
                Mosteller: {bsaMosteller} m² • DuBois: {bsaDuBois} m²
              </div>
            </div>

            {/* Target Flow Rates */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Target CPB Flows</span>
                <Heart className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-4">
                <div>
                  <div className="text-2xl font-extrabold text-emerald-900">{flows.flow24}</div>
                  <div className="text-[10px] font-semibold text-emerald-700">2.4 LPM/m² (Std)</div>
                </div>
                <div className="h-8 w-px bg-emerald-200"></div>
                <div>
                  <div className="text-2xl font-extrabold text-emerald-900">{flows.flow30}</div>
                  <div className="text-[10px] font-semibold text-emerald-700">3.0 LPM/m² (High)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Anticoagulation & Reversal Section */}
          <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                  Anticoagulation & Protamine Reversal
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-purple-700 font-medium">Target:</span>
                <select
                  value={heparinTarget}
                  onChange={(e) => setHeparinTarget(e.target.value)}
                  className="bg-white border border-purple-200 rounded px-1.5 py-0.5 text-xs text-purple-900 font-semibold"
                >
                  <option value="300">300 IU/kg</option>
                  <option value="350">350 IU/kg (Std)</option>
                  <option value="400">400 IU/kg</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-3 rounded-lg border border-purple-100">
                <div className="text-[11px] text-purple-700 font-medium">Initial Heparin Loading Dose</div>
                <div className="text-xl font-bold text-purple-950">
                  {hepDoseUnits.toLocaleString()} <span className="text-xs font-normal">IU</span>
                </div>
                <div className="text-[10px] text-purple-500 mt-0.5">
                  Target ACT &gt; 480 seconds before CPB
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-purple-100">
                <div className="text-[11px] text-purple-700 font-medium">Protamine Reversal (1:1 Ratio)</div>
                <div className="text-xl font-bold text-purple-950">
                  {protamineMg} <span className="text-xs font-normal">mg</span>
                </div>
                <div className="text-[10px] text-purple-500 mt-0.5">
                  Administer slowly over 10-15 minutes post-decannulation
                </div>
              </div>
            </div>
          </div>

          {/* Hemodilution Estimator */}
          <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Hemodilution & Priming Estimation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-amber-900 mb-1">Pre-CPB Hb (g/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={preCpbHb}
                  onChange={(e) => setPreCpbHb(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-amber-900 mb-1">Prime Volume (mL)</label>
                <input
                  type="number"
                  step="50"
                  value={primeVol}
                  onChange={(e) => setPrimeVol(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-200 rounded-lg"
                />
              </div>
              <div className="bg-white p-2 rounded-lg border border-amber-200 flex flex-col justify-center">
                <div className="text-[10px] font-semibold text-amber-800">Est. On-Bypass Hb</div>
                <div className="text-lg font-bold text-amber-950">
                  {estimatedDilutionHb} <span className="text-xs font-normal">g/dL</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={() => {
              setHeight('170');
              setWeight('70');
            }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset to Standard 70kg
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              Close
            </button>
            {onApplyValues && (
              <button
                onClick={handleApply}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                <Check className="w-4 h-4" />
                Apply to Clinical Sheet
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
