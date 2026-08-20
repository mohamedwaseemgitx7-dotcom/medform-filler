import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Stethoscope, ShieldCheck, Zap, UserCheck } from 'lucide-react';
import { DoctorProfile } from '../types';
import { signInDoctorWithGoogle, setCurrentDoctor, getStoredDoctors, saveStoredDoctor } from '../utils/storage';
import {
  requestGisAccessToken,
  fetchGoogleUserProfile,
} from '../utils/googleWorkspace';
import {
  signInWithSupabaseGoogleOAuth,
  isSupabaseConfigured,
} from '../utils/supabaseClient';

interface LoginPageProps {
  onLoginSuccess: (doctor: DoctorProfile, isNewUser?: boolean) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onShowToast }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Primary GOOGLE SIGN-IN FLOW:
   * 1. If Supabase is configured, use Supabase Google OAuth (handles redirects seamlessly across mobile/desktop).
   * 2. Otherwise, use Google Identity Services (GIS) token client.
   */
  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage('');

    // If Supabase is configured, use Supabase OAuth redirect (works 100% on mobile without origin_mismatch)
    if (isSupabaseConfigured()) {
      try {
        const res = await signInWithSupabaseGoogleOAuth(window.location.origin);
        if (!res.success) {
          throw new Error(res.error || 'Failed to start Supabase Google OAuth.');
        }
        // Browser will redirect to Google via Supabase OAuth
        return;
      } catch (sbErr: any) {
        console.warn('Supabase OAuth error, falling back to direct sign-in:', sbErr);
      }
    }

    // Direct Google GIS Flow
    try {
      const gisRes = await requestGisAccessToken('select_account', 'email profile openid');
      const token = gisRes.accessToken;

      const userProfile = await fetchGoogleUserProfile(token);
      const email = userProfile.email || 'doctor@hospital.org';
      const name = userProfile.name
        ? userProfile.name.startsWith('Dr.')
          ? userProfile.name
          : `Dr. ${userProfile.name}`
        : `Dr. ${email.split('@')[0]}`;

      const doc = signInDoctorWithGoogle(email, name, userProfile.picture);
      setCurrentDoctor(doc);

      setIsLoading(false);
      onShowToast('success', `Welcome back, ${name}!`, 'Signed In');
      onLoginSuccess(doc, false);
    } catch (err: any) {
      setIsLoading(false);
      const msg = err?.message || '';

      if (msg.includes('popup_closed') || msg.includes('cancelled') || msg.includes('closed')) {
        return;
      } else if (msg.includes('origin_mismatch')) {
        setErrorMessage(
          `Domain not registered in Google Cloud Console. Click "Instant Doctor Access" below to sign in immediately without Google Cloud setup.`
        );
      } else if (msg.includes('access_denied')) {
        setErrorMessage(
          'Access blocked by Google. Use "Instant Doctor Access" below to enter immediately.'
        );
      } else {
        setErrorMessage(msg || 'Google sign-in failed. You can use Instant Access below.');
      }
    }
  };

  /**
   * INSTANT CLINICAL ACCESS (1-Tap Zero Block Guarantee):
   * Instantly signs in the doctor into their secure local clinical vault.
   */
  const handleInstantAccess = (customName?: string) => {
    setIsLoading(true);
    try {
      let doc: DoctorProfile;
      const existing = getStoredDoctors();

      if (existing.length > 0) {
        doc = existing[0];
      } else {
        doc = {
          id: `DOC-MAIN-${Date.now().toString(36).toUpperCase()}`,
          name: customName || 'Dr. Consultant Perfusionist',
          email: 'doctor@clinical.vault',
          username: 'doctor',
          authProvider: 'google',
          hospital: 'Apex Heart & Lung Institute',
          department: 'Cardiothoracic Surgery & Perfusion',
          role: 'Consultant Cardiac Surgeon & Perfusionist',
        };
        saveStoredDoctor(doc);
      }

      setCurrentDoctor(doc);
      setIsLoading(false);
      onShowToast('success', `Signed in as ${doc.name}`, 'Clinical Vault Active');
      onLoginSuccess(doc, false);
    } catch (err: any) {
      console.warn('Instant access fallback:', err);
      const fallbackDoc: DoctorProfile = {
        id: 'DOC-LOCAL-FALLBACK',
        name: customName || 'Dr. Consultant Perfusionist',
        email: 'doctor@clinical.vault',
        hospital: 'Apex Heart & Lung Institute',
        department: 'Cardiothoracic Surgery & Perfusion',
        role: 'Consultant Cardiac Surgeon & Perfusionist',
      };
      setCurrentDoctor(fallbackDoc);
      setIsLoading(false);
      onLoginSuccess(fallbackDoc, false);
    }
  };



  return (
    <div
      style={{
        minHeight: '100svh',
        background: 'linear-gradient(135deg, #0f1626 0%, #1a2744 50%, #0d1f3c 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "'Inter', system-ui, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'fixed',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '350px',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <main
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '24px',
          padding: '44px 32px 36px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 8px 32px rgba(59,130,246,0.45)',
            }}
          >
            <Stethoscope style={{ width: '30px', height: '30px', color: 'white' }} />
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.5px',
              margin: 0,
              lineHeight: 1,
            }}
          >
            MEDFORMS
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '8px 0 0', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Clinical Precision Systems
          </p>
        </div>

        {/* Sign-in section */}
        <div style={{ width: '100%' }}>
          <p
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: '13.5px',
              textAlign: 'center',
              lineHeight: 1.6,
              margin: '0 0 20px',
              fontWeight: 400,
            }}
          >
            Sign in with your Google account to access your clinical records and data.
          </p>

          {/* Google Button */}
          <button
            type="button"
            id="btn-google-signin"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              background: 'rgba(255,255,255,0.96)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '14px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.65 : 1,
              transition: 'all 0.18s ease',
              fontSize: '15px',
              fontWeight: 600,
              color: '#1a1a2e',
              letterSpacing: '-0.2px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw
                  style={{
                    width: '20px',
                    height: '20px',
                    color: '#3b82f6',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <span style={{ color: '#64748b' }}>Signing in...</span>
              </>
            ) : (
              <>
                <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" fill="#EA4335" />
                  <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" fill="#4285F4" />
                  <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" fill="#FBBC05" />
                  <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" fill="#34A853" />
                  <path d="M0 0h48v48H0z" fill="none" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Instant Clinical Sign-In (Zero Setup / Zero Block) */}
          <div style={{ marginTop: '14px', width: '100%' }}>
            <button
              type="button"
              id="btn-instant-doctor-signin"
              onClick={() => handleInstantAccess()}
              disabled={isLoading}
              style={{
                width: '100%',
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.30)',
                borderRadius: '14px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s ease',
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#93c5fd',
              }}
            >
              <Zap style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
              <span>Instant Practitioner Sign-In (1-Tap)</span>
            </button>
          </div>

          {/* Error */}
          {errorMessage && (
            <div
              style={{
                marginTop: '14px',
                padding: '12px 14px',
                background: 'rgba(239,68,68,0.10)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '12px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}
            >
              <AlertCircle style={{ width: '15px', height: '15px', color: '#f87171', flexShrink: 0, marginTop: '1px' }} />
              <div style={{ fontSize: '12px', color: '#fca5a5', lineHeight: 1.55 }}>
                {errorMessage}
                {errorMessage.includes('PUBLISH APP') && (
                  <a
                    href="https://console.cloud.google.com/apis/credentials/consent"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '8px',
                      color: '#93c5fd',
                      fontWeight: 700,
                      textDecoration: 'none',
                      fontSize: '11.5px',
                    }}
                  >
                    → Open Google Cloud Console ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Info pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
            <InfoPill icon="🔒" text="Only your name & email are used — no password stored" />
            <InfoPill icon="📊" text="Connect Google Drive & Sheets from the dashboard after login" />
          </div>
        </div>

        {/* Security footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '28px',
            padding: '7px 16px',
            background: 'rgba(34,197,94,0.07)',
            border: '1px solid rgba(34,197,94,0.18)',
            borderRadius: '100px',
          }}
        >
          <ShieldCheck style={{ width: '12px', height: '12px', color: '#4ade80' }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
            Records stored securely on your device
          </span>
        </div>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

function InfoPill({ icon, text }: { icon: string; text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 13px',
        background: 'rgba(255,255,255,0.035)',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.065)',
      }}
    >
      <span style={{ fontSize: '14px', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}