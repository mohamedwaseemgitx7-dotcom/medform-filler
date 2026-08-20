import React from 'react';
import { DoctorProfile } from '../types';
import {
  Calculator,
  LayoutDashboard,
  LogOut,
  Settings,
  FileSpreadsheet,
  Stethoscope,
  Plus,
  Users,
  CheckCircle2,
  Cloud,
} from 'lucide-react';
import { getDoctorGoogleAuth } from '../utils/googleWorkspace';

interface NavbarProps {
  currentDoctor: DoctorProfile | null;
  onSignOut: () => void;
  onOpenCalculator: () => void;
  onOpenGoogleSync: () => void;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  onNavigateHome: () => void;
  onNavigatePatients?: () => void;
  onNewPatient?: () => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDoctor,
  onSignOut,
  onOpenCalculator,
  onOpenGoogleSync,
  onOpenSettings,
  onOpenGuide,
  onNavigateHome,
  onNavigatePatients,
  onNewPatient,
  currentView,
}) => {
  const isGoogleConnected = currentDoctor
    ? getDoctorGoogleAuth(currentDoctor.id).isConnected
    : false;

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#E2E8F0] h-[64px] shrink-0">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Left: Brand & Navigation Links */}
        <div className="flex items-center gap-6 sm:gap-8">
          <div
            onClick={onNavigateHome}
            className="font-extrabold text-xl text-[#131b2e] tracking-tight cursor-pointer select-none flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-[#004ac6] rounded-lg flex items-center justify-center text-white shadow-xs">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span>MEDFORMS</span>
          </div>

          {currentDoctor && (
            <nav className="hidden md:flex items-center gap-6 h-full">
              <button
                type="button"
                onClick={onNavigateHome}
                className={`text-sm font-semibold transition-colors cursor-pointer py-1 ${
                  currentView === 'dashboard'
                    ? 'text-[#004ac6] border-b-2 border-[#004ac6]'
                    : 'text-[#434655] hover:text-[#004ac6]'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={onNavigatePatients || onNavigateHome}
                className={`text-sm font-semibold transition-colors cursor-pointer py-1 ${
                  currentView === 'form-list'
                    ? 'text-[#004ac6] border-b-2 border-[#004ac6]'
                    : 'text-[#434655] hover:text-[#004ac6]'
                }`}
              >
                Patients
              </button>
              <button
                type="button"
                onClick={onOpenCalculator}
                className="text-sm font-semibold text-[#434655] hover:text-[#004ac6] transition-colors cursor-pointer"
              >
                Calculator
              </button>
              <button
                type="button"
                onClick={onOpenGoogleSync}
                className={`text-sm font-semibold transition-colors cursor-pointer py-1 ${
                  currentView === 'google-workspace'
                    ? 'text-[#004ac6] border-b-2 border-[#004ac6]'
                    : 'text-[#434655] hover:text-[#004ac6]'
                }`}
              >
                Workspace
              </button>
            </nav>
          )}
        </div>

        {/* Right: Actions */}
        {currentDoctor ? (
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Google Status Badge */}
            <button
              type="button"
              onClick={onOpenGoogleSync}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                isGoogleConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-[#F2F3FF] text-[#004ac6] border-[#C3C6D7] hover:bg-[#E2E7FF]'
              }`}
            >
              {isGoogleConnected ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Connected</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-[#004ac6]" />
                  <span>Connect Google</span>
                </>
              )}
            </button>

            {/* New Patient Button */}
            {onNewPatient && (
              <button
                type="button"
                onClick={onNewPatient}
                className="bg-[#004ac6] hover:bg-[#2563eb] active:bg-[#003ea8] text-white font-semibold text-xs sm:text-sm px-3.5 sm:px-4 h-[38px] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Patient</span>
              </button>
            )}

            {/* Profile / Settings Button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 text-[#434655] hover:text-[#004ac6] hover:bg-[#F2F3FF] rounded-full transition-colors cursor-pointer"
              title="Doctor Profile & Settings"
            >
              <div className="w-8 h-8 rounded-full bg-[#E2E8F0] text-[#004ac6] flex items-center justify-center font-bold text-xs border border-[#C3C6D7]">
                {currentDoctor.name ? currentDoctor.name.charAt(3) || currentDoctor.name.charAt(0) : 'D'}
              </div>
            </button>

            {/* Sign Out */}
            <button
              type="button"
              onClick={onSignOut}
              className="p-1.5 text-[#ba1a1a] hover:bg-[#FFDAD6] rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 bg-[#004ac6] hover:bg-[#2563eb] text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
