import React, { useState, useEffect } from 'react';
import { Check, Stethoscope } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doctorApi } from '../../services/api';
import { DoctorProfile } from '../../types';
import { Button } from '../../components/ui/Button';

export const DoctorProfilePage: React.FC = () => {
  const { user, profile, refreshUser } = useAuth();
  const doctor = profile as DoctorProfile | null;

  const [specialization, setSpecialization] = useState(doctor?.specialization || '');
  const [qualification, setQualification] = useState(doctor?.qualification || '');
  const [clinicName, setClinicName] = useState(doctor?.clinicName || '');
  const [clinicAddress, setClinicAddress] = useState(doctor?.clinicAddress || '');
  const [consultationFee, setConsultationFee] = useState(doctor?.consultationFee || 500);
  const [experience, setExperience] = useState(doctor?.experience || 5);
  const [bio, setBio] = useState(doctor?.bio || '');
  const [averageConsultationMinutes, setAverageConsultationMinutes] = useState(doctor?.averageConsultationMinutes || 20);

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (doctor) {
      setSpecialization(doctor.specialization || '');
      setQualification(doctor.qualification || '');
      setClinicName(doctor.clinicName || '');
      setClinicAddress(doctor.clinicAddress || '');
      setConsultationFee(doctor.consultationFee || 500);
      setExperience(doctor.experience || 5);
      setBio(doctor.bio || '');
      setAverageConsultationMinutes(doctor.averageConsultationMinutes || 20);
    }
  }, [doctor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await doctorApi.updateProfile({
        specialization,
        qualification,
        clinicName,
        clinicAddress,
        consultationFee: Number(consultationFee),
        experience: Number(experience),
        bio,
        averageConsultationMinutes: Number(averageConsultationMinutes)
      });
      await refreshUser();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update doctor profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Doctor Practice Profile</h1>
        <p className="page-subtitle">
          Update medical qualifications, clinic address, consultation fee, and patient bio.
        </p>
      </div>

      <div className="card-clinical p-6 space-y-6">
        {/* Doctor Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
          <div className="w-14 h-14 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xl">
            {user?.name.replace('Dr. ', '').charAt(0)}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs font-semibold text-teal-800">Reg: {doctor?.registrationNumber}</p>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email} · {user?.phone}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Medical Specialization</label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Degrees & Qualifications</label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. MBBS, MD (Cardiology)"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Consultation Fee (₹)</label>
              <input
                type="number"
                min="0"
                value={consultationFee}
                onChange={(e) => setConsultationFee(Number(e.target.value))}
                className="form-input font-semibold"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Years of Experience</label>
              <input
                type="number"
                min="0"
                value={experience}
                onChange={(e) => setExperience(Number(e.target.value))}
                className="form-input font-semibold"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Avg Visit (Mins)</label>
              <input
                type="number"
                min="5"
                max="120"
                value={averageConsultationMinutes}
                onChange={(e) => setAverageConsultationMinutes(Number(e.target.value))}
                className="form-input font-semibold"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Clinic / Hospital Name</label>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Clinic Full Address</label>
            <input
              type="text"
              value={clinicAddress}
              onChange={(e) => setClinicAddress(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Professional Bio / Overview</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="form-textarea"
              placeholder="Summary of experience, clinical interests, and approach to patient care..."
            />
          </div>

          {savedSuccess && (
            <div className="alert-banner-success">
              <Check className="w-4 h-4 shrink-0" />
              Practice profile saved successfully!
            </div>
          )}

          <div className="pt-3 flex justify-end">
            <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
              Save Practice Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
