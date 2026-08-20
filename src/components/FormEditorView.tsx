import React, { useState, useEffect, useRef } from 'react';
import { FormType, PatientRecord, RecordStatus } from '../types';
import { FORM_CONFIGS } from '../utils/storage';
import { ExactDocumentSheet } from './ExactDocumentSheet';
import { MobileFormEditor } from './MobileFormEditor';
import { calculateBsaMosteller, calculateFlowRates, calculateFluidBalance } from '../utils/calculator';
import { downloadRecordHtml, openRecordHtmlInNewTab } from '../utils/htmlExport';
import {
  ArrowLeft,
  Save,
  Download,
  Printer,
  Calculator,
  CheckCircle2,
  Sparkles,
  Eye,
  FileEdit,
  Cloud,
  FileCode,
  ExternalLink,
  FileSpreadsheet,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Smartphone,
  Maximize2,
  Wand2,
  Trash2,
} from 'lucide-react';

interface FormEditorViewProps {
  record: PatientRecord;
  onBack: () => void;
  onSave: (updatedRecord: PatientRecord, showToast?: boolean) => void;
  onDeleteRecord?: (recordId: string) => void;
  onDownloadPdf?: (record: PatientRecord, element: HTMLElement) => void;
  onOpenCalculator: () => void;
  onSaveToDrive?: (record: PatientRecord, element?: HTMLElement) => void;
  onOpenGoogleSync?: () => void;
}

export const FormEditorView: React.FC<FormEditorViewProps> = ({
  record,
  onBack,
  onSave,
  onDeleteRecord,
  onDownloadPdf,
  onOpenCalculator,
  onSaveToDrive,
  onOpenGoogleSync,
}) => {
  const [formData, setFormData] = useState<any>(record.data);
  const [status, setStatus] = useState<RecordStatus>(record.status);
  // Default to 'editor' (interactive sheet where every cell is editable)
  const [activeTab, setActiveTab] = useState<'editor' | 'mobile-form' | 'preview'>('editor');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [lastSaved, setLastSaved] = useState<string>('Just now');
  const [isSaving, setIsSaving] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const config = FORM_CONFIGS[record.formType];

  // Auto-detect small screen on mount and set appropriate zoom
  useEffect(() => {
    if (window.innerWidth < 768) {
      setZoomLevel(100);
    }
  }, []);

  // Auto-calculate BSA and Flows when height or weight changes
  useEffect(() => {
    const h = parseFloat(formData.height);
    const w = parseFloat(formData.weight);
    if (!isNaN(h) && !isNaN(w) && h > 0 && w > 0) {
      const bsa = calculateBsaMosteller(h, w);
      const flows = calculateFlowRates(bsa);
      if (bsa && !formData.bsa) {
        setFormData((prev: any) => ({
          ...prev,
          bsa: String(bsa),
          flow30: String(flows.flow30),
          flow24: String(flows.flow24),
        }));
      }
    }
  }, [formData.height, formData.weight]);

  // Recalculate Fluid Balance
  const handleAutoCalculateFluid = () => {
    if (!formData.primeGain || !formData.fluidLoss) return;
    const result = calculateFluidBalance(formData.primeGain, formData.fluidLoss);
    setFormData((prev: any) => ({
      ...prev,
      primeGain: {
        ...prev.primeGain,
        totalPrimeBefore: String(result.totalPrimeBefore || ''),
        totalPrimeDuring: String(result.totalPrimeDuring || ''),
        totalGain: String(result.totalGain || ''),
      },
      fluidLoss: {
        ...prev.fluidLoss,
        totalLoss: String(result.totalLoss || ''),
        balance: (result.netBalance >= 0 ? '+' : '') + String(result.netBalance),
      },
    }));
  };

  // Quick fill sample clinical data
  const handleFillSampleData = () => {
    const h = 172;
    const w = 68;
    const bsa = calculateBsaMosteller(h, w);
    const flows = calculateFlowRates(bsa);

    let sampleData: any = {
      ...formData,
      patientName: formData.patientName || 'Mohamed Shakeel',
      age: formData.age || '54 Yrs',
      sex: formData.sex || 'Male',
      height: String(h),
      weight: String(w),
      bsa: String(bsa),
      flow30: String(flows.flow30),
      flow24: String(flows.flow24),
      ipNo: formData.ipNo || 'IP-84921',
      bedNo: formData.bedNo || 'ICU-04',
      conDr: formData.conDr || 'Dr. M. Shakeel',
      diagnosis: formData.diagnosis || 'Triple Vessel CAD, Unstable Angina',
      surgery: formData.surgery || 'CABG x 3 (LIMA-LAD, SVG-OM, SVG-PDA)',
      date: formData.date || new Date().toISOString().split('T')[0],
      otLpm: '2.4',
      surgeon: 'Dr. Mohamed Shakeel',
      anaesthesist: 'Dr. Rajesh M.D',
      perfusionist: 'Perfusion Care Team',
      bloodGroup: 'O +ve',
      preHb: '13.8',
      circHb: '9.5',
      hepTime: '09:30',
      hepDose: '25,000 IU',
      actTime: '09:45',
      actValue: '485',
      remarks: 'DM: Controlled, HTN: Grade 1, CKD: Nil',
      creat: '0.9 mg/dL',
      ef: '55%',
    };

    if (record.formType === 'adult' || record.formType === 'pediatric') {
      sampleData = {
        ...sampleData,
        oxygenator: 'Medtronic Fusion',
        cpds: 'Del Nido 1:4',
        cpbOn: '10:00',
        cpbOff: '12:15',
        accOn: '10:15',
        acOff: '11:45',
        cannulasAortic: '22 Fr Curved',
        cannulasSvc: '28/32 Fr Dual Stage',
        tubingsAv: '3/8 x 3/8',
        hemofilter: 'BC 140 Plus',
        bsTime: '10:30',
        bsValue: '124 mg/dL',
        cardioplegia: {
          times: ['10:15', '10:45', '11:15'],
          doses: ['1000 ml', '500 ml', '400 ml'],
          total: '1900 ml',
        },
        primeGain: {
          plasmalyteBefore: '1000',
          plasmalyteDuring: '500',
          albuminBefore: '100',
          albuminDuring: '0',
          bicarbBefore: '50',
          bicarbDuring: '50',
          mannitolBefore: '100',
          mannitolDuring: '0',
          bloodBefore: '0',
          bloodDuring: '350',
          totalPrimeBefore: '1250',
          totalPrimeDuring: '900',
          totalGain: '2150',
        },
        fluidLoss: {
          postPerfVol: '200',
          orLossSponges: '300',
          urine: '850',
          others: '50',
          cufMuf: '500',
          totalLoss: '1900',
          balance: '+250',
        },
      };
    }

    setFormData(sampleData);
  };

  const handleSaveToDriveAndSheets = async () => {
    setIsSaving(true);
    const updated: PatientRecord = {
      ...record,
      patientName: formData.patientName || record.patientName,
      status,
      data: formData,
      updatedAt: new Date().toISOString(),
    };

    // Save locally
    onSave(updated, false);
    setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    // Upload to Drive & Sync Sheets
    if (onSaveToDrive) {
      await onSaveToDrive(updated, sheetRef.current || undefined);
    } else if (onOpenGoogleSync) {
      onOpenGoogleSync();
    }
    setIsSaving(false);
  };

  const handleManualSave = (showToast = true) => {
    setIsSaving(true);
    const updated: PatientRecord = {
      ...record,
      patientName: formData.patientName || record.patientName,
      status,
      data: formData,
      updatedAt: new Date().toISOString(),
    };
    onSave(updated, showToast);
    setIsSaving(false);
    setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const currentRecordState: PatientRecord = {
    ...record,
    patientName: formData.patientName || record.patientName,
    status,
    data: formData,
  };

  // Zoom handlers
  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 200));
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 50));
  const resetZoom = () => setZoomLevel(100);
  const fitWidth = () => {
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      if (screenWidth < 640) {
        const scale = Math.round(((screenWidth - 32) / 920) * 100);
        setZoomLevel(Math.max(scale, 40));
      } else {
        setZoomLevel(100);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white p-3.5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition mb-2 min-h-[32px] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to {config.shortTitle} Records
          </button>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              {record.patientId}
            </span>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate max-w-[280px] sm:max-w-none">
              {formData.patientName || 'Untitled Clinical Form'}
            </h1>
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">• {config.title}</span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">

          {/* Status Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setStatus('draft')}
              className={`px-2.5 sm:px-3 py-1 text-xs font-bold rounded-lg transition min-h-[32px] cursor-pointer ${
                status === 'draft'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => setStatus('completed')}
              className={`px-2.5 sm:px-3 py-1 text-xs font-bold rounded-lg transition min-h-[32px] cursor-pointer ${
                status === 'completed'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Calculator Button */}
          <button
            onClick={onOpenCalculator}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition min-h-[36px] cursor-pointer"
            title="Open Perfusion Calculator"
          >
            <Calculator className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Calc</span>
          </button>


          {/* Download HTML Button */}
          <button
            onClick={() => downloadRecordHtml(currentRecordState)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition min-h-[36px] cursor-pointer"
            title="Download Standalone Offline HTML Form"
          >
            <FileCode className="w-4 h-4 text-[#004ac6]" />
            <span className="hidden sm:inline">HTML</span>
          </button>

          {/* Download PDF Button */}
          {onDownloadPdf && (
            <button
              onClick={() => {
                if (sheetRef.current) {
                  onDownloadPdf(currentRecordState, sheetRef.current);
                } else {
                  downloadRecordHtml(currentRecordState);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition min-h-[36px] cursor-pointer"
              title="Download PDF Document"
            >
              <Download className="w-4 h-4 text-[#004ac6]" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          )}

          {/* Delete Record Button */}
          {onDeleteRecord && (
            <button
              id="editor-delete-record-btn"
              onClick={() => onDeleteRecord(record.id)}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl transition min-h-[36px] cursor-pointer"
              title="Delete this patient record"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher, Zoom Bar & Quick Helper */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Left: View Modes */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Interactive Document Sheet (DEFAULT) */}
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition min-h-[34px] ${
              activeTab === 'editor'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Interactive Exact Sheet (Click Any Cell to Type)</span>
          </button>

          {/* Mobile Friendly Card Form */}
          <button
            onClick={() => setActiveTab('mobile-form')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition min-h-[34px] ${
              activeTab === 'mobile-form'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Form Cards</span>
          </button>

          {/* Print Preview Mode */}
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition min-h-[34px] ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Print Preview</span>
          </button>
        </div>

        {/* Right: Zoom Controls for Sheet View */}
        {activeTab !== 'mobile-form' ? (
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto">
            <span className="text-slate-500 font-semibold px-1 text-[11px]">Zoom:</span>
            
            <button
              onClick={zoomOut}
              className="p-1.5 hover:bg-white active:bg-slate-200 rounded-lg text-slate-700 transition"
              title="Zoom Out (-15%)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="font-mono font-bold text-slate-800 text-xs px-1.5 min-w-[44px] text-center">
              {zoomLevel}%
            </span>

            <button
              onClick={zoomIn}
              className="p-1.5 hover:bg-white active:bg-slate-200 rounded-lg text-slate-700 transition"
              title="Zoom In (+15%)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-300 mx-0.5" />

            <button
              onClick={fitWidth}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold rounded-lg text-[11px] transition flex items-center gap-1"
              title="Fit to screen width"
            >
              <Maximize2 className="w-3 h-3 text-blue-600" />
              Fit Screen
            </button>

            <button
              onClick={resetZoom}
              className="p-1.5 hover:bg-white active:bg-slate-200 rounded-lg text-slate-700 transition"
              title="Reset Zoom to 100%"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Saved: {lastSaved}
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">Auto-Synced</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'mobile-form' ? (
        /* Responsive Mobile Form View for Fast, Easy Details Entry on Phones */
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-blue-900 font-semibold">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>Mobile-Optimized Touch Layout</span>
            </div>
            <button
              onClick={() => setActiveTab('editor')}
              className="text-blue-700 font-bold hover:underline"
            >
              Switch to Exact Sheet →
            </button>
          </div>

          <MobileFormEditor
            record={currentRecordState}
            formData={formData}
            onChange={(updated) => setFormData(updated)}
          />

          {/* Mobile Bottom Save Button Bar: Only Save to Drive & Sheets */}
          <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-2">
            <button
              onClick={handleSaveToDriveAndSheets}
              disabled={isSaving}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[48px]"
            >
              <Cloud className="w-4 h-4" />
              <span>{isSaving ? 'Saving to Google Cloud...' : '💾 Save to Google Drive & Google Sheets'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Sheet Container with Zoom & Pan Support */
        <div className="space-y-4">
          <div className="bg-slate-200/70 p-2 sm:p-6 lg:p-8 rounded-2xl border border-slate-300/80 overflow-x-auto shadow-inner">
            <div
              ref={sheetRef}
              className="mx-auto transition-transform origin-top"
              style={{
                width: '920px',
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                marginBottom: zoomLevel < 100 ? `-${(100 - zoomLevel) * 8}px` : `${(zoomLevel - 100) * 8}px`,
              }}
            >
              <ExactDocumentSheet
                record={currentRecordState}
                isEditable={activeTab === 'editor'}
                onChange={(updated) => {
                  setFormData(updated);
                }}
              />
            </div>
          </div>

          {/* Sheet View Bottom Bar: ONLY Save to Google Drive & Google Sheets Button */}
          <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 hidden sm:block">
              <span>Status: </span>
              <strong className="text-slate-800 uppercase font-bold">{status}</strong>
              <span className="ml-2">• Last saved: {lastSaved}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* HTML Download Button */}
              <button
                type="button"
                onClick={() => downloadRecordHtml(currentRecordState)}
                className="py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-h-[44px]"
                title="Download Self-Contained HTML Form"
              >
                <FileCode className="w-4 h-4 text-[#004ac6]" />
                <span>Download HTML</span>
              </button>

              {/* PDF Download Button */}
              {onDownloadPdf && (
                <button
                  type="button"
                  onClick={() => {
                    if (sheetRef.current) {
                      onDownloadPdf(currentRecordState, sheetRef.current);
                    } else {
                      downloadRecordHtml(currentRecordState);
                    }
                  }}
                  className="py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-h-[44px]"
                  title="Download Form as PDF"
                >
                  <Download className="w-4 h-4 text-[#004ac6]" />
                  <span>Download PDF</span>
                </button>
              )}

              {/* Primary Save to Google Drive & Sheets Button */}
              <button
                type="button"
                onClick={handleSaveToDriveAndSheets}
                disabled={isSaving}
                className="py-3 px-6 bg-[#004ac6] hover:bg-[#2563eb] active:bg-[#003ea8] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px] flex-1 sm:flex-initial"
              >
                <Cloud className="w-4 h-4" />
                <span>{isSaving ? 'Saving to Cloud...' : 'Save to Drive & Sheets'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
