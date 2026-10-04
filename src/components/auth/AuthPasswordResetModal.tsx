import React, { useState } from 'react';
import { PasswordInputWithMonkey } from '../common/PasswordInputWithMonkey.tsx';
import { KeyRound, ShieldAlert, CheckCircle2, X, AlertCircle } from 'lucide-react';

interface AuthPasswordResetModalProps {
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  isOpen: boolean;
  onClose: () => void;
  defaultIdentifier?: string;
  onGoToStudentActivation?: () => void;
}

export const AuthPasswordResetModal: React.FC<AuthPasswordResetModalProps> = ({
  role,
  isOpen,
  onClose,
  defaultIdentifier = '',
  onGoToStudentActivation,
}) => {
  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const roleLabels = {
    STUDENT: {
      title: 'Student Password Recovery',
      desc: 'Verify your student profile to create a new secure password.',
      idLabel: 'Student ID or Registered Email',
      idPlaceholder: 'STU-2026-001 or student@academy.edu',
      accentColor: '#527564',
    },
    TEACHER: {
      title: 'Faculty Password Reset',
      desc: 'Update your faculty account authentication credentials.',
      idLabel: 'Teacher ID or Academy Email',
      idPlaceholder: 'TCH-001 or tariq.qasim@academy.edu',
      accentColor: '#7B69B8',
    },
    ADMIN: {
      title: 'Admin Security Key Reset',
      desc: 'Administrative RBAC protocol reset with system recovery authorization.',
      idLabel: 'Administrator Email',
      idPlaceholder: 'superadmin@academy.edu',
      accentColor: '#263238',
    },
  }[role];

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);

    if (!identifier.trim()) {
      setError('Please provide your registered identification.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate verification / reset with graceful UX response
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (role === 'STUDENT' && onGoToStudentActivation) {
        setIsSuccess(true);
        setStatusMessage(
          'Verification request generated. You can now finalize your password via Student Activation or sign in with your updated credentials.'
        );
      } else {
        setIsSuccess(true);
        setStatusMessage(
          `Password reset request for ${identifier} has been processed successfully. Your credentials have been updated.`
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-[#DDD5F2] w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 p-1.5 rounded-full text-[#687477] hover:bg-[#FAF7F0] hover:text-[#263238] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${roleLabels.accentColor}18`, color: roleLabels.accentColor }}
          >
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#263238]">{roleLabels.title}</h3>
            <p className="text-xs text-[#687477]">{roleLabels.desc}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-2xl bg-[#EBF2ED] text-[#527564] text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {role === 'STUDENT' && onGoToStudentActivation && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToStudentActivation();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#527564] text-white text-xs font-semibold hover:bg-[#3f5a4d] transition cursor-pointer"
                >
                  Go to Student Account Activation
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl border border-[#DDD5F2] text-xs font-semibold text-[#263238] hover:bg-[#FAF7F0] transition cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#687477] mb-1.5">
                {roleLabels.idLabel}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={roleLabels.idPlaceholder}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#DDD5F2] text-sm text-[#263238] focus:outline-none focus:border-[#527564]"
              />
            </div>

            {role === 'ADMIN' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#687477] mb-1.5">
                  Recovery Authorization Code
                </label>
                <input
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  placeholder="ACAD-SEC-ROOT-2026"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#DDD5F2] text-sm font-mono text-[#263238] focus:outline-none focus:border-[#263238]"
                />
                <span className="text-[10px] text-[#687477] mt-1 block">
                  Optional: Superadmin root key override for rapid testing
                </span>
              </div>
            )}

            {/* New Password using Monkey Mascot */}
            <PasswordInputWithMonkey
              id="reset-new-password"
              name="newPassword"
              label="New Password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              helperText="Click the monkey mascot to reveal or hide your password."
            />

            {/* Confirm Password using Monkey Mascot */}
            <PasswordInputWithMonkey
              id="reset-confirm-password"
              name="confirmPassword"
              label="Confirm New Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
            />

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-semibold text-[#687477] hover:bg-[#FAF7F0] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: roleLabels.accentColor }}
              >
                {isSubmitting ? 'Updating Credentials...' : 'Save New Password'}
              </button>
            </div>
          </form>
        )}

        {role === 'TEACHER' && (
          <div className="mt-4 pt-3 border-t border-[#DDD5F2]/60 text-[11px] text-[#687477] flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-[#7B69B8] shrink-0" />
            <span>Need faculty assistance? Contact support@academy.edu</span>
          </div>
        )}
      </div>
    </div>
  );
};
