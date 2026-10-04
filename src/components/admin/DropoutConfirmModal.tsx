import React, { useState } from 'react';
import { X, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { StudentProfile } from '../../types.ts';

interface DropoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  student: StudentProfile | null;
}

export const DropoutConfirmModal: React.FC<DropoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  student,
}) => {
  const { token } = useAuth();
  const [dropoutReason, setDropoutReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/students/${student.id}/dropout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dropoutReason: dropoutReason.trim() || 'Voluntary Academy Discontinuation',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record student dropout.');
      }

      onSuccess(data.message || `Student ${student.fullName} marked as Dropped Out.`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing dropout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-red-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-red-500 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Drop Out Student</h2>
              <p className="text-xs text-red-100">Academic Discontinuation Process</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl hover:bg-white/10 text-red-100 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#DDD5F2] space-y-2">
            <div className="text-xs font-semibold text-[#687477]">Affected Student:</div>
            <div className="text-sm font-bold text-[#263238] flex items-center justify-between">
              <span>{student.fullName}</span>
              <span className="font-mono text-xs text-[#527564] bg-[#EBF2ED] px-2 py-0.5 rounded-md">
                {student.studentId}
              </span>
            </div>
            <div className="text-xs text-[#687477]">
              Roll: <strong>{student.rollNumber}</strong> &bull; Course: <strong>{student.courseTitle || 'Enrolled Course'}</strong>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Record Preservation Policy:</span>
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              The student will <strong>not</strong> be permanently deleted. Their lifecycle status will transition to <strong>Dropped Out</strong> and login access will be deactivated. All historical attendance logs, assignments, test marks, and payment vouchers remain archived in academic reports.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#263238] mb-1">
              Dropout Reason / Departure Notes (Optional):
            </label>
            <textarea
              rows={3}
              value={dropoutReason}
              onChange={(e) => setDropoutReason(e.target.value)}
              placeholder="e.g. Relocated to another city, personal schedule conflicts, medical leave..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs text-[#263238] focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-400"
            />
          </div>

          {errorMessage && (
            <p className="text-xs text-red-600 font-semibold">{errorMessage}</p>
          )}

          {/* Buttons */}
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
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Confirm Student Dropout</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
