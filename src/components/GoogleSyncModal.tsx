import React, { useState, useEffect } from 'react';
import { FormType, PatientRecord } from '../types';
import { FORM_CONFIGS, exportToGoogleSheetsCsv } from '../utils/storage';
import {
  getDoctorGoogleAuth,
  saveDoctorGoogleAuth,
  disconnectDoctorGoogleAuth,
  signInWithGoogleWorkspacePopup,
  createOrGetSpreadsheet,
  syncAllRecordsToGoogleSheets,
  createOrGetDriveFolder,
  uploadPdfToDrive,
  GoogleAuthState,
} from '../utils/googleWorkspace';
import { exportElementToPdf } from '../utils/pdfExport';
import { saveAs } from 'file-saver';
import {
  FileSpreadsheet,
  Cloud,
  CheckCircle2,
  Download,
  X,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  ShieldCheck,
  FileText,
  UploadCloud,
  Search,
  Check,
} from 'lucide-react';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: PatientRecord[];
  doctorId: string;
  doctorName: string;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
  onUpdateRecord?: (record: PatientRecord) => void;
  onRenderRecordPdf?: (record: PatientRecord) => Promise<HTMLElement>;
  onDownloadPdf?: (record: PatientRecord) => void;
}

type TabSelection = 'all' | FormType;

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  records,
  doctorId,
  doctorName,
  onShowToast,
  onUpdateRecord,
  onRenderRecordPdf,
  onDownloadPdf,
}) => {
  const [selectedTab, setSelectedTab] = useState<TabSelection>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [authState, setAuthState] = useState<GoogleAuthState>(getDoctorGoogleAuth(doctorId));
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [uploadingRecordId, setUploadingRecordId] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<string>('');
  const [connectError, setConnectError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setAuthState(getDoctorGoogleAuth(doctorId));
      setConnectError('');
    }
  }, [isOpen, doctorId]);

  if (!isOpen) return null;

  // Filtered records
  const filteredRecords = records
    .filter((r) => (selectedTab === 'all' ? true : r.formType === selectedTab))
    .filter((r) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        r.patientName.toLowerCase().includes(term) ||
        r.patientId.toLowerCase().includes(term) ||
        (r.data?.diagnosis && r.data.diagnosis.toLowerCase().includes(term))
      );
    });

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setConnectError('');
    try {
      await signInWithGoogleWorkspacePopup(doctorName, doctorId);
      const updated = getDoctorGoogleAuth(doctorId);
      setAuthState(updated);
      setIsConnecting(false);
      onShowToast(
        'success',
        `Connected as ${updated.userEmail || doctorName}! Google Sheets & Google Drive access granted.`,
        'Google Connected'
      );
    } catch (err: any) {
      setIsConnecting(false);
      const errMsg = err?.message || 'Google authorization could not be completed.';
      setConnectError(errMsg);
      onShowToast('error', errMsg, 'Google Auth Error');
    }
  };

  const handleDisconnect = () => {
    const cleared = disconnectDoctorGoogleAuth(doctorId);
    setAuthState(cleared);
    setConnectError('');
    onShowToast('info', `Disconnected Google Workspace for ${doctorName}`, 'Disconnected');
  };

  // Upload single record PDF to Drive & update record
  const handleUploadRecordToDrive = async (rec: PatientRecord) => {
    if (!authState.isConnected || !authState.accessToken) {
      await handleConnectGoogle();
      return;
    }

    setUploadingRecordId(rec.id);
    try {
      let folderId = authState.driveFolderId;
      if (!folderId) {
        const folder = await createOrGetDriveFolder(
          authState.accessToken,
          `MedForms Pro Clinical Vault (${doctorName})`
        );
        folderId = folder.folderId;
        saveDoctorGoogleAuth(doctorId, {
          driveFolderId: folder.folderId,
          driveFolderUrl: folder.folderUrl,
        });
        setAuthState(getDoctorGoogleAuth(doctorId));
      }

      if (!onRenderRecordPdf) {
        throw new Error('PDF render utility is unavailable.');
      }

      const el = await onRenderRecordPdf(rec);
      const safeName = (rec.patientName || 'Patient').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${rec.patientId}_${rec.formType.toUpperCase()}_${safeName}.pdf`;
      const pdfBlob = await exportElementToPdf(el, fileName);

      const uploaded = await uploadPdfToDrive(authState.accessToken, folderId, fileName, pdfBlob);

      const updatedRec: PatientRecord = {
        ...rec,
        drivePdfUrl: uploaded.viewUrl,
        driveFileId: uploaded.fileId,
        lastSyncedToDriveAt: new Date().toISOString(),
      };

      if (onUpdateRecord) {
        onUpdateRecord(updatedRec);
      }

      setUploadingRecordId(null);
      onShowToast('success', `PDF uploaded to Google Drive for ${rec.patientName || rec.patientId}! Click link to open or download.`, 'Drive Upload Ready');
      
      // Auto-open drive link in new tab
      window.open(uploaded.viewUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error(err);
      setUploadingRecordId(null);
      onShowToast('error', err?.message || 'Failed to upload PDF to Google Drive.', 'Drive Error');
    }
  };

  // Sync All Records to Google Sheets (including auto-generating Drive PDF links for unsynced records)
  const handleSyncAll = async (autoUploadPdfs: boolean = true) => {
    if (!authState.isConnected || !authState.accessToken) {
      await handleConnectGoogle();
      return;
    }

    setIsSyncing(true);
    setSyncProgress('Verifying Google Spreadsheet & Drive Vault...');

    try {
      let sheetId = authState.spreadsheetId;
      let folderId = authState.driveFolderId;

      if (!sheetId) {
        const createdSheet = await createOrGetSpreadsheet(authState.accessToken, doctorName);
        sheetId = createdSheet.spreadsheetId;
        saveDoctorGoogleAuth(doctorId, {
          spreadsheetId: createdSheet.spreadsheetId,
          spreadsheetUrl: createdSheet.spreadsheetUrl,
        });
      }

      if (!folderId) {
        const createdFolder = await createOrGetDriveFolder(
          authState.accessToken,
          `MedForms Pro Clinical Vault (${doctorName})`
        );
        folderId = createdFolder.folderId;
        saveDoctorGoogleAuth(doctorId, {
          driveFolderId: createdFolder.folderId,
          driveFolderUrl: createdFolder.folderUrl,
        });
      }

      const activeRecords = [...records];

      // Auto upload PDFs to Drive if requested and renderer is available
      if (autoUploadPdfs && onRenderRecordPdf) {
        setSyncProgress(`Generating & archiving PDFs to Google Drive for ${records.length} records...`);
        for (let i = 0; i < activeRecords.length; i++) {
          const rec = activeRecords[i];
          if (!rec.drivePdfUrl) {
            try {
              setSyncProgress(`Archiving PDF ${i + 1}/${activeRecords.length} (${rec.patientName || rec.patientId})...`);
              const el = await onRenderRecordPdf(rec);
              const safeName = (rec.patientName || 'Patient').replace(/[^a-zA-Z0-9_-]/g, '_');
              const fileName = `${rec.patientId}_${rec.formType.toUpperCase()}_${safeName}.pdf`;
              const pdfBlob = await exportElementToPdf(el, fileName);
              const uploaded = await uploadPdfToDrive(authState.accessToken, folderId, fileName, pdfBlob);

              activeRecords[i] = {
                ...rec,
                drivePdfUrl: uploaded.viewUrl,
                driveFileId: uploaded.fileId,
                lastSyncedToDriveAt: new Date().toISOString(),
              };

              if (onUpdateRecord) {
                onUpdateRecord(activeRecords[i]);
              }
            } catch (pdfErr) {
              console.warn(`PDF upload skipped for ${rec.patientId}:`, pdfErr);
            }
          }
        }
      }

      setSyncProgress(`Writing structured rows & clickable Drive PDF download links to Google Sheets...`);
      const res = await syncAllRecordsToGoogleSheets(authState.accessToken, sheetId, activeRecords);

      setAuthState(getDoctorGoogleAuth(doctorId));
      setIsSyncing(false);
      setSyncProgress('');
      onShowToast(
        'success',
        `Successfully synced ${res.total} records to Google Sheets with direct Google Drive PDF download links!`,
        'Sheets & Drive Sync Complete'
      );
    } catch (err: any) {
      console.error(err);
      setIsSyncing(false);
      setSyncProgress('');
      onShowToast('error', err?.message || 'An error occurred during synchronization', 'Sync Failed');
    }
  };

  const handleDownloadCsv = (type: FormType) => {
    const csv = exportToGoogleSheetsCsv(records, type);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `MedForms_${FORM_CONFIGS[type].sheetTabName}_${doctorId}.csv`);
    onShowToast('success', `Exported ${FORM_CONFIGS[type].sheetTabName}.csv for Google Sheets`, 'CSV Exported');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Google Sheets & Google Drive Vault</h2>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                  SYNC & CLOUD PDFS
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Live spreadsheet sync & direct Google Drive PDF download links for <span className="font-semibold text-slate-700">{doctorName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Connection Status Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${authState.isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                  {authState.isConnected ? <CheckCircle2 className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">
                      {authState.isConnected
                        ? `Connected: ${authState.userEmail || doctorName}`
                        : 'Connect Any Google Account for Sync'}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${authState.isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {authState.isConnected ? 'ACTIVE' : 'ACTION NEEDED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {authState.isConnected
                      ? `Dedicated 4-tab spreadsheet with embedded Drive PDF download links for every patient.`
                      : `Authorize Google Sheets & Drive to sync records and generate downloadable Drive PDF links.`}
                  </p>
                  {authState.lastSyncedAt && (
                    <div className="text-[11px] text-slate-400 mt-1">
                      Last synchronized: {new Date(authState.lastSyncedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {authState.isConnected ? (
                  <>
                    <button
                      onClick={() => handleSyncAll(true)}
                      disabled={isSyncing}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                      title="Upload all record PDFs to Drive and sync Google Sheets with download hyperlinks"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Syncing...' : 'Sync Sheets + Drive PDFs'}
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnectGoogle}
                    disabled={isConnecting}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
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
                    <span>{isConnecting ? 'Connecting...' : 'Connect Google Workspace Account'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Error Banner */}
            {connectError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 font-bold text-rose-900">
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Google Authorization Notice</span>
                </div>
                <p className="text-rose-700 leading-relaxed">{connectError}</p>
                <div className="text-[11px] text-rose-600 bg-white/80 p-2 rounded-lg border border-rose-200/80">
                  <strong>Tip:</strong> If popup is blocked, allow popups in your browser's URL bar, then retry.
                </div>
              </div>
            )}

            {/* Sync Progress Indicator */}
            {syncProgress && (
              <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                <span>{syncProgress}</span>
              </div>
            )}

            {/* Direct Links to Google Sheets & Google Drive Vault */}
            {authState.isConnected && (
              <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-3 text-xs">
                {authState.spreadsheetUrl && (
                  <a
                    href={authState.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 font-bold bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-2xs transition"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Open Live Google Spreadsheet</span>
                    <ExternalLink className="w-3 h-3 text-emerald-600" />
                  </a>
                )}
                {authState.driveFolderUrl && (
                  <a
                    href={authState.driveFolderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-blue-800 hover:text-blue-950 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 shadow-2xs transition"
                  >
                    <FolderOpen className="w-4 h-4 text-blue-600" />
                    <span>Open Google Drive Clinical Vault Folder</span>
                    <ExternalLink className="w-3 h-3 text-blue-600" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Tab Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setSelectedTab('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  selectedTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Records ({records.length})
              </button>
              {(['adult', 'pediatric', 'ecmo', 'iabp'] as FormType[]).map((ft) => {
                const conf = FORM_CONFIGS[ft];
                const count = records.filter((r) => r.formType === ft).length;
                return (
                  <button
                    key={ft}
                    onClick={() => setSelectedTab(ft)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                      selectedTab === ft
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {conf.shortTitle} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, ID, diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-56"
              />
            </div>
          </div>

          {/* Unified Clinical Records Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {selectedTab === 'all' ? 'All Clinical Registry Records' : `${FORM_CONFIGS[selectedTab].sheetTabName} Registry Tab`}
                </span>
                <span className="text-xs text-slate-500">
                  ({filteredRecords.length} records shown)
                </span>
              </div>
              {selectedTab !== 'all' && (
                <button
                  onClick={() => handleDownloadCsv(selectedTab as FormType)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
                >
                  <Download className="w-3 h-3 text-slate-600" />
                  Export Tab CSV
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 z-10">
                  <tr className="divide-x divide-slate-200 border-b border-slate-200">
                    <th className="px-3 py-2">Patient ID</th>
                    <th className="px-3 py-2">Patient Name</th>
                    <th className="px-3 py-2">Form Type</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-emerald-800 font-bold bg-emerald-50/70">
                      Google Drive PDF (Click to Download)
                    </th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Diagnosis</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">
                        No patient records found matching the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => {
                      const isUploading = uploadingRecordId === rec.id;
                      const hasDrivePdf = Boolean(rec.drivePdfUrl);

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/80 divide-x divide-slate-200 text-slate-800">
                          {/* ID */}
                          <td className="px-3 py-2 font-mono text-[11px] text-blue-700 font-bold">
                            {rec.patientId}
                          </td>

                          {/* Name */}
                          <td className="px-3 py-2 font-semibold text-slate-900">
                            {rec.patientName || 'Untitled Patient'}
                          </td>

                          {/* Form Type Badge */}
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase">
                              {FORM_CONFIGS[rec.formType].shortTitle}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                rec.status === 'completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>

                          {/* Google Drive PDF Link Column */}
                          <td className="px-3 py-2 bg-emerald-50/30">
                            {hasDrivePdf ? (
                              <a
                                href={rec.drivePdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg transition group"
                                title="Click to redirect to Google Drive where you can view & download this PDF"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                                <span>Drive PDF (Download)</span>
                              </a>
                            ) : (
                              <button
                                onClick={() => handleUploadRecordToDrive(rec)}
                                disabled={isUploading}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer disabled:opacity-50"
                                title="Generate PDF, archive to Google Drive, and generate shareable download link"
                              >
                                {isUploading ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                ) : (
                                  <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                                )}
                                <span>{isUploading ? 'Uploading...' : 'Upload & Get Link'}</span>
                              </button>
                            )}
                          </td>

                          {/* Date */}
                          <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                            {rec.data?.date || '-'}
                          </td>

                          {/* Diagnosis */}
                          <td className="px-3 py-2 text-slate-600 truncate max-w-[160px]">
                            {rec.data?.diagnosis || '-'}
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {onDownloadPdf && (
                                <button
                                  onClick={() => onDownloadPdf(rec)}
                                  className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-200/60 rounded-lg transition"
                                  title="Download exact clinical PDF locally"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleUploadRecordToDrive(rec)}
                                disabled={isUploading}
                                className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition"
                                title="Re-archive to Google Drive"
                              >
                                <Cloud className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Explanatory Banner on Google Sheets Link Redirection */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">How Google Sheets & Drive Linking Works:</div>
              <p className="text-blue-800 text-[11px] leading-relaxed">
                When you sync your clinical records, the spreadsheet row includes a direct{' '}
                <strong>=HYPERLINK("...", "📥 Open / Download PDF")</strong> formula. Touching or clicking that cell
                in Google Sheets redirects straight to Google Drive where you can view, print, or download the full A4 PDF.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50 gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Encrypted physician vault • Direct Google Drive downloads enabled</span>
          </div>

          <div className="flex items-center gap-2">
            {authState.isConnected && authState.spreadsheetUrl && (
              <a
                href={authState.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold rounded-xl transition inline-flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Open Google Spreadsheet</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
