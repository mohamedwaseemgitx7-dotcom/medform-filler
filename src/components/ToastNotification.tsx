import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        let bgClass = 'bg-white border-emerald-300 text-slate-900 shadow-md';
        let Icon = CheckCircle2;
        let iconColor = 'text-emerald-600';

        if (t.type === 'error') {
          bgClass = 'bg-white border-rose-300 text-slate-900 shadow-md';
          Icon = AlertCircle;
          iconColor = 'text-rose-600';
        } else if (t.type === 'info') {
          bgClass = 'bg-white border-blue-300 text-slate-900 shadow-md';
          Icon = Info;
          iconColor = 'text-blue-600';
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-lg border flex items-start gap-3 animate-in slide-in-from-top-3 fade-in duration-150 ${bgClass}`}
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              {t.title && <h5 className="text-xs font-bold text-slate-900">{t.title}</h5>}
              <p className="text-xs font-normal text-slate-600 leading-tight mt-0.5">{t.message}</p>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
