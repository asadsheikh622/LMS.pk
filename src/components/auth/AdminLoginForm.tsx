import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, ArrowLeft, KeySquare } from 'lucide-react';
import { PasswordInputWithMonkey } from '../common/PasswordInputWithMonkey.tsx';
import { AuthPasswordResetModal } from './AuthPasswordResetModal.tsx';

interface AdminLoginFormProps {
  onSuccess: () => void;
  onBackToHome: () => void;
}

export const AdminLoginForm: React.FC<AdminLoginFormProps> = ({
  onSuccess,
  onBackToHome,
}) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('superadmin@academy.edu');
  const [password, setPassword] = useState('SuperierAdmin123!');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Server-side will verify password and verify user role is ADMIN or SUPER_ADMIN
      const res = await login(identifier, password, 'ADMIN');
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Access denied: Invalid administrative credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full rounded-3xl bg-white border border-[#263238]/20 p-8 sm:p-10 shadow-lg space-y-6">
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#687477] hover:text-[#263238] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Public Site</span>
          </button>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#263238] text-white tracking-widest uppercase">
            Restricted System
          </span>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#263238] text-white flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-7 h-7 text-[#8FAF9A]" />
          </div>
          <h2 className="text-2xl font-bold text-[#263238]">Executive Administration</h2>
          <p className="text-sm text-[#687477]">
            Academy Governance & Institutional Management Console
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
              Administrative Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="superadmin@academy.edu"
                className="w-full px-4 py-3 pl-11 rounded-xl bg-[#FAF7F0] border border-[#DDD5F2] text-sm text-[#263238] focus:outline-none focus:border-[#263238]"
              />
              <Mail className="w-4 h-4 text-[#687477] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="admin-password-input" className="block text-xs font-semibold uppercase tracking-wider text-[#687477]">
                Access Token / Password
              </label>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="text-xs font-semibold text-[#263238] hover:underline cursor-pointer"
              >
                Emergency Reset?
              </button>
            </div>
            <PasswordInputWithMonkey
              id="admin-password-input"
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
            className="w-full py-3.5 px-4 rounded-xl bg-[#263238] hover:bg-[#151c1f] text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Verifying Administrative Privileges...</span>
            ) : (
              <>
                <KeySquare className="w-4 h-4 text-[#8FAF9A]" />
                <span>Enter Administration Console</span>
              </>
            )}
          </button>
        </form>

        {/* Security Audit Badge */}
        <div className="p-3 text-center rounded-xl bg-[#FAF7F0] text-[11px] text-[#687477]">
          <span>Security Protocol: Cloud SQL RBAC v2.4 • All attempts logged</span>
        </div>

      </div>

      {/* Admin Emergency Reset Modal */}
      <AuthPasswordResetModal
        role="ADMIN"
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        defaultIdentifier={identifier}
      />
    </div>
  );
};
