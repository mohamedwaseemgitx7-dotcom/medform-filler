import React, { useState, useEffect } from 'react';
import { DoctorProfile } from '../types';
import {
  getDoctorGoogleAuth,
  signInWithGoogleWorkspacePopup,
  disconnectDoctorGoogleAuth,
  syncAllRecordsToGoogleSheets,
  createOrGetSpreadsheet,
  createOrGetDriveFolder,
  GoogleAuthState,
} from '../utils/googleWorkspace';
import { getDoctorRecords } from '../utils/storage';
import {
  FileSpreadsheet,
  FolderOpen,
  RefreshCw,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  HardDrive,
  UserCheck,
} from 'lucide-react';

interface GoogleWorkspacePageProps {
  doctor: DoctorProfile;
  onBack: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const GoogleWorkspacePage: React.FC<GoogleWorkspacePageProps> = ({
  doctor,
  onBack,
  onShowToast,
}) => {
  const [googleAuth, setGoogleAuth] = useState<GoogleAuthState>(getDoctorGoogleAuth(doctor.id));
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const records = getDoctorRecords(doctor.id);

  useEffect(() => {
    setGoogleAuth(getDoctorGoogleAuth(doctor.id));
  }, [doctor.id]);

  const handleConnectOrSwitch = async (isSwitch: boolean = false) => {
    setIsLoading(true);
    try {
      await signInWithGoogleWorkspacePopup(
        doctor.name,
        doctor.id,
        isSwitch ? 'select_account' : 'consent',
        doctor.email
      );
      const updated = getDoctorGoogleAuth(doctor.id);
      setGoogleAuth(updated);
      setIsLoading(false);
      onShowToast(
        'success',
        isSwitch
          ? `Switched Google Account to ${updated.userEmail || 'new account'}`
          : `Connected Google Workspace for ${updated.userEmail || doctor.name}`,
        'Google Connected'
      );
    } catch (err: any) {
      setIsLoading(false);
      onShowToast('error', err?.message || 'Google authentication was cancelled.', 'Google Connection');
    }
  };


  const handleDisconnect = () => {
    const cleared = disconnectDoctorGoogleAuth(doctor.id);
    setGoogleAuth(cleared);
    onShowToast('info', 'Logged out of Google Drive & Sheets account.', 'Google Disconnected');
  };

  const handleSyncSheets = async () => {
    if (!googleAuth.isConnected || !googleAuth.accessToken) {
      await handleConnectOrSwitch(false);
      return;
    }

    setIsSyncing(true);
    try {
      let sheetId = googleAuth.spreadsheetId;
      if (!sheetId) {
        const created = await createOrGetSpreadsheet(googleAuth.accessToken, doctor.name);
        sheetId = created.spreadsheetId;
      }

      const res = await syncAllRecordsToGoogleSheets(googleAuth.accessToken, sheetId, records);
      setGoogleAuth(getDoctorGoogleAuth(doctor.id));
      setIsSyncing(false);
      onShowToast(
        'success',
        `Successfully synced ${res.total} patient cases to Google Sheets!`,
        'Sheets Synchronized'
      );
    } catch (err: any) {
      setIsSyncing(false);
      onShowToast('error', err?.message || 'Sync failed. Try re-connecting your account.', 'Sync Error');
    }
  };

  const handleTestConnection = async () => {
    if (!googleAuth.isConnected || !googleAuth.accessToken) {
      onShowToast('info', 'Please connect a Google Account first.', 'Not Connected');
      return;
    }

    setIsTesting(true);
    try {
      await createOrGetSpreadsheet(googleAuth.accessToken, doctor.name);
      await createOrGetDriveFolder(googleAuth.accessToken, `MedForms Pro Clinical Vault (${doctor.name})`);
      setIsTesting(false);
      onShowToast('success', 'Google Sheets & Drive APIs verified and fully operational!', 'Connection Verified');
    } catch (err: any) {
      setIsTesting(false);
      onShowToast('error', err?.message || 'Verification failed. Re-authorization may be needed.', 'Check Failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#004AC6] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              googleAuth.isConnected
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                googleAuth.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            {googleAuth.isConnected ? 'Google Workspace Connected' : 'Not Connected'}
          </span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E]">
            Google Workspace & Cloud Storage
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your connected Google Account, switch accounts for storage quotas, and sync clinical registries.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <h2 className="text-base font-bold text-[#131B2E] flex items-center gap-2 mb-4">
              <UserCheck className="w-5 h-5 text-[#004AC6]" />
              <span>Current Connected Google Account</span>
            </h2>

            {googleAuth.isConnected ? (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-lg shrink-0">
                      {googleAuth.userName ? googleAuth.userName.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-base">
                        {googleAuth.userName || doctor.name}
                      </div>
                      <div className="text-sm text-slate-600 font-mono">
                        {googleAuth.userEmail || 'Google Account Connected'}
                      </div>
                      {googleAuth.lastSyncedAt && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          Last synchronized: {new Date(googleAuth.lastSyncedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleConnectOrSwitch(true)}
                      disabled={isLoading}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isLoading ? 'Opening...' : 'Switch Account'}</span>
                    </button>

                    <button
                      onClick={handleDisconnect}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900">
                  <HardDrive className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Storage Tip:</strong> If your Google Drive 15GB free limit gets full, you can click <strong className="underline">Switch Account</strong> at any time to link a new Google account or official hospital workspace. Your local patient records will remain safe and intact.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-[#004AC6] mx-auto flex items-center justify-center">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-sm font-bold text-slate-900">No Google Account Connected</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Connect your Google Drive and Google Sheets account to enable automatic cloud backup, 4-tab spreadsheet synchronization, and secure PDF archival.
                  </p>
                </div>
                <button
                  onClick={() => handleConnectOrSwitch(false)}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-[#004AC6] hover:bg-[#0053DB] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLoading ? 'Connecting...' : 'Login with Google'}</span>
                </button>
              </div>
            )}
          </div>

          {googleAuth.isConnected && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">4-Tab Google Spreadsheet</h3>
                  <p className="text-xs text-slate-500">
                    Maintains live updated tabs for <strong>Adult Perfusion</strong>, <strong>Pediatric Perfusion</strong>, <strong>ECMO</strong>, and <strong>IABP</strong>.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {googleAuth.spreadsheetUrl ? (
                    <a
                      href={googleAuth.spreadsheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Open Live Google Sheet</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
                    </a>
                  ) : (
                    <div className="text-xs text-slate-400">Spreadsheet will be created on first sync</div>
                  )}

                  <button
                    onClick={handleSyncSheets}
                    disabled={isSyncing}
                    className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing Records...' : `Sync All Records (${records.length})`}</span>
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004AC6] flex items-center justify-center border border-blue-200">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Google Drive PDF Vault</h3>
                  <p className="text-xs text-slate-500">
                    A dedicated secure folder in your Google Drive storing full medical PDF charts with direct hyperlinks embedded in Sheets.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {googleAuth.driveFolderUrl ? (
                    <a
                      href={googleAuth.driveFolderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-3 bg-[#004AC6] hover:bg-[#0053DB] active:bg-[#003ea8] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Open Drive Vault Folder</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
                    </a>
                  ) : (
                    <div className="text-xs text-slate-400">Vault folder will be generated automatically</div>
                  )}

                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isTesting ? 'Verifying...' : 'Verify Cloud Permissions'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Medical Data Isolation & Privacy</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every doctor profile maintains independent Google Workspace authorization tokens and storage paths. No cross-doctor data leakage occurs. When you switch or logout from an account, local patient records on your device remain preserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
