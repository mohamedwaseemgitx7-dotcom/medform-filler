import React, { useState } from 'react';
import { DoctorProfile } from '../types';
import {
  signInWithGoogleWorkspacePopup,
  getDoctorGoogleAuth,
  GoogleAuthState,
} from '../utils/googleWorkspace';
import { CheckCircle2, Lock, RefreshCw, AlertCircle } from 'lucide-react';

interface GoogleConnectionGateProps {
  doctor: DoctorProfile;
  onConnected: (auth: GoogleAuthState) => void;
  onSkip: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const GoogleConnectionGate: React.FC<GoogleConnectionGateProps> = ({
  doctor,
  onConnected,
  onSkip,
  onShowToast,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMsg('');
    try {
      await signInWithGoogleWorkspacePopup(doctor.name, doctor.id, 'select_account');
      const auth = getDoctorGoogleAuth(doctor.id);
      setIsConnecting(false);
      setIsSuccess(true);
      onShowToast(
        'success',
        `Google Drive & Google Sheets connected successfully for ${doctor.name}!`,
        'Connection Success'
      );
      setTimeout(() => {
        onConnected(auth);
      }, 1000);
    } catch (err: any) {
      setIsConnecting(false);
      const msg = err?.message || 'Google authorization could not be completed.';
      setErrorMsg(msg);
      onShowToast('error', msg, 'Connection Failed');
    }
  };

  return (
    <div className="bg-[#FAF8FF] min-h-screen flex items-center justify-center font-sans antialiased p-4 text-[#131b2e]">
      <main className="w-full max-w-[480px]">
        {/* Brand / Logo Area Above Card */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-[#131b2e] tracking-tight">MEDFORMS</h1>
          <p className="text-sm text-[#434655] mt-1 font-medium">Clinical Precision Systems</p>
        </div>

        {/* Card Container */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 sm:p-10 flex flex-col items-center shadow-sm">
          {/* Google Icon Area */}
          <div className="w-16 h-16 bg-[#F2F3FF] rounded-full flex items-center justify-center mb-6">
            <svg height="32" viewBox="0 0 48 48" width="32" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                fill="#EA4335"
              />
              <path
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                fill="#4285F4"
              />
              <path
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                fill="#FBBC05"
              />
              <path
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                fill="#34A853"
              />
            </svg>
          </div>

          {/* Heading & Subtitle */}
          <h2 className="text-2xl font-bold text-[#131b2e] mb-2 text-center">Connect Google</h2>
          <p className="text-sm text-[#434655] text-center mb-6 max-w-sm leading-relaxed">
            MEDFORMS requires access to your Google Workspace to securely synchronize clinical forms and patient logs.
          </p>

          {/* Error Message */}
          {errorMsg && (
            <div className="w-full p-3.5 mb-4 bg-[#FFF0EE] border border-[#FFB4AB] text-[#93000A] text-xs rounded-xl space-y-1.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 font-semibold">{errorMsg}</div>
              </div>
              {errorMsg.toLowerCase().includes('denied') || errorMsg.toLowerCase().includes('verification') ? (
                <div className="pl-6 text-[11px] text-[#434655] leading-relaxed">
                  💡 <strong>How to fix in 1 minute:</strong> In Google Cloud Console → <em>OAuth consent screen</em>, click <strong>"Publish App"</strong> to switch from <em>Testing</em> to <em>In Production</em>. Alternatively, click <strong>"Skip for now"</strong> below to proceed directly.
                </div>
              ) : null}
            </div>
          )}

          {/* Permissions List */}
          <div className="w-full space-y-2.5 mb-6">
            {/* Item 1: Drive */}
            <div className="flex items-center p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-[#004ac6] mr-3 shrink-0" />
              <div>
                <span className="text-sm font-semibold text-[#131b2e] block">Google Drive</span>
                <span className="text-xs text-[#737686]">Stores patient form PDFs and HTML archives</span>
              </div>
            </div>

            {/* Item 2: Sheets */}
            <div className="flex items-center p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-[#004ac6] mr-3 shrink-0" />
              <div>
                <span className="text-sm font-semibold text-[#131b2e] block">Google Sheets</span>
                <span className="text-xs text-[#737686]">Synchronizes clinical telemetry and log registry</span>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleConnect}
            disabled={isConnecting || isSuccess}
            className="w-full h-[44px] bg-[#004ac6] text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-[#2563eb] active:bg-[#003ea8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:ring-offset-2 cursor-pointer disabled:opacity-60"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Connecting Account...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Connected!</span>
              </>
            ) : (
              <span>Connect Google Account</span>
            )}
          </button>

          {/* Secondary Action Button */}
          <button
            type="button"
            onClick={onSkip}
            className="w-full h-[44px] mt-2.5 bg-white text-[#505f76] border border-[#E2E8F0] font-semibold text-sm rounded-lg flex items-center justify-center hover:bg-[#F1F5F9] transition-colors focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:ring-offset-2 cursor-pointer"
          >
            Skip for now
          </button>
        </div>

        {/* Trust Indicator */}
        <div className="flex items-center justify-center mt-6 space-x-2 text-[#737686]">
          <Lock className="w-4 h-4" />
          <span className="text-xs font-semibold tracking-wider uppercase">Secure 256-bit Encryption</span>
        </div>
      </main>
    </div>
  );
};
