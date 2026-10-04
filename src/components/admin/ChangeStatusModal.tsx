import React, { useState } from 'react';
import { X, RefreshCw, Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { StudentProfile, StudentLifecycleStatus } from '../../types.ts';

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  student: StudentProfile | null;
}

export const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  student,
}) => {
  const { token } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<StudentLifecycleStatus>(
    (student?.status as StudentLifecycleStatus) || 'ACTIVE'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/students/${student.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update student lifecycle status.');

      onSuccess(data.message || `Student status transitioned to ${selectedStatus}.`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusDescriptions: Record<StudentLifecycleStatus, string> = {
    ACTIVE: 'Student is currently attending sessions with full active portal access.',
    PENDING_ACTIVATION: 'Admitted student who has not yet completed OTP credentials setup on /student/activate.',
    ON_LEAVE: 'Temporarily on leave (medical, personal, travel). Preserves active enrollment.',
    SUSPENDED: 'Temporarily suspended due to disciplinary or administrative review. Blocks portal login.',
    DROPPED_OUT: 'Marked as discontinued. Preserves historical transcripts, test grades, and fee records.',
    GRADUATED: 'Successfully completed the entire course curriculum and final project evaluation.',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#DDD5F2] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#263238] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#527564] text-white flex items-center justify-center shadow-xs">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Change Lifecycle Status</h2>
              <p className="text-xs text-gray-300">Update academic standing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#DDD5F2]">
            <div className="text-xs text-[#687477]">Student:</div>
            <div className="text-sm font-bold text-[#263238]">{student.fullName} ({student.studentId})</div>
            <div className="text-xs text-[#687477] mt-1">
              Current Status: <span className="font-semibold text-[#527564]">{student.status}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#263238] mb-1">
              Select New Academic Standing:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as StudentLifecycleStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-bold text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564] bg-white"
            >
              <option value="ACTIVE">Active</option>
              <option value="PENDING_ACTIVATION">Pending Activation</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DROPPED_OUT">Dropped Out</option>
              <option value="GRADUATED">Graduated</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-[#687477]">
            {statusDescriptions[selectedStatus]}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
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
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-semibold shadow-xs disabled:opacity-60 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Status...</span>
                </>
              ) : (
                <span>Update Status</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
