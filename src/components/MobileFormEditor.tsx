import React from 'react';
import { FormType, PatientRecord } from '../types';
import { calculateBsaMosteller, calculateFlowRates, calculateFluidBalance } from '../utils/calculator';
import {
  User,
  Heart,
  Activity,
  Droplets,
  Stethoscope,
  FileSpreadsheet,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';

interface MobileFormEditorProps {
  record: PatientRecord;
  formData: any;
  onChange: (updatedData: any) => void;
}

export const MobileFormEditor: React.FC<MobileFormEditorProps> = ({
  record,
  formData,
  onChange,
}) => {
  const formType = record.formType;

  const updateField = (field: string, value: any) => {
    const nextData = {
      ...formData,
      [field]: value,
    };

    // Auto-calculate BSA & flows if height or weight changed
    if (field === 'height' || field === 'weight') {
      const h = parseFloat(field === 'height' ? value : nextData.height);
      const w = parseFloat(field === 'weight' ? value : nextData.weight);
      if (!isNaN(h) && !isNaN(w) && h > 0 && w > 0) {
        const bsa = calculateBsaMosteller(h, w);
        const flows = calculateFlowRates(bsa);
        nextData.bsa = String(bsa);
        nextData.flow30 = String(flows.flow30);
        nextData.flow24 = String(flows.flow24);
      }
    }

    onChange(nextData);
  };

  const updateNestedField = (parent: string, child: string, value: any) => {
    const parentObj = formData[parent] || {};
    const updatedParent = {
      ...parentObj,
      [child]: value,
    };

    const nextData = {
      ...formData,
      [parent]: updatedParent,
    };

    if (parent === 'primeGain' || parent === 'fluidLoss') {
      const calc = calculateFluidBalance(
        nextData.primeGain || {},
        nextData.fluidLoss || {}
      );
      nextData.primeGain = {
        ...nextData.primeGain,
        totalPrimeBefore: String(calc.totalPrimeBefore || ''),
        totalPrimeDuring: String(calc.totalPrimeDuring || ''),
        totalGain: String(calc.totalGain || ''),
      };
      nextData.fluidLoss = {
        ...nextData.fluidLoss,
        totalLoss: String(calc.totalLoss || ''),
        balance: (calc.netBalance >= 0 ? '+' : '') + String(calc.netBalance),
      };
    }

    onChange(nextData);
  };

  const handleAutoFillFluids = () => {
    const calc = calculateFluidBalance(
      formData.primeGain || {},
      formData.fluidLoss || {}
    );
    onChange({
      ...formData,
      primeGain: {
        ...formData.primeGain,
        totalPrimeBefore: String(calc.totalPrimeBefore || ''),
        totalPrimeDuring: String(calc.totalPrimeDuring || ''),
        totalGain: String(calc.totalGain || ''),
      },
      fluidLoss: {
        ...formData.fluidLoss,
        totalLoss: String(calc.totalLoss || ''),
        balance: (calc.netBalance >= 0 ? '+' : '') + String(calc.netBalance),
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Demographics & Vitals Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800 font-bold text-sm">
          <User className="w-4 h-4 text-blue-600" />
          <span>Patient Demographics & Vitals</span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Patient Name *</label>
            <input
              type="text"
              value={formData.patientName || ''}
              onChange={(e) => updateField('patientName', e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Age</label>
              <input
                type="text"
                value={formData.age || ''}
                onChange={(e) => updateField('age', e.target.value)}
                placeholder="e.g. 54 Yrs"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Sex</label>
              <select
                value={formData.sex || ''}
                onChange={(e) => updateField('sex', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Height (cm)</label>
              <input
                type="number"
                value={formData.height || ''}
                onChange={(e) => updateField('height', e.target.value)}
                placeholder="e.g. 170"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Weight (kg)</label>
              <input
                type="number"
                value={formData.weight || ''}
                onChange={(e) => updateField('weight', e.target.value)}
                placeholder="e.g. 70"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Auto Calculated BSA & Flows Display */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-2.5 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] uppercase font-bold text-blue-700">BSA (m²)</div>
              <div className="font-extrabold text-slate-900 text-sm">{formData.bsa || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-blue-700">3.0 LPM</div>
              <div className="font-extrabold text-slate-900 text-sm">{formData.flow30 || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-blue-700">2.4 LPM</div>
              <div className="font-extrabold text-slate-900 text-sm">{formData.flow24 || '—'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">IP Number</label>
              <input
                type="text"
                value={formData.ipNo || ''}
                onChange={(e) => updateField('ipNo', e.target.value)}
                placeholder="e.g. IP-84920"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Bed No</label>
              <input
                type="text"
                value={formData.bedNo || ''}
                onChange={(e) => updateField('bedNo', e.target.value)}
                placeholder="e.g. ICU-04"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Diagnosis</label>
            <input
              type="text"
              value={formData.diagnosis || ''}
              onChange={(e) => updateField('diagnosis', e.target.value)}
              placeholder="e.g. CAD, Severe Triple Vessel Disease"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Surgery / Procedure</label>
            <input
              type="text"
              value={formData.surgery || ''}
              onChange={(e) => updateField('surgery', e.target.value)}
              placeholder="e.g. CABG x 3 (LIMA to LAD, SVG to OM, RCA)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Consulting Doctor</label>
              <input
                type="text"
                value={formData.conDr || ''}
                onChange={(e) => updateField('conDr', e.target.value)}
                placeholder="e.g. Dr. Shakeel"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Date</label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => updateField('date', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Clinical Team & Equipment */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800 font-bold text-sm">
          <Stethoscope className="w-4 h-4 text-indigo-600" />
          <span>Clinical Team & Lab Parameters</span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Surgeon</label>
              <input
                type="text"
                value={formData.surgeon || ''}
                onChange={(e) => updateField('surgeon', e.target.value)}
                placeholder="Dr. Mohamed Shakeel"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Blood Group</label>
              <input
                type="text"
                value={formData.bloodGroup || ''}
                onChange={(e) => updateField('bloodGroup', e.target.value)}
                placeholder="O +ve"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Anaesthetist</label>
              <input
                type="text"
                value={formData.anaesthesist || ''}
                onChange={(e) => updateField('anaesthesist', e.target.value)}
                placeholder="e.g. Dr. Rajesh"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Perfusionist</label>
              <input
                type="text"
                value={formData.perfusionist || ''}
                onChange={(e) => updateField('perfusionist', e.target.value)}
                placeholder="e.g. Perfusion Team"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Pre Hb (g/dL)</label>
              <input
                type="text"
                value={formData.preHb || ''}
                onChange={(e) => updateField('preHb', e.target.value)}
                placeholder="13.5"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">CIRC Hb (g/dL)</label>
              <input
                type="text"
                value={formData.circHb || ''}
                onChange={(e) => updateField('circHb', e.target.value)}
                placeholder="9.8"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Timings & Cannulae for CPB & ECMO */}
          {formType !== 'iabp' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">CPB ON</label>
                <input
                  type="text"
                  value={formData.cpbOn || ''}
                  onChange={(e) => updateField('cpbOn', e.target.value)}
                  placeholder="10:15"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">CPB OFF</label>
                <input
                  type="text"
                  value={formData.cpbOff || ''}
                  onChange={(e) => updateField('cpbOff', e.target.value)}
                  placeholder="12:45"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">ACC ON</label>
                <input
                  type="text"
                  value={formData.accOn || ''}
                  onChange={(e) => updateField('accOn', e.target.value)}
                  placeholder="10:30"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">ACC OFF</label>
                <input
                  type="text"
                  value={formData.acOff || ''}
                  onChange={(e) => updateField('acOff', e.target.value)}
                  placeholder="12:15"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Cannulae */}
          {formType !== 'iabp' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Aortic Cannula</label>
                <input
                  type="text"
                  value={formData.cannulasAortic || ''}
                  onChange={(e) => updateField('cannulasAortic', e.target.value)}
                  placeholder="22 Fr"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Venous (SVC/IVC)</label>
                <input
                  type="text"
                  value={formData.cannulasSvc || ''}
                  onChange={(e) => updateField('cannulasSvc', e.target.value)}
                  placeholder="28/32 Fr Dual Stage"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Anticoagulation & Heparin */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800 font-bold text-sm">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>Heparin & Anticoagulation</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Heparin Time</label>
            <input
              type="text"
              value={formData.hepTime || ''}
              onChange={(e) => updateField('hepTime', e.target.value)}
              placeholder="10:00"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Heparin Dose (IU)</label>
            <input
              type="text"
              value={formData.hepDose || ''}
              onChange={(e) => updateField('hepDose', e.target.value)}
              placeholder="25,000 IU"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">ACT Time</label>
            <input
              type="text"
              value={formData.actTime || ''}
              onChange={(e) => updateField('actTime', e.target.value)}
              placeholder="10:10"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">ACT Value (sec)</label>
            <input
              type="text"
              value={formData.actValue || ''}
              onChange={(e) => updateField('actValue', e.target.value)}
              placeholder="480 sec"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">CREAT / EF</label>
            <input
              type="text"
              value={formData.creat || ''}
              onChange={(e) => updateField('creat', e.target.value)}
              placeholder="Cr: 0.9 mg/dL"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Clinical Remarks</label>
            <input
              type="text"
              value={formData.remarks || ''}
              onChange={(e) => updateField('remarks', e.target.value)}
              placeholder="DM: Nil, HTN: Yes"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 4. Prime Gain & Fluid Balance */}
      {formType !== 'iabp' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Droplets className="w-4 h-4 text-cyan-600" />
              <span>Prime Gain & Fluid Balance</span>
            </div>
            <button
              onClick={handleAutoFillFluids}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-lg border border-emerald-200 transition"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Auto Sum
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">Prime Fluids (ml)</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Plasmalyte (Before)</label>
                <input
                  type="number"
                  value={formData.primeGain?.plasmalyteBefore || ''}
                  onChange={(e) => updateNestedField('primeGain', 'plasmalyteBefore', e.target.value)}
                  placeholder="1000"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Plasmalyte (During)</label>
                <input
                  type="number"
                  value={formData.primeGain?.plasmalyteDuring || ''}
                  onChange={(e) => updateNestedField('primeGain', 'plasmalyteDuring', e.target.value)}
                  placeholder="500"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Mannitol (ml)</label>
                <input
                  type="number"
                  value={formData.primeGain?.mannitolBefore || ''}
                  onChange={(e) => updateNestedField('primeGain', 'mannitolBefore', e.target.value)}
                  placeholder="100"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Blood / PRBC (ml)</label>
                <input
                  type="number"
                  value={formData.primeGain?.bloodDuring || ''}
                  onChange={(e) => updateNestedField('primeGain', 'bloodDuring', e.target.value)}
                  placeholder="350"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wide pt-2 border-t border-slate-100">Fluid Loss (ml)</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Urine Output</label>
                <input
                  type="number"
                  value={formData.fluidLoss?.urine || ''}
                  onChange={(e) => updateNestedField('fluidLoss', 'urine', e.target.value)}
                  placeholder="850"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">CUF / MUF</label>
                <input
                  type="number"
                  value={formData.fluidLoss?.cufMuf || ''}
                  onChange={(e) => updateNestedField('fluidLoss', 'cufMuf', e.target.value)}
                  placeholder="500"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">OR Loss Sponges</label>
                <input
                  type="number"
                  value={formData.fluidLoss?.orLossSponges || ''}
                  onChange={(e) => updateNestedField('fluidLoss', 'orLossSponges', e.target.value)}
                  placeholder="300"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Post Perf Vol</label>
                <input
                  type="number"
                  value={formData.fluidLoss?.postPerfVol || ''}
                  onChange={(e) => updateNestedField('fluidLoss', 'postPerfVol', e.target.value)}
                  placeholder="200"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Net Balance Summary Bar */}
            <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Gain / Total Loss</div>
                <div className="font-mono text-xs font-bold text-slate-200">
                  {formData.primeGain?.totalGain || '0'} ml / {formData.fluidLoss?.totalLoss || '0'} ml
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Net Fluid Balance</div>
                <div className="font-mono text-sm font-extrabold text-emerald-400">
                  {formData.fluidLoss?.balance || '0 ml'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
