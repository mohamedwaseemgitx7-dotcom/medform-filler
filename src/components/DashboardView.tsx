import React, { useState } from 'react';
import { DoctorProfile, FormType, PatientRecord } from '../types';
import {
  FORM_CONFIGS,
  getDoctorStats,
  getDoctorRecords,
} from '../utils/storage';
import { getDoctorGoogleAuth } from '../utils/googleWorkspace';
import { downloadRecordHtml } from '../utils/htmlExport';
import {
  Plus,
  ArrowRight,
  FileCode,
  FileText,
  Activity,
  HeartPulse,
  FolderOpen,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  Edit2,
  Trash2,
  CheckCircle2,
  Cloud,
  Search,
  BookOpen,
} from 'lucide-react';

interface DashboardViewProps {
  doctor: DoctorProfile;
  onSelectFormType: (type: FormType) => void;
  onOpenRecord: (record: PatientRecord) => void;
  onNewPatient: (type?: FormType) => void;
  onDeleteRecord: (recordId: string) => void;
  onDownloadPdf: (record: PatientRecord) => void;
  onOpenGoogleSync: () => void;
  onOpenSettings: () => void;
  onReloadRecords: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  doctor,
  onSelectFormType,
  onOpenRecord,
  onNewPatient,
  onDeleteRecord,
  onDownloadPdf,
  onOpenGoogleSync,
  onOpenSettings,
  onReloadRecords,
  onShowToast,
}) => {
  const allRecords = getDoctorRecords(doctor.id);
  const googleAuth = getDoctorGoogleAuth(doctor.id);
  const stats = getDoctorStats(doctor.id);

  const recentRecords = allRecords.slice(0, 5);

  const quickForms = [
    {
      type: 'adult' as FormType,
      title: 'Adult',
      subtitle: 'Adult Data Sheet',
      icon: (
        <svg className="w-6 h-6 text-[#004ac6]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
        </svg>
      ),
      count: stats.byType.adult,


    },
    {
      type: 'pediatric' as FormType,
      title: 'Pediatric',
      subtitle: 'Pediatric Data Sheet',
      icon: (
        <svg className="w-6 h-6 text-[#004ac6]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 13c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z" />
        </svg>
      ),
      count: stats.byType.pediatric,


    },
    {
      type: 'ecmo' as FormType,
      title: 'ECMO',
      subtitle: 'Extracorporeal Membrane Oxygenation',
      icon: <Activity className="w-6 h-6 text-[#004ac6]" />,
      count: stats.byType.ecmo,


    },
    {
      type: 'iabp' as FormType,
      title: 'IABP',
      subtitle: 'Intra-aortic Balloon Pump',
      icon: <HeartPulse className="w-6 h-6 text-[#004ac6]" />,
      count: stats.byType.iabp,


    },
  ];

  return (
    <div className="bg-[#FAF8FF] min-h-screen text-[#131b2e] font-sans antialiased py-6 sm:py-8">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
        {/* Greeting & Primary Action */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
              Hello, {doctor.name || 'Doctor'}
            </h1>
            <p className="text-sm text-[#434655] mt-1 font-medium">
              Ready for today's rounds? • {doctor.hospital || 'Apex Heart & Lung Institute'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNewPatient('adult')}
              className="w-full sm:w-auto h-[44px] bg-[#004ac6] hover:bg-[#2563eb] active:bg-[#003ea8] text-white font-semibold text-sm px-5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Patient</span>
            </button>
          </div>
        </section>

        {/* Quick Forms Bento Grid */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-bold text-[#434655] uppercase tracking-wider">Quick Forms</h2>
            <span className="text-xs text-[#737686]">{allRecords.length} total records</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickForms.map((item) => (
              <div
                key={item.type}
                onClick={() => onSelectFormType(item.type)}
                className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 flex items-center gap-4 hover:bg-[#F2F3FF] hover:border-[#C3C6D7] transition-all duration-150 cursor-pointer group shadow-xs active:scale-[0.99]"
              >
                <div className="w-12 h-12 rounded-xl bg-[#F2F3FF] group-hover:bg-white flex items-center justify-center shrink-0 transition-colors border border-[#E2E8F0]">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#131b2e] group-hover:text-[#004ac6] transition-colors truncate">
                      {item.title}
                    </h3>
                    <span className="text-xs font-bold text-[#737686] bg-[#FAF8FF] px-2 py-0.5 rounded-full border border-[#E2E8F0]">
                      {item.count}
                    </span>
                  </div>
                  <p className="text-xs text-[#434655] truncate mt-0.5">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Google Workspace & Cloud Bar */}
        <section className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              googleAuth.isConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F2F3FF] text-[#004ac6]'
            }`}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#131b2e]">
                  {googleAuth.isConnected ? 'Google Workspace Connected' : 'Google Cloud Backup'}
                </span>
                {googleAuth.isConnected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Live
                  </span>
                )}
              </div>
              <p className="text-xs text-[#737686] mt-0.5">
                {googleAuth.isConnected
                  ? `Signed in as ${googleAuth.userEmail || doctor.email} • 4-Tab Sheet & Drive Vault active`
                  : 'Connect Google to auto-sync sheets and save PDF & HTML forms to Drive'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {googleAuth.spreadsheetUrl && (
              <a
                href={googleAuth.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF8FF] hover:bg-[#F2F3FF] text-emerald-700 border border-[#E2E8F0] text-xs font-semibold rounded-lg transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Open Sheets</span>
              </a>
            )}

            {googleAuth.driveFolderUrl && (
              <a
                href={googleAuth.driveFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF8FF] hover:bg-[#F2F3FF] text-[#004ac6] border border-[#E2E8F0] text-xs font-semibold rounded-lg transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Open Drive</span>
              </a>
            )}

            <button
              onClick={onOpenGoogleSync}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#004ac6] hover:bg-[#2563eb] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <span>{googleAuth.isConnected ? 'Manage Cloud' : 'Connect Google'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Recent Patients List */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-bold text-[#434655] uppercase tracking-wider">Recent Patients</h2>
            <button
              onClick={() => onSelectFormType('adult')}
              className="text-xs font-bold text-[#004ac6] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs divide-y divide-[#E2E8F0]">
            {recentRecords.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm font-semibold text-[#131b2e]">No patient records recorded yet</p>
                <p className="text-xs text-[#737686]">Click "New Patient" above to start your first clinical form.</p>
              </div>
            ) : (
              recentRecords.map((record) => {
                const ipNo = record.data?.ipNo || record.patientId;
                const formName = FORM_CONFIGS[record.formType]?.title || record.formType.toUpperCase();

                return (
                  <div
                    key={record.id}
                    onClick={() => onOpenRecord(record)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F2F3FF] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#FAF8FF] group-hover:bg-white flex items-center justify-center text-[#004ac6] font-bold text-xs border border-[#E2E8F0] shrink-0">
                        {record.patientName ? record.patientName.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#131b2e] group-hover:text-[#004ac6] transition-colors">
                          {record.patientName || 'Untitled Patient'}
                        </div>
                        <div className="text-xs text-[#434655] mt-0.5">
                          IP: {ipNo} • {formName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                      {/* Status Tag */}
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                        record.status === 'completed'
                          ? 'bg-[#d0e1fb] text-[#004ac6]'
                          : 'bg-[#e2e7ff] text-[#131b2e]'
                      }`}>
                        {record.status === 'completed' ? 'Completed' : 'Draft'}
                      </span>

                      {/* Download HTML */}
                      <button
                        type="button"
                        onClick={() => downloadRecordHtml(record)}
                        className="p-1.5 text-[#434655] hover:text-[#004ac6] hover:bg-white rounded-md transition-colors"
                        title="Download Standalone HTML"
                      >
                        <FileCode className="w-4 h-4" />
                      </button>

                      {/* Download PDF */}
                      <button
                        type="button"
                        onClick={() => onDownloadPdf(record)}
                        className="p-1.5 text-[#434655] hover:text-[#004ac6] hover:bg-white rounded-md transition-colors"
                        title="Download PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(record.id)}
                        className="p-1.5 text-[#ba1a1a] hover:bg-[#FFDAD6] rounded-md transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <ChevronRight className="w-4 h-4 text-[#C3C6D7] group-hover:text-[#004ac6] ml-1" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
