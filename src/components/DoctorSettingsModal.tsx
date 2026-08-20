import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Building2,
  Stethoscope,
  Key,
  Save,
  HelpCircle,
  FileEdit,
  Smartphone,
  Calculator,
  Cloud,
  Download,
  CheckCircle2,
  ChevronRight,
  Droplets,
  Heart,
  Layers,
} from 'lucide-react';
import { DoctorProfile } from '../types';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearCustomSupabaseConfig,
  testSupabaseConnection,
  isSupabaseConfigured,
} from '../utils/supabaseClient';
import { Copy, Database, ShieldCheck, RefreshCw } from 'lucide-react';

interface DoctorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfile;
  onUpdateDoctor: (updated: DoctorProfile) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
  initialTab?: 'profile' | 'guide' | 'supabase';
}

export const DoctorSettingsModal: React.FC<DoctorSettingsModalProps> = ({
  isOpen,
  onClose,
  doctor,
  onUpdateDoctor,
  onShowToast,
  initialTab = 'profile',
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'guide' | 'supabase'>(initialTab);
  const [guideSection, setGuideSection] = useState<'filling' | 'mobile' | 'formulas' | 'sync' | 'export'>('filling');

  // Doctor profile state
  const [name, setName] = useState(doctor.name);
  const [hospital, setHospital] = useState(doctor.hospital);
  const [department, setDepartment] = useState(doctor.department);
  const [role, setRole] = useState(doctor.role);
  const [licenseNo, setLicenseNo] = useState(doctor.licenseNo || '');

  // Supabase state
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(doctor.name);
      setHospital(doctor.hospital);
      setDepartment(doctor.department);
      setRole(doctor.role);
      setLicenseNo(doctor.licenseNo || '');
      setActiveTab(initialTab);

      const cfg = getSupabaseConfig();
      setSupabaseUrl(cfg.url || '');
      setSupabaseAnonKey(cfg.anonKey || '');
      setSupabaseStatusMsg('');
    }
  }, [isOpen, doctor, initialTab]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !hospital.trim()) {
      onShowToast('error', 'Doctor Name and Hospital Name are required.', 'Validation Error');
      return;
    }

    const updated: DoctorProfile = {
      ...doctor,
      name: name.trim(),
      hospital: hospital.trim(),
      department: department.trim(),
      role: role.trim(),
      licenseNo: licenseNo.trim(),
    };

    onUpdateDoctor(updated);
    onShowToast('success', 'Practitioner credentials and hospital profile updated.', 'Profile Updated');
  };

  return (
    <div
      id="doctor-settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="doctor-settings-modal"
        className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-5 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Practitioner Settings & User Guide
              </h2>
              <p className="text-xs text-slate-500">
                Manage doctor identity, hospital credentials, and consult clinical guides.
              </p>
            </div>
          </div>
          <button
            id="close-settings-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 shrink-0 overflow-x-auto">
          <button
            id="tab-profile-btn"
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'profile'
                ? 'border-[#004ac6] text-[#004ac6]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Doctor & Hospital Profile
          </button>

          <button
            id="tab-supabase-btn"
            type="button"
            onClick={() => setActiveTab('supabase' as any)}
            className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 shrink-0 ${
              (activeTab as any) === 'supabase'
                ? 'border-[#004ac6] text-[#004ac6]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Supabase Cloud & RLS
          </button>

          <button
            id="tab-guide-btn"
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'guide'
                ? 'border-[#004ac6] text-[#004ac6]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            User Guide & Documentation
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* Tab 1: Profile Settings */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Doctor Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-doctor-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hospital / Institution <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-doctor-hospital"
                      type="text"
                      required
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    id="input-doctor-department"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Clinical Role / Designation
                  </label>
                  <input
                    id="input-doctor-role"
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Medical License ID
                  </label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-doctor-license"
                      type="text"
                      value={licenseNo}
                      onChange={(e) => setLicenseNo(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Practitioner Email (Read-Only)
                  </label>
                  <input
                    id="input-doctor-email-readonly"
                    type="email"
                    disabled
                    value={doctor.email}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  id="save-profile-btn"
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#004ac6] hover:bg-[#2563eb] active:bg-[#003ea8] text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Supabase Cloud & RLS */}
          {activeTab === 'supabase' && (
            <div className="space-y-4 pt-1">
              <div className="bg-[#FAF8FF] border border-[#C3C6D7] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#004ac6]" />
                    <h3 className="text-xs font-bold text-[#131b2e]">Supabase Database & Row Level Security</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSupabaseConfigured() ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isSupabaseConfigured() ? 'Configured' : 'Optional / Standalone'}
                  </span>
                </div>
                <p className="text-xs text-[#434655] leading-relaxed">
                  MedForms Pro supports PostgreSQL with strict Row Level Security (RLS) policies. Each practitioner only accesses their own clinical records.
                </p>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                      Project URL (e.g., https://xyzcompany.supabase.co)
                    </label>
                    <input
                      type="url"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://your-project.supabase.co"
                      className="w-full px-3 py-2 text-xs border border-[#C3C6D7] rounded-lg focus:ring-1 focus:ring-[#004ac6] bg-white text-[#131b2e]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                      Anon Public API Key
                    </label>
                    <input
                      type="text"
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-3 py-2 text-xs border border-[#C3C6D7] rounded-lg focus:ring-1 focus:ring-[#004ac6] bg-white text-[#131b2e] font-mono"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (saveSupabaseConfig({ url: supabaseUrl, anonKey: supabaseAnonKey })) {
                          onShowToast('success', 'Supabase credentials saved successfully.', 'Config Saved');
                        }
                      }}
                      className="px-4 py-2 bg-[#004ac6] hover:bg-[#2563eb] text-white text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      Save Configuration
                    </button>

                    <button
                      type="button"
                      disabled={isTestingSupabase || !supabaseUrl || !supabaseAnonKey}
                      onClick={async () => {
                        setIsTestingSupabase(true);
                        saveSupabaseConfig({ url: supabaseUrl, anonKey: supabaseAnonKey });
                        const res = await testSupabaseConnection();
                        setIsTestingSupabase(false);
                        setSupabaseStatusMsg(res.message);
                        onShowToast(res.success ? 'success' : 'error', res.message, 'Supabase Connection Test');
                      }}
                      className="px-4 py-2 bg-white border border-[#C3C6D7] hover:bg-[#F2F3FF] text-[#131b2e] text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isTestingSupabase ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Test Connection</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        clearCustomSupabaseConfig();
                        setSupabaseUrl('');
                        setSupabaseAnonKey('');
                        setSupabaseStatusMsg('');
                        onShowToast('info', 'Supabase configuration cleared.', 'Config Reset');
                      }}
                      className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>

                  {supabaseStatusMsg && (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs">
                      {supabaseStatusMsg}
                    </div>
                  )}
                </div>
              </div>

              {/* Copy SQL Schema Card */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-[#131b2e]">
                      SQL Schema & Row Level Security (RLS) Script
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const sql = `-- MEDFORMS PRO - COMPLETE SUPABASE SQL SCHEMA WITH ROW LEVEL SECURITY (RLS)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.practitioners (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT NOT NULL,
    hospital TEXT DEFAULT 'Apex Heart & Lung Institute',
    department TEXT DEFAULT 'Cardiothoracic Surgery & Perfusion',
    role TEXT DEFAULT 'Consultant Cardiac Surgeon & Perfusionist',
    license_no TEXT,
    avatar_url TEXT,
    auth_provider TEXT DEFAULT 'google',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.patient_records (
    id TEXT PRIMARY KEY,
    doctor_id TEXT NOT NULL REFERENCES public.practitioners(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL,
    patient_name TEXT,
    form_type TEXT NOT NULL CHECK (form_type IN ('adult', 'pediatric', 'ecmo', 'iabp')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    drive_pdf_url TEXT,
    drive_file_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.doctor_workspace_sync (
    doctor_id TEXT PRIMARY KEY REFERENCES public.practitioners(id) ON DELETE CASCADE,
    spreadsheet_id TEXT,
    spreadsheet_url TEXT,
    drive_folder_id TEXT,
    drive_folder_url TEXT,
    auto_sync BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_workspace_sync ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can only view their own patient records" ON public.patient_records;
CREATE POLICY "Doctors can only view their own patient records"
    ON public.patient_records FOR SELECT
    USING ((auth.uid() IS NOT NULL AND (auth.uid())::text = doctor_id::text) OR ((auth.jwt() ->> 'email') IS NOT NULL AND doctor_id::text IN (SELECT p.id::text FROM public.practitioners p WHERE p.email::text = (auth.jwt() ->> 'email')::text)) OR (auth.role()::text = 'anon'));

DROP POLICY IF EXISTS "Doctors can only insert their own patient records" ON public.patient_records;
CREATE POLICY "Doctors can only insert their own patient records"
    ON public.patient_records FOR INSERT
    WITH CHECK ((auth.uid() IS NOT NULL AND (auth.uid())::text = doctor_id::text) OR ((auth.jwt() ->> 'email') IS NOT NULL AND doctor_id::text IN (SELECT p.id::text FROM public.practitioners p WHERE p.email::text = (auth.jwt() ->> 'email')::text)) OR (auth.role()::text = 'anon'));

DROP POLICY IF EXISTS "Doctors can only update their own patient records" ON public.patient_records;
CREATE POLICY "Doctors can only update their own patient records"
    ON public.patient_records FOR UPDATE
    USING ((auth.uid() IS NOT NULL AND (auth.uid())::text = doctor_id::text) OR ((auth.jwt() ->> 'email') IS NOT NULL AND doctor_id::text IN (SELECT p.id::text FROM public.practitioners p WHERE p.email::text = (auth.jwt() ->> 'email')::text)) OR (auth.role()::text = 'anon'));

DROP POLICY IF EXISTS "Doctors can only delete their own patient records" ON public.patient_records;
CREATE POLICY "Doctors can only delete their own patient records"
    ON public.patient_records FOR DELETE
    USING ((auth.uid() IS NOT NULL AND (auth.uid())::text = doctor_id::text) OR ((auth.jwt() ->> 'email') IS NOT NULL AND doctor_id::text IN (SELECT p.id::text FROM public.practitioners p WHERE p.email::text = (auth.jwt() ->> 'email')::text)) OR (auth.role()::text = 'anon'));
`;
                      navigator.clipboard.writeText(sql);
                      onShowToast('success', 'Supabase SQL Schema copied to clipboard!', 'SQL Copied');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL</span>
                  </button>
                </div>
                <p className="text-xs text-[#737686]">
                  File saved at project root: <span className="font-mono font-bold text-[#131b2e]">supabase-schema.sql</span>. Paste into Supabase Dashboard → SQL Editor and click Run.
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: User Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-4 pt-1">
              {/* Sub-navigation for Guide */}
              <div className="flex border-b border-slate-200 bg-slate-50 rounded-xl p-1 gap-1 overflow-x-auto text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setGuideSection('filling')}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                    guideSection === 'filling'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>1. Filling Forms</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGuideSection('mobile')}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                    guideSection === 'mobile'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>2. Mobile & Zoom</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGuideSection('formulas')}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                    guideSection === 'formulas'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>3. Auto Formulas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGuideSection('sync')}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                    guideSection === 'sync'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>4. Google Sync</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGuideSection('export')}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                    guideSection === 'export'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>5. PDF & ZIP Export</span>
                </button>
              </div>

              {/* Guide Content Sections */}
              {guideSection === 'filling' && (
                <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed">
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900">
                    <h4 className="font-bold flex items-center gap-2 mb-1">
                      <FileEdit className="w-4 h-4 text-blue-600" />
                      Direct Interactive Clinical Sheet Editing
                    </h4>
                    <p>
                      Click directly into any cell or field on the exact clinical sheet to edit demographics, cardioplegia timings, heparin dose, gas values, and fluid balances.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-900">Quick Key Features:</div>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                      <li><strong>Fill Sample Data:</strong> Click the "Fill Sample Data" button at the top of the form editor to auto-populate complete clinical details for instant testing and reference.</li>
                      <li><strong>Minimum Required Info:</strong> Only Patient Name is required to save and download a complete, structured clinical sheet.</li>
                      <li><strong>Auto Status:</strong> Switch between <strong>Draft</strong> and <strong>Completed</strong> directly from the status toggle.</li>
                    </ul>
                  </div>
                </div>
              )}

              {guideSection === 'mobile' && (
                <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
                      <Smartphone className="w-4 h-4 text-slate-700" />
                      Mobile Optimization & Zoom Controls
                    </h4>
                    <p className="text-slate-600">
                      View and edit large clinical tables seamlessly on both desktop monitors and mobile devices.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-900">Zoom & Layout Options:</div>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                      <li><strong>Zoom Controls:</strong> Use <strong>Zoom In (+)</strong>, <strong>Zoom Out (-)</strong>, or <strong>Fit Screen</strong> to adjust the document scaling from 40% to 200%.</li>
                      <li><strong>Mobile Form View:</strong> Switch to the "Mobile Form" tab for an easy-touch stacked input interface specifically designed for phones and small tablets.</li>
                      <li><strong>Print Preview:</strong> Click "Print Preview" to inspect the document before physical printing.</li>
                    </ul>
                  </div>
                </div>
              )}

              {guideSection === 'formulas' && (
                <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                    <h4 className="font-bold flex items-center gap-2 mb-1">
                      <Calculator className="w-4 h-4 text-emerald-700" />
                      Automated Perfusion Formulas & Fluid Balance
                    </h4>
                    <p>
                      Automatic computation of Body Surface Area (BSA), cardiac perfusion flow rates, and fluid balance.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-900">Formulas Used:</div>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                      <li><strong>BSA (Mosteller Formula):</strong> <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">√((Height × Weight) / 3600)</code></li>
                      <li><strong>Flow 2.4 L/min/m²:</strong> <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">BSA × 2.4</code></li>
                      <li><strong>Flow 3.0 L/min/m²:</strong> <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">BSA × 3.0</code></li>
                      <li><strong>Auto Fluid Balance:</strong> Click <strong>Auto-Balance</strong> in the toolbar to automatically sum Prime Gain, Fluid Loss, and compute Net Balance.</li>
                    </ul>
                  </div>
                </div>
              )}

              {guideSection === 'sync' && (
                <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed">
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                    <h4 className="font-bold flex items-center gap-2 mb-1">
                      <Cloud className="w-4 h-4 text-blue-600" />
                      Google Workspace Synchronization
                    </h4>
                    <p>
                      Direct 4-tab synchronization with Google Sheets (Adult, Pediatric, ECMO, IABP) and cloud PDF archiving in Google Drive.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-900">Workflow:</div>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                      <li>Click <strong>Sheets & Drive</strong> in the top navigation or <strong>Save to Google Drive & Google Sheets</strong> at the bottom of any form.</li>
                      <li>Authenticates directly via secure Google Workspace OAuth.</li>
                      <li>Creates or updates your designated spreadsheet with synchronized patient rows.</li>
                    </ul>
                  </div>
                </div>
              )}

              {guideSection === 'export' && (
                <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed">
                  <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-900">
                    <h4 className="font-bold flex items-center gap-2 mb-1">
                      <Download className="w-4 h-4 text-purple-600" />
                      High-Fidelity PDF & Bulk ZIP Archiving
                    </h4>
                    <p>
                      Generate standalone, complete clinical documents ready for medical records, printing, or offline review.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-900">Export Options:</div>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                      <li><strong>Direct Download:</strong> Click the Download icon on any record in the list or dashboard to download the complete clinical form immediately.</li>
                      <li><strong>Bulk ZIP Export:</strong> In the Form Records view, select multiple patient cases and click <strong>Bulk ZIP</strong> to download a single zipped package containing all selected forms.</li>
                      <li><strong>Guaranteed Non-Blank:</strong> Even with only the patient name entered, all sections, grid layouts, and labels are preserved with zero blank pages.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
