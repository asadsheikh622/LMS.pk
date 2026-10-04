import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserCheck, Lock, Mail, ArrowRight, AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { PasswordInputWithMonkey } from '../common/PasswordInputWithMonkey.tsx';
import { AuthPasswordResetModal } from './AuthPasswordResetModal.tsx';

interface TeacherLoginFormProps {
  onSuccess: () => void;
  onBackToHome: () => void;
}

export const TeacherLoginForm: React.FC<TeacherLoginFormProps> = ({
  onSuccess,
  onBackToHome,
}) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('tariq.qasim@academy.edu'); // Seed teacher
  const [password, setPassword] = useState('Academy123!');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await login(identifier, password, 'TEACHER');
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Login failed. Please check your faculty credentials.');
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
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#687477] hover:text-[#263238] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Academy</span>
          </button>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#F4F1FB] text-[#7b69b8]">
            Faculty Portal
          </span>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#F4F1FB] text-[#7b69b8] flex items-center justify-center mx-auto shadow-xs">
            <UserCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-[#263238]">Teacher Sign In</h2>
          <p className="text-sm text-[#687477]">
            Authorized faculty credentials required
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
              Faculty Email or Teacher Code
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="tariq.qasim@academy.edu or TCH-001"
                className="w-full px-4 py-3 pl-11 rounded-xl bg-[#FAF7F0] border border-[#DDD5F2] text-sm text-[#263238] focus:outline-none focus:border-[#7b69b8]"
              />
              <Mail className="w-4 h-4 text-[#687477] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="teacher-password-input" className="block text-xs font-semibold uppercase tracking-wider text-[#687477]">
                Password
              </label>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="text-xs font-semibold text-[#7b69b8] hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <PasswordInputWithMonkey
              id="teacher-password-input"
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
            className="w-full py-3.5 px-4 rounded-xl bg-[#263238] hover:bg-[#1a2327] text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Teacher Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#DDD5F2] text-xs text-[#687477] flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-[#7b69b8] shrink-0 mt-0.5" />
          <span>
            Teacher accounts cannot be registered publicly. To request faculty credentials or reset your security access, contact the Director of Academics or use self-service recovery.
          </span>
        </div>

      </div>

      {/* Faculty Password Reset Modal */}
      <AuthPasswordResetModal
        role="TEACHER"
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        defaultIdentifier={identifier}
      />
    </div>
  );
};
