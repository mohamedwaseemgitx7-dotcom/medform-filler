import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  FileEdit,
  Smartphone,
  ZoomIn,
  Sparkles,
  Calculator,
  Save,
  Download,
  Cloud,
  FileSpreadsheet,
  FileCode,
  Printer,
  ChevronRight,
  Stethoscope,
  Activity,
  Layers,
  Heart,
  Droplets,
  CheckCircle2,
} from 'lucide-react';

interface ClinicalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicalGuideModal: React.FC<ClinicalGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeSection, setActiveSection] = useState<'filling' | 'mobile' | 'formulas' | 'sync' | 'export'>('filling');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                Clinical Form User Guide
              </h2>
              <p className="text-xs text-slate-300">
                Step-by-step instructions for filling, calculating, zooming, and exporting records.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-1 sm:gap-2 overflow-x-auto shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveSection('filling')}
            className={`px-3 py-2.5 rounded-t-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'filling'
                ? 'bg-white text-blue-600 border-t-2 border-t-blue-600 border-x border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>1. Filling Forms</span>
          </button>

          <button
            onClick={() => setActiveSection('mobile')}
            className={`px-3 py-2.5 rounded-t-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'mobile'
                ? 'bg-white text-blue-600 border-t-2 border-t-blue-600 border-x border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>2. Mobile & Zoom</span>
          </button>

          <button
            onClick={() => setActiveSection('formulas')}
            className={`px-3 py-2.5 rounded-t-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'formulas'
                ? 'bg-white text-blue-600 border-t-2 border-t-blue-600 border-x border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>3. Auto Formulas</span>
          </button>

          <button
            onClick={() => setActiveSection('sync')}
            className={`px-3 py-2.5 rounded-t-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'sync'
                ? 'bg-white text-blue-600 border-t-2 border-t-blue-600 border-x border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>4. Google Sync</span>
          </button>

          <button
            onClick={() => setActiveSection('export')}
            className={`px-3 py-2.5 rounded-t-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'export'
                ? 'bg-white text-blue-600 border-t-2 border-t-blue-600 border-x border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>5. PDF & Print</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          {/* SECTION 1: FILLING FORMS */}
          {activeSection === 'filling' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl flex items-start gap-3">
                <FileEdit className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-blue-900 text-sm">Two Ways to Fill Your Forms</h3>
                  <p className="text-blue-800 mt-1">
                    You can enter clinical data directly on the exact document or use the touch-optimized mobile card layout.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">A</span>
                    Direct Sheet Typing
                  </div>
                  <p className="text-slate-600">
                    Click or tap any cell in the <strong>Exact Sheet</strong> (Name, Age, Sex, Height, Weight, Blood Gas rows, Heparin, etc.). The cell highlights in soft blue so you can immediately type.
                  </p>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700">
                    💡 Tip: Tab key moves to the next field rapidly.
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">B</span>
                    Fill Sample Data Button
                  </div>
                  <p className="text-slate-600">
                    Click the <strong>"Fill Sample Data"</strong> button at the top header to instantly populate a complete set of standard clinical values, flows, blood gas telemetry, and balance figures.
                  </p>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700">
                    ✨ Great for quick testing or rapid record templating.
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-2 text-amber-900">
                <Save className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Always tap <strong>Save</strong> (top right) or the floating bottom save bar to persist changes locally and trigger cloud sync.
                </span>
              </div>
            </div>
          )}

          {/* SECTION 2: MOBILE & ZOOM CONTROLS */}
          {activeSection === 'mobile' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-2xl flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-indigo-900 text-sm">Mobile View & Zooming</h3>
                  <p className="text-indigo-800 mt-1">
                    Designed specifically for phone and tablet screens so you never have trouble reading or editing wide clinical tables.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Zoom Bar Controls (+ / - / Reset)</h4>
                    <p className="text-slate-600 mt-0.5">
                      Use the <strong>+</strong> and <strong>-</strong> buttons to zoom the sheet from 50% up to 200%. Tap <strong>Fit Screen</strong> to automatically shrink the document perfectly to your phone's screen width.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Mobile Form Cards Mode</h4>
                    <p className="text-slate-600 mt-0.5">
                      Tap <strong>"Mobile Form Cards"</strong> tab to switch to large vertical cards (Demographics, Team & Cannulae, Heparin, and Fluid Balance) with touch-friendly keyboards.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                    <Save className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Floating Action Bar</h4>
                    <p className="text-slate-600 mt-0.5">
                      On mobile, a floating bar sticks to the bottom with <strong>Save Record</strong> and <strong>PDF</strong> for fast one-thumb operations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: AUTOMATIC CLINICAL CALCULATIONS */}
          {activeSection === 'formulas' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-start gap-3">
                <Calculator className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-emerald-900 text-sm">Automatic Calculations & Formulas</h3>
                  <p className="text-emerald-800 mt-1">
                    The platform computes BSA, target pump flows, fluid balances, and transfusion estimates in real time.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    BSA & Target Cardiac Index
                  </h4>
                  <p className="text-slate-600 mb-2">
                    Using <strong>Mosteller's Formula</strong>:
                  </p>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800">
                    BSA = √((Height (cm) × Weight (kg)) / 3600)
                  </div>
                  <p className="text-slate-600 mt-2">
                    Automatically derives <strong>3.0 LPM (BSA × 3.0)</strong> and <strong>2.4 LPM (BSA × 2.4)</strong>.
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-1.5">
                    <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                    Prime Gain & Fluid Balance
                  </h4>
                  <p className="text-slate-600 mb-2">
                    Click <strong>"Auto-Balance"</strong> or <strong>"Auto Sum"</strong>:
                  </p>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800">
                    Net Balance = Total Gain - Total Loss
                  </div>
                  <p className="text-slate-600 mt-2">
                    Sums Plasmalyte, Albumin, Mannitol, Blood, Urine, MUF, and Post Perf Vol.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Standalone Perfusion Calculator
                </h4>
                <p className="text-slate-600">
                  Click the <strong>Calc</strong> button in the navigation bar or form header to open the interactive clinical tool for <strong>BSA</strong>, <strong>Pump Flow Rates (CI 1.8 – 3.0)</strong>, <strong>Heparin / Protamine dosing</strong>, <strong>Circulating Hct on CPB</strong>, and <strong>Oxygen Delivery (DO2)</strong>.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 4: GOOGLE SHEETS & DRIVE SYNC */}
          {activeSection === 'sync' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-start gap-3">
                <Cloud className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-emerald-900 text-sm">Google Workspace Integration</h3>
                  <p className="text-emerald-800 mt-1">
                    Seamless sync to Google Sheets tables and automatic PDF archiving to Google Drive.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Google Sheets Sync</h4>
                    <p className="text-slate-600 mt-0.5">
                      Tap <strong>"Sheets & Drive"</strong> in the top navigation bar. Connect your Google account to automatically push records into structured tabs: <strong>Adult CPB</strong>, <strong>Pediatric CPB</strong>, <strong>ECMO Runs</strong>, and <strong>IABP Logs</strong>.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">One-Tap Drive PDF Archiving</h4>
                    <p className="text-slate-600 mt-0.5">
                      In the form editor, tap <strong>"Drive PDF"</strong>. The system renders the document into vector PDF and uploads it into your designated <strong>"Perfusion Forms Archive"</strong> folder in Google Drive.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: EXPORTING & PRINTING */}
          {activeSection === 'export' && (
            <div className="space-y-4">
              <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-2xl flex items-start gap-3">
                <Download className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Exporting, Printing, & Standalone HTML</h3>
                  <p className="text-slate-600 mt-1">
                    Multiple ways to download, print, or share your patient medical records.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-blue-600" />
                    Crisp Vector PDF
                  </div>
                  <p className="text-slate-600">
                    Downloads an exact 1:1 clinical A4 PDF document ready for hospital filing.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-indigo-600" />
                    Standalone HTML
                  </div>
                  <p className="text-slate-600">
                    Exports a self-contained HTML file that opens offline in any browser or web viewer.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-slate-700" />
                    Direct Print
                  </div>
                  <p className="text-slate-600">
                    Sends the formatted clinical sheet directly to hospital network printers.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            MedForms Pro Clinical Documentation System
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            Got It, Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
