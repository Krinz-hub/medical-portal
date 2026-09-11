import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, User as UserIcon } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export const PatientLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/patient', icon: Home },
    { label: 'Search', path: '/doctors', icon: Search },
    { label: 'Appts', path: '/patient/appointments', icon: Calendar },
    { label: 'Profile', path: '/patient/profile', icon: UserIcon }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pb-20 md:pb-0">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                isActive ? 'text-teal-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
