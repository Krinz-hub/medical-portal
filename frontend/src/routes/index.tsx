import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PublicLayout } from '../layouts/PublicLayout';
import { PatientLayout } from '../layouts/PatientLayout';
import { DoctorLayout } from '../layouts/DoctorLayout';

// Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { PatientRegisterPage } from '../pages/auth/PatientRegisterPage';
import { DoctorRegisterPage } from '../pages/auth/DoctorRegisterPage';
import { PatientHomePage } from '../pages/patient/PatientHomePage';
import { DoctorSearchPage } from '../pages/patient/DoctorSearchPage';
import { DoctorDetailPage } from '../pages/patient/DoctorDetailPage';
import { PatientAppointmentsPage } from '../pages/patient/PatientAppointmentsPage';
import { PatientProfilePage } from '../pages/patient/PatientProfilePage';

import { DoctorDashboardPage } from '../pages/doctor/DoctorDashboardPage';
import { DoctorQueuePage } from '../pages/doctor/DoctorQueuePage';
import { DoctorAppointmentsPage } from '../pages/doctor/DoctorAppointmentsPage';
import { DoctorSchedulePage } from '../pages/doctor/DoctorSchedulePage';
import { DoctorAnalyticsPage } from '../pages/doctor/DoctorAnalyticsPage';
import { DoctorProfilePage } from '../pages/doctor/DoctorProfilePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: 'PATIENT' | 'DOCTOR' }> = ({
  children,
  allowedRole
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'DOCTOR' ? '/doctor' : '/patient'} replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<PatientHomePage />} />
        <Route path="/doctors" element={<DoctorSearchPage />} />
        <Route path="/doctors/:id" element={<DoctorDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register/patient" element={<PatientRegisterPage />} />
        <Route path="/register/doctor" element={<DoctorRegisterPage />} />
      </Route>

      {/* Patient Routes */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRole="PATIENT">
            <PatientLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PatientHomePage />} />
        <Route path="search" element={<DoctorSearchPage />} />
        <Route path="doctors/:id" element={<DoctorDetailPage />} />
        <Route path="appointments" element={<PatientAppointmentsPage />} />
        <Route path="profile" element={<PatientProfilePage />} />
      </Route>

      {/* Doctor Routes */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRole="DOCTOR">
            <DoctorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DoctorDashboardPage />} />
        <Route path="queue" element={<DoctorQueuePage />} />
        <Route path="appointments" element={<DoctorAppointmentsPage />} />
        <Route path="schedule" element={<DoctorSchedulePage />} />
        <Route path="analytics" element={<DoctorAnalyticsPage />} />
        <Route path="profile" element={<DoctorProfilePage />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
