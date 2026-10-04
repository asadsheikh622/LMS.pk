import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  GraduationCap, Plus, Search, Filter, Mail, Phone,
  BookOpen, Award, CheckCircle, XCircle, Edit, Layers
} from 'lucide-react';
import { PasswordInputWithMonkey } from '../common/PasswordInputWithMonkey.tsx';

interface TeacherItem {
  id: number;
  userId: number;
  teacherCode: string;
  fullName: string;
  email: string;
  phone: string;
  isActive: boolean;
  qualification: string;
  specialization: string;
  bio: string;
  joiningDate: string;
  assignedCount: number;
  assignments: { courseTitle: string; courseCode: string; batchNumber: string }[];
}

export const AdminTeachersView: React.FC = () => {
  const { token } = useAuth();
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    qualification: 'MS Computer Science',
    specialization: 'Cloud & Systems',
    bio: '',
    initialPassword: 'Academy123!',
  });

  const [assignData, setAssignData] = useState({
    courseId: '',
    batchId: '',
  });

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/teachers?query=${encodeURIComponent(query)}&page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [cRes, bRes] = await Promise.all([
        fetch('/api/admin/courses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/batches', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (cRes.ok) {
        const cData = await cRes.json();
        setCourses(cData.courses || []);
      }
      if (bRes.ok) {
        const bData = await bRes.json();
        setBatches(bData.batches || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [token, query, page]);

  useEffect(() => {
    fetchDependencies();
  }, [token]);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ type: 'success', text: `Faculty member ${formData.fullName} added successfully.` });
        setIsAddModalOpen(false);
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          qualification: 'MS Computer Science',
          specialization: 'Cloud & Systems',
          bio: '',
          initialPassword: 'Academy123!',
        });
        fetchTeachers();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to create teacher' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleAssignBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    try {
      const res = await fetch(`/api/admin/teachers/${selectedTeacher.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assignData),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Faculty assigned to batch successfully.' });
        setIsAssignModalOpen(false);
        fetchTeachers();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to assign batch' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#263238] tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-[#527564]" />
            <span>Faculty & Instructors Registry</span>
          </h1>
          <p className="text-xs text-[#687477]">
            Manage academic instructors, course allocations, qualifications, and faculty credentials.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Appoint New Faculty Member</span>
        </button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
          statusMessage.type === 'success' ? 'bg-[#EBF2ED] text-[#527564]' : 'bg-red-50 text-red-700'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="font-bold underline ml-4">Dismiss</button>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div className="rounded-3xl bg-white border border-[#DDD5F2] p-5 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#687477] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, code, email or spec..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8FAF9A]"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-[#687477] w-full md:w-auto justify-end">
          <span>Total Faculty: <strong className="text-[#263238]">{pagination.totalCount}</strong></span>
          <span>•</span>
          <span>Showing Page <strong className="text-[#263238]">{page} of {pagination.totalPages || 1}</strong></span>
        </div>
      </div>

      {/* Roster Table */}
      <div className="rounded-3xl bg-white border border-[#DDD5F2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F0] border-b border-[#DDD5F2] text-[#687477] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Faculty Code</th>
                <th className="py-3.5 px-4">Instructor Name</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Specialization</th>
                <th className="py-3.5 px-4">Assigned Batches</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD5F2]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#687477]">
                    Loading faculty registry...
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#687477]">
                    No instructors found matching search criteria.
                  </td>
                </tr>
              ) : (
                teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAF7F0]/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#527564]">{t.teacherCode}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#263238]">{t.fullName}</div>
                      <div className="text-[11px] text-[#687477]">{t.qualification}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[#263238]">{t.email}</div>
                      <div className="text-[11px] text-[#687477]">{t.phone || 'No phone'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F4F1FB] text-[#7b69b8] font-semibold text-[10px]">
                        {t.specialization}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {t.assignments.length === 0 ? (
                          <span className="text-[11px] text-[#687477] italic">No active batches</span>
                        ) : (
                          t.assignments.map((a, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-[#FAF7F0] border border-[#DDD5F2] text-[10px] font-mono">
                              {a.batchNumber} ({a.courseCode})
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.isActive ? 'bg-[#EBF2ED] text-[#527564]' : 'bg-red-50 text-red-700'
                      }`}>
                        {t.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTeacher(t);
                          setAssignData({ courseId: courses[0]?.id || '', batchId: batches[0]?.id || '' });
                          setIsAssignModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#FAF7F0] border border-[#DDD5F2] text-[#527564] hover:bg-[#8FAF9A]/20 text-xs font-semibold cursor-pointer"
                      >
                        + Assign Batch
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-[#DDD5F2] flex items-center justify-between text-xs text-[#687477]">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-[#DDD5F2] disabled:opacity-40 font-semibold cursor-pointer"
          >
            &larr; Previous
          </button>
          <span>Page {page} of {pagination.totalPages || 1}</span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-[#DDD5F2] disabled:opacity-40 font-semibold cursor-pointer"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* Modal: Appoint Faculty */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-[#DDD5F2] p-6 sm:p-8 space-y-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#263238]">Appoint New Faculty Member</h2>
            <form onSubmit={handleCreateTeacher} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#263238] mb-1">Full Name *</label>
                <input
                  required
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Dr. Salman Farooqi"
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="salman@academy.edu"
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+92 300 1234567"
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Highest Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#263238] mb-1">Temporary Initial Password</label>
                <PasswordInputWithMonkey
                  value={formData.initialPassword}
                  onChange={(e) => setFormData({ ...formData, initialPassword: e.target.value })}
                  inputClassName="font-mono"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DDD5F2] text-[#687477] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white font-bold cursor-pointer"
                >
                  Create Faculty Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Batch */}
      {isAssignModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-[#DDD5F2] p-6 sm:p-8 space-y-6 shadow-xl">
            <h2 className="text-lg font-bold text-[#263238]">
              Assign Course Batch to {selectedTeacher.fullName}
            </h2>
            <form onSubmit={handleAssignBatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#263238] mb-1">Select Course *</label>
                <select
                  required
                  value={assignData.courseId}
                  onChange={(e) => setAssignData({ ...assignData, courseId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] bg-white focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#263238] mb-1">Select Cohort Batch *</label>
                <select
                  required
                  value={assignData.batchId}
                  onChange={(e) => setAssignData({ ...assignData, batchId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] bg-white focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                >
                  <option value="">-- Choose Batch --</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.batchNumber} - {b.name} ({b.campus})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DDD5F2] text-[#687477] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white font-bold cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
