import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200/80 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 MedPulse Doctor Appointment Visibility Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <span>Single Synchronized Backend</span>
            <span>·</span>
            <span>Real-time Visibility</span>
            <span>·</span>
            <span>Zero Queue Uncertainty</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
