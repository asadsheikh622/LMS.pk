import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { KeyRound, ShieldCheck, Phone, CheckCircle2, Lock, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { PasswordInputWithMonkey } from '../common/PasswordInputWithMonkey.tsx';

interface StudentActivationProps {
  onSuccess: () => void;
  onBackToLogin: () => void;
}

export const StudentActivationModal: React.FC<StudentActivationProps> = ({
  onSuccess,
  onBackToLogin,
}) => {
  const { setUserSession } = useAuth();

  // Multi-step state: 1 = Verify Info, 2 = Verify OTP, 3 = Create Password
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [studentId, setStudentId] = useState('STU-2026-003'); // Pre-created unactivated student from seed
  const [phone, setPhone] = useState('+92 312 3456783');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Verified Data
  const [verifiedStudent, setVerifiedStudent] = useState<{
    studentId: string;
    studentName: string;
    maskedPhone: string;
    devOtpHint?: string;
  } | null>(null);

  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STEP 1: Verify Student Record
  const handleVerifyStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/student/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed');
        return;
      }

      setVerifiedStudent({
        studentId: data.studentId,
        studentName: data.studentName,
        maskedPhone: data.maskedPhone,
        devOtpHint: data.devOtpHint,
      });

      // If dev hint is provided, fill it in for seamless demonstration
      if (data.devOtpHint) {
        setOtp(data.devOtpHint);
      }

      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/student/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'OTP verification failed');
        return;
      }

      setOtpToken(data.activationToken);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 3: Set Password and Complete Activation
  const handleCompleteActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/student/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          otpToken,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Activation failed');
        return;
      }

      // Set user session in context
      setUserSession(data.user, data.token);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full rounded-3xl bg-white border border-[#DDD5F2] p-8 sm:p-10 shadow-sm space-y-6">
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToLogin}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#687477] hover:text-[#263238] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Login</span>
          </button>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#DDD5F2]/40 text-[#527564]">
            Step {step} of 3
          </span>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#DDD5F2]/50 text-[#527564] flex items-center justify-center mx-auto shadow-xs">
            <KeyRound className="w-7 h-7 text-[#527564]" />
          </div>
          <h2 className="text-2xl font-bold text-[#263238]">
            Academy Account Activation
          </h2>
          <p className="text-sm text-[#687477]">
            {step === 1 && 'Verify your pre-admitted academy record to initiate activation.'}
            {step === 2 && 'Enter the 6-digit verification code sent to your phone.'}
            {step === 3 && 'Create a secure password to finalize and activate your portal.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Verify Record */}
        {step === 1 && (
          <form onSubmit={handleVerifyStudent} className="space-y-4">
            <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#DDD5F2]/70 text-xs text-[#687477]">
              <span className="font-semibold text-[#263238]">Academy Registry Policy:</span> Accounts cannot be created by public visitors. You must already be registered in the Academy database by an administrator.
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#687477] mb-1.5">
                Academy Student ID
              </label>
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. STU-2026-003"
                className="w-full px-4 py-3 rounded-xl bg-[#FAF7F0] border border-[#DDD5F2] text-sm text-[#263238] focus:outline-none focus:border-[#527564]"
              />
              <span className="text-[11px] text-[#687477] mt-1 block">
                Found on your official admission receipt or fee voucher
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#687477] mb-1.5">
                Registered Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +92 312 3456783"
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-[#FAF7F0] border border-[#DDD5F2] text-sm text-[#263238] focus:outline-none focus:border-[#527564]"
                />
                <Phone className="w-4 h-4 text-[#687477] absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Checking Registry...</span>
              ) : (
                <>
                  <span>Verify Academy Record</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Verify OTP */}
        {step === 2 && verifiedStudent && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#EBF2ED] border border-[#8FAF9A]/30 text-xs text-[#527564] space-y-1">
              <div className="font-bold text-sm text-[#263238]">{verifiedStudent.studentName}</div>
              <div>Student ID: <span className="font-semibold">{verifiedStudent.studentId}</span></div>
              <div>Dispatch Target: <span className="font-semibold">{verifiedStudent.maskedPhone}</span></div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#687477] mb-1.5">
                6-Digit Verification Code (OTP)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-3 text-center text-xl tracking-widest font-mono rounded-xl bg-[#FAF7F0] border border-[#DDD5F2] focus:outline-none focus:border-[#527564]"
              />
              {verifiedStudent.devOtpHint && (
                <div className="text-[11px] text-[#527564] bg-[#FAF7F0] p-2 mt-2 rounded border border-[#DDD5F2]">
                  <strong>Demo Verification Code:</strong> {verifiedStudent.devOtpHint}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 rounded-xl border border-[#DDD5F2] text-xs font-semibold text-[#687477] hover:bg-[#FAF7F0]"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting || otp.length !== 6}
                className="w-2/3 py-3 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white font-semibold text-sm shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Verifying...' : 'Confirm OTP'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Set Password */}
        {step === 3 && (
          <form onSubmit={handleCompleteActivation} className="space-y-4">
            <div className="p-3 rounded-xl bg-[#EBF2ED] text-[#527564] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Identity Verified. Create your account password below.</span>
            </div>

            <PasswordInputWithMonkey
              id="activation-new-password"
              name="password"
              label="New Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              leftIcon={<Lock className="w-4 h-4 text-[#687477]" />}
            />

            <PasswordInputWithMonkey
              id="activation-confirm-password"
              name="confirmPassword"
              label="Confirm Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              leftIcon={<ShieldCheck className="w-4 h-4 text-[#687477]" />}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Activating Portal...' : 'Complete Activation & Sign In'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
