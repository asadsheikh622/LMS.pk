import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle2, Loader2, BookOpen, School, Calendar, Phone, Mail, FileText, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  courses: { id: number; code: string; title: string }[];
  batches: { id: number; courseId: number; batchNumber: string; name: string; campus: string }[];
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
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
  const [selectedCourseId, setSelectedCourseId] = useState<number>(courses[0]?.id || 1);
  const [selectedBatchId, setSelectedBatchId] = useState<number>(batches[0]?.id || 1);
  const [campus, setCampus] = useState('Main IT Campus');
  const [city, setCity] = useState('Karachi');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('PENDING_ACTIVATION');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate suggested student ID and roll number when modal opens
  useEffect(() => {
    if (isOpen) {
      const randNum = Math.floor(100 + Math.random() * 900);
      setStudentId(`STU-2026-${randNum}`);
      setRollNumber(`WMD-20-${randNum}`);
      setErrorMessage(null);
      if (courses.length > 0) setSelectedCourseId(courses[0].id);
    }
  }, [isOpen, courses]);

  // Filter batches based on selected course
  const availableBatches = batches.filter((b) => b.courseId === selectedCourseId);

  useEffect(() => {
    if (availableBatches.length > 0) {
      setSelectedBatchId(availableBatches[0].id);
    }
  }, [selectedCourseId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side quick checks
    if (!studentId.trim()) return setErrorMessage('Academy Student ID is required');
    if (!rollNumber.trim()) return setErrorMessage('Roll Number is required');
    if (!fullName.trim()) return setErrorMessage('Student Full Name is required');
    if (!fatherName.trim()) return setErrorMessage('Father / Guardian Name is required');
    if (!phone.trim()) return setErrorMessage('Contact Phone Number is required');

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
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
          admissionDate,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to admit student into academic registry.');
      }

      onSuccess(data.message || `Student ${fullName} admitted successfully.`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred while saving student.');
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
            <div className="w-10 h-10 rounded-xl bg-[#527564] text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Admit New Student</h2>
              <p className="text-xs text-gray-300">Enroll student into course & batch with official academic credentials</p>
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
              <div className="relative">
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                  placeholder="e.g. STU-2026-025"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-mono font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564] bg-[#FAF7F0]/40"
                />
              </div>
              <p className="text-[10px] text-[#687477] mt-0.5">Unique identifier used for verification & portal activation</p>
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
                placeholder="e.g. WMD-20-025"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-mono font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564] bg-[#FAF7F0]/40"
              />
              <p className="text-[10px] text-[#687477] mt-0.5">Cohort examination & attendance roll code</p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Asad Qadri"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564]"
                />
              </div>
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
                placeholder="e.g. Abdul Qadir"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564]"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564]"
                />
              </div>
              <p className="text-[10px] text-[#687477] mt-0.5">Used with Student ID for two-factor SMS portal setup</p>
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
                placeholder="student@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564]"
              />
            </div>

            {/* CNIC / B-Form */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                CNIC / B-Form (Optional)
              </label>
              <input
                type="text"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                placeholder="42101........"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-mono text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564]"
              />
            </div>

            {/* Admission Date */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                Admission Date
              </label>
              <input
                type="date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564]"
              />
            </div>

            {/* Course Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                Assigned Course <span className="text-red-500">*</span>
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

            {/* Batch Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                Assigned Batch Cohort <span className="text-red-500">*</span>
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

            {/* Campus & City */}
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

            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1">
                Initial Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564] bg-white"
              >
                <option value="PENDING_ACTIVATION">Pending Activation (New Admission)</option>
                <option value="ACTIVE">Active (Pre-activated)</option>
                <option value="ON_LEAVE">On Leave</option>
              </select>
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-semibold shadow-xs disabled:opacity-60 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enrolling Student...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Complete Admission</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
