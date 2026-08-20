import React from 'react';
import {
  FileQuestion,
  Loader2,
  AlertCircle,
  WifiOff,
  Clock,
  ShieldAlert,
  Lock,
  CheckCircle2,
  RefreshCw,
  Plus,
  ArrowRight,
  Stethoscope,
  Activity,
  HeartPulse,
} from 'lucide-react';

// ==========================================
// 1. NO ITEMS YET (EMPTY STATE)
// ==========================================
interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  iconType?: 'records' | 'general' | 'filter';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Records Yet',
  description = 'No clinical patient records found in your isolated database partition. Create your first record to begin.',
  actionText = 'New Patient Record',
  onAction,
  iconType = 'records',
}) => {
  return (
    <div className="p-8 sm:p-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl shadow-sm flex flex-col items-center justify-center max-w-lg mx-auto my-6 animate-in fade-in duration-200">
      {/* Medical Equipment Badge */}
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
        {iconType === 'records' ? (
          <Stethoscope className="w-8 h-8 stroke-[1.5]" />
        ) : iconType === 'filter' ? (
          <Activity className="w-8 h-8 stroke-[1.5]" />
        ) : (
          <FileQuestion className="w-8 h-8 stroke-[1.5]" />
        )}
      </div>

      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h3>
      <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">{description}</p>

      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};

// ==========================================
// 2. LOADING STATE
// ==========================================
interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading Clinical Records...',
  subMessage = 'Connecting to isolated database partition',
}) => {
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-150">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 animate-pulse">
          <HeartPulse className="w-7 h-7 animate-bounce" />
        </div>
        <div className="absolute -inset-1 rounded-2xl border-2 border-blue-500/20 animate-ping"></div>
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-800">{message}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{subMessage}</p>
      </div>
    </div>
  );
};

// ==========================================
// 3. ERROR STATE
// ==========================================
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Encountered Clinical Data Error',
  message,
  onRetry,
}) => {
  return (
    <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex flex-col sm:flex-row items-start gap-4 shadow-sm my-4">
      <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">{title}</h4>
        <p className="text-xs text-rose-700 mt-1 leading-relaxed">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Operation</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 4. NO INTERNET CONNECTION (OFFLINE BANNER)
// ==========================================
interface OfflineBannerProps {
  isOffline: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOffline }) => {
  if (!isOffline) return null;

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span>
          <strong>Offline Clinical Mode:</strong> No internet connection detected. All patient forms and edits are securely cached locally and will synchronize when online.
        </span>
      </div>
    </div>
  );
};

// ==========================================
// 5. IT'S TAKING LONGER THAN USUAL (LATENCY WATCHER)
// ==========================================
interface SlowOperationNoticeProps {
  onCancel?: () => void;
}

export const SlowOperationNotice: React.FC<SlowOperationNoticeProps> = ({ onCancel }) => {
  return (
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center justify-between gap-3 animate-in fade-in my-2">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Operation is taking longer than usual. Synchronizing with cloud vault...</span>
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-amber-800 font-bold hover:underline shrink-0"
        >
          Cancel
        </button>
      )}
    </div>
  );
};

// ==========================================
// 6. PERMISSION DENIED MODAL / ALERT
// ==========================================
interface PermissionDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const PermissionDeniedModal: React.FC<PermissionDeniedModalProps> = ({
  isOpen,
  onClose,
  message = 'Row-Level Security (RLS) partition check failed. You do not have permission to view or modify records outside your doctor credentials.',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
        <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-black text-slate-900">Access Restricted / Permission Denied</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm transition"
        >
          Acknowledge & Return
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 7. SESSION EXPIRED MODAL
// ==========================================
interface SessionExpiredModalProps {
  isOpen: boolean;
  onReLogin: () => void;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  onReLogin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900">Clinical Session Expired</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            For patient data confidentiality (HIPAA/RLS security protocol), your authentication session has timed out. Please sign in again. Any active draft has been preserved.
          </p>
        </div>
        <button
          type="button"
          onClick={onReLogin}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>Re-authenticate Doctor Session</span>
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 8. FORM VALIDATION SUCCESSFUL
// ==========================================
interface ValidationSuccessBannerProps {
  message?: string;
}

export const ValidationSuccessBanner: React.FC<ValidationSuccessBannerProps> = ({
  message = 'All perfusion parameters and blood gas entries passed mathematical & range validation.',
}) => {
  return (
    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center gap-2.5 shadow-xs animate-in fade-in">
      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
      <span className="font-medium">{message}</span>
    </div>
  );
};
