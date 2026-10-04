import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { GraduationCap, Lock, Mail, ArrowRight, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { PasswordInputWithMonkey } from '../common/PasswordInputWithMonkey.tsx';
import { AuthPasswordResetModal } from './AuthPasswordResetModal.tsx';

interface StudentLoginFormProps {
  onSuccess: () => void;
  onGoToActivate: () => void;
  onBackToHome: () => void;
}

export const StudentLoginForm: React.FC<StudentLoginFormProps> = ({
  onSuccess,
  onGoToActivate,
  onBackToHome,
}) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('STU-2026-001'); // Seed student for quick testing
  const [password, setPassword] = useState('Academy123!');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await login(identifier, password, 'STUDENT');
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full rounded-3xl bg-white border border-[#DDD5F2] p-8 sm:p-10 shadow-sm space-y-6">
        
        {/* Top bar with back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#687477] hover:text-[#263238] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Academy</span>
          </button>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EBF2ED] text-[#527564]">
            Student Portal
          </span>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#EBF2ED] text-[#527564] flex items-center justify-center mx-auto shadow-xs">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-[#263238]">Student Sign In</h2>
          <p className="text-sm text-[#687477]">
            Enter your Student ID or registered email and password
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#687477] mb-1.5">
              Student ID or Email
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="STU-2026-001 or student@academy.edu"
                className="w-full px-4 py-3 pl-11 rounded-xl bg-[#FAF7F0] border border-[#DDD5F2] text-sm text-[#263238] placeholder-gray-400 focus:outline-none focus:border-[#527564] focus:ring-1 focus:ring-[#527564]"
              />
              <Mail className="w-4 h-4 text-[#687477] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="student-password-input" className="block text-xs font-semibold uppercase tracking-wider text-[#687477]">
                Password
              </label>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="text-xs font-semibold text-[#527564] hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <PasswordInputWithMonkey
              id="student-password-input"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-[#687477]" />}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Verifying Session...</span>
            ) : (
              <>
                <span>Sign In to Student Area</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Activation Callout */}
        <div className="pt-4 border-t border-[#DDD5F2]/50 text-center space-y-2">
          <p className="text-xs text-[#687477]">
            Newly admitted to the Academy and haven't set your password?
          </p>
          <button
            onClick={onGoToActivate}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#527564] hover:underline cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Academy Verified Student Account Activation</span>
          </button>
        </div>

      </div>

      {/* Password Recovery Modal */}
      <AuthPasswordResetModal
        role="STUDENT"
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        defaultIdentifier={identifier}
        onGoToStudentActivation={onGoToActivate}
      />
    </div>
  );
};
