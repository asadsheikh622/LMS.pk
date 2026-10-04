import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { CalendarCheck, Calendar, Filter, Search, CheckCircle, XCircle, Clock } from 'lucide-react';

export const AdminAttendanceView: React.FC = () => {
  const { token } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, leave: 0, late: 0 });
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      let url = `/api/admin/attendance?date=${date}`;
      if (selectedCourse) url += `&courseId=${selectedCourse}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setRecords(d.records || []);
        setStats(d.stats || { total: 0, present: 0, absent: 0, leave: 0, late: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/courses', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load courses'))))
      .then((d) => setCourses(d.courses || []))
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    fetchAttendance();
  }, [token, date, selectedCourse]);

  const handleUpdateStatus = async (recordId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/attendance/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setMessage('Attendance status updated by Admin override.');
        setTimeout(() => setMessage(null), 3000);
        fetchAttendance();
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
            <CalendarCheck className="w-7 h-7 text-[#527564]" />
            <span>Campus Daily Attendance Audit</span>
          </h1>
          <p className="text-xs text-[#687477]">
            Real-time biometric & faculty attendance logs with administrative override tools.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#DDD5F2] bg-white text-xs font-semibold text-[#263238] focus:ring-2 focus:ring-[#8FAF9A] outline-none cursor-pointer"
          />
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-[#EBF2ED] text-[#527564] text-xs font-semibold">
          {message}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#DDD5F2] shadow-xs">
          <span className="text-[11px] font-bold text-[#687477] uppercase block mb-1">Total Checked</span>
          <div className="text-2xl font-black text-[#263238]">{stats.total}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#DDD5F2] shadow-xs">
          <span className="text-[11px] font-bold text-[#527564] uppercase block mb-1">Present</span>
          <div className="text-2xl font-black text-[#527564]">{stats.present}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#DDD5F2] shadow-xs">
          <span className="text-[11px] font-bold text-red-600 uppercase block mb-1">Absent</span>
          <div className="text-2xl font-black text-red-600">{stats.absent}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#DDD5F2] shadow-xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase block mb-1">Official Leave</span>
          <div className="text-2xl font-black text-blue-600">{stats.leave}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#DDD5F2] shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase block mb-1">Late Entry</span>
          <div className="text-2xl font-black text-amber-600">{stats.late}</div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="rounded-3xl bg-white border border-[#DDD5F2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F0] border-b border-[#DDD5F2] text-[#687477] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Roll Number</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Course & Batch</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Remarks</th>
                <th className="py-3.5 px-4 text-right">Admin Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD5F2]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#687477]">Auditing logs for {date}...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#687477]">
                    No attendance records logged for {date}. Faculty can mark attendance via the Faculty Portal.
                  </td>
                </tr>
              ) : records.map((r) => (
                <tr key={r.id} className="hover:bg-[#FAF7F0]/60 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#527564]">{r.studentCode}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#263238]">{r.rollNumber}</td>
                  <td className="py-3.5 px-4 font-bold text-[#263238]">{r.studentName}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-[#263238]">{r.courseTitle}</span>
                    <span className="text-[11px] text-[#687477] block font-mono">{r.batchNumber}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      r.status === 'PRESENT'
                        ? 'bg-[#EBF2ED] text-[#527564]'
                        : r.status === 'ABSENT'
                        ? 'bg-red-50 text-red-700'
                        : r.status === 'LEAVE'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#687477]">{r.remarks || '—'}</td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'PRESENT')}
                      className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                        r.status === 'PRESENT' ? 'bg-[#527564] text-white' : 'bg-zinc-100 hover:bg-[#EBF2ED] text-zinc-700'
                      }`}
                    >
                      P
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'ABSENT')}
                      className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                        r.status === 'ABSENT' ? 'bg-red-600 text-white' : 'bg-zinc-100 hover:bg-red-50 text-zinc-700'
                      }`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'LEAVE')}
                      className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                        r.status === 'LEAVE' ? 'bg-blue-600 text-white' : 'bg-zinc-100 hover:bg-blue-50 text-zinc-700'
                      }`}
                    >
                      L
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
