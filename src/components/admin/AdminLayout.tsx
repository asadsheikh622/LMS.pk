import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  CalendarCheck,
  FileSpreadsheet,
  HelpCircle,
  CreditCard,
  Calendar,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Search,
  ExternalLink
} from 'lucide-react';
import { AdminStudentsView } from './AdminStudentsView.tsx';
import { AdminDashboardView } from './AdminDashboardView.tsx';
import { AdminTeachersView } from './AdminTeachersView.tsx';
import { AdminCoursesView } from './AdminCoursesView.tsx';
import { AdminBatchesView } from './AdminBatchesView.tsx';
import { AdminAttendanceView } from './AdminAttendanceView.tsx';
import { AdminPaymentsView } from './AdminPaymentsView.tsx';
import { AdminSchedulesView } from './AdminSchedulesView.tsx';
import { AdminReportsView } from './AdminReportsView.tsx';
import { AdminNotificationsView } from './AdminNotificationsView.tsx';
import { AdminSettingsView } from './AdminSettingsView.tsx';

interface AdminLayoutProps {
  onLogout: () => void;
  initialTab?: string;
}

export type AdminTab =
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'courses'
  | 'batches'
  | 'attendance'
  | 'assignments'
  | 'quizzes'
  | 'payments'
  | 'schedules'
  | 'reports'
  | 'notifications'
  | 'settings';

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout, initialTab = 'dashboard' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>((initialTab as AdminTab) || 'dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'students', label: 'Students', icon: Users, badge: 'Registry' },
    { id: 'teachers', label: 'Teachers', icon: GraduationCap, badge: null },
    { id: 'courses', label: 'Courses', icon: BookOpen, badge: null },
    { id: 'batches', label: 'Batches', icon: Layers, badge: null },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, badge: null },
    { id: 'assignments', label: 'Assignments', icon: FileSpreadsheet, badge: null },
    { id: 'quizzes', label: 'Quizzes', icon: HelpCircle, badge: null },
    { id: 'payments', label: 'Payments & Fees', icon: CreditCard, badge: null },
    { id: 'schedules', label: 'Class Schedules', icon: Calendar, badge: null },
    { id: 'reports', label: 'Academic Reports', icon: BarChart3, badge: null },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: null },
    { id: 'settings', label: 'System Settings', icon: Settings, badge: null },
  ];

  const handleTabSelect = (tab: AdminTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col md:flex-row">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-xs"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-50 md:z-20 w-64 bg-white border-r border-[#DDD5F2] flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-5 border-b border-[#DDD5F2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#527564] text-white flex items-center justify-center font-black shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-black text-[#263238] block tracking-tight">Admin Console</span>
              <span className="text-[10px] text-[#527564] font-bold uppercase tracking-wider block">
                {user?.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Academic Director'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-xl text-[#687477] hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-[#687477] uppercase tracking-wider">
            Academic Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabSelect(item.id as AdminTab)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#527564] text-white shadow-xs'
                    : 'text-[#263238] hover:bg-[#FAF7F0] hover:text-[#527564]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#687477]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#EBF2ED] text-[#527564]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-[#DDD5F2] bg-[#FAF7F0]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-[#263238] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.fullName?.substring(0, 1).toUpperCase() || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-[#263238] truncate">{user?.fullName}</p>
                <p className="text-[10px] text-[#687477] truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-xl text-[#687477] hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs border-b border-[#DDD5F2] px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-[#263238] hover:bg-[#FAF7F0] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#687477]">
              <span>Executive Portal</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#263238] capitalize font-bold">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleTabSelect('students')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-[#527564] text-white'
                  : 'bg-[#FAF7F0] text-[#263238] hover:bg-[#DDD5F2]/50'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => handleTabSelect('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#527564] text-white'
                  : 'bg-[#FAF7F0] text-[#263238] hover:bg-[#DDD5F2]/50'
              }`}
            >
              Dashboard
            </button>
          </div>
        </header>

        {/* Tab Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <AdminDashboardView
              onLogout={onLogout}
              onNavigateToStudents={() => handleTabSelect('students')}
            />
          )}

          {activeTab === 'students' && <AdminStudentsView />}
          {activeTab === 'teachers' && <AdminTeachersView />}
          {activeTab === 'courses' && <AdminCoursesView />}
          {activeTab === 'batches' && <AdminBatchesView />}
          {activeTab === 'attendance' && <AdminAttendanceView />}
          {activeTab === 'payments' && <AdminPaymentsView />}
          {activeTab === 'schedules' && <AdminSchedulesView />}
          {activeTab === 'reports' && <AdminReportsView />}
          {activeTab === 'notifications' && <AdminNotificationsView />}
          {activeTab === 'settings' && <AdminSettingsView />}

          {/* Assignments & Quizzes tabs redirect or have focused views */}
          {(activeTab === 'assignments' || activeTab === 'quizzes') && (
            <div className="max-w-3xl mx-auto my-12 p-8 rounded-3xl bg-white border border-[#DDD5F2] text-center space-y-4 shadow-xs animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-[#EBF2ED] text-[#527564] flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-[#263238] capitalize">{activeTab} Supervision</h2>
              <p className="text-xs text-[#687477] max-w-md mx-auto">
                Faculty instructors author and score curriculum {activeTab} directly via the Faculty Portal. As academic administrator, you can inspect courses and student enrollment portfolios directly.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => handleTabSelect('courses')}
                  className="px-5 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  View Course Catalog
                </button>
                <button
                  onClick={() => handleTabSelect('students')}
                  className="px-5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-semibold text-[#687477] hover:bg-[#FAF7F0] cursor-pointer"
                >
                  Student Registry
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
