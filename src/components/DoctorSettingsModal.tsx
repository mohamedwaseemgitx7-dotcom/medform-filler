import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Building2,
  Settings,

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
              <Settings className="w-5 h-5" />

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
        </div>
      </div>
    </div>
  );
};
