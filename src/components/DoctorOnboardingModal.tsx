import React, { useState } from 'react';
import {
  Stethoscope,
  Building2,
  User,
  Key,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { DoctorProfile } from '../types';

interface DoctorOnboardingModalProps {
  isOpen: boolean;
  initialEmail: string;
  currentProfile: DoctorProfile;
  onComplete: (updated: DoctorProfile) => void;
}

export const DoctorOnboardingModal: React.FC<DoctorOnboardingModalProps> = ({
  isOpen,
  initialEmail,
  currentProfile,
  onComplete,
}) => {
  const [name, setName] = useState(currentProfile.name || '');
  const [hospital, setHospital] = useState(currentProfile.hospital || '');
  const [department, setDepartment] = useState(
    currentProfile.department || 'Cardiothoracic Surgery & Perfusion'
  );
  const [licenseNo, setLicenseNo] = useState(currentProfile.licenseNo || '');
  const [role, setRole] = useState(
    currentProfile.role || 'Consultant Cardiac Surgeon & Perfusionist'
  );
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your Doctor Name');
      return;
    }
    if (!hospital.trim()) {
      setError('Please provide your Hospital / Healthcare Institution Name');
      return;
    }

    const updatedProfile: DoctorProfile = {
      ...currentProfile,
      name: name.trim(),
      hospital: hospital.trim(),
      department: department.trim(),
      role: role.trim(),
      licenseNo: licenseNo.trim(),
    };

    onComplete(updatedProfile);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-6">
        {/* Header with Medical Icon */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto shadow-sm">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Complete Practitioner Profile
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please enter your doctor name and hospital. A fresh, isolated clinical database vault will be created exclusively for your account ({initialEmail}).
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Doctor Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Doctor Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Dr. Mohamed Shakeel"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Hospital Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Hospital / Clinical Institution <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={hospital}
                onChange={(e) => {
                  setHospital(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Apex Heart & Lung Institute"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Department & Specialty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Cardiothoracic Surgery"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                License / Registration ID
              </label>
              <div className="relative">
                <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  placeholder="MCI-84920"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Clinical Isolation Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-slate-600 text-[11px] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Private Data Partition:</strong> Your records will be isolated under your Doctor UID in Supabase and local cache with zero access by other practitioners.
            </span>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            <span>Confirm Profile & Open Fresh Database</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
