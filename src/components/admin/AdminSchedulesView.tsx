import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Calendar, Plus, Trash2, Clock, MapPin, Layers, GraduationCap } from 'lucide-react';

export const AdminSchedulesView: React.FC = () => {
  const { token } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    courseId: '',
    batchId: '',
    teacherId: '',
    dayOfWeek: 'Monday',
    startTime: '09:00 AM',
    endTime: '11:00 AM',
    room: 'Lab 1',
    campus: 'Main Campus',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/schedules', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setSchedules(d.schedules || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [cRes, bRes, tRes] = await Promise.all([
        fetch('/api/admin/courses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/batches', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/teachers?limit=50', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (cRes.ok) {
        const c = await cRes.json();
        setCourses(c.courses || []);
        if (c.courses?.length > 0) setFormData(f => ({ ...f, courseId: c.courses[0].id }));
      }
      if (bRes.ok) {
        const b = await bRes.json();
        setBatches(b.batches || []);
        if (b.batches?.length > 0) setFormData(f => ({ ...f, batchId: b.batches[0].id }));
      }
      if (tRes.ok) {
        const t = await tRes.json();
        setTeachers(t.teachers || []);
        if (t.teachers?.length > 0) setFormData(f => ({ ...f, teacherId: t.teachers[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchDependencies();
  }, [token]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const d = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Class slot added to master timetable.' });
        setIsAddModalOpen(false);
        fetchSchedules();
      } else {
        setMessage({ type: 'error', text: d.error || 'Failed to add schedule' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/schedules/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Class schedule removed.' });
        fetchSchedules();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#263238] tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-[#527564]" />
            <span>Master Timetable & Class Schedules</span>
          </h1>
          <p className="text-xs text-[#687477]">
            Configure weekly recurring class times, faculty hall allocations, and room reservations.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Class Slot</span>
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

      {/* Timetable Cards by Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-[#687477]">Loading timetable...</div>
        ) : schedules.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#687477]">No class slots configured yet.</div>
        ) : schedules.map((s) => (
          <div key={s.id} className="rounded-3xl bg-white border border-[#DDD5F2] p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#FAF7F0] border border-[#DDD5F2] font-bold text-xs text-[#527564]">
                  {s.dayOfWeek}
                </span>
                <span className="text-[11px] font-mono text-[#687477]">{s.startTime} - {s.endTime}</span>
              </div>
              <h3 className="font-bold text-[#263238] text-sm">{s.courseTitle}</h3>
              <div className="flex items-center gap-2 text-xs text-[#687477]">
                <Layers className="w-3.5 h-3.5 text-[#527564]" />
                <span>{s.batchNumber}</span>
                <span>&bull;</span>
                <span>{s.batchName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#687477]">
                <GraduationCap className="w-3.5 h-3.5 text-[#7b69b8]" />
                <span>Instructor: <strong>{s.teacherName}</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DDD5F2]/60 flex items-center justify-between text-xs text-[#687477]">
              <span>{s.room} ({s.campus})</span>
              <button
                onClick={() => handleDelete(s.id)}
                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition cursor-pointer"
                title="Remove class slot"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Schedule Slot */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-[#DDD5F2] p-6 sm:p-8 space-y-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#263238]">Schedule Timetable Slot</h2>
            <form onSubmit={handleCreateSchedule} className="space-y-4 text-xs">
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
                  <label className="block font-bold text-[#263238] mb-1">Cohort Batch *</label>
                  <select
                    required
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] bg-white focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  >
                    <option value="">-- Choose Batch --</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.batchNumber} - {b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Instructor *</label>
                  <select
                    required
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] bg-white focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  >
                    <option value="">-- Choose Instructor --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.fullName} ({t.teacherCode})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Day of Week</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] bg-white focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Start Time</label>
                  <input
                    type="text"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    placeholder="09:00 AM"
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#263238] mb-1">End Time</label>
                  <input
                    type="text"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    placeholder="11:00 AM"
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Room / Lab</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Campus</label>
                  <input
                    type="text"
                    value={formData.campus}
                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
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
                  Confirm Class Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
