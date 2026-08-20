import React from 'react';
import {
  PatientRecord,
  AdultFormData,
  PediatricFormData,
  EcmoFormData,
  IabpFormData,
  BloodGasRow,
  EcmoRow,
  IabpRow,
  IabpLabRow,
} from '../types';
import { calculateBsaMosteller, calculateFlowRates, calculateFluidBalance } from '../utils/calculator';

interface ExactDocumentSheetProps {
  record: PatientRecord;
  isEditable?: boolean;
  onChange?: (updatedData: any) => void;
  id?: string;
}

export const ExactDocumentSheet: React.FC<ExactDocumentSheetProps> = ({
  record,
  isEditable = true,
  onChange,
  id = 'medical-exact-sheet',
}) => {
  const { formType, data } = record;

  const updateField = (field: string, value: any) => {
    if (!isEditable || !onChange) return;
    const nextData = {
      ...data,
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
    if (!isEditable || !onChange) return;
    const parentObj = (data as any)[parent] || {};
    const updatedParent = {
      ...parentObj,
      [child]: value,
    };

    const nextData = {
      ...data,
      [parent]: updatedParent,
    };

    // Recalculate fluid balance if primeGain or fluidLoss changed
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

  const updateBloodGasRow = (index: number, col: keyof BloodGasRow, val: string) => {
    if (!isEditable || !onChange) return;
    const rows = [...((data as AdultFormData).bloodGasRows || [])];
    if (rows[index]) {
      rows[index] = { ...rows[index], [col]: val };
      onChange({ ...data, bloodGasRows: rows });
    }
  };

  const updateEcmoRow = (index: number, col: keyof EcmoRow, val: string) => {
    if (!isEditable || !onChange) return;
    const rows = [...((data as EcmoFormData).ecmoRows || [])];
    if (rows[index]) {
      rows[index] = { ...rows[index], [col]: val };
      onChange({ ...data, ecmoRows: rows });
    }
  };

  const updateIabpRow = (index: number, col: keyof IabpRow, val: string) => {
    if (!isEditable || !onChange) return;
    const rows = [...((data as IabpFormData).iabpRows || [])];
    if (rows[index]) {
      rows[index] = { ...rows[index], [col]: val };
      onChange({ ...data, iabpRows: rows });
    }
  };

  const updateIabpLabRow = (index: number, col: keyof IabpLabRow, val: string) => {
    if (!isEditable || !onChange) return;
    const rows = [...((data as IabpFormData).labRows || [])];
    if (rows[index]) {
      rows[index] = { ...rows[index], [col]: val };
      onChange({ ...data, labRows: rows });
    }
  };

  // Helper for input cell vs static text in exact sheet with clear click-to-type visual cues
  const renderCell = (
    value: string | number | undefined,
    fieldPath: string,
    placeholder: string = 'Click to type',
    className: string = ''
  ) => {
    if (!isEditable) {
      return (
        <span className={`font-semibold text-black block truncate min-h-[18px] ${className}`}>
          {value || ''}
        </span>
      );
    }

    return (
      <input
        type="text"
        value={value !== undefined && value !== null ? String(value) : ''}
        placeholder={placeholder}
        onChange={(e) => {
          if (fieldPath.includes('.')) {
            const [p, c] = fieldPath.split('.');
            updateNestedField(p, c, e.target.value);
          } else {
            updateField(fieldPath, e.target.value);
          }
        }}
        className={`w-full bg-blue-50/40 hover:bg-blue-100/60 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-blue-600 px-1 py-0.5 text-xs text-black font-semibold placeholder:text-slate-400 placeholder:italic rounded-sm transition-colors ${className}`}
      />
    );
  };

  const bloodGasRows: BloodGasRow[] = (data as AdultFormData | PediatricFormData).bloodGasRows || [];
  const ecmoRows: EcmoRow[] = (data as EcmoFormData).ecmoRows || [];
  const iabpRows: IabpRow[] = (data as IabpFormData).iabpRows || [];
  const labRows: IabpLabRow[] = (data as IabpFormData).labRows || [];

  return (
    <div
      id={id}
      className="bg-white text-black p-4 sm:p-6 md:p-8 max-w-[920px] mx-auto shadow-sm print:shadow-none print:p-0 print:max-w-none text-xs font-sans border border-black/80 print:border-none select-text"
      style={{ backgroundColor: '#ffffff', color: '#000000' }}
    >
      {/* Title Header */}
      <div className="text-center mb-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-wider uppercase text-black">
          {formType === 'adult' && 'ADULT DATA SHEET'}
          {formType === 'pediatric' && 'PEDIATRIC DATA SHEET'}
          {formType === 'ecmo' && 'ECMO DATA SHEET'}
          {formType === 'iabp' && 'IABP DATA SHEET'}
        </h1>

        {formType === 'ecmo' && (
          <div className="flex justify-center items-center gap-4 mt-1 font-bold text-sm tracking-widest">
            {['VA', 'VV', 'VAV', 'VVA'].map((mode) => {
              const ecmoData = data as EcmoFormData;
              const isSelected = ecmoData.ecmoMode === mode;
              return (
                <span
                  key={mode}
                  onClick={() => isEditable && updateField('ecmoMode', mode)}
                  className={`cursor-pointer px-2 py-0.5 rounded transition ${
                    isSelected ? 'bg-black text-white font-bold' : 'hover:bg-neutral-100 text-neutral-800'
                  }`}
                >
                  {mode}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* TOP SECTION: Grid of 2 Main Columns */}
      <table className="w-full border-collapse border border-black mb-3 text-xs">
        <colgroup>
          <col style={{ width: '13%' }} />
          <col style={{ width: '37%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <tbody>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1.5 font-bold">Patient Name :</td>
            <td className="border-r border-black p-1.5 font-bold">{renderCell(data.patientName, 'patientName', 'Full Name')}</td>
            <td className="border-r border-black p-1.5 font-bold">Height :</td>
            <td className="border-r border-black p-1.5">{renderCell(data.height, 'height', 'cm')}</td>
            <td className="border-r border-black p-1.5 font-bold">Weight :</td>
            <td className="p-1.5">{renderCell(data.weight, 'weight', 'kg')}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1.5 font-bold">Age / Sex :</td>
            <td className="border-r border-black p-1.5">
              <div className="flex items-center gap-1">
                <div className="w-1/2">{renderCell(data.age, 'age', 'Age')}</div>
                <span>/</span>
                <div className="w-1/2">{renderCell(data.sex, 'sex', 'Sex')}</div>
              </div>
            </td>
            <td className="border-r border-black p-1.5 font-bold">BSA :</td>
            <td colSpan={3} className="p-1.5 font-bold">{renderCell(data.bsa, 'bsa', 'm²')}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1.5 font-bold">IP No :</td>
            <td className="border-r border-black p-1.5">{renderCell(data.ipNo, 'ipNo', 'IP No')}</td>
            <td className="border-r border-black p-1.5 font-bold">Flows :</td>
            <td className="border-r border-black p-1.5 font-bold">
              <div className="flex items-center gap-1">
                <span className="text-[10px] whitespace-nowrap font-bold">3.0 LPM:</span>
                {renderCell(data.flow30, 'flow30', '3.0 LPM')}
              </div>
            </td>
            <td colSpan={2} className="p-1.5 font-bold">
              <div className="flex items-center gap-1">
                <span className="text-[10px] whitespace-nowrap font-bold">2.4 LPM:</span>
                {renderCell(data.flow24, 'flow24', '2.4 LPM')}
              </div>
            </td>
          </tr>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1.5 font-bold">Bed No :</td>
            <td className="border-r border-black p-1.5">{renderCell(data.bedNo, 'bedNo', 'Bed No')}</td>
            <td className="border-r border-black p-1.5 font-bold">Diagnosis :</td>
            <td colSpan={3} className="p-1.5">{renderCell(data.diagnosis, 'diagnosis', 'Diagnosis / Indications')}</td>
          </tr>
          <tr>
            <td rowSpan={2} className="border-r border-black p-1.5 font-bold align-top">Con.Dr :</td>
            <td rowSpan={2} className="border-r border-black p-1.5 align-top">{renderCell(data.conDr, 'conDr', 'Consulting Doctor')}</td>
            <td className="border-r border-b border-black p-1.5 font-bold">Surgery :</td>
            <td colSpan={3} className="border-b border-black p-1.5">{renderCell(data.surgery, 'surgery', 'Surgical Procedure')}</td>
          </tr>
          <tr>
            <td className="border-r border-black p-1.5 font-bold">Date :</td>
            <td className="border-r border-black p-1.5">{renderCell(data.date, 'date', 'YYYY-MM-DD')}</td>
            <td className="border-r border-black p-1.5 font-bold text-[10px]">OT /LPM :</td>
            <td className="p-1.5">{renderCell(data.otLpm, 'otLpm', 'OT / LPM')}</td>
          </tr>
        </tbody>
      </table>

      {/* SECOND SECTION: Staff & Setup for Adult / Pediatric */}
      {(formType === 'adult' || formType === 'pediatric') && (
        <table className="w-full border-collapse border border-black mb-3 text-xs">
          <colgroup>
            <col style={{ width: '14%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '24%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <tbody>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">Surgeon :</td>
              <td colSpan={3} className="border-r border-black p-1.5">{renderCell(data.surgeon, 'surgeon', 'Operating Surgeon')}</td>
              <td className="border-r border-black p-1.5 font-bold">Blood Group :</td>
              <td className="p-1.5 font-bold">{renderCell(data.bloodGroup, 'bloodGroup', 'O +ve')}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">Anaesthesist :</td>
              <td colSpan={3} className="border-r border-black p-1.5">{renderCell(data.anaesthesist, 'anaesthesist', 'Anaesthesiologist')}</td>
              <td className="border-r border-black p-1.5 font-bold">Pre Hb :</td>
              <td className="p-1.5">{renderCell(data.preHb, 'preHb', 'g/dL')}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">Perfusionist :</td>
              <td colSpan={3} className="border-r border-black p-1.5">{renderCell(data.perfusionist, 'perfusionist', 'Perfusionist')}</td>
              <td className="border-r border-black p-1.5 font-bold">CIRC Hb :</td>
              <td className="p-1.5">{renderCell(data.circHb, 'circHb', 'g/dL')}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">Oxygenator :</td>
              <td className="border-r border-black p-1.5">{renderCell((data as AdultFormData).oxygenator, 'oxygenator', 'Oxygenator model')}</td>
              <td className="border-r border-black p-1.5 font-bold">CPDS :</td>
              <td className="border-r border-black p-1.5">{renderCell((data as AdultFormData).cpds, 'cpds', 'CPDS')}</td>
              <td className="border-r border-black p-1.5 font-bold">CPB ON :</td>
              <td className="p-1.5 font-bold">{renderCell((data as AdultFormData).cpbOn, 'cpbOn', 'HH:MM')}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">CannulasAortic :</td>
              <td className="border-r border-black p-1.5">{renderCell((data as AdultFormData).cannulasAortic, 'cannulasAortic', 'e.g. 22 Fr')}</td>
              <td className="border-r border-black p-1.5 font-bold">SVC :</td>
              <td className="border-r border-black p-1.5">{renderCell((data as AdultFormData).cannulasSvc, 'cannulasSvc', 'e.g. 28/32 Fr')}</td>
              <td className="border-r border-black p-1.5 font-bold">CPB OFF :</td>
              <td className="p-1.5 font-bold">{renderCell((data as AdultFormData).cpbOff, 'cpbOff', 'HH:MM')}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">Tubings AV :</td>
              <td className="border-r border-black p-1.5">{renderCell((data as AdultFormData).tubingsAv, 'tubingsAv', '3/8 x 3/8')}</td>
              <td className="border-r border-black p-1.5 font-bold">HEMOFILTER :</td>
              <td className="border-r border-black p-1.5">{renderCell((data as AdultFormData).hemofilter, 'hemofilter', 'Hemofilter model')}</td>
              <td className="border-r border-black p-1.5 font-bold">ACC ON :</td>
              <td className="p-1.5 font-bold">{renderCell((data as AdultFormData).accOn, 'accOn', 'HH:MM')}</td>
            </tr>
            <tr>
              <td colSpan={4} className="border-r border-black p-1.5 bg-neutral-50/50"></td>
              <td className="border-r border-black p-1.5 font-bold">AC OFF :</td>
              <td className="p-1.5 font-bold">{renderCell((data as AdultFormData).acOff, 'acOff', 'HH:MM')}</td>
            </tr>
          </tbody>
        </table>
      )}

      {/* ECMO Staff & Setup */}
      {formType === 'ecmo' && (
        <table className="w-full border-collapse border border-black mb-3 text-xs">
          <colgroup>
            <col style={{ width: '14%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <tbody>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">Surgeon :</td>
              <td colSpan={3} className="border-r border-black p-1.5">{renderCell(data.surgeon, 'surgeon', 'Primary Surgeon')}</td>
              <td className="border-r border-black p-1.5 font-bold">Blood Group :</td>
              <td className="p-1.5 font-bold">{renderCell(data.bloodGroup, 'bloodGroup', 'Blood Group')}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">Anaesthesist :</td>
              <td colSpan={3} className="border-r border-black p-1.5">{renderCell(data.anaesthesist, 'anaesthesist', 'Anaesthesiologist')}</td>
              <td className="border-r border-black p-1.5 font-bold">Pre Hb :</td>
              <td className="p-1.5">{renderCell(data.preHb, 'preHb', 'g/dL')}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">Perfusionist :</td>
              <td colSpan={3} className="border-r border-black p-1.5">{renderCell(data.perfusionist, 'perfusionist', 'Perfusionist')}</td>
              <td className="border-r border-black p-1.5 font-bold">CIRC Hb :</td>
              <td className="p-1.5">{renderCell(data.circHb, 'circHb', 'g/dL')}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">ECMO Kit /</td>
              <td className="border-r border-black p-1.5">{renderCell((data as EcmoFormData).ecmoKit, 'ecmoKit', 'Kit spec')}</td>
              <td className="border-r border-black p-1.5 font-bold">ECMO Console :</td>
              <td className="border-r border-black p-1.5">{renderCell((data as EcmoFormData).ecmoConsole, 'ecmoConsole', 'Console spec')}</td>
              <td className="border-r border-black p-1.5 font-bold">ECMO ON :</td>
              <td className="p-1.5 font-bold">{renderCell((data as EcmoFormData).ecmoOn, 'ecmoOn', 'HH:MM')}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">CannulasAortic :</td>
              <td className="border-r border-black p-1.5">{renderCell((data as EcmoFormData).cannulasAortic, 'cannulasAortic', 'Cannula Size')}</td>
              <td className="border-r border-black p-1.5 font-bold">SVC :</td>
              <td className="border-r border-black p-1.5">{renderCell((data as EcmoFormData).cannulasSvc, 'cannulasSvc', 'SVC Cannula')}</td>
              <td className="border-r border-black p-1.5 font-bold">ECMO OFF :</td>
              <td className="p-1.5 font-bold">{renderCell((data as EcmoFormData).ecmoOff, 'ecmoOff', 'HH:MM')}</td>
            </tr>
            <tr>
              <td className="border-r border-black p-1.5 font-bold">Tubings AV :</td>
              <td className="border-r border-black p-1.5">{renderCell((data as EcmoFormData).tubingsAv, 'tubingsAv', 'Tubing lines')}</td>
              <td className="border-r border-black p-1.5 font-bold">HEMOFILTER :</td>
              <td colSpan={3} className="p-1.5">{renderCell((data as EcmoFormData).hemofilter, 'hemofilter', 'Hemofilter')}</td>
            </tr>
          </tbody>
        </table>
      )}

      {/* IABP Staff & Setup */}
      {formType === 'iabp' && (
        <table className="w-full border-collapse border border-black mb-3 text-xs">
          <colgroup>
            <col style={{ width: '14%' }} />
            <col style={{ width: '36%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <tbody>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">Surgeon :</td>
              <td className="border-r border-black p-1.5">{renderCell(data.surgeon, 'surgeon', 'Surgeon')}</td>
              <td rowSpan={2} className="border-r border-black p-1.5 font-bold align-middle">Blood<br />Group :</td>
              <td rowSpan={2} className="border-r border-black p-1.5 font-bold align-middle">{renderCell(data.bloodGroup, 'bloodGroup', 'O +ve')}</td>
              <td className="border-r border-black p-1.5 font-bold">Hep. Time :</td>
              <td className="p-1.5 font-bold">{renderCell(data.hepTime, 'hepTime', 'HH:MM')}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">Anaesthesist :</td>
              <td className="border-r border-black p-1.5">{renderCell(data.anaesthesist, 'anaesthesist', 'Anaesthetist')}</td>
              <td className="border-r border-black p-1.5 font-bold">Hep. Dose :</td>
              <td className="p-1.5 font-bold">{renderCell(data.hepDose, 'hepDose', 'Dose')}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">Perfusionist :</td>
              <td className="border-r border-black p-1.5">{renderCell(data.perfusionist, 'perfusionist', 'Perfusionist')}</td>
              <td className="border-r border-black p-1.5 font-bold">Pre Hb :</td>
              <td className="border-r border-black p-1.5">{renderCell(data.preHb, 'preHb', 'g/dL')}</td>
              <td className="border-r border-black p-1.5 font-bold">ACT Time :</td>
              <td className="p-1.5">{renderCell(data.actTime, 'actTime', 'HH:MM')}</td>
            </tr>
            <tr>
              <td colSpan={4} className="border-r border-black p-1.5 bg-neutral-50/50"></td>
              <td className="border-r border-black p-1.5 font-bold">Value :</td>
              <td className="p-1.5">{renderCell(data.actValue, 'actValue', 'sec')}</td>
            </tr>
          </tbody>
        </table>
      )}

      {/* SECTION 3: Heparin & Lab for Adult / Pediatric / ECMO */}
      {formType !== 'iabp' && (
        <table className="w-full border-collapse border border-black mb-3 text-xs">
          <colgroup>
            <col style={{ width: '14%' }} />
            <col style={{ width: '36%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '36%' }} />
          </colgroup>
          <tbody>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">Hep. Time :</td>
              <td className="border-r border-black p-1.5 font-bold">{renderCell(data.hepTime, 'hepTime', 'HH:MM')}</td>
              <td colSpan={2} className="p-1.5 font-bold">Remarks</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">Hep. Dose :</td>
              <td className="border-r border-black p-1.5 font-bold">{renderCell(data.hepDose, 'hepDose', 'e.g. 25,000 IU')}</td>
              <td className="border-r border-black p-1.5 font-bold">CREAT :</td>
              <td className="p-1.5">{renderCell(data.creat, 'creat', 'Creatinine')}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">ACT Time :</td>
              <td className="border-r border-black p-1.5">{renderCell(data.actTime, 'actTime', 'HH:MM')}</td>
              <td className="border-r border-black p-1.5 font-bold">EF :</td>
              <td className="p-1.5">{renderCell(data.ef, 'ef', 'EF %')}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">Value :</td>
              <td className="border-r border-black p-1.5">{renderCell(data.actValue, 'actValue', 'ACT in seconds')}</td>
              <td className="border-r border-black p-1.5 font-bold">DM/HTN/CKD</td>
              <td className="p-1.5">{renderCell(data.remarks, 'remarks', 'e.g. DM: Yes, HTN: Nil')}</td>
            </tr>
            {(formType === 'adult' || formType === 'pediatric') && (
              <>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1.5 font-bold">B.S Time :</td>
                  <td className="border-r border-black p-1.5">{renderCell((data as AdultFormData).bsTime, 'bsTime', 'HH:MM')}</td>
                  <td colSpan={2} rowSpan={2} className="p-1.5 bg-neutral-50/50"></td>
                </tr>
                <tr>
                  <td className="border-r border-black p-1.5 font-bold">Value :</td>
                  <td className="border-r border-black p-1.5">{renderCell((data as AdultFormData).bsValue, 'bsValue', 'Blood Sugar')}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      )}

      {/* IABP Balloon Size banner */}
      {formType === 'iabp' && (
        <div className="mb-2 font-bold text-xs flex items-center gap-2">
          <span>Baloon Size :</span>
          <span className="w-64 border-b border-black">
            {renderCell((data as IabpFormData).balloonSize, 'balloonSize', 'e.g. 40 cc')}
          </span>
        </div>
      )}

      {/* SECTION 4: MAIN TELEMETRY TABLES */}
      {/* Adult & Pediatric Blood Gas Table */}
      {(formType === 'adult' || formType === 'pediatric') && (
        <div className="overflow-x-auto mb-3">
          <table className="w-full border-collapse border border-black text-center text-[10px]">
            <thead>
              <tr className="border-b border-black font-bold">
                <th className="border-r border-black p-1">TIME</th>
                <th className="border-r border-black p-1">TEMP</th>
                <th className="border-r border-black p-1">B FLOW</th>
                <th className="border-r border-black p-1">LP</th>
                <th className="border-r border-black p-1">MAP</th>
                <th className="border-r border-black p-1">GAS FLOW</th>
                <th className="border-r border-black p-1">FiO2</th>
                <th className="border-r border-black p-1">Hb</th>
                <th className="border-r border-black p-1">PH</th>
                <th className="border-r border-black p-1">PCO2</th>
                <th className="border-r border-black p-1">PO2</th>
                <th className="border-r border-black p-1">HCO2</th>
                <th className="border-r border-black p-1">BE</th>
                <th className="border-r border-black p-1">O%</th>
                <th className="border-r border-black p-1">NA*</th>
                <th className="border-r border-black p-1">K+</th>
                <th className="p-1">HCT</th>
              </tr>
            </thead>
            <tbody>
              {bloodGasRows.map((row, idx) => (
                <tr key={row.id || idx} className="border-b border-black h-6">
                  <td className="border-r border-black p-0.5 font-bold">
                    {idx === 0 ? 'PRE' : idx === 1 ? 'ON' : isEditable ? (
                      <input
                        type="text"
                        value={row.time || ''}
                        onChange={(e) => updateBloodGasRow(idx, 'time', e.target.value)}
                        placeholder="Time"
                        className="w-full text-center bg-blue-50/30 hover:bg-blue-100/50 focus:bg-white border-0 font-bold text-[10px] p-0 focus:outline-none"
                      />
                    ) : (
                      row.time
                    )}
                  </td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.temp, (v) => updateBloodGasRow(idx, 'temp', v), isEditable, 'Temp')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.bFlow, (v) => updateBloodGasRow(idx, 'bFlow', v), isEditable, 'Flow')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.lp, (v) => updateBloodGasRow(idx, 'lp', v), isEditable, 'LP')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.map, (v) => updateBloodGasRow(idx, 'map', v), isEditable, 'MAP')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.gasFlow, (v) => updateBloodGasRow(idx, 'gasFlow', v), isEditable, 'Gas')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.fio2, (v) => updateBloodGasRow(idx, 'fio2', v), isEditable, 'FiO2')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.hb, (v) => updateBloodGasRow(idx, 'hb', v), isEditable, 'Hb')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.ph, (v) => updateBloodGasRow(idx, 'ph', v), isEditable, 'pH')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.pco2, (v) => updateBloodGasRow(idx, 'pco2', v), isEditable, 'pCO2')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.po2, (v) => updateBloodGasRow(idx, 'po2', v), isEditable, 'pO2')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.hco3, (v) => updateBloodGasRow(idx, 'hco3', v), isEditable, 'HCO3')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.be, (v) => updateBloodGasRow(idx, 'be', v), isEditable, 'BE')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.oPercent, (v) => updateBloodGasRow(idx, 'oPercent', v), isEditable, 'O%')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.na, (v) => updateBloodGasRow(idx, 'na', v), isEditable, 'Na')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.k, (v) => updateBloodGasRow(idx, 'k', v), isEditable, 'K')}</td>
                  <td className="p-0.5">{renderRowInput(row.hct, (v) => updateBloodGasRow(idx, 'hct', v), isEditable, 'HCT')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ECMO Telemetry Table */}
      {formType === 'ecmo' && (
        <div className="overflow-x-auto mb-3">
          <table className="w-full border-collapse border border-black text-center text-[10px]">
            <thead>
              <tr className="border-b border-black font-bold">
                <th className="border-r border-black p-1">S.No</th>
                <th className="border-r border-black p-1">Time</th>
                <th className="border-r border-black p-1">BP</th>
                <th className="border-r border-black p-1">SPO2</th>
                <th className="border-r border-black p-1">PR</th>
                <th className="border-r border-black p-1">MAP</th>
                <th className="border-r border-black p-1">LP</th>
                <th className="border-r border-black p-1">P1</th>
                <th className="border-r border-black p-1">P2</th>
                <th className="border-r border-black p-1">▲P</th>
                <th className="border-r border-black p-1">FLOW</th>
                <th className="border-r border-black p-1">FiO2</th>
                <th className="p-1">Temp</th>
              </tr>
            </thead>
            <tbody>
              {ecmoRows.map((row, idx) => (
                <tr key={row.id || idx} className="border-b border-black h-6">
                  <td className="border-r border-black p-0.5 font-bold">{row.sNo || idx + 1}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.time, (v) => updateEcmoRow(idx, 'time', v), isEditable, 'Time')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.bp, (v) => updateEcmoRow(idx, 'bp', v), isEditable, 'BP')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.spo2, (v) => updateEcmoRow(idx, 'spo2', v), isEditable, 'SPO2')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.pr, (v) => updateEcmoRow(idx, 'pr', v), isEditable, 'PR')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.map, (v) => updateEcmoRow(idx, 'map', v), isEditable, 'MAP')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.lp, (v) => updateEcmoRow(idx, 'lp', v), isEditable, 'LP')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.p1, (v) => updateEcmoRow(idx, 'p1', v), isEditable, 'P1')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.p2, (v) => updateEcmoRow(idx, 'p2', v), isEditable, 'P2')}</td>
                  <td className="border-r border-black p-0.5 font-bold">{renderRowInput(row.deltaP, (v) => updateEcmoRow(idx, 'deltaP', v), isEditable, 'ΔP')}</td>
                  <td className="border-r border-black p-0.5 font-bold">{renderRowInput(row.flow, (v) => updateEcmoRow(idx, 'flow', v), isEditable, 'Flow')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.fio2, (v) => updateEcmoRow(idx, 'fio2', v), isEditable, 'FiO2')}</td>
                  <td className="p-0.5">{renderRowInput(row.temp, (v) => updateEcmoRow(idx, 'temp', v), isEditable, 'Temp')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* IABP Telemetry Table */}
      {formType === 'iabp' && (
        <div className="overflow-x-auto mb-3">
          <table className="w-full border-collapse border border-black text-center text-[10px]">
            <thead>
              <tr className="border-b border-black font-bold">
                <th className="border-r border-black p-1">S.No</th>
                <th className="border-r border-black p-1">Time</th>
                <th className="border-r border-black p-1">Trigger</th>
                <th className="border-r border-black p-1">Ratio</th>
                <th className="border-r border-black p-1">Aug.Pressure</th>
                <th className="border-r border-black p-1">Aug . lvl</th>
                <th className="border-r border-black p-1">SP</th>
                <th className="border-r border-black p-1">DP</th>
                <th className="p-1">Mean</th>
              </tr>
            </thead>
            <tbody>
              {iabpRows.map((row, idx) => (
                <tr key={row.id || idx} className="border-b border-black h-6">
                  <td className="border-r border-black p-0.5 font-bold">{row.sNo || idx + 1}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.time, (v) => updateIabpRow(idx, 'time', v), isEditable, 'Time')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.trigger, (v) => updateIabpRow(idx, 'trigger', v), isEditable, 'Trig')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.ratio, (v) => updateIabpRow(idx, 'ratio', v), isEditable, 'Ratio')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.augPressure, (v) => updateIabpRow(idx, 'augPressure', v), isEditable, 'Aug.P')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.augLvl, (v) => updateIabpRow(idx, 'augLvl', v), isEditable, 'Lvl')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.sp, (v) => updateIabpRow(idx, 'sp', v), isEditable, 'SP')}</td>
                  <td className="border-r border-black p-0.5">{renderRowInput(row.dp, (v) => updateIabpRow(idx, 'dp', v), isEditable, 'DP')}</td>
                  <td className="p-0.5">{renderRowInput(row.mean, (v) => updateIabpRow(idx, 'mean', v), isEditable, 'Mean')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cardioplegia Section for Adult / Pediatric */}
      {(formType === 'adult' || formType === 'pediatric') && (
        <table className="w-full border-collapse border border-black mb-3 text-xs">
          <colgroup>
            <col style={{ width: '45%' }} />
            <col style={{ width: '40%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <tbody>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">Cardioplegia:- Crystalloid / blood 4:1 / DELNIDO</td>
              <td className="border-r border-black p-1.5 text-right font-bold">Total</td>
              <td className="p-1.5 font-bold text-center">
                {renderCell((data as AdultFormData).cardioplegia?.total, 'cardioplegia.total', 'Total ml')}
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black p-1.5 font-bold">Time :</td>
              <td colSpan={2} className="p-1.5">
                {renderCell(
                  Array.isArray((data as AdultFormData).cardioplegia?.times)
                    ? (data as AdultFormData).cardioplegia?.times.join(', ')
                    : ((data as AdultFormData).cardioplegia as any)?.times,
                  'cardioplegia.times',
                  'e.g. 10:15, 10:45, 11:20'
                )}
              </td>
            </tr>
            <tr>
              <td className="border-r border-black p-1.5 font-bold">Dose :</td>
              <td colSpan={2} className="p-1.5">
                {renderCell(
                  Array.isArray((data as AdultFormData).cardioplegia?.doses)
                    ? (data as AdultFormData).cardioplegia?.doses.join(', ')
                    : ((data as AdultFormData).cardioplegia as any)?.doses,
                  'cardioplegia.doses',
                  'e.g. 1000ml, 500ml'
                )}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* BOTTOM SECTION: Prime Gain & Fluid Loss or IABP Supports */}
      {formType !== 'iabp' ? (
        <div className="grid grid-cols-2 gap-4">
          {/* PRIME / FLUID GAIN */}
          <div>
            <table className="w-full border-collapse border border-black text-xs text-center">
              <thead>
                <tr className="border-b border-black font-bold">
                  <th colSpan={3} className="p-1.5">PRIME / FLUID GAIN</th>
                </tr>
                <tr className="border-b border-black font-bold">
                  <th style={{ width: '44%' }} className="border-r border-black p-1"></th>
                  <th style={{ width: '28%' }} className="border-r border-black p-1">BEFORE</th>
                  <th style={{ width: '28%' }} className="p-1">DURING</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 font-bold text-left">PLASMALYTE</td>
                  <td className="border-r border-black p-0.5">{renderCell(data.primeGain?.plasmalyteBefore, 'primeGain.plasmalyteBefore', 'ml')}</td>
                  <td className="p-0.5">{renderCell(data.primeGain?.plasmalyteDuring, 'primeGain.plasmalyteDuring', 'ml')}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 font-bold text-left">ALBUMIN / COLLOID</td>
                  <td className="border-r border-black p-0.5">{renderCell(data.primeGain?.albuminBefore, 'primeGain.albuminBefore', 'ml')}</td>
                  <td className="p-0.5">{renderCell(data.primeGain?.albuminDuring, 'primeGain.albuminDuring', 'ml')}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 font-bold text-left">BICARB</td>
                  <td className="border-r border-black p-0.5">{renderCell(data.primeGain?.bicarbBefore, 'primeGain.bicarbBefore', 'ml')}</td>
                  <td className="p-0.5">{renderCell(data.primeGain?.bicarbDuring, 'primeGain.bicarbDuring', 'ml')}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 font-bold text-left">Mannitol</td>
                  <td className="border-r border-black p-0.5">{renderCell(data.primeGain?.mannitolBefore, 'primeGain.mannitolBefore', 'ml')}</td>
                  <td className="p-0.5">{renderCell(data.primeGain?.mannitolDuring, 'primeGain.mannitolDuring', 'ml')}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 font-bold text-left">BLOOD</td>
                  <td className="border-r border-black p-0.5">{renderCell(data.primeGain?.bloodBefore, 'primeGain.bloodBefore', 'ml')}</td>
                  <td className="p-0.5">{renderCell(data.primeGain?.bloodDuring, 'primeGain.bloodDuring', 'ml')}</td>
                </tr>
                <tr className="border-b border-black font-bold">
                  <td className="border-r border-black p-1 text-left">TOTAL PRIME</td>
                  <td className="border-r border-black p-0.5">{renderCell(data.primeGain?.totalPrimeBefore, 'primeGain.totalPrimeBefore', 'ml')}</td>
                  <td className="p-0.5">{renderCell(data.primeGain?.totalPrimeDuring, 'primeGain.totalPrimeDuring', 'ml')}</td>
                </tr>
                <tr className="font-bold">
                  <td className="border-r border-black p-1 text-left">TOTAL GAIN :</td>
                  <td colSpan={2} className="p-0.5">{renderCell(data.primeGain?.totalGain, 'primeGain.totalGain', 'Total Gain ml')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* FLUID LOSS */}
          <div>
            <table className="w-full border-collapse border border-black text-xs text-center">
              <thead>
                <tr className="border-b border-black font-bold">
                  <th colSpan={2} className="p-1.5">FLUID LOSS</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black">
                  <td style={{ width: '50%' }} className="border-r border-black p-1 font-bold text-left">Post. Perf. Vol</td>
                  <td style={{ width: '50%' }} className="p-0.5">{renderCell(data.fluidLoss?.postPerfVol, 'fluidLoss.postPerfVol', 'ml')}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 font-bold text-left">O . R Loss Sponges</td>
                  <td className="p-0.5">{renderCell(data.fluidLoss?.orLossSponges, 'fluidLoss.orLossSponges', 'ml')}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 font-bold text-right">Urine</td>
                  <td className="p-0.5">{renderCell(data.fluidLoss?.urine, 'fluidLoss.urine', 'ml')}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 font-bold text-right">Others</td>
                  <td className="p-0.5">{renderCell(data.fluidLoss?.others, 'fluidLoss.others', 'ml')}</td>
                </tr>
                <tr className="border-b border-black font-bold">
                  <td className="border-r border-black p-1 text-left">CUF/MUF</td>
                  <td className="p-0.5">{renderCell(data.fluidLoss?.cufMuf, 'fluidLoss.cufMuf', 'ml')}</td>
                </tr>
                <tr className="border-b border-black font-bold">
                  <td className="border-r border-black p-1 text-left">TOTAL LOSS</td>
                  <td className="p-0.5">{renderCell(data.fluidLoss?.totalLoss, 'fluidLoss.totalLoss', 'Total ml')}</td>
                </tr>
                <tr className="font-bold">
                  <td className="border-r border-black p-1 text-left">BALANCE</td>
                  <td className="p-0.5">{renderCell(data.fluidLoss?.balance, 'fluidLoss.balance', '+/- ml')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* IABP Bottom Tables: Supports & Lab Rows */
        <div className="grid grid-cols-2 gap-4">
          <div>
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="border-b border-black font-bold">
                  <th colSpan={2} className="p-1.5 text-left">Supports</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black">
                  <td style={{ width: '50%' }} className="border-r border-black p-1 font-bold">INJ. Nor-Adrenaline</td>
                  <td style={{ width: '50%' }} className="p-0.5">{renderCell((data as IabpFormData).supports?.norAdrenaline, 'supports.norAdrenaline', 'Dose')}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 font-bold">INJ. Adrenaline</td>
                  <td className="p-0.5">{renderCell((data as IabpFormData).supports?.adrenaline, 'supports.adrenaline', 'Dose')}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 font-bold">INJ. NTG</td>
                  <td className="p-0.5">{renderCell((data as IabpFormData).supports?.ntg, 'supports.ntg', 'Dose')}</td>
                </tr>
                <tr>
                  <td className="border-r border-black p-1 font-bold">INJ. Dobutamine</td>
                  <td className="p-0.5">{renderCell((data as IabpFormData).supports?.dobutamine, 'supports.dobutamine', 'Dose')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <table className="w-full border-collapse border border-black text-xs text-center">
              <thead>
                <tr className="border-b border-black font-bold">
                  <th style={{ width: '25%' }} className="border-r border-black p-1">S. No</th>
                  <th style={{ width: '40%' }} className="border-r border-black p-1">T. WBC</th>
                  <th style={{ width: '35%' }} className="p-1">PC</th>
                </tr>
              </thead>
              <tbody>
                {labRows.map((lr, idx) => (
                  <tr key={idx} className="border-b border-black h-6">
                    <td className="border-r border-black p-0.5 font-bold">{lr.sNo || idx + 1}</td>
                    <td className="border-r border-black p-0.5">{renderRowInput(lr.wbc, (v) => updateIabpLabRow(idx, 'wbc', v), isEditable, 'WBC')}</td>
                    <td className="p-0.5">{renderRowInput(lr.pc, (v) => updateIabpLabRow(idx, 'pc', v), isEditable, 'PC')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

function renderRowInput(
  value: string | undefined,
  onUpdate: (v: string) => void,
  isEditable: boolean,
  placeholder: string = '-'
) {
  if (!isEditable) {
    return <span className="block truncate font-medium text-black">{value || ''}</span>;
  }

  return (
    <input
      type="text"
      value={value || ''}
      placeholder={placeholder}
      onChange={(e) => onUpdate(e.target.value)}
      className="w-full text-center bg-blue-50/30 hover:bg-blue-100/50 focus:bg-white border-0 font-medium text-black text-[10px] p-0 focus:outline-none placeholder:text-slate-300"
    />
  );
}
