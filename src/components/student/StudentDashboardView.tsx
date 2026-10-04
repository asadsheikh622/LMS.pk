import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import {
  GraduationCap, BookOpen, Calendar, Clock, Award, CheckCircle2,
  AlertCircle, CreditCard, FileText, ChevronRight, MapPin, User, LogOut,
  Upload, Check, X, Bell, Shield, CheckCheck, RefreshCw, Search
} from 'lucide-react';

interface StudentDashboardViewProps {
  onLogout: () => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ onLogout }) => {
  const { token, user } = useAuth();
  const {
    notifications,
    unreadCount,
    openNotification,
    markAsRead,
    markAllAsRead,
    refresh: refreshNotifications,
  } = useNotifications();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'notifications' | 'attendance' | 'assignments' | 'fees'>('overview');
  const [notifSearch, setNotifSearch] = useState('');

  // Interactive Modal: Submit Assignment Solution
  const [submittingAssignment, setSubmittingAssignment] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  // Interactive Modal: View Receipt / Pay Voucher
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Interactive Quiz Taking Modal
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [quizQuestionsList, setQuizQuestionsList] = useState<any[]>([]);
  const [quizUserAnswers, setQuizUserAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  const fetchDashboard = () => {
    if (!token) return;
    fetch('/api/student/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load dashboard records');
        return res.json();
      })
      .then((d) => setData(d))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  const handleLaunchQuiz = async (quiz: any) => {
    setActiveQuiz(quiz);
    setQuizScore(null);
    setQuizUserAnswers({});
    setIsLoadingQuestions(true);
    try {
      const res = await fetch(`/api/student/quizzes/${quiz.id}/start`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setQuizQuestionsList(d.questions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/student/assignments/${submittingAssignment.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: submissionText,
          attachmentUrl: submissionText.startsWith('http') ? submissionText : null,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setSubmitStatus('Assignment solution submitted successfully for faculty review.');
        setTimeout(() => {
          setSubmitStatus(null);
          setSubmittingAssignment(null);
          setSubmissionText('');
          fetchDashboard();
        }, 1500);
      } else {
        setSubmitStatus(d.error || 'Failed to submit solution');
      }
    } catch (err: any) {
      setSubmitStatus(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteQuiz = async (quiz: any) => {
    setIsTakingQuiz(true);
    try {
      const res = await fetch(`/api/student/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: quizUserAnswers,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setQuizScore(d.score !== undefined ? d.score : quiz.totalMarks);
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTakingQuiz(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#8FAF9A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#687477]">Loading your academic records...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl bg-white border border-red-200 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-xl font-bold text-[#263238]">Unable to load dashboard</h3>
        <p className="text-sm text-[#687477]">{error || 'No student profile record linked to this account.'}</p>
        <button
          onClick={onLogout}
          className="px-5 py-2.5 rounded-xl bg-[#527564] text-white text-sm font-semibold cursor-pointer"
        >
          Sign Out & Return
        </button>
      </div>
    );
  }

  const { student, activeCourse, stats, attendanceSummary, recentPayments, assignments, quizzes } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Banner */}
      <div className="rounded-3xl bg-white/90 border border-[#DDD5F2] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#EBF2ED] text-[#527564] flex items-center justify-center font-bold text-2xl shadow-xs">
            {student.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-[#263238] tracking-tight">
                {student.fullName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EBF2ED] text-[#527564] text-xs font-bold">
                Student
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#687477] mt-1 font-medium">
              <span>ID: <strong>{student.code}</strong></span>
              <span>•</span>
              <span>Roll: <strong>{student.roll}</strong></span>
              <span>•</span>
              <span>Father: <strong>{student.fatherName}</strong></span>
              <span>•</span>
              <span>Campus: <strong>{student.city}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#DDD5F2] hover:bg-[#FAF7F0] text-[#263238] text-xs font-semibold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#DDD5F2] pb-2 overflow-x-auto">
        {(['overview', 'notifications', 'attendance', 'assignments', 'fees'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition capitalize cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab
                ? 'bg-[#527564] text-white shadow-xs'
                : 'bg-white text-[#263238] hover:bg-[#FAF7F0] border border-[#DDD5F2]'
            }`}
          >
            {tab === 'notifications' ? (
              <>
                <Bell className="w-3.5 h-3.5" />
                <span>Announcements</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </>
            ) : (
              <span>{tab}</span>
            )}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Dedicated Campus Broadcasts & Notifications Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#DDD5F2] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#DDD5F2]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#8FAF9A]/20 text-[#527564] flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#263238]">Campus Broadcasts & Announcements</h2>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#687477]">
                    Official communications from faculty instructors and academy administration
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8FAF9A]/15 hover:bg-[#8FAF9A]/25 text-[#263238] text-xs font-semibold border border-[#8FAF9A]/30 transition cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-[#527564]" />
                    <span>Mark all as read</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('notifications')}
                  className="px-3.5 py-1.5 rounded-xl border border-[#DDD5F2] hover:bg-[#FAF7F0] text-xs font-semibold text-[#527564] transition cursor-pointer"
                >
                  View all ({notifications.length}) &rarr;
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2.5">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#687477] bg-[#FAF7F0]/40 rounded-2xl border border-dashed border-[#DDD5F2]">
                  No broadcasts received yet. When instructors or administration send announcements, they will appear here.
                </div>
              ) : (
                notifications.slice(0, 3).map((notif) => {
                  const isTeacher =
                    notif.senderRole?.toUpperCase().includes('TEACHER') ||
                    notif.senderRole?.toUpperCase().includes('FACULTY');
                  return (
                    <div
                      key={notif.id}
                      onClick={() => openNotification(notif)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 hover:shadow-xs ${
                        !notif.isRead
                          ? 'bg-gradient-to-r from-emerald-50/50 via-white to-white border-[#8FAF9A] ring-1 ring-[#8FAF9A]/20'
                          : 'bg-[#FAF7F0]/30 hover:bg-[#FAF7F0]/60 border-[#DDD5F2]/60'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 relative flex-shrink-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
                              !notif.isRead ? 'bg-[#8FAF9A] text-white' : 'bg-[#DDD5F2]/40 text-[#687477]'
                            }`}
                          >
                            <Bell className="w-4 h-4" />
                          </div>
                          {!notif.isRead && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                !notif.isRead ? 'bg-[#527564] text-white' : 'bg-[#DDD5F2]/40 text-[#687477]'
                              }`}
                            >
                              {notif.type}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-[#263238] font-semibold">
                              {isTeacher ? (
                                <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                              ) : (
                                <Shield className="w-3.5 h-3.5 text-[#527564]" />
                              )}
                              <span>{notif.senderName}</span>
                              <span className="text-[11px] font-normal text-[#687477]">
                                ({isTeacher ? 'Faculty' : 'Admin'})
                              </span>
                            </div>
                          </div>
                          <h4
                            className={`text-sm mt-1 leading-snug ${
                              !notif.isRead ? 'font-bold text-[#263238]' : 'font-semibold text-[#455A64]'
                            }`}
                          >
                            {notif.title}
                          </h4>
                          <p className="text-xs text-[#687477] line-clamp-2 mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
                        <span className="text-[11px] text-[#687477] whitespace-nowrap">
                          {new Date(notif.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-[11px] font-semibold text-[#527564] hover:underline">
                          Read notice &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setActiveTab('attendance')}
              className="p-5 rounded-2xl bg-white border border-[#DDD5F2]/70 shadow-xs hover:border-[#527564] cursor-pointer transition"
            >
              <span className="text-xs font-semibold text-[#687477] uppercase tracking-wider block mb-1">
                Attendance Standing
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#263238]">
                  {stats.attendancePercentage}%
                </span>
                <span className="text-xs font-bold text-[#527564]">Eligible</span>
              </div>
              <div className="w-full bg-[#FAF7F0] h-2 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#527564] h-full rounded-full" style={{ width: `${stats.attendancePercentage}%` }} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#DDD5F2]/70 shadow-xs">
              <span className="text-xs font-semibold text-[#687477] uppercase tracking-wider block mb-1">
                Syllabus Progression
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#263238]">
                  {stats.courseProgress}%
                </span>
                <span className="text-xs font-bold text-[#7b69b8]">Week 12</span>
              </div>
              <div className="w-full bg-[#FAF7F0] h-2 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#7b69b8] h-full rounded-full" style={{ width: `${stats.courseProgress}%` }} />
              </div>
            </div>

            <div
              onClick={() => setActiveTab('assignments')}
              className="p-5 rounded-2xl bg-white border border-[#DDD5F2]/70 shadow-xs hover:border-[#527564] cursor-pointer transition"
            >
              <span className="text-xs font-semibold text-[#687477] uppercase tracking-wider block mb-1">
                Assignments Handed In
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#263238]">
                  {stats.assignmentRatio}
                </span>
                <span className="text-xs font-bold text-[#F3BFA5]">Reviewed</span>
              </div>
              <div className="w-full bg-[#FAF7F0] h-2 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#F3BFA5] h-full rounded-full" style={{ width: '80%' }} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#DDD5F2]/70 shadow-xs">
              <span className="text-xs font-semibold text-[#687477] uppercase tracking-wider block mb-1">
                Average Quiz Score
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#263238]">
                  {stats.quizScorePercentage}%
                </span>
                <span className="text-xs font-bold text-[#527564]">Grade A</span>
              </div>
              <div className="w-full bg-[#FAF7F0] h-2 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#527564] h-full rounded-full" style={{ width: `${stats.quizScorePercentage}%` }} />
              </div>
            </div>
          </div>

          {/* Active Course Card */}
          {activeCourse ? (
            <div className="rounded-3xl bg-white border border-[#DDD5F2] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDD5F2]/50 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#527564] mb-1">
                    <span>Active Enrolled Course</span>
                    <span>•</span>
                    <span>{activeCourse.code}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#263238]">{activeCourse.title}</h2>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EBF2ED] text-[#527564] text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#527564] animate-pulse" />
                  <span>Batch {activeCourse.batch} &bull; Morning Cohort</span>
                </div>
              </div>

              {/* Weekly Timetable */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#263238] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#527564]" />
                  <span>Class Schedule (Lab 4, Level 2)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeCourse.schedule.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#FAF7F0] border border-[#DDD5F2]/60 flex items-center justify-between">
                      <div className="font-semibold text-xs text-[#263238]">{item.day}</div>
                      <div className="flex items-center gap-1.5 text-xs text-[#687477]">
                        <Clock className="w-3.5 h-3.5 text-[#527564]" />
                        <span>{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white text-center text-sm text-[#687477]">
              No active course enrollment found.
            </div>
          )}
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#EBF2ED] border border-[#8FAF9A]/30 text-center">
              <span className="text-xs font-semibold uppercase text-[#527564]">Present Days</span>
              <div className="text-3xl font-extrabold text-[#527564] mt-1">{attendanceSummary.present}</div>
            </div>
            <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-center">
              <span className="text-xs font-semibold uppercase text-red-700">Absent</span>
              <div className="text-3xl font-extrabold text-red-700 mt-1">{attendanceSummary.absent}</div>
            </div>
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <span className="text-xs font-semibold uppercase text-amber-700">Sanctioned Leave</span>
              <div className="text-3xl font-extrabold text-amber-700 mt-1">{attendanceSummary.leave}</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#DDD5F2] text-center">
              <span className="text-xs font-semibold uppercase text-[#687477]">Total Held</span>
              <div className="text-3xl font-extrabold text-[#263238] mt-1">{attendanceSummary.totalClasses}</div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#DDD5F2] p-6 text-sm">
            <h4 className="font-bold text-[#263238] mb-3">Attendance Audit Certification</h4>
            <p className="text-[#687477] text-xs leading-relaxed">
              Minimum 80% attendance is mandatory for semester end examination eligibility under the Academic Board regulations. Current attendance of <strong>{stats.attendancePercentage}%</strong> qualifies for honors standing.
            </p>
          </div>
        </div>
      )}

      {/* ASSIGNMENTS TAB */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white border border-[#DDD5F2] p-6 space-y-4">
            <h3 className="font-bold text-[#263238]">Active Course Assignments</h3>
            {assignments.length > 0 ? (
              <div className="space-y-3">
                {assignments.map((asgn: any) => (
                  <div key={asgn.id} className="p-4 rounded-xl bg-[#FAF7F0] border border-[#DDD5F2]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-[#263238]">{asgn.title}</h4>
                      <p className="text-xs text-[#687477] mt-0.5">{asgn.description}</p>
                      <div className="flex gap-3 text-[11px] text-[#527564] font-semibold mt-1">
                        <span>Total Marks: {asgn.totalMarks}</span>
                        <span>•</span>
                        <span>Due: {asgn.dueDate}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSubmittingAssignment(asgn)}
                      className="px-4 py-2 rounded-xl bg-[#527564] text-white text-xs font-semibold hover:bg-[#3f5a4d] transition self-start sm:self-auto cursor-pointer shadow-xs"
                    >
                      Submit Solution
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#687477]">No pending assignments at this time.</p>
            )}
          </div>

          <div className="rounded-3xl bg-white border border-[#DDD5F2] p-6 space-y-4">
            <h3 className="font-bold text-[#263238]">Online Quizzes</h3>
            {quizzes.length > 0 ? (
              <div className="space-y-3">
                {quizzes.map((quiz: any) => (
                  <div key={quiz.id} className="p-4 rounded-xl bg-[#F4F1FB] border border-[#DDD5F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-[#263238]">{quiz.title}</h4>
                      <p className="text-xs text-[#687477] mt-0.5">{quiz.description}</p>
                      <div className="flex gap-3 text-[11px] text-[#7b69b8] font-semibold mt-1">
                        <span>Duration: {quiz.durationMinutes} mins</span>
                        <span>•</span>
                        <span>Total Marks: {quiz.totalMarks}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLaunchQuiz(quiz)}
                      className="px-4 py-2 rounded-xl bg-[#263238] text-white text-xs font-semibold hover:bg-[#1a2327] transition self-start sm:self-auto cursor-pointer shadow-xs"
                    >
                      Launch Quiz
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#687477]">No quizzes scheduled today.</p>
            )}
          </div>
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#DDD5F2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-[#263238]">Campus Broadcasts & Notices</h3>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-xs text-[#687477] mt-1">
                Official announcements targeted to your enrolled courses, cohorts, and student account
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refreshNotifications()}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#DDD5F2] text-xs font-semibold text-[#687477] hover:text-[#263238] hover:bg-[#FAF7F0] transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8FAF9A]/20 hover:bg-[#8FAF9A]/30 border border-[#8FAF9A]/40 text-[#263238] text-xs font-semibold transition cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-[#527564]" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#687477] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={notifSearch}
              onChange={(e) => setNotifSearch(e.target.value)}
              placeholder="Filter announcements by title, content, or instructor..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#DDD5F2] bg-white text-xs text-[#263238] placeholder:text-[#687477] focus:outline-none focus:ring-2 focus:ring-[#8FAF9A]"
            />
          </div>

          {/* List */}
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#DDD5F2] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#8FAF9A]/20 text-[#527564] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#263238]">No Broadcasts Yet</h4>
                <p className="text-xs text-[#687477] max-w-sm mx-auto">
                  Your campus instructors and academic office have not sent any announcements yet.
                </p>
              </div>
            ) : (
              notifications
                .filter((n) => {
                  if (!notifSearch.trim()) return true;
                  const q = notifSearch.toLowerCase();
                  return (
                    n.title.toLowerCase().includes(q) ||
                    n.message.toLowerCase().includes(q) ||
                    (n.senderName || '').toLowerCase().includes(q)
                  );
                })
                .map((notif) => {
                  const isTeacher =
                    notif.senderRole?.toUpperCase().includes('TEACHER') ||
                    notif.senderRole?.toUpperCase().includes('FACULTY');
                  return (
                    <div
                      key={notif.id}
                      onClick={() => openNotification(notif)}
                      className={`group bg-white rounded-3xl p-5 border transition-all cursor-pointer shadow-xs hover:shadow-sm ${
                        !notif.isRead
                          ? 'border-[#8FAF9A] bg-gradient-to-r from-emerald-50/40 via-white to-white ring-1 ring-[#8FAF9A]/30'
                          : 'border-[#DDD5F2]/70 hover:border-[#8FAF9A]/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative flex-shrink-0">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                              !notif.isRead
                                ? 'bg-[#8FAF9A] text-white shadow-xs'
                                : 'bg-[#DDD5F2]/30 text-[#687477]'
                            }`}
                          >
                            <Bell className="w-5 h-5" />
                          </div>
                          {!notif.isRead && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 ring-2 ring-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                  !notif.isRead
                                    ? 'bg-[#527564] text-white'
                                    : 'bg-[#DDD5F2]/40 text-[#687477]'
                                }`}
                              >
                                {notif.type}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs text-[#263238] font-semibold">
                                {isTeacher ? (
                                  <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                                ) : (
                                  <Shield className="w-3.5 h-3.5 text-[#527564]" />
                                )}
                                <span>{notif.senderName}</span>
                                <span className="text-[11px] font-normal text-[#687477]">
                                  ({isTeacher ? 'Faculty' : 'Admin'})
                                </span>
                              </div>
                            </div>

                            <span className="text-[11px] text-[#687477]">
                              {new Date(notif.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <h4
                            className={`text-base leading-snug ${
                              !notif.isRead ? 'font-bold text-[#263238]' : 'font-semibold text-[#455A64]'
                            }`}
                          >
                            {notif.title}
                          </h4>

                          <p className="text-xs text-[#687477] leading-relaxed whitespace-pre-line">
                            {notif.message}
                          </p>

                          <div className="pt-2 flex items-center justify-between text-xs">
                            <span className="text-[#527564] font-medium group-hover:underline">
                              Open detail view &rarr;
                            </span>
                            {!notif.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notif.id);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#FAF7F0] border border-[#DDD5F2] text-[11px] font-semibold text-[#527564] hover:bg-[#8FAF9A]/20 transition cursor-pointer"
                              >
                                Mark as Read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* FEES TAB */}
      {activeTab === 'fees' && (
        <div className="rounded-3xl bg-white border border-[#DDD5F2] p-6 space-y-4">
          <h3 className="font-bold text-[#263238]">Fee Vouchers & Payment History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#DDD5F2] text-[#687477] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Voucher #</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD5F2]/50">
                {recentPayments.map((pay: any) => (
                  <tr key={pay.id} className="hover:bg-[#FAF7F0]/60 transition">
                    <td className="py-3.5 px-3 font-mono font-semibold">{pay.voucherId}</td>
                    <td className="py-3.5 px-3">{pay.month} - {pay.type}</td>
                    <td className="py-3.5 px-3">{pay.dueDate}</td>
                    <td className="py-3.5 px-3 font-bold">Rs. {pay.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        pay.status === 'PAID' ? 'bg-[#EBF2ED] text-[#527564]' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {pay.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedReceipt(pay)}
                        className="text-[#527564] hover:underline font-semibold cursor-pointer"
                      >
                        View Receipt / Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Submit Solution */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-[#DDD5F2] p-6 sm:p-8 space-y-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#263238]">Submit Assignment Solution</h2>
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#DDD5F2] text-xs space-y-1">
              <span className="font-bold text-[#263238] block">{submittingAssignment.title}</span>
              <span className="text-[#687477]">{submittingAssignment.description}</span>
            </div>

            {submitStatus && (
              <div className="p-3 rounded-xl bg-[#EBF2ED] text-[#527564] text-xs font-semibold">
                {submitStatus}
              </div>
            )}

            <form onSubmit={handleSubmitSolution} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#263238] mb-1">
                  GitHub Repository / Documentation Link or Answer Text *
                </label>
                <textarea
                  required
                  rows={4}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Paste GitHub repository URL, deployment URL, or write your solution..."
                  className="w-full p-3 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmittingAssignment(null)}
                  className="px-4 py-2 rounded-xl border border-[#DDD5F2] text-[#687477] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white font-bold cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting ? 'Uploading...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Receipt / Invoice */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-[#DDD5F2] p-6 sm:p-8 space-y-6 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-[#DDD5F2] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#263238]">Fee Voucher Invoice</h3>
                <span className="font-mono text-[#527564]">{selectedReceipt.voucherId}</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                selectedReceipt.status === 'PAID' ? 'bg-[#EBF2ED] text-[#527564]' : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedReceipt.status}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-[#DDD5F2]/40">
                <span className="text-[#687477]">Student Name:</span>
                <span className="font-bold text-[#263238]">{student.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDD5F2]/40">
                <span className="text-[#687477]">Student ID:</span>
                <span className="font-mono font-bold text-[#527564]">{student.code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDD5F2]/40">
                <span className="text-[#687477]">Billing Cycle:</span>
                <span className="font-semibold text-[#263238]">{selectedReceipt.month}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDD5F2]/40">
                <span className="text-[#687477]">Fee Description:</span>
                <span className="font-semibold text-[#263238]">{selectedReceipt.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDD5F2]/40">
                <span className="text-[#687477]">Due Date:</span>
                <span className="font-semibold text-[#263238]">{selectedReceipt.dueDate}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-bold text-[#263238]">
                <span>Total Payable:</span>
                <span>PKR {selectedReceipt.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#DDD5F2] text-[11px] text-[#687477]">
              Fee vouchers can be paid through Habib Bank Limited (HBL) or campus accounts office. Keep this invoice for institutional verification.
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-5 py-2.5 rounded-xl bg-[#263238] text-white font-bold cursor-pointer"
              >
                Close Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Interactive Quiz */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-[#DDD5F2] p-6 sm:p-8 space-y-6 shadow-xl text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#263238]">{activeQuiz.title}</h3>
                <span className="text-[#687477]">{activeQuiz.durationMinutes} Minutes &bull; {activeQuiz.totalMarks} Marks</span>
              </div>
              <button
                onClick={() => { setActiveQuiz(null); setQuizScore(null); }}
                className="px-3 py-1 rounded-lg border border-[#DDD5F2] cursor-pointer"
              >
                Close
              </button>
            </div>

            {quizScore !== null ? (
              <div className="p-6 rounded-2xl bg-[#EBF2ED] text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#527564] mx-auto" />
                <h4 className="text-lg font-bold text-[#263238]">Assessment Complete!</h4>
                <p className="text-xs text-[#527564] font-bold">
                  Score: {quizScore} / {activeQuiz.totalMarks} Marks Recorded
                </p>
                <button
                  onClick={() => { setActiveQuiz(null); setQuizScore(null); }}
                  className="px-4 py-2 rounded-xl bg-[#527564] text-white font-bold cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : isLoadingQuestions ? (
              <div className="py-12 text-center text-[#687477]">
                <div className="w-6 h-6 border-2 border-[#527564] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Preparing assessment questions...</span>
              </div>
            ) : quizQuestionsList.length === 0 ? (
              <div className="space-y-4">
                <p className="text-[#687477] py-4 text-center">
                  This assessment does not contain pre-set MCQ questions or is an in-class evaluation. Click below to submit your attempt.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleCompleteQuiz(activeQuiz)}
                    disabled={isTakingQuiz}
                    className="px-5 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white font-bold cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isTakingQuiz ? 'Recording...' : 'Mark Quiz Attempted'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {quizQuestionsList.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#DDD5F2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#263238] block">Question {idx + 1} of {quizQuestionsList.length}</span>
                      <span className="text-[10px] font-mono text-[#527564]">{q.marks} Marks</span>
                    </div>
                    <p className="text-[#263238] font-medium">{q.questionText}</p>
                    <div className="space-y-1.5 pt-1">
                      {Array.isArray(q.options) && q.options.map((opt: string, optIdx: number) => {
                        const isSelected = quizUserAnswers[q.id] === optIdx;
                        return (
                          <label
                            key={optIdx}
                            onClick={() => {
                              setQuizUserAnswers(prev => ({ ...prev, [q.id]: optIdx }));
                            }}
                            className={`flex items-center gap-2.5 p-2 rounded-xl border transition cursor-pointer ${
                              isSelected
                                ? 'bg-white border-[#527564] shadow-xs'
                                : 'bg-transparent border-transparent hover:bg-white hover:border-[#DDD5F2]'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`quiz-q-${q.id}`}
                              checked={isSelected}
                              onChange={() => {}}
                              className="accent-[#527564]"
                            />
                            <span className={isSelected ? 'font-bold text-[#263238]' : 'text-[#687477]'}>
                              {opt}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleCompleteQuiz(activeQuiz)}
                    disabled={isTakingQuiz}
                    className="px-5 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white font-bold cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isTakingQuiz ? 'Submitting Answers...' : 'Submit Assessment'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
