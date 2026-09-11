import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Calendar,
  Clock,
  BarChart3,
  User as UserIcon,
  LogOut,
  Stethoscope,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DoctorProfile } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Navbar } from '../components/Navbar';

export const DoctorLayout: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const doctorProfile = profile as DoctorProfile | null;

  const navItems = [
    { label: 'Dashboard', path: '/doctor', icon: Activity },
    { label: "Today's Queue", path: '/doctor/queue', icon: Stethoscope },
    { label: 'All Appointments', path: '/doctor/appointments', icon: Calendar },
    { label: 'Schedule & Slots', path: '/doctor/schedule', icon: Clock },
    { label: 'Analytics', path: '/doctor/analytics', icon: BarChart3 },
    { label: 'Doctor Profile', path: '/doctor/profile', icon: UserIcon }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        {/* Doctor Operational Sidebar (Desktop) */}
        <aside className="w-full md:w-64 shrink-0 space-y-4">
          {/* Doctor Status Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-base shrink-0">
                {user?.name.replace('Dr. ', '').charAt(0) || 'D'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 truncate">{user?.name}</h4>
                <p className="text-xs text-teal-800 font-medium truncate">
                  {doctorProfile?.specialization || 'Specialist'}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Live Status</span>
              {doctorProfile && (
                <StatusBadge
                  status={doctorProfile.status}
                  delayMinutes={doctorProfile.delayMinutes}
                  size="sm"
                />
              )}
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className="bg-white rounded-xl border border-slate-200 p-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-700 text-white font-semibold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-100 mt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Operational Cockpit */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
