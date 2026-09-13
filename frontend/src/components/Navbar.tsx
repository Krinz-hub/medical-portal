import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  Calendar,
  Search,
  User as UserIcon,
  Bell,
  LogOut,
  Menu,
  X,
  Stethoscope,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { patientApi } from '../services/api';
import { NotificationItem } from '../types';
import { Button } from './ui/Button';

export const Navbar: React.FC = () => {
  const { user, profile, logout, isDoctor, isPatient } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && isPatient) {
      patientApi
        .getNotifications()
        .then((data) => setNotifications(data || []))
        .catch(() => {});
    }
  }, [user, isPatient]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await patientApi.markNotificationRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
      );
    } catch {
      // silently ignore
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0E4F43] text-white flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-base font-bold text-slate-900 tracking-tight leading-none">
                Med<span className="text-[#0E4F43]">Pulse</span>
              </span>
              <span className="text-[10px] font-medium text-slate-500 tracking-wider uppercase mt-0.5">
                Clinical Registry
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/doctors"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/doctors') || isActive('/patient/search')
                  ? 'bg-[#F0FDF8] text-[#0E4F43] font-semibold border border-[#A7F3D0]/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Find Doctors
            </Link>

            {isPatient && (
              <>
                <Link
                  to="/patient/appointments"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/patient/appointments')
                      ? 'bg-[#F0FDF8] text-[#0E4F43] font-semibold border border-[#A7F3D0]/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  My Appointments
                </Link>
                <Link
                  to="/patient/profile"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/patient/profile')
                      ? 'bg-[#F0FDF8] text-[#0E4F43] font-semibold border border-[#A7F3D0]/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Profile
                </Link>
              </>
            )}

            {isDoctor && (
              <>
                <Link
                  to="/doctor"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/doctor')
                      ? 'bg-[#F0FDF8] text-[#0E4F43] font-semibold border border-[#A7F3D0]/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
                <Link
                  to="/doctor/queue"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/doctor/queue')
                      ? 'bg-[#F0FDF8] text-[#0E4F43] font-semibold border border-[#A7F3D0]/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  Live Queue
                </Link>
                <Link
                  to="/doctor/schedule"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/doctor/schedule')
                      ? 'bg-[#F0FDF8] text-[#0E4F43] font-semibold border border-[#A7F3D0]/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Schedule & Slots
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 relative">
                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-xl shadow-lg border border-slate-200/90 py-2 z-50">
                      <div className="px-3 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800">Notifications</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium font-mono">{notifications.length}</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400">No notifications yet</div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n._id}
                              onClick={() => handleMarkAsRead(n._id)}
                              className={`p-3.5 text-xs cursor-pointer transition-colors hover:bg-slate-50 ${
                                n.isRead ? 'bg-white text-slate-600' : 'bg-[#F0FDF8] text-slate-900 font-medium'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-slate-900">{n.title}</p>
                                {!n.isRead && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#0E4F43]" />
                                )}
                              </div>
                              <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Role Pill */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                    <span className="text-[10px] uppercase font-mono font-bold text-[#0E4F43] tracking-wide bg-[#F0FDF8] px-1.5 py-0.5 rounded border border-[#A7F3D0]/70">
                      {user.role}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-rose-600 p-2"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register/patient">
                  <Button variant="primary" size="sm">
                    Patient Sign Up
                  </Button>
                </Link>
                <Link to="/register/doctor">
                  <Button variant="secondary" size="sm" leftIcon={<Stethoscope className="w-3.5 h-3.5" />}>
                    Doctor Portal
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
                {user.role}
              </span>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-fade-in">
          <Link
            to="/doctors"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Search className="w-4 h-4 text-brand-600" />
            Find Doctors
          </Link>

          {isPatient && (
            <>
              <Link
                to="/patient/appointments"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Calendar className="w-4 h-4 text-brand-600" />
                My Appointments
              </Link>
              <Link
                to="/patient/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <UserIcon className="w-4 h-4 text-brand-600" />
                My Profile
              </Link>
            </>
          )}

          {isDoctor && (
            <>
              <Link
                to="/doctor"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Activity className="w-4 h-4 text-brand-600" />
                Doctor Dashboard
              </Link>
              <Link
                to="/doctor/queue"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Stethoscope className="w-4 h-4 text-brand-600" />
                Today's Queue
              </Link>
              <Link
                to="/doctor/schedule"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Calendar className="w-4 h-4 text-brand-600" />
                Working Schedule
              </Link>
            </>
          )}

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <Button variant="danger" size="sm" onClick={handleLogout} className="w-full">
                Sign Out ({user.name})
              </Button>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register/patient" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Register as Patient
                  </Button>
                </Link>
                <Link to="/register/doctor" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Register as Doctor
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
