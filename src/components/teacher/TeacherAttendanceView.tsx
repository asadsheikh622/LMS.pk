import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  CalendarCheck, Save, AlertCircle, RefreshCw, CheckCircle, Users
} from 'lucide-react';

export const TeacherAttendanceView: React.FC = () => {
  const { token } = useAuth();
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, { status: string; remarks: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch Teacher's assigned courses and batches
  useEffect(() => {
    if (!token) return;
    fetch('/api/teacher/courses', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load courses'))))
      .then((d) => {
        const cList = d.courses || [];
        setCoursesList(cList);
        if (cList.length > 0) {
          setSelectedCourseId(cList[0].courseId.toString());
          setSelectedBatchId(cList[0].batchId.toString());
        }
      })
      .catch(console.error);
  }, [token]);

  // Load attendance sheet whenever course, batch, or date changes
  const loadAttendanceSheet = async () => {
    if (!selectedCourseId || !selectedBatchId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/teacher/attendance?courseId=${selectedCourseId}&batchId=${selectedBatchId}&date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        const stuList = d.students || [];
        setStudents(stuList);

        const initialMap: Record<number, { status: string; remarks: string }> = {};
        stuList.forEach((s: any) => {
          initialMap[s.studentId] = {
            status: s.status === 'NOT_MARKED' ? 'PRESENT' : s.status,
            remarks: s.remarks || '',
          };
        });
        setAttendanceMap(initialMap);
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to load attendance sheet' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceSheet();
  }, [token, selectedCourseId, selectedBatchId, date]);

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    const updated = { ...attendanceMap };
    students.forEach((s) => {
      updated[s.studentId] = { ...updated[s.studentId], status };
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    try {
      const records = students.map((s) => ({
        studentId: s.studentId,
        status: attendanceMap[s.studentId]?.status || 'PRESENT',
        remarks: attendanceMap[s.studentId]?.remarks || '',
      }));

      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: parseInt(selectedCourseId, 10),
          batchId: parseInt(selectedBatchId, 10),
          date,
          records,
        }),
      });

      const d = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: d.message || `Roll call for ${date} successfully recorded in database.` });
        setTimeout(() => setMessage(null), 4000);
        loadAttendanceSheet();
      } else {
        setMessage({ type: 'error', text: d.error || 'Failed to record attendance' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#263238] tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-[#527564]" />
            <span>Class Attendance Register</span>
          </h2>
          <p className="text-xs text-[#687477]">
            Mark daily classroom roll call, tardiness, and verified excused leaves with atomic database updates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={`${selectedCourseId}-${selectedBatchId}`}
            onChange={(e) => {
              const [cId, bId] = e.target.value.split('-');
              setSelectedCourseId(cId);
              setSelectedBatchId(bId);
            }}
            className="px-3 py-2 rounded-xl border border-[#DDD5F2] bg-white text-xs font-semibold text-[#263238] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
          >
            {coursesList.map((c) => (
              <option key={c.assignmentId} value={`${c.courseId}-${c.batchId}`}>
                {c.courseCode} &bull; {c.batchNumber} ({c.courseTitle})
              </option>
            ))}
          </select>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#DDD5F2] bg-white text-xs font-semibold text-[#263238] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
          />

          <button
            onClick={handleSaveAttendance}
            disabled={isSaving || students.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Submitting...' : 'Save Roll Call'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
          message.type === 'success' ? 'bg-[#EBF2ED] text-[#527564]' : 'bg-red-50 text-red-700'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Quick Mark Toolbar */}
      <div className="rounded-2xl bg-white border border-[#DDD5F2] p-4 flex items-center justify-between text-xs">
        <span className="text-[#687477]">
          Showing <strong>{students.length}</strong> enrolled students in cohort
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleMarkAll('PRESENT')}
            className="px-3 py-1.5 rounded-lg bg-[#EBF2ED] text-[#527564] font-bold hover:bg-[#d8e6dc] cursor-pointer"
          >
            Mark All Present
          </button>
          <button
            onClick={() => handleMarkAll('ABSENT')}
            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 font-bold hover:bg-red-100 cursor-pointer"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="rounded-3xl bg-white border border-[#DDD5F2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F0] border-b border-[#DDD5F2] text-[#687477] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Roll No</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Attendance Status</th>
                <th className="py-3.5 px-4">Faculty Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD5F2]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#687477]">Loading cohort roster...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#687477]">
                    No students currently enrolled in this batch.
                  </td>
                </tr>
              ) : students.map((s) => {
                const cur = attendanceMap[s.studentId] || { status: 'PRESENT', remarks: '' };
                return (
                  <tr key={s.studentId} className="hover:bg-[#FAF7F0]/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#527564]">{s.academyStudentId}</td>
                    <td className="py-3 px-4 font-mono font-semibold">{s.rollNumber}</td>
                    <td className="py-3 px-4 font-bold text-[#263238]">{s.fullName}</td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-100 border border-zinc-200">
                        {(['PRESENT', 'ABSENT', 'LEAVE', 'LATE'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              setAttendanceMap({
                                ...attendanceMap,
                                [s.studentId]: { ...cur, status: st },
                              });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              cur.status === st
                                ? st === 'PRESENT'
                                  ? 'bg-[#527564] text-white shadow-xs'
                                  : st === 'ABSENT'
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : st === 'LEAVE'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-amber-600 text-white shadow-xs'
                                : 'text-zinc-600 hover:text-black'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={cur.remarks}
                        onChange={(e) => {
                          setAttendanceMap({
                            ...attendanceMap,
                            [s.studentId]: { ...cur, remarks: e.target.value },
                          });
                        }}
                        placeholder="Optional remarks..."
                        className="w-full max-w-xs p-1.5 rounded-lg border border-[#DDD5F2] text-xs focus:ring-1 focus:ring-[#8FAF9A] outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
