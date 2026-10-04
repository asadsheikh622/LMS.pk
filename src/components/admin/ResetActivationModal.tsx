import React, { useState } from 'react';
import { X, KeyRound, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { StudentProfile } from '../../types.ts';

interface ResetActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  student: StudentProfile | null;
}

export const ResetActivationModal: React.FC<ResetActivationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  student,
}) => {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const handleReset = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/students/${student.id}/reset-activation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset activation credentials.');

      onSuccess(data.message || `Activation credentials reset for ${student.fullName}.`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error during activation reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-amber-600 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Reset Student Activation</h2>
              <p className="text-xs text-amber-100">Issue fresh credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl hover:bg-white/10 text-amber-100 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#DDD5F2] space-y-1 text-xs">
            <div className="text-[#687477]">Affected Student:</div>
            <div className="text-sm font-bold text-[#263238]">{student.fullName}</div>
            <div className="text-[#687477]">
              Student ID: <span className="font-mono font-bold text-[#527564]">{student.studentId}</span> &bull; 
              Phone: <span className="font-semibold text-[#263238]">{student.phone}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>What happens next:</span>
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800">
              <li>Any existing user password will be purged.</li>
              <li>Activation state is cleared to <strong>Pending Activation</strong>.</li>
              <li>The student will navigate to <code>/student/activate</code>, input their Student ID (<strong>{student.studentId}</strong>) and verified phone (<strong>{student.phone}</strong>) to establish a fresh login password.</li>
            </ul>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-600 font-semibold">{errorMessage}</p>
          )}

          <div className="pt-3 border-t border-[#DDD5F2] flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#DDD5F2] text-xs font-semibold text-[#687477] hover:bg-[#FAF7F0] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resetting...</span>
                </>
              ) : (
                <span>Reset Activation Now</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
