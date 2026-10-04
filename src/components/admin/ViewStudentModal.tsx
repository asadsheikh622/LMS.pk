import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, MapPin, CheckCircle, Clock, AlertTriangle, BookOpen, Layers, DollarSign, Award, ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { StudentProfile } from '../../types.ts';

interface ViewStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number | null;
  onEditRequested: (student: StudentProfile) => void;
}

export const ViewStudentModal: React.FC<ViewStudentModalProps> = ({
  isOpen,
  onClose,
  studentId,
  onEditRequested,
}) => {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !studentId || !token) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(`/api/admin/students/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Could not retrieve student academic dossier.');
        return res.json();
      })
      .then((d) => setData(d))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [isOpen, studentId, token]);

  if (!isOpen) return null;

  const stu = data?.student;
  const enrollment = data?.enrollment;
  const attendance = data?.attendanceStats;
  const payments = data?.payments || [];
  const userAccount = data?.userAccount;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EBF2ED] text-[#527564]">Active Student</span>;
      case 'PENDING_ACTIVATION':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">Pending Activation</span>;
      case 'ON_LEAVE':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">On Academic Leave</span>;
      case 'SUSPENDED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">Suspended</span>;
      case 'DROPPED_OUT':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-200 text-zinc-700 border border-zinc-300">Dropped Out</span>;
      case 'GRADUATED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Graduated Alumni</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#DDD5F2] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#263238] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#527564] text-white flex items-center justify-center font-extrabold text-lg shadow-xs">
              {stu?.fullName ? stu.fullName.substring(0, 2).toUpperCase() : 'ST'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{stu?.fullName || 'Student Dossier'}</h2>
                <span className="font-mono text-xs text-[#8FAF9A] bg-white/10 px-2.5 py-0.5 rounded-md font-semibold">
                  {stu?.studentId}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Roll # {stu?.rollNumber} &bull; S/O {stu?.fatherName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading / Error Content */}
        {isLoading && (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#527564] mx-auto" />
            <p className="text-xs font-semibold text-[#687477]">Accessing Student Registry Dossier...</p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-[#263238] text-white text-xs font-semibold">
              Close
            </button>
          </div>
        )}

        {!isLoading && !error && stu && (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Status & Quick Stats */}
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#DDD5F2]/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#687477]">Lifecycle Status:</span>
                {getStatusBadge(stu.status)}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#263238] font-medium">
                <span className="text-[#687477]">Portal Account:</span>
                {stu.isActivated ? (
                  <span className="inline-flex items-center gap-1 text-[#527564] font-bold">
                    <CheckCircle className="w-3.5 h-3.5" /> Activated ({userAccount?.email || stu.email})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                    <Clock className="w-3.5 h-3.5" /> Not Activated (Awaiting student OTP setup)
                  </span>
                )}
              </div>
            </div>

            {/* Dropout Notice if dropped out */}
            {stu.status === 'DROPPED_OUT' && (
              <div className="p-4 rounded-2xl bg-zinc-100 border border-zinc-300 space-y-1 text-xs">
                <div className="flex items-center gap-2 font-bold text-zinc-800">
                  <ShieldAlert className="w-4 h-4 text-zinc-600" />
                  <span>Student Discontinuation Notice (Historical Record)</span>
                </div>
                <p className="text-zinc-600">
                  <strong>Date:</strong> {stu.dropoutDate ? new Date(stu.dropoutDate).toLocaleDateString() : 'N/A'} &bull; 
                  <strong> Reason:</strong> {stu.dropoutReason || 'Administrative Discontinuation'} &bull; 
                  <strong> Recorded by:</strong> {stu.updatedBy || 'Academy Admin'}
                </p>
                <p className="text-zinc-500 text-[11px]">
                  * All historical attendance, payment receipts, assignments, and test grades remain archived in records and reports.
                </p>
              </div>
            )}

            {/* Grid Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal & Contact Details */}
              <div className="space-y-3 p-4 rounded-2xl bg-white border border-[#DDD5F2]">
                <h3 className="text-xs font-bold text-[#263238] uppercase tracking-wider flex items-center gap-2 border-b border-[#DDD5F2] pb-2">
                  <User className="w-4 h-4 text-[#527564]" />
                  <span>Personal & Contact Info</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#687477]">Father / Guardian:</span>
                    <span className="font-semibold text-[#263238]">{stu.fatherName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#687477]">Phone:</span>
                    <span className="font-semibold text-[#263238]">{stu.phone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#687477]">Email:</span>
                    <span className="font-semibold text-[#263238]">{stu.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#687477]">CNIC / B-Form:</span>
                    <span className="font-mono font-semibold text-[#263238]">{stu.cnic || 'Not on file'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#687477]">Campus Location:</span>
                    <span className="font-semibold text-[#263238]">{stu.campus}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#687477]">Admission Date:</span>
                    <span className="font-semibold text-[#263238]">
                      {stu.admissionDate ? new Date(stu.admissionDate).toLocaleDateString() : new Date(stu.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Academic Enrollment & Attendance */}
              <div className="space-y-3 p-4 rounded-2xl bg-white border border-[#DDD5F2]">
                <h3 className="text-xs font-bold text-[#263238] uppercase tracking-wider flex items-center gap-2 border-b border-[#DDD5F2] pb-2">
                  <BookOpen className="w-4 h-4 text-[#7B69B8]" />
                  <span>Course & Cohort Enrollment</span>
                </h3>
                {enrollment ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-[#687477]">Course:</span>
                      <span className="font-bold text-[#263238]">{enrollment.courseCode} - {enrollment.courseTitle}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-[#687477]">Batch Cohort:</span>
                      <span className="font-semibold text-[#263238]">{enrollment.batchNumber} ({enrollment.batchName})</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-[#687477]">Campus:</span>
                      <span className="font-semibold text-[#263238]">{enrollment.campus}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-[#687477]">Course Progress:</span>
                      <span className="font-bold text-[#527564]">{enrollment.progress}%</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#687477]">Attendance Rate:</span>
                      <span className="font-bold text-[#527564]">
                        {attendance?.percentage ?? 100}% ({attendance?.present ?? 0} / {attendance?.total ?? 0} sessions)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-[#687477]">
                    No active course enrollment found.
                  </div>
                )}
              </div>
            </div>

            {/* Fee & Voucher Ledger */}
            <div className="space-y-3 p-4 rounded-2xl bg-white border border-[#DDD5F2]">
              <h3 className="text-xs font-bold text-[#263238] uppercase tracking-wider flex items-center gap-2 border-b border-[#DDD5F2] pb-2">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span>Financial & Fee Vouchers ({payments.length})</span>
              </h3>
              {payments.length === 0 ? (
                <p className="text-xs text-[#687477] py-2">No fee vouchers currently issued.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[#687477] border-b border-gray-100">
                      <tr>
                        <th className="py-2 px-2">Voucher #</th>
                        <th className="py-2 px-2">Description</th>
                        <th className="py-2 px-2">Amount</th>
                        <th className="py-2 px-2">Due Date</th>
                        <th className="py-2 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payments.map((p: any) => (
                        <tr key={p.id}>
                          <td className="py-2 px-2 font-mono font-semibold text-[#263238]">{p.voucherId}</td>
                          <td className="py-2 px-2 text-[#263238]">{p.month} ({p.type})</td>
                          <td className="py-2 px-2 font-bold text-[#263238]">PKR {p.amount.toLocaleString()}</td>
                          <td className="py-2 px-2 text-[#687477]">{p.dueDate}</td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="pt-4 border-t border-[#DDD5F2] flex items-center justify-between">
              <span className="text-[11px] text-[#687477]">
                Record Last Updated: {stu.updatedAt ? new Date(stu.updatedAt).toLocaleString() : 'N/A'}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-[#DDD5F2] text-xs font-semibold text-[#687477] hover:bg-[#FAF7F0] transition cursor-pointer"
                >
                  Close Dossier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditRequested(stu);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-semibold transition shadow-xs cursor-pointer"
                >
                  Edit Academic Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
