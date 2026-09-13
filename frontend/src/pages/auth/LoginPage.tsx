import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 animate-scale-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-[#0E4F43] text-white flex items-center justify-center mx-auto shadow-xs">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-900">Sign in to MedPulse</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Clinical appointment scheduling and live queue management
          </p>
        </div>

        {/* Standard Login Form */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 space-y-5 shadow-xs">
          {error && (
            <div className="alert-banner-danger">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Account Fill (Testing Helper) */}
          <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-500 space-y-2">
            <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-600">
              <span className="text-slate-400">Quick fill:</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('dr.sharma@healthhub.com');
                  setPassword('Password123!');
                }}
                className="text-[#0E4F43] hover:underline font-semibold"
              >
                Doctor account
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('rahul.patient@gmail.com');
                  setPassword('Password123!');
                }}
                className="text-[#0E4F43] hover:underline font-semibold"
              >
                Patient account
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <Link to="/register/patient" className="font-semibold text-[#0E4F43] hover:underline">
                New patient? Register
              </Link>
              <Link to="/register/doctor" className="font-semibold text-slate-700 hover:text-slate-900 hover:underline">
                Register Doctor Practice
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secure authentication with session management</span>
        </div>
      </div>
    </div>
  );
};
