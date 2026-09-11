import React, { useState, useEffect } from 'react';
import { Mail, Phone, Check, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { patientApi } from '../../services/api';
import { PatientProfile } from '../../types';
import { Button } from '../../components/ui/Button';

export const PatientProfilePage: React.FC = () => {
  const { user, profile, refreshUser, logout } = useAuth();
  const [patientData, setPatientData] = useState<PatientProfile | null>(profile as PatientProfile);

  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    patientApi
      .getProfile()
      .then((p) => {
        setPatientData(p);
        if (p) {
          setDateOfBirth(p.dateOfBirth || '');
          setGender(p.gender || '');
          setAddress(p.address || '');
          setEmergencyContact(p.emergencyContact || '');
          setBloodGroup(p.bloodGroup || '');
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await patientApi.updateProfile({
        dateOfBirth,
        gender,
        address,
        emergencyContact,
        bloodGroup
      });
      await refreshUser();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Patient Profile</h1>
        <p className="page-subtitle">
          Manage your personal information, emergency contacts, and medical preferences.
        </p>
      </div>

      <div className="card-clinical p-6 space-y-6">
        {/* User Account Info */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
          <div className="w-14 h-14 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xl">
            {user?.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{user?.name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {user?.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {user?.phone}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="form-select"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="form-select"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Contact Phone</label>
              <input
                type="tel"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="+91 99887 76650"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Residential Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. B-12 Defence Colony, New Delhi"
              className="form-input"
            />
          </div>

          {savedSuccess && (
            <div className="alert-banner-success">
              <Check className="w-4 h-4 shrink-0" />
              Profile updated successfully!
            </div>
          )}

          <div className="pt-3 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-rose-600 hover:bg-rose-50"
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
            >
              Sign Out
            </Button>

            <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
