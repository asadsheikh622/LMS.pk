import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Layers, Plus, Users, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';

export const AdminBatchesView: React.FC = () => {
  const { token } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    courseId: '',
    batchNumber: '',
    name: '',
    campus: 'Main Campus',
    capacity: 40,
    startDate: new Date().toISOString().split('T')[0],
    teacherId: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/batches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setBatches(d.batches || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
    };








  const fetchDependencies = async () => {
    try {
      const [cRes, tRes] = await Promise.all([
        fetch('/api/admin/courses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/teachers?limit=50', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (cRes.ok) {
        const cData = await cRes.json();
        setCourses(cData.courses || []);
        if (cData.courses?.length > 0) {
          setFormData((f) => ({ ...f, courseId: cData.courses[0].id }));
        }
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        setTeachers(tData.teachers || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchDependencies();
  }, [token]);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const d = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Batch ${formData.batchNumber} created successfully.` });
        setIsAddModalOpen(false);
        setFormData({
          courseId: courses[0]?.id || '',
          batchNumber: '',
          name: '',
          campus: 'Main Campus',
          capacity: 40,
          startDate: new Date().toISOString().split('T')[0],
          teacherId: '',
        });
        fetchBatches();
      } else {
        setMessage({ type: 'error', text: d.error || 'Failed to create batch' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#263238] tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-[#527564]" />
            <span>Cohort Batches & Sections</span>
          </h1>
          <p className="text-xs text-[#687477]">
            Organize student groups, classroom capacities, start schedules, and assigned instructors.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Cohort Batch</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
          message.type === 'success' ? 'bg-[#EBF2ED] text-[#527564]' : 'bg-red-50 text-red-700'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Batches Table */}
      <div className="rounded-3xl bg-white border border-[#DDD5F2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F0] border-b border-[#DDD5F2] text-[#687477] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Batch Number</th>
                <th className="py-3.5 px-4">Cohort Name</th>
                <th className="py-3.5 px-4">Associated Course</th>
                <th className="py-3.5 px-4">Campus Location</th>
                <th className="py-3.5 px-4">Enrolled / Capacity</th>
                <th className="py-3.5 px-4">Assigned Instructors</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD5F2]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#687477]">Loading batches...</td>
                </tr>
              ) : batches.map((b) => (
                <tr key={b.id} className="hover:bg-[#FAF7F0]/60 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#527564]">{b.batchNumber}</td>
                  <td className="py-3.5 px-4 font-bold text-[#263238]">{b.name}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-[#263238]">{b.courseTitle}</span>
                    <span className="text-[11px] text-[#687477] block font-mono">{b.courseCode}</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#687477]">{b.campus}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#263238]">{b.enrolledStudentsCount}</span>
                      <span className="text-[#687477]">/ {b.capacity}</span>
                      <div className="w-16 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className="h-full bg-[#527564] rounded-full"
                          style={{ width: `${Math.min(100, Math.round((b.enrolledStudentsCount / b.capacity) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {b.instructors?.length === 0 ? (
                        <span className="text-[#687477] italic text-[11px]">Unassigned</span>
                      ) : (
                        b.instructors.map((ins: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-[#F4F1FB] text-[#7b69b8] text-[10px] font-semibold">
                            {ins.fullName} ({ins.teacherCode})
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      b.isActive ? 'bg-[#EBF2ED] text-[#527564]' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {b.isActive ? 'Active Cohort' : 'Concluded'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Batch */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-[#DDD5F2] p-6 sm:p-8 space-y-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#263238]">Launch New Cohort Batch</h2>
            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#263238] mb-1">Course Module *</label>
                <select
                  required
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] bg-white focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Batch Identifier *</label>
                  <input
                    required
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    placeholder="e.g. Batch 22"
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] font-mono focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Cohort Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Web & Mobile Spring 2026"
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Campus Location</label>
                  <input
                    type="text"
                    value={formData.campus}
                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Student Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Initial Lead Instructor</label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] bg-white focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  >
                    <option value="">-- Optional: Assign Later --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.fullName} ({t.teacherCode})</option>
                    ))}
                  </select>
                </div>
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
                  Confirm Batch Activation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
