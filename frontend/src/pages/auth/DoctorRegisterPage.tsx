import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Stethoscope, AlertCircle, ArrowRight, Award, Building, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const DoctorRegisterPage: React.FC = () => {
  const { registerDoctor } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [specialization, setSpecialization] = useState('Cardiologist');
  const [qualification, setQualification] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [consultationFee, setConsultationFee] = useState(500);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await registerDoctor({
        name,
        email,
        phone,
        password,
        confirmPassword,
        registrationNumber,
        specialization,
        qualification,
        clinicName,
        clinicAddress,
        consultationFee: Number(consultationFee)
      });
      navigate('/doctor');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Doctor registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-teal-700 text-white flex items-center justify-center mx-auto">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Register Doctor Practice</h2>
          <p className="text-sm text-slate-500">
            Join the platform to manage appointments and streamline patient queues
          </p>
        </div>

        <div className="card-clinical p-6 sm:p-8 space-y-5">
          {error && (
            <div className="alert-banner-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Full Name (with Dr. prefix)"
                type="text"
                placeholder="Dr. Ananya Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Medical Reg Number (MCI/NMC)"
                type="text"
                placeholder="MCI-2018-9921"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                leftIcon={<FileText className="w-4 h-4" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Email Address"
                type="email"
                placeholder="dr.sharma@healthhub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="form-group">
                <label className="form-label">
                  Specialization
                </label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="Cardiologist">Cardiologist</option>
                  <option value="Dermatologist">Dermatologist</option>
                  <option value="Pediatrician">Pediatrician</option>
                  <option value="Neurologist">Neurologist</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Orthopedic">Orthopedic</option>
                </select>
              </div>

              <Input
                label="Degrees & Qualification"
                type="text"
                placeholder="MBBS, MD (Cardiology)"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                leftIcon={<Award className="w-4 h-4" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Clinic / Hospital Name"
                type="text"
                placeholder="City Care Hospital"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                leftIcon={<Building className="w-4 h-4" />}
                required
              />

              <Input
                label="Consultation Fee (₹)"
                type="number"
                min="0"
                value={consultationFee}
                onChange={(e) => setConsultationFee(Number(e.target.value))}
                required
              />
            </div>

            <Input
              label="Clinic Full Address"
              type="text"
              placeholder="Suite 101, Medical Enclave, Central Ave"
              value={clinicAddress}
              onChange={(e) => setClinicAddress(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Complete Doctor Registration
            </Button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#0E4F43] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
