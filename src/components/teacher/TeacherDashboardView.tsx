import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard, BookOpen, Users, CalendarCheck,
  FileSpreadsheet, HelpCircle, Bell, User, LogOut, ChevronRight,
  PlusCircle, Sparkles
} from 'lucide-react';
import { TeacherAttendanceView } from './TeacherAttendanceView.tsx';
import { TeacherAssignmentsView } from './TeacherAssignmentsView.tsx';
import { TeacherQuizzesView } from './TeacherQuizzesView.tsx';
import { TeacherStudentsView } from './TeacherStudentsView.tsx';

interface TeacherLayoutProps {
  onLogout: () => void;
}

type TeacherTab = 'dashboard' | 'attendance' | 'assignments' | 'quizzes' | 'students' | 'announcements';

export const TeacherDashboardView: React.FC<TeacherLayoutProps> = ({ onLogout }) => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TeacherTab>('dashboard');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick announcement modal
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceMessage, setAnnounceMessage] = useState('');
  const [targetType, setTargetType] = useState('ALL_MY_STUDENTS');
  const [targetCourseId, setTargetCourseId] = useState('');
  const [targetBatchId, setTargetBatchId] = useState('');
  const [targetStudentId, setTargetStudentId] = useState('');
  const [teacherCourses, setTeacherCourses] = useState<any[]>([]);
  const [teacherBatches, setTeacherBatches] = useState<any[]>([]);
  const [teacherStudents, setTeacherStudents] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchDashboard = () => {
    if (!token) return;
    fetch('/api/teacher/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load teacher dashboard');
        return res.json();
      })
      .then((d) => setData(d))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  const fetchAnnouncements = () => {
    if (!token) return;
    fetch('/api/teacher/announcements', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load announcements'))))
      .then((d) => setAnnouncements(d.announcements || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchDashboard();
    fetchAnnouncements();

    if (token) {
      fetch('/api/teacher/courses', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => {
          const list = d.courses || [];
          setTeacherCourses(list);
          const batchMap = new Map();
          list.forEach((c: any) => {
            if (c.batchId && !batchMap.has(c.batchId)) {
              batchMap.set(c.batchId, {
                id: c.batchId,
                name: c.batchName || c.batchNumber,
                courseTitle: c.courseTitle,
              });
            }
          });
          setTeacherBatches(Array.from(batchMap.values()));
        })
        .catch(console.error);

      fetch('/api/teacher/students', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => setTeacherStudents(d.students || []))
        .catch(console.error);
    }
  }, [token]);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPosting(true);
    try {
      const payload: any = {
        title: announceTitle.trim(),
        content: announceMessage.trim(),
        targetType,
      };

      if (targetType === 'BATCH') {
        if (!targetBatchId) {
          setStatusMsg('Please select an assigned batch.');
          setIsPosting(false);
          return;
        }
        payload.batchId = parseInt(targetBatchId, 10);
      } else if (targetType === 'COURSE') {
        if (!targetCourseId) {
          setStatusMsg('Please select an assigned course.');
          setIsPosting(false);
          return;
        }
        payload.courseId = parseInt(targetCourseId, 10);
      } else if (targetType === 'INDIVIDUAL_STUDENT') {
        if (!targetStudentId) {
          setStatusMsg('Please select an individual student.');
          setIsPosting(false);
          return;
        }
        payload.studentId = parseInt(targetStudentId, 10);
      }

      const res = await fetch('/api/teacher/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (res.ok) {
        setStatusMsg(`Course announcement broadcasted to ${d.recipientCount !== undefined ? d.recipientCount : 'all'} students successfully.`);
        setIsAnnounceModalOpen(false);
        setAnnounceTitle('');
        setAnnounceMessage('');
        setTargetCourseId('');
        setTargetBatchId('');
        setTargetStudentId('');
        fetchAnnouncements();
        window.dispatchEvent(new CustomEvent('lms:refresh_notifications'));
        setTimeout(() => setStatusMsg(null), 4000);
      } else {
        setStatusMsg(d.error || 'Failed to dispatch broadcast');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg(err.message || 'Failed to dispatch broadcast');
    } finally {
      setIsPosting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#A99AD9] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#687477]">Loading Faculty Portal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl bg-white border border-red-200 text-center space-y-4">
        <h3 className="text-xl font-bold text-[#263238]">Teacher Access Error</h3>
        <p className="text-sm text-[#687477]">{error || 'Unable to load teacher data'}</p>
        <button onClick={onLogout} className="px-5 py-2.5 rounded-xl bg-[#263238] text-white text-sm font-semibold">
          Sign Out & Return
        </button>
      </div>
    );
  }

  const { teacher, stats, courses } = data;

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'assignments', label: 'Assignments', icon: FileSpreadsheet },
    { id: 'quizzes', label: 'Quizzes', icon: HelpCircle },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'announcements', label: 'Broadcasts', icon: Bell },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Banner */}
      <div className="rounded-3xl bg-white/90 border border-[#DDD5F2] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F4F1FB] text-[#7b69b8] flex items-center justify-center font-bold text-2xl shadow-xs">
            {user?.fullName?.charAt(0) || 'T'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-[#263238] tracking-tight">
                {user?.fullName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F4F1FB] text-[#7b69b8] text-xs font-bold">
                Faculty Instructor
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#687477] mt-1 font-medium">
              <span>Code: <strong>{teacher.code}</strong></span>
              <span>•</span>
              <span>Spec: <strong>{teacher.specialization}</strong></span>
              <span>•</span>
              <span>Qualification: <strong>{teacher.qualification}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAnnounceModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Course Announcement</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#DDD5F2] hover:bg-[#FAF7F0] text-[#263238] text-xs font-semibold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-2xl bg-[#EBF2ED] text-[#527564] text-xs font-semibold">
          {statusMsg}
        </div>
      )}

      {/* Faculty Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#DDD5F2]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TeacherTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#527564] text-white shadow-xs'
                  : 'bg-white text-[#263238] hover:bg-[#FAF7F0] border border-[#DDD5F2]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Overview (Dashboard) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setActiveTab('students')}
              className="p-5 rounded-2xl bg-white border border-[#DDD5F2]/70 shadow-xs hover:border-[#527564] cursor-pointer transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#687477] uppercase tracking-wider">Total Students</span>
                <Users className="w-4 h-4 text-[#7b69b8]" />
              </div>
              <div className="text-3xl font-extrabold text-[#263238]">{stats.totalStudents}</div>
              <span className="text-[11px] text-[#527564] font-semibold mt-1 block">Inspect Class Roster &rarr;</span>
            </div>

            <div
              onClick={() => setActiveTab('attendance')}
              className="p-5 rounded-2xl bg-white border border-[#DDD5F2]/70 shadow-xs hover:border-[#527564] cursor-pointer transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#687477] uppercase tracking-wider">Today's Attendance</span>
                <CalendarCheck className="w-4 h-4 text-[#527564]" />
              </div>
              <div className="text-3xl font-extrabold text-[#527564]">{stats.presentToday} <span className="text-sm font-normal text-[#687477]">Present</span></div>
              <span className="text-[11px] text-[#527564] font-semibold mt-1 block">Mark Roll Call &rarr;</span>
            </div>

            <div
              onClick={() => setActiveTab('assignments')}
              className="p-5 rounded-2xl bg-white border border-[#DDD5F2]/70 shadow-xs hover:border-[#527564] cursor-pointer transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#687477] uppercase tracking-wider">Submissions to Grade</span>
                <BookOpen className="w-4 h-4 text-[#F3BFA5]" />
              </div>
              <div className="text-3xl font-extrabold text-[#263238]">{stats.pendingAssignments}</div>
              <span className="text-[11px] text-[#A99AD9] font-semibold mt-1 block">Open Gradebook &rarr;</span>
            </div>

            <div
              onClick={() => setActiveTab('quizzes')}
              className="p-5 rounded-2xl bg-white border border-[#DDD5F2]/70 shadow-xs hover:border-[#527564] cursor-pointer transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#687477] uppercase tracking-wider">Scheduled Quizzes</span>
                <HelpCircle className="w-4 h-4 text-[#263238]" />
              </div>
              <div className="text-3xl font-extrabold text-[#263238]">{stats.upcomingQuizzes}</div>
              <span className="text-[11px] text-[#527564] font-semibold mt-1 block">Create Assessment &rarr;</span>
            </div>
          </div>

          {/* Courses Assigned */}
          <div className="rounded-3xl bg-white border border-[#DDD5F2] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#263238]">Active Teaching Modules</h2>
                <p className="text-xs text-[#687477]">Assigned by Executive Academic Council</p>
              </div>
              <button
                onClick={() => setActiveTab('assignments')}
                className="text-xs font-bold text-[#527564] hover:underline cursor-pointer"
              >
                Manage Coursework &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((c: any) => (
                <div key={c.id} className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#DDD5F2] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-[#DDD5F2]/50 text-[#7b69b8] font-mono text-xs font-bold">
                      {c.code}
                    </span>
                    <span className="text-xs font-semibold text-[#527564]">{c.durationWeeks} Weeks</span>
                  </div>
                  <h3 className="font-bold text-[#263238] text-base">{c.title}</h3>
                  <p className="text-xs text-[#687477] line-clamp-2">{c.description}</p>
                  <div className="pt-2 flex items-center justify-between border-t border-[#DDD5F2]/60 text-xs">
                    <span className="text-[#687477]">Active Cohorts Enrolled</span>
                    <button
                      onClick={() => setActiveTab('assignments')}
                      className="text-[#527564] font-bold hover:underline cursor-pointer"
                    >
                      Open Gradebook &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Attendance */}
      {activeTab === 'attendance' && <TeacherAttendanceView />}

      {/* Tab: Assignments */}
      {activeTab === 'assignments' && <TeacherAssignmentsView />}

      {/* Tab: Quizzes */}
      {activeTab === 'quizzes' && <TeacherQuizzesView />}

      {/* Tab: Students */}
      {activeTab === 'students' && <TeacherStudentsView />}

      {/* Tab: Broadcasts */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#263238]">Faculty Broadcasts to Students</h2>
            <button
              onClick={() => setIsAnnounceModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-bold cursor-pointer"
            >
              + Post Notice
            </button>
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="py-12 text-center text-[#687477] text-xs">
                No active announcements published.
              </div>
            ) : announcements.map((a) => (
              <div key={a.id} className="p-5 rounded-3xl bg-white border border-[#DDD5F2] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EBF2ED] text-[#527564] text-[10px] font-bold">
                    Target: {a.targetRole || 'ALL'}
                  </span>
                  <span className="text-[11px] text-[#687477] font-mono">
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#263238]">{a.title}</h3>
                <p className="text-xs text-[#687477] leading-relaxed">{a.content || a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Post Announcement */}
      {isAnnounceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-[#DDD5F2] p-6 sm:p-8 space-y-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#263238]">Broadcast Notice to Students</h2>
            <form onSubmit={handlePostAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#263238] mb-1">Subject / Headline *</label>
                <input
                  required
                  type="text"
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  placeholder="e.g. Lab 03 Submission Deadline Extended"
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#263238] mb-1">Target Audience *</label>
                <select
                  value={targetType}
                  onChange={(e) => {
                    setTargetType(e.target.value);
                    setTargetCourseId('');
                    setTargetBatchId('');
                    setTargetStudentId('');
                  }}
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] bg-white focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                >
                  <option value="ALL_MY_STUDENTS">🎓 All My Assigned Students</option>
                  <option value="BATCH">👥 Specific Assigned Batch / Cohort</option>
                  <option value="COURSE">📚 Specific Assigned Course</option>
                  <option value="INDIVIDUAL_STUDENT">👤 Individual Student</option>
                </select>
              </div>

              {/* Batch Selector */}
              {targetType === 'BATCH' && (
                <div className="animate-in fade-in duration-200">
                  <label className="block font-bold text-[#263238] mb-1">Select Batch *</label>
                  <select
                    required
                    value={targetBatchId}
                    onChange={(e) => setTargetBatchId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#8FAF9A] bg-emerald-50/30 focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  >
                    <option value="">-- Choose Batch --</option>
                    {teacherBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.courseTitle})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Course Selector */}
              {targetType === 'COURSE' && (
                <div className="animate-in fade-in duration-200">
                  <label className="block font-bold text-[#263238] mb-1">Select Course *</label>
                  <select
                    required
                    value={targetCourseId}
                    onChange={(e) => setTargetCourseId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#8FAF9A] bg-emerald-50/30 focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  >
                    <option value="">-- Choose Course --</option>
                    {Array.from(
                      new Map(teacherCourses.map((c) => [c.courseId, c])).values()
                    ).map((c: any) => (
                      <option key={c.courseId} value={c.courseId}>
                        {c.courseCode} - {c.courseTitle}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Individual Student Selector */}
              {targetType === 'INDIVIDUAL_STUDENT' && (
                <div className="animate-in fade-in duration-200">
                  <label className="block font-bold text-[#263238] mb-1">Select Student *</label>
                  <select
                    required
                    value={targetStudentId}
                    onChange={(e) => setTargetStudentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#8FAF9A] bg-emerald-50/30 focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  >
                    <option value="">-- Choose Student --</option>
                    {teacherStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.code} / Roll: {s.roll})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#263238] mb-1">Announcement Message *</label>
                <textarea
                  required
                  rows={4}
                  value={announceMessage}
                  onChange={(e) => setAnnounceMessage(e.target.value)}
                  placeholder="Message content for student cohorts..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAnnounceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DDD5F2] text-[#687477] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPosting}
                  className="px-5 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isPosting ? 'Broadcasting...' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
