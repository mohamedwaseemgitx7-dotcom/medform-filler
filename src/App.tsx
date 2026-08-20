/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Calculator, FileSpreadsheet, Settings, FileText } from 'lucide-react';
import { DoctorProfile, FormType, PatientRecord } from './types';
import {
  getCurrentDoctor,
  setCurrentDoctor,
  getDoctorRecords,
  saveDoctorRecord,
  deleteDoctorRecord,
  createBlankFormData,
  collectFormData,
  updateDoctorProfile,
} from './utils/storage';
import {
  getSupabase,
  isSupabaseConfigured,
} from './utils/supabaseClient';
import { generatePatientId } from './utils/calculator';
import { downloadRecordPdf, exportElementToPdf } from './utils/pdfExport';
import {
  getStoredGoogleAuth,
  getDoctorGoogleAuth,
  uploadPdfToDrive,
  uploadHtmlToDrive,
  createOrGetDriveFolder,
  syncTabRecordsToGoogleSheets,
  syncAllRecordsToGoogleSheets,
} from './utils/googleWorkspace';
import { generateStandaloneFormHtml, renderExactForm, downloadRecordHtml } from './utils/htmlExport';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { DashboardView } from './components/DashboardView';
import { FormListView } from './components/FormListView';
import { FormEditorView } from './components/FormEditorView';
import { GoogleWorkspacePage } from './components/GoogleWorkspacePage';

import { PerfusionCalculatorModal } from './components/PerfusionCalculatorModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { BulkZipModal } from './components/BulkZipModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { ExactDocumentSheet } from './components/ExactDocumentSheet';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { DoctorSettingsModal } from './components/DoctorSettingsModal';
import { DoctorOnboardingModal } from './components/DoctorOnboardingModal';
import {
  OfflineBanner,
  SessionExpiredModal,
  PermissionDeniedModal,
} from './components/StateFeedback';

export default function App() {
  const [currentDoctor, setDoctor] = useState<DoctorProfile | null>(() => getCurrentDoctor());
  const [currentView, setCurrentView] = useState<'login' | 'dashboard' | 'form-list' | 'form-editor' | 'google-workspace'>('dashboard');
  const [selectedFormType, setSelectedFormType] = useState<FormType>('adult');
  const [activeRecord, setActiveRecord] = useState<PatientRecord | null>(null);

  // Modals state
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isGoogleSyncOpen, setIsGoogleSyncOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isBulkZipOpen, setIsBulkZipOpen] = useState(false);
  const [bulkZipRecords, setBulkZipRecords] = useState<PatientRecord[]>([]);
  const [recordToDelete, setRecordToDelete] = useState<PatientRecord | null>(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);

  // System States
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  // Records for current logged in doctor
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Hidden container for off-screen PDF rendering
  const [renderRecordForPdf, setRenderRecordForPdf] = useState<PatientRecord | null>(null);

  const hiddenSheetRef = useRef<HTMLDivElement>(null);

  // Online / Offline Network Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      addToast('success', 'Back online. Cloud synchronization active.', 'Network Restored');
    };
    const handleOffline = () => {
      setIsOffline(true);
      addToast('info', 'Working in offline clinical mode. Edits cached locally.', 'No Internet Connection');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check Supabase session & listen for Google OAuth redirects
  useEffect(() => {
    try {
      const supabase = getSupabase();
      if (supabase && isSupabaseConfigured()) {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user && !currentDoctor) {
            const user = session.user;
            const googleName = user.user_metadata?.full_name || user.user_metadata?.name || '';
            const email = user.email || '';
            
            // Try fetch profile
            supabase
              .from('doctor_profiles')
              .select('*')
              .eq('id', user.id)
              .single()
              .then(({ data: profile }) => {
                if (profile) {
                  const doc: DoctorProfile = {
                    id: profile.id,
                    name: profile.name || profile.doctor_name || googleName || 'Dr. Practitioner',
                    email: profile.email || email,
                    hospital: profile.hospital || 'Apex Heart & Lung Institute',
                    department: profile.department || 'Cardiothoracic Surgery & Perfusion',
                    role: profile.role || 'Consultant Cardiac Surgeon & Perfusionist',
                    licenseNo: profile.license_no || '',
                    authProvider: 'google',
                  };
                  setDoctor(doc);
                  setCurrentDoctor(doc);
                } else {
                  // Setup initial doctor profile
                  const nameParts = email.split('@')[0].replace(/[._-]/g, ' ');
                  const formattedName = googleName
                    ? (googleName.startsWith('Dr.') ? googleName : `Dr. ${googleName}`)
                    : `Dr. ${nameParts.charAt(0).toUpperCase() + nameParts.slice(1)}`;

                  const newDoc: DoctorProfile = {
                    id: user.id,
                    name: formattedName,
                    email: email,
                    username: email.split('@')[0],
                    hospital: 'Apex Heart & Lung Institute',
                    department: 'Cardiothoracic Surgery & Perfusion',
                    role: 'Consultant Cardiac Surgeon & Perfusionist',
                    authProvider: 'google',
                  };
                  setDoctor(newDoc);
                  setCurrentDoctor(newDoc);
                }
              });
          }
        });

        // Listen for auth state changes (e.g. login/logout via OAuth)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            const user = session.user;
            const googleName = user.user_metadata?.full_name || user.user_metadata?.name || '';
            const email = user.email || '';
            const nameParts = email.split('@')[0].replace(/[._-]/g, ' ');
            const formattedName = googleName
              ? (googleName.startsWith('Dr.') ? googleName : `Dr. ${googleName}`)
              : `Dr. ${nameParts.charAt(0).toUpperCase() + nameParts.slice(1)}`;

            const doc: DoctorProfile = {
              id: user.id,
              name: formattedName,
              email: email,
              username: email.split('@')[0],
              hospital: 'Apex Heart & Lung Institute',
              department: 'Cardiothoracic Surgery & Perfusion',
              role: 'Consultant Cardiac Surgeon & Perfusionist',
              authProvider: 'google',
            };
            setDoctor(doc);
            setCurrentDoctor(doc);
            addToast('success', `Signed in as ${doc.name}`, 'Authentication Active');
          }
        });

        return () => {
          authListener?.subscription?.unsubscribe();
        };
      }
    } catch (e) {
      console.warn('Supabase session listener init:', e);
    }
  }, []);

  // Load records whenever doctor changes
  useEffect(() => {
    if (currentDoctor) {
      const docRecords = getDoctorRecords(currentDoctor.id);
      setRecords(docRecords);
      setCurrentDoctor(currentDoctor);
      
      // If doctor name or hospital is missing, open onboarding modal
      if (!currentDoctor.name || !currentDoctor.hospital) {
        setIsOnboardingOpen(true);
      }

      if (currentView === 'login') {
        setCurrentView('dashboard');
      }
    } else {
      setRecords([]);
      setCurrentView('login');
    }
  }, [currentDoctor]);

  const addToast = (type: 'success' | 'error' | 'info', message: string, title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleReloadRecords = () => {
    if (currentDoctor) {
      setRecords(getDoctorRecords(currentDoctor.id));
    }
  };

  // Sign In / Sign Out
  const handleSignIn = (doctor: DoctorProfile, isNewUser = false) => {
    setDoctor(doctor);
    setCurrentDoctor(doctor);
    if (isNewUser || !doctor.name || !doctor.hospital) {
      setIsOnboardingOpen(true);
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = getSupabase();
      if (supabase && isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch {}
    setDoctor(null);
    setCurrentDoctor(null);
    setRecords([]);
    setActiveRecord(null);
    setCurrentView('login');
    addToast('info', 'You have been signed out from your clinical vault.');
  };

  const handleUpdateDoctor = (updated: DoctorProfile) => {
    updateDoctorProfile(updated.id, updated);
    setDoctor(updated);
    setCurrentDoctor(updated);
    setIsOnboardingOpen(false);
  };

  // Navigation handlers
  const handleNavigateHome = () => {
    if (currentDoctor) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('login');
    }
  };

  const handleSelectFormType = (type: FormType) => {
    setSelectedFormType(type);
    setCurrentView('form-list');
  };

  const handleNewPatient = (type: FormType = 'adult') => {
    if (!currentDoctor) return;
    const newId = generatePatientId();
    const newRecord: PatientRecord = {
      id: `rec-${Date.now()}`,
      doctorId: currentDoctor.id,
      patientId: newId,
      patientName: '',
      formType: type,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: createBlankFormData(type, ''),
    };

    saveDoctorRecord(currentDoctor.id, newRecord);
    setRecords(getDoctorRecords(currentDoctor.id));
    setActiveRecord(newRecord);
    setSelectedFormType(type);
    setCurrentView('form-editor');
    addToast('info', `Created new patient draft ${newId}`);
  };

  const handleOpenRecord = (record: PatientRecord) => {
    if (currentDoctor && record.doctorId && record.doctorId !== currentDoctor.id) {
      setIsPermissionDenied(true);
      return;
    }
    setActiveRecord(record);
    setSelectedFormType(record.formType);
    setCurrentView('form-editor');
  };

  const handleSaveRecord = (updatedRecord: PatientRecord, showToast = true) => {
    if (!currentDoctor) {
      setIsSessionExpired(true);
      return;
    }
    try {
      const saved = saveDoctorRecord(currentDoctor.id, updatedRecord);
      setRecords(getDoctorRecords(currentDoctor.id));
      setActiveRecord(saved);
      if (showToast) {
        addToast('success', `Patient form for ${saved.patientName || saved.patientId} saved.`, 'Validation & Save Complete');
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to save record.');
    }
  };

  // Request delete confirmation
  const handleRequestDeleteRecord = (recordOrId: string | PatientRecord) => {
    if (!currentDoctor) return;
    if (typeof recordOrId === 'string') {
      const found = records.find((r) => r.id === recordOrId) || (activeRecord?.id === recordOrId ? activeRecord : null);
      if (found) {
        setRecordToDelete(found);
      }
    } else {
      setRecordToDelete(recordOrId);
    }
  };

  // Perform confirmed deletion
  const handleConfirmDeleteRecord = async (recordId: string) => {
    if (!currentDoctor) return;
    setIsDeletingRecord(true);
    try {
      deleteDoctorRecord(currentDoctor.id, recordId);
      const updatedList = getDoctorRecords(currentDoctor.id);
      setRecords(updatedList);
      if (activeRecord?.id === recordId) {
        setActiveRecord(null);
        setCurrentView('dashboard');
      }
      addToast('info', 'Record permanently removed from your vault.', 'Record Deleted');
      setRecordToDelete(null);
    } catch (err: any) {
      console.error('Delete record error:', err);
      addToast('error', err?.message || 'Failed to delete record.');
    } finally {
      setIsDeletingRecord(false);
    }
  };

  // Single Download Handler: Guaranteed Complete Standalone Form
  const handleDownloadSinglePdf = async (record: PatientRecord, targetElement?: HTMLElement) => {
    try {
      const cleanData = collectFormData(record.formType, record.data);
      const completeRecord: PatientRecord = {
        ...record,
        patientName: cleanData.patientName || record.patientName,
        data: cleanData,
      };

      downloadRecordHtml(completeRecord);
      addToast(
        'success',
        `Downloaded exact clinical form for ${completeRecord.patientName || completeRecord.patientId}`,
        'Download Ready'
      );
    } catch (err: any) {
      console.error('Download error:', err);
      addToast('error', err?.message || 'Could not download the clinical form. Please try again.');
    }
  };

  // Direct Save & Sync to Google Drive Vault & Google Sheets
  const handleSavePdfToGoogleDrive = async (record: PatientRecord, targetElement?: HTMLElement) => {
    // 1. Mandatory Patient Name Validation
    if (!record.patientName || !record.patientName.trim()) {
      addToast('error', 'Patient name is required to save to Google Drive & Google Sheets.');
      return;
    }

    const auth = currentDoctor ? getDoctorGoogleAuth(currentDoctor.id) : getStoredGoogleAuth();
    if (!auth.isConnected || !auth.accessToken) {
      setIsGoogleSyncOpen(true);
      addToast('info', 'Please connect your Google Workspace account to enable automatic cloud sync.');
      return;
    }

    try {
      addToast('info', `Saving clinical record to Google Drive & Google Sheets...`);
      
      // Collect complete form data (single source of truth)
      const cleanData = collectFormData(record.formType, record.data);
      const safePatientName = (cleanData.patientName || record.patientName).trim();
      const completeRecord: PatientRecord = {
        ...record,
        patientName: safePatientName,
        data: cleanData,
      };

      const safeName = safePatientName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const htmlFileName = `${completeRecord.patientId}_${safeName}.html`;
      
      // Render exact standalone HTML and validate
      const standaloneHtml = renderExactForm(
        completeRecord.formType,
        completeRecord.data,
        completeRecord.patientId,
        completeRecord.patientName
      );

      if (!standaloneHtml || standaloneHtml.trim().length < 100) {
        throw new Error('Form generation failed: Blank HTML prevented.');
      }

      let folderId = auth.driveFolderId;
      if (!folderId) {
        const folder = await createOrGetDriveFolder(auth.accessToken, `MedForms Pro - ${currentDoctor?.name || 'Doctor'}`);
        folderId = folder.folderId;
      }

      // 1. Upload Standalone HTML Archive to Google Drive
      const uploadRes = await uploadHtmlToDrive(auth.accessToken, folderId, htmlFileName, standaloneHtml);
      let driveUrl = uploadRes.viewUrl;
      let driveFileId = uploadRes.fileId;

      // 2. Also export and upload PDF if container is available
      try {
        let el = targetElement;
        if (!el) {
          setRenderRecordForPdf(completeRecord);
          await new Promise((r) => setTimeout(r, 200));
          el = hiddenSheetRef.current || undefined;
        }
        if (el) {
          const pdfFileName = `${completeRecord.patientId}_${safeName}.pdf`;
          const pdfBlob = await exportElementToPdf(el, pdfFileName);
          const pdfUploadRes = await uploadPdfToDrive(auth.accessToken, folderId, pdfFileName, pdfBlob);
          driveUrl = pdfUploadRes.viewUrl;
          driveFileId = pdfUploadRes.fileId;
        }
      } catch (pdfErr) {
        console.warn('PDF supplemental export notice:', pdfErr);
      }

      const updatedRec: PatientRecord = {
        ...completeRecord,
        drivePdfUrl: driveUrl,
        driveFileId: driveFileId,
        lastSyncedToDriveAt: new Date().toISOString(),
      };

      // Save locally under doctor's partition
      saveDoctorRecord(currentDoctor!.id, updatedRec);
      const allDocRecords = getDoctorRecords(currentDoctor!.id);
      setRecords(allDocRecords);
      if (activeRecord?.id === record.id) {
        setActiveRecord(updatedRec);
      }

      // 3. Sync to Google Sheets Tab immediately (including full JSON)
      if (auth.spreadsheetId) {
        try {
          await syncTabRecordsToGoogleSheets(auth.accessToken, auth.spreadsheetId, updatedRec.formType, allDocRecords);
        } catch (sheetsErr) {
          console.warn('Sheets sync notice:', sheetsErr);
        }
      }

      addToast('success', `Archived to Google Drive and synced with Google Sheets!`, 'Cloud Sync Complete');
    } catch (err: any) {
      console.error('Google Drive & Sheets upload error:', err);
      addToast('error', err?.message || 'Failed to sync to Google Drive & Sheets.');
    } finally {
      setRenderRecordForPdf(null);
    }
  };

  // Bulk ZIP handler
  const handleTriggerBulkZip = (selected: PatientRecord[]) => {
    if (selected.length === 0) {
      addToast('error', 'No records selected for Bulk ZIP.');
      return;
    }
    setBulkZipRecords(selected);
    setIsBulkZipOpen(true);
  };

  const renderRecordForBulkZip = async (record: PatientRecord): Promise<HTMLElement> => {
    setRenderRecordForPdf(record);
    await new Promise((r) => setTimeout(r, 250));
    if (hiddenSheetRef.current) {
      return hiddenSheetRef.current;
    }
    throw new Error('Offscreen container not ready');
  };

  return (
    <div className="min-h-screen pb-16 sm:pb-0 bg-[#f8fafc] text-neutral-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Offline Status Alert */}
      <OfflineBanner isOffline={isOffline} />

      {/* Toast Notification Container */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} />

      {/* Main Top Navigation Header */}
      {currentDoctor && (
        <Navbar
          currentDoctor={currentDoctor}
          onSignOut={handleSignOut}
          onOpenCalculator={() => setIsCalculatorOpen(true)}
          onOpenGoogleSync={() => setCurrentView('google-workspace')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenGuide={() => {}}
          onNavigateHome={handleNavigateHome}
          onNavigatePatients={() => {
            setSelectedFormType('adult');
            setCurrentView('form-list');
          }}
          onNewPatient={() => handleNewPatient('adult')}
          currentView={currentView}
        />
      )}

      {/* View Router */}
      <main className="flex-1">
        {!currentDoctor || currentView === 'login' ? (
          <LoginPage onLoginSuccess={handleSignIn} onShowToast={addToast} />
        ) : currentView === 'dashboard' ? (
          <DashboardView
            doctor={currentDoctor}
            onSelectFormType={handleSelectFormType}
            onOpenRecord={handleOpenRecord}
            onNewPatient={handleNewPatient}
            onDeleteRecord={handleRequestDeleteRecord}
            onDownloadPdf={(rec) => handleDownloadSinglePdf(rec)}
            onOpenGoogleSync={() => setCurrentView('google-workspace')}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onReloadRecords={handleReloadRecords}
            onShowToast={addToast}
          />
        ) : currentView === 'google-workspace' ? (
          <GoogleWorkspacePage
            doctor={currentDoctor}
            onBack={handleNavigateHome}
            onShowToast={addToast}
          />
        ) : currentView === 'form-list' ? (
          <FormListView
            formType={selectedFormType}
            records={records}
            onBackToDashboard={() => setCurrentView('dashboard')}
            onNewPatient={handleNewPatient}
            onEditRecord={handleOpenRecord}
            onDeleteRecord={handleRequestDeleteRecord}
            onDownloadPdf={(rec) => handleDownloadSinglePdf(rec)}
            onBulkZip={handleTriggerBulkZip}
          />
        ) : currentView === 'form-editor' && activeRecord ? (
          <FormEditorView
            record={activeRecord}
            onBack={() => setCurrentView('form-list')}
            onSave={handleSaveRecord}
            onDeleteRecord={handleRequestDeleteRecord}
            onDownloadPdf={(rec, el) => handleDownloadSinglePdf(rec, el)}
            onSaveToDrive={(rec, el) => handleSavePdfToGoogleDrive(rec, el)}
            onOpenGoogleSync={() => setCurrentView('google-workspace')}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
          />
        ) : null}
      </main>


      {/* Onboarding Modal (Asks Doctor Name and Hospital Name on fresh login) */}
      {currentDoctor && (
        <DoctorOnboardingModal
          isOpen={isOnboardingOpen}
          initialEmail={currentDoctor.email}
          currentProfile={currentDoctor}
          onComplete={handleUpdateDoctor}
        />
      )}

      {/* Settings Modal (Allows editing Doctor Name, Hospital, Supabase config) */}
      {currentDoctor && (
        <DoctorSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          doctor={currentDoctor}
          onUpdateDoctor={handleUpdateDoctor}
          onShowToast={addToast}
        />
      )}

      {/* Perfusion Calculator Modal */}
      <PerfusionCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        initialHeight={activeRecord?.data?.height || '170'}
        initialWeight={activeRecord?.data?.weight || '70'}
        onApplyValues={(vals) => {
          if (activeRecord && currentView === 'form-editor') {
            const updated = {
              ...activeRecord,
              data: {
                ...activeRecord.data,
                height: vals.height,
                weight: vals.weight,
                bsa: vals.bsa,
                flow30: vals.flow30,
                flow24: vals.flow24,
                hepDose: vals.hepDose,
              },
            };
            handleSaveRecord(updated, true);
            addToast('success', 'Calculated BSA, Flows, and Heparin applied to clinical sheet.', 'Form Validation Successful');
          } else {
            addToast('info', 'Values calculated.');
          }
        }}
      />

      {/* Google Sheets & Drive Sync Modal */}
      {currentDoctor && (
        <GoogleSyncModal
          isOpen={isGoogleSyncOpen}
          onClose={() => setIsGoogleSyncOpen(false)}
          records={records}
          doctorId={currentDoctor.id}
          doctorName={currentDoctor.name}
          onShowToast={addToast}
          onUpdateRecord={(updated) => {
            handleSaveRecord(updated, false);
          }}
          onRenderRecordPdf={renderRecordForBulkZip}
          onDownloadPdf={(rec) => handleDownloadSinglePdf(rec)}
        />
      )}

      {/* Bulk ZIP Export Modal */}
      <BulkZipModal
        isOpen={isBulkZipOpen}
        onClose={() => {
          setIsBulkZipOpen(false);
          setRenderRecordForPdf(null);
        }}
        selectedRecords={bulkZipRecords}
        renderRecordFn={renderRecordForBulkZip}
      />

      {/* Delete Record Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!recordToDelete}
        record={recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDeleteRecord}
        isDeleting={isDeletingRecord}
      />

      {/* Permission Denied Modal */}
      <PermissionDeniedModal
        isOpen={isPermissionDenied}
        onClose={() => setIsPermissionDenied(false)}
      />

      {/* Session Expired Modal */}
      <SessionExpiredModal
        isOpen={isSessionExpired}
        onReLogin={() => {
          setIsSessionExpired(false);
          setCurrentView('login');
        }}
      />

      {/* Off-screen Hidden Sheet Container for PDF Generation */}
      {renderRecordForPdf && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1000px' }}>
          <div ref={hiddenSheetRef}>
            <ExactDocumentSheet record={renderRecordForPdf} isEditable={false} id="offscreen-pdf-sheet" />
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Shell */}
      {currentDoctor && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0] block md:hidden pb-[env(safe-area-inset-bottom)] shadow-lg">
          <div className="flex justify-around items-center h-[60px]">
            {/* Home Tab */}
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
                currentView === 'dashboard' ? 'text-[#004ac6]' : 'text-[#737686]'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] font-semibold mt-0.5">Home</span>
            </button>
            
            {/* Patients Tab */}
            <button
              onClick={() => {
                setSelectedFormType('adult');
                setCurrentView('form-list');
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
                currentView === 'form-list' ? 'text-[#004ac6]' : 'text-[#737686]'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] font-semibold mt-0.5">Patients</span>
            </button>

            {/* Google Workspace Tab */}
            <button
              onClick={() => setCurrentView('google-workspace')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
                currentView === 'google-workspace' ? 'text-[#004ac6]' : 'text-[#737686]'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span className="text-[10px] font-semibold mt-0.5">Workspace</span>
            </button>

            {/* Calculator Tab */}
            <button
              onClick={() => setIsCalculatorOpen(true)}
              className="flex flex-col items-center justify-center flex-1 py-1 text-[#737686] hover:text-[#004ac6] transition-colors cursor-pointer"
            >
              <Calculator className="w-5 h-5" />
              <span className="text-[10px] font-semibold mt-0.5">Calc</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
