import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ShieldCheck, Users, BookOpen, Layers, DollarSign,
  UserPlus, CheckCircle, Clock, AlertCircle, LogOut, ChevronRight
} from 'lucide-react';

interface AdminDashboardViewProps {
  onLogout: () => void;
  onNavigateToStudents?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onLogout,
  onNavigateToStudents,
}) => {
  const { token, user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    fetch('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load administration console');
        return res.json();
      })
      .then((d) => setData(d))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#263238] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#687477]">Accessing Executive Registry...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl bg-white border border-red-200 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-xl font-bold text-[#263238]">Access Prohibited</h3>
        <p className="text-sm text-[#687477]">{error || 'Administrative privileges required.'}</p>
        <button
          onClick={onLogout}
          className="px-5 py-2.5 rounded-xl bg-[#263238] text-white text-sm font-semibold"
        >
          Sign Out
        </button>
      </div>
    );
  }

  const { stats, recentStudents } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="rounded-3xl bg-[#263238] text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#8FAF9A] text-[#263238] flex items-center justify-center font-extrabold text-2xl shadow-xs">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                {user?.fullName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#8FAF9A]/20 text-[#8FAF9A] text-xs font-bold uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
            <div className="text-xs text-gray-300 mt-1">
              Director of Academics &bull; Executive System Authority &bull; Cloud SQL Connected
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#DDD5F2]/70 shadow-xs">
          <span className="text-xs font-semibold text-[#687477] uppercase tracking-wider block mb-1">
            Total Students
          </span>
          <div className="text-3xl font-extrabold text-[#263238]">{stats.totalStudents}</div>
          <span className="text-[11px] text-[#527564] font-semibold mt-1 block">
            {stats.activeStudents} Activated Accounts
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#DDD5F2]/70 shadow-xs">
          <span className="text-xs font-semibold text-[#687477] uppercase tracking-wider block mb-1">
            Faculty Members
          </span>
          <div className="text-3xl font-extrabold text-[#263238]">{stats.totalTeachers}</div>
          <span className="text-[11px] text-[#7b69b8] font-semibold mt-1 block">
            Assigned to Batches
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#DDD5F2]/70 shadow-xs">
          <span className="text-xs font-semibold text-[#687477] uppercase tracking-wider block mb-1">
            Active Courses
          </span>
          <div className="text-3xl font-extrabold text-[#263238]">{stats.totalCourses}</div>
          <span className="text-[11px] text-[#527564] font-semibold mt-1 block">
            {stats.totalBatches} Cohort Batches
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#DDD5F2]/70 shadow-xs">
          <span className="text-xs font-semibold text-[#687477] uppercase tracking-wider block mb-1">
            Daily Attendance
          </span>
          <div className="text-3xl font-extrabold text-[#527564]">{stats.presentToday}%</div>
          <span className="text-[11px] text-[#687477] font-semibold mt-1 block">
            Campus Check-in rate
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#DDD5F2]/70 shadow-xs">
          <span className="text-xs font-semibold text-[#687477] uppercase tracking-wider block mb-1">
            Pending Fee Dues
          </span>
          <div className="text-3xl font-extrabold text-amber-700">{stats.pendingFees}</div>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
            Unpaid Vouchers
          </span>
        </div>
      </div>

      {/* Student Registry Table */}
      <div className="rounded-3xl bg-white border border-[#DDD5F2] p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#263238]">Recent Admissions & Student Registry</h2>
            <p className="text-xs text-[#687477]">
              Admitted by Academy &bull; Students activate via /student/activate using Student ID and phone
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToStudents}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#DDD5F2] text-[#263238] hover:bg-[#FAF7F0] text-xs font-semibold transition cursor-pointer"
            >
              <span>Open Student Registry</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateToStudents}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#527564] text-white text-xs font-semibold hover:bg-[#3f5a4d] transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Admit New Student</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#DDD5F2] text-[#687477] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Student ID</th>
                <th className="py-3 px-3">Roll Number</th>
                <th className="py-3 px-3">Full Name</th>
                <th className="py-3 px-3">Father Name</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD5F2]/50">
              {recentStudents.map((stu: any) => (
                <tr key={stu.id} className="hover:bg-[#FAF7F0]/60 transition">
                  <td className="py-3 px-3 font-mono font-bold text-[#527564]">{stu.studentId}</td>
                  <td className="py-3 px-3 font-mono font-semibold">{stu.rollNumber}</td>
                  <td className="py-3 px-3 font-bold text-[#263238]">{stu.fullName}</td>
                  <td className="py-3 px-3 text-[#687477]">{stu.fatherName}</td>
                  <td className="py-3 px-3 text-[#687477]">{stu.phone}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      stu.status === 'ACTIVE' || stu.isActivated
                        ? 'bg-[#EBF2ED] text-[#527564]'
                        : stu.status === 'DROPPED_OUT'
                        ? 'bg-zinc-200 text-zinc-700'
                        : 'bg-amber-50 text-amber-800'
                    }`}>
                      {stu.status || (stu.isActivated ? 'ACTIVE' : 'PENDING_ACTIVATION')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={onNavigateToStudents}
                      className="text-[#527564] hover:underline font-semibold text-xs cursor-pointer"
                    >
                      Manage in Registry
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
