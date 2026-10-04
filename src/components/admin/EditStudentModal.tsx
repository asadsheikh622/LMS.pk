import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Loader2, Edit3, User, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { StudentProfile } from '../../types.ts';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  student: StudentProfile | null;
  courses: { id: number; code: string; title: string }[];
  batches: { id: number; courseId: number; batchNumber: string; name: string; campus: string }[];
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  student,
  courses,
  batches,
}) => {
  const { token } = useAuth();

  const [studentId, setStudentId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cnic, setCnic] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<number>(1);
  const [selectedBatchId, setSelectedBatchId] = useState<number>(1);
  const [campus, setCampus] = useState('Main IT Campus');
  const [city, setCity] = useState('Karachi');
  const [status, setStatus] = useState<string>('ACTIVE');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setStudentId(student.studentId || '');
      setRollNumber(student.rollNumber || '');
      setFullName(student.fullName || '');
      setFatherName(student.fatherName || '');
      setPhone(student.phone || '');
      setEmail(student.email || '');
      setCnic(student.cnic || '');
      setCampus(student.campus || 'Main IT Campus');
      setCity(student.city || 'Karachi');
      setStatus(student.status || 'ACTIVE');
      if (student.courseId) setSelectedCourseId(student.courseId);
      if (student.batchId) setSelectedBatchId(student.batchId);
      setErrorMessage(null);
    }
  }, [student, isOpen]);

  const availableBatches = batches.filter((b) => b.courseId === selectedCourseId);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!studentId.trim()) return setErrorMessage('Student ID is required');
    if (!rollNumber.trim()) return setErrorMessage('Roll Number is required');
    if (!fullName.trim()) return setErrorMessage('Full Name is required');
    if (!fatherName.trim()) return setErrorMessage('Father Name is required');
    if (!phone.trim()) return setErrorMessage('Phone Number is required');

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: studentId.trim(),
          rollNumber: rollNumber.trim(),
          fullName: fullName.trim(),
          fatherName: fatherName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          cnic: cnic.trim() || null,
          courseId: selectedCourseId,
          batchId: selectedBatchId,
          campus,
          city,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update student record.');
      }

      onSuccess(data.message || `Student ${fullName} updated successfully.`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating student record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#DDD5F2] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#263238] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DDD5F2] text-[#263238] flex items-center justify-center shadow-xs font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Edit Student Academic Record</h2>
              <p className="text-xs text-gray-300">
                Modifying record for <span className="text-[#8FAF9A] font-mono font-semibold">{student.studentId}</span> ({student.fullName})
              </p>
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

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student ID */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                Student ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-mono font-bold text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564] bg-[#FAF7F0]/40"
              />
            </div>

            {/* Roll Number */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                Roll Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-mono font-bold text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564] bg-[#FAF7F0]/40"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564]"
              />
            </div>

            {/* Father Name */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                Father / Guardian Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564]"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564]"
              />
            </div>

            {/* CNIC */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                CNIC / B-Form
              </label>
              <input
                type="text"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-mono text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564]"
              />
            </div>

            {/* Lifecycle Status */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                Academic Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564] bg-white font-semibold"
              >
                <option value="ACTIVE">Active</option>
                <option value="PENDING_ACTIVATION">Pending Activation</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DROPPED_OUT">Dropped Out</option>
                <option value="GRADUATED">Graduated</option>
              </select>
            </div>

            {/* Course */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                Enrolled Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564] bg-white"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                Enrolled Batch
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564] bg-white"
              >
                {(availableBatches.length > 0 ? availableBatches : batches).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchNumber}: {b.name} ({b.campus})
                  </option>
                ))}
              </select>
            </div>

            {/* Campus */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                Campus Location
              </label>
              <select
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564] bg-white"
              >
                <option value="Main IT Campus">Main IT Campus</option>
                <option value="Zaitoon Ashraf IT Park">Zaitoon Ashraf IT Park</option>
                <option value="North Karachi Tech Center">North Karachi Tech Center</option>
                <option value="Gulshan Digital Academy">Gulshan Digital Academy</option>
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#DDD5F2] flex items-center justify-end gap-3">
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#263238] hover:bg-[#1b2428] text-white text-xs font-semibold shadow-xs disabled:opacity-60 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Record Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
