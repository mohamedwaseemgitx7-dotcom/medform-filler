import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { PatientRecord } from '../types';
import { FORM_CONFIGS } from '../utils/storage';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  record: PatientRecord | null;
  onClose: () => void;
  onConfirm: (recordId: string) => void;
  isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  record,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !record) return null;

  const formConfig = FORM_CONFIGS[record.formType];

  return (
    <div
      id="delete-record-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div
        id="delete-record-modal"
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="delete-dialog-title" className="text-base font-extrabold text-slate-900">
                Delete Patient Record
              </h3>
              <p className="text-xs text-slate-500">This action cannot be undone.</p>
            </div>
          </div>
          <button
            id="close-delete-modal-btn"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Record Details Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Patient:</span>
            <span className="font-bold text-slate-900">{record.patientName || 'Untitled Patient'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Patient ID:</span>
            <span className="font-mono font-bold text-blue-700">{record.patientId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Form Registry:</span>
            <span className="font-semibold text-slate-700">{formConfig?.title || record.formType}</span>
          </div>
        </div>

        {/* Warning text */}
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            Are you sure you want to permanently delete this clinical record from your practitioner vault?
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            id="cancel-delete-record-btn"
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition border border-slate-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-record-btn"
            type="button"
            disabled={isDeleting}
            onClick={() => onConfirm(record.id)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Deleting...' : 'Delete Record'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
