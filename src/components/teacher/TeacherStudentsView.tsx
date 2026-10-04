import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Users, Search, Filter, BookOpen, Layers, CheckCircle, Clock } from 'lucide-react';

export const TeacherStudentsView: React.FC = () => {
  const { token } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      let url = `/api/teacher/students?query=${encodeURIComponent(searchQuery)}`;
      if (selectedBatch) {
        url += `&batchId=${selectedBatch}`;
      }
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setStudents(d.students || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const res = await fetch('/api/teacher/courses', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setCoursesList(d.courses || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, [token]);

  useEffect(() => {
    fetchStudents();
  }, [token, selectedBatch, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#263238] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#527564]" />
            <span>Assigned Students & Roster</span>
          </h2>
          <p className="text-xs text-[#687477]">
            Monitor enrolled learners, view attendance records, and track academic progress across cohorts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#DDD5F2] bg-white text-xs font-semibold text-[#263238] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
          >
            <option value="">All Assigned Batches</option>
            {coursesList.map((c) => (
              <option key={c.assignmentId} value={c.batchId}>
                {c.courseCode} &bull; {c.batchNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#687477] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter students by name, registration ID, or roll number..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#DDD5F2] bg-white text-xs text-[#263238] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
        />
      </div>

      {/* Student List Table */}
      <div className="rounded-3xl bg-white border border-[#DDD5F2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F0] border-b border-[#DDD5F2] text-[#687477] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Roll Number</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Course & Batch</th>
                <th className="py-3.5 px-4">Attendance Rate</th>
                <th className="py-3.5 px-4">Course Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD5F2]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#687477]">Loading students...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#687477]">
                    No enrolled students found matching query.
                  </td>
                </tr>
              ) : students.map((s) => (
                <tr key={`${s.id}-${s.batchId}`} className="hover:bg-[#FAF7F0]/60 transition">
                  <td className="py-3 px-4 font-mono font-bold text-[#527564]">{s.studentId}</td>
                  <td className="py-3 px-4 font-mono">{s.rollNumber}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-[#263238] block">{s.fullName}</span>
                    <span className="text-[10px] text-[#687477]">{s.email}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-[#263238] block">{s.courseTitle}</span>
                    <span className="text-[10px] font-mono text-[#687477]">{s.batchNumber}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      (s.attendancePercentage || 0) >= 80 ? 'bg-[#EBF2ED] text-[#527564]' : 'bg-red-50 text-red-700'
                    }`}>
                      {s.attendancePercentage || 0}% ({s.totalAttendanceRecords || 0} Sessions)
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-28 bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#527564] h-full rounded-full"
                        style={{ width: `${s.progressPercentage || 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#687477] mt-0.5 block">{s.progressPercentage || 0}% completed</span>
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
