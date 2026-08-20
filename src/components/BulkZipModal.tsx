import React, { useState } from 'react';
import { PatientRecord } from '../types';
import { exportSelectedRecordsHtmlZip } from '../utils/htmlExport';
import { Archive, X, CheckCircle2, Loader2, FileText, AlertCircle } from 'lucide-react';

interface BulkZipModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecords: PatientRecord[];
  renderRecordFn?: (record: PatientRecord) => Promise<HTMLElement>;
}

export const BulkZipModal: React.FC<BulkZipModalProps> = ({
  isOpen,
  onClose,
  selectedRecords,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const total = selectedRecords.length;

  const handleStartExport = async () => {
    if (total === 0) return;
    setIsExporting(true);
    setErrorMsg('');
    setIsDone(false);

    try {
      await exportSelectedRecordsHtmlZip(
        selectedRecords,
        (curr, tot, status) => {
          setCurrentStep(curr);
          setProgressText(status);
        }
      );
      setIsDone(true);
      setTimeout(() => {
        setIsExporting(false);
      }, 1000);
    } catch (err: any) {
      console.error('Bulk export error', err);
      setErrorMsg(err?.message || 'An error occurred during bulk ZIP compilation.');
      setIsExporting(false);
    }
  };

  const percentage = total > 0 ? Math.round((currentStep / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Bulk ZIP Export</h2>
              <p className="text-xs text-slate-500">Batch clinical PDF & Sheets compilation</p>
            </div>
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between text-xs text-slate-700">
              <span className="font-semibold">Selected Records:</span>
              <span className="font-bold text-blue-700">{total} patients</span>
            </div>
            <div className="text-xs text-slate-500">
              Bundles individual high-resolution PDFs formatted to exact medical sheet standards, plus Google Sheets CSV exports and JSON manifests.
            </div>
          </div>

          {/* Records preview pill list */}
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {selectedRecords.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-2 text-xs bg-white border border-slate-200 rounded-lg"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-900 truncate">{r.patientName || 'Untitled'}</span>
                  <span className="text-[10px] font-mono text-slate-500">({r.patientId})</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-500">{r.formType}</span>
              </div>
            ))}
          </div>

          {/* Progress / Status */}
          {isExporting && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>{progressText || 'Compiling archive...'}</span>
                <span>{percentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          )}

          {isDone && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ZIP archive downloaded successfully!
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
          >
            {isDone ? 'Close' : 'Cancel'}
          </button>
          {!isDone && (
            <button
              onClick={handleStartExport}
              disabled={isExporting || total === 0}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating ({percentage}%)
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  Generate Bulk ZIP ({total})
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
