import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Bell,
  Send,
  Users,
  GraduationCap,
  CheckCircle,
  Clock,
  Layers,
  BookOpen,
  User,
  Shield,
} from 'lucide-react';

export const AdminNotificationsView: React.FC = () => {
  const { token } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState('ALL_STUDENTS');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearchText, setStudentSearchText] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/announcements', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setAnnouncements(d.announcements || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch courses, batches, and students for targeting
  useEffect(() => {
    if (!token) return;
    fetchAnnouncements();

    // Fetch courses
    fetch('/api/admin/courses', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((d) => setCourses(d.courses || []))
      .catch((err) => console.error('Failed to load courses:', err));

    // Fetch batches
    fetch('/api/admin/batches', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((d) => setBatches(d.batches || []))
      .catch((err) => console.error('Failed to load batches:', err));

    // Fetch students
    fetch('/api/admin/students?limit=200', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((d) => setStudents(d.students || []))
      .catch((err) => console.error('Failed to load students:', err));
  }, [token]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const payload: any = {
        title: title.trim(),
        message: message.trim(),
        targetType,
        priority,
      };

      if (targetType === 'COURSE') {
        if (!selectedCourseId) {
          setStatus({ type: 'error', text: 'Please select a course to target.' });
          setIsSubmitting(false);
          return;
        }
        payload.courseId = parseInt(selectedCourseId, 10);
      } else if (targetType === 'BATCH') {
        if (!selectedBatchId) {
          setStatus({ type: 'error', text: 'Please select a batch to target.' });
          setIsSubmitting(false);
          return;
        }
        payload.batchId = parseInt(selectedBatchId, 10);
      } else if (targetType === 'INDIVIDUAL_STUDENT') {
        if (!selectedStudentId) {
          setStatus({ type: 'error', text: 'Please select an individual student to target.' });
          setIsSubmitting(false);
          return;
        }
        payload.studentId = parseInt(selectedStudentId, 10);
      }

      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (res.ok) {
        const countText = d.recipientCount !== undefined ? ` (${d.recipientCount} recipients notified)` : '';
        setStatus({
          type: 'success',
          text: `Announcement broadcasted successfully${countText}.`,
        });
        setTitle('');
        setMessage('');
        setSelectedCourseId('');
        setSelectedBatchId('');
        setSelectedStudentId('');
        setStudentSearchText('');
        fetchAnnouncements();

        // Dispatch instant event for student components
        window.dispatchEvent(new CustomEvent('lms:refresh_notifications'));
      } else {
        setStatus({ type: 'error', text: d.error || 'Failed to dispatch broadcast' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    if (!studentSearchText.trim()) return true;
    const q = studentSearchText.toLowerCase();
    return (
      (s.fullName || '').toLowerCase().includes(q) ||
      (s.code || '').toLowerCase().includes(q) ||
      (s.roll || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#263238] tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-[#527564]" />
            <span>Campus Broadcasts & Announcements</span>
          </h1>
          <p className="text-xs text-[#687477]">
            Push urgent institutional alerts, targeted course notices, cohort reminders, and individual updates.
          </p>
        </div>
      </div>

      {status && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
            status.type === 'success' ? 'bg-[#EBF2ED] text-[#527564]' : 'bg-red-50 text-red-700'
          }`}
        >
          <span>{status.text}</span>
          <button onClick={() => setStatus(null)} className="font-bold underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Broadcast Form */}
        <div className="lg:col-span-1 rounded-3xl bg-white border border-[#DDD5F2] p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#263238] flex items-center gap-2">
            <Send className="w-4 h-4 text-[#527564]" />
            <span>Dispatch New Broadcast</span>
          </h2>

          <form onSubmit={handleBroadcast} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-[#263238] mb-1">Headline / Subject *</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midterm Examination Schedule Released"
                className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#263238] mb-1">Target Audience *</label>
              <select
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value);
                  setSelectedCourseId('');
                  setSelectedBatchId('');
                  setSelectedStudentId('');
                }}
                className="w-full p-2.5 rounded-xl border border-[#DDD5F2] bg-white focus:ring-2 focus:ring-[#8FAF9A] outline-none font-medium"
              >
                <option value="ALL_STUDENTS">🎓 All Enrolled Students</option>
                <option value="COURSE">📚 Specific Course (Enrolled Students)</option>
                <option value="BATCH">👥 Specific Batch / Cohort</option>
                <option value="INDIVIDUAL_STUDENT">👤 Individual Student</option>
                <option value="ALL">🌐 Entire Campus (Students & Faculty)</option>
                <option value="TEACHERS">👨‍🏫 Faculty Instructors Only</option>
              </select>
            </div>

            {/* Course Selector */}
            {targetType === 'COURSE' && (
              <div className="animate-in fade-in duration-200">
                <label className="block font-bold text-[#263238] mb-1">Select Target Course *</label>
                <select
                  required
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#8FAF9A] bg-emerald-50/30 focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Batch Selector */}
            {targetType === 'BATCH' && (
              <div className="animate-in fade-in duration-200">
                <label className="block font-bold text-[#263238] mb-1">Select Target Batch / Cohort *</label>
                <select
                  required
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#8FAF9A] bg-emerald-50/30 focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                >
                  <option value="">-- Choose Batch --</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code || b.batchNumber || `Batch #${b.id}`})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Individual Student Selector */}
            {targetType === 'INDIVIDUAL_STUDENT' && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <label className="block font-bold text-[#263238] mb-1">Search & Select Student *</label>
                <input
                  type="text"
                  value={studentSearchText}
                  onChange={(e) => setStudentSearchText(e.target.value)}
                  placeholder="Type name, roll # or student ID..."
                  className="w-full p-2 rounded-xl border border-[#DDD5F2] focus:ring-1 focus:ring-[#8FAF9A] outline-none text-xs"
                />
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#8FAF9A] bg-emerald-50/30 focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  size={5}
                >
                  {filteredStudents.length === 0 ? (
                    <option disabled value="">No matching students found</option>
                  ) : (
                    filteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.code} / Roll: {s.roll})
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            <div>
              <label className="block font-bold text-[#263238] mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#DDD5F2] bg-white focus:ring-2 focus:ring-[#8FAF9A] outline-none"
              >
                <option value="NORMAL">Standard Notice</option>
                <option value="URGENT">Urgent / Important Alert</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#263238] mb-1">Notice Content *</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Detailed announcement details..."
                className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Dispatching...' : 'Broadcast Notice'}</span>
            </button>
          </form>
        </div>

        {/* Existing Announcements List */}
        <div className="lg:col-span-2 rounded-3xl bg-white border border-[#DDD5F2] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#263238]">Active Campus Broadcasts</h2>
            <span className="text-xs text-[#687477]">{announcements.length} broadcasts recorded</span>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-[#687477]">Loading broadcasts...</div>
            ) : announcements.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#687477]">No active campus broadcasts.</div>
            ) : (
              announcements.map((a) => (
                <div key={a.id} className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#DDD5F2] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EBF2ED] text-[#527564] text-[10px] font-bold">
                        Target: {a.targetAudience || a.targetRole || 'ALL'}
                      </span>
                      {a.courseTitle && (
                        <span className="px-2 py-0.5 rounded-md bg-white border border-[#DDD5F2] text-[10px] text-[#263238] font-semibold">
                          Course: {a.courseTitle}
                        </span>
                      )}
                      {a.batchName && (
                        <span className="px-2 py-0.5 rounded-md bg-white border border-[#DDD5F2] text-[10px] text-[#263238] font-semibold">
                          Batch: {a.batchName}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#687477] font-mono">
                      {new Date(a.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#263238]">{a.title}</h3>
                  <p className="text-xs text-[#687477] leading-relaxed whitespace-pre-line">{a.message || a.content}</p>
                  <div className="text-[10px] text-[#687477] font-semibold pt-1 border-t border-[#DDD5F2]/40 flex items-center justify-between">
                    <span>
                      Published by: <strong>{a.authorName}</strong> ({a.authorRole || 'ADMIN'})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
