import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  BarChart3, Download, TrendingUp, Users, Award, Calendar,
  CreditCard, CheckCircle, FileText
} from 'lucide-react';

export const AdminReportsView: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/reports', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load reports'))))
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token]);

  const handleExportCSV = (type: string) => {
    window.location.href = `/api/admin/export/students?token=${token}`;
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs font-semibold text-[#687477]">Compiling analytical reports...</div>;
  }

  const { overallStats, courseDistribution, studentStatusBreakdown } = data || {
    overallStats: { totalStudents: 0, totalTeachers: 0, totalCourses: 0, totalBatches: 0, totalPayments: 0, attendanceRate: 0 },
    courseDistribution: [],
    studentStatusBreakdown: [],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#263238] tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-[#527564]" />
            <span>Institutional Analytics & Audits</span>
          </h1>
          <p className="text-xs text-[#687477]">
            Comprehensive reporting on student enrollments, retention rates, and fee reconciliation.
          </p>
        </div>

        <button
          onClick={() => handleExportCSV('students')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#263238] hover:bg-black text-white text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Student Roster (CSV)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#DDD5F2] shadow-xs">
          <span className="text-xs font-bold text-[#687477] uppercase block mb-1">Campus Attendance Rate</span>
          <div className="text-3xl font-black text-[#527564]">{overallStats.attendanceRate}%</div>
          <span className="text-[11px] text-[#527564] font-semibold mt-1 block">Based on verified classroom logs</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#DDD5F2] shadow-xs">
          <span className="text-xs font-bold text-[#687477] uppercase block mb-1">Total Fee Realization</span>
          <div className="text-3xl font-black text-[#263238]">PKR {overallStats.totalPayments.toLocaleString()}</div>
          <span className="text-[11px] text-[#687477] font-semibold mt-1 block">Accrued across active batches</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#DDD5F2] shadow-xs">
          <span className="text-xs font-bold text-[#687477] uppercase block mb-1">Total Enrolled Body</span>
          <div className="text-3xl font-black text-[#263238]">{overallStats.totalStudents}</div>
          <span className="text-[11px] text-[#7b69b8] font-semibold mt-1 block">Across {overallStats.totalBatches} batches</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#DDD5F2] shadow-xs">
          <span className="text-xs font-bold text-[#687477] uppercase block mb-1">Faculty to Student Ratio</span>
          <div className="text-3xl font-black text-[#7b69b8]">
            1:{overallStats.totalTeachers > 0 ? Math.round(overallStats.totalStudents / overallStats.totalTeachers) : 0}
          </div>
          <span className="text-[11px] text-[#7b69b8] font-semibold mt-1 block">Healthy academic benchmark</span>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status distribution */}
        <div className="rounded-3xl bg-white border border-[#DDD5F2] p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#263238]">Student Lifecycle Breakdown</h2>
          <div className="space-y-3 text-xs">
            {studentStatusBreakdown.map((s: any) => (
              <div key={s.status} className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F0] border border-[#DDD5F2]/60">
                <span className="font-bold text-[#263238]">{s.status}</span>
                <span className="font-mono font-bold text-[#527564]">{s.count} Students</span>
              </div>
            ))}
          </div>
        </div>

        {/* Course distribution */}
        <div className="rounded-3xl bg-white border border-[#DDD5F2] p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#263238]">Course Module Enrollment</h2>
          <div className="space-y-3 text-xs">
            {courseDistribution.map((c: any) => (
              <div key={c.code} className="space-y-1">
                <div className="flex items-center justify-between font-semibold text-[#263238]">
                  <span>{c.code} - {c.title}</span>
                  <span className="font-mono text-[#527564]">{c.count}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className="h-full bg-[#527564] rounded-full"
                    style={{ width: `${Math.min(100, (c.count / Math.max(overallStats.totalStudents, 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
