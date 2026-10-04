import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  MoreVertical,
  Eye,
  Edit3,
  UserX,
  KeyRound,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  XCircle,
  Check,
  Building,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { StudentProfile, StudentLifecycleStatus } from '../../types.ts';
import { AddStudentModal } from './AddStudentModal.tsx';
import { EditStudentModal } from './EditStudentModal.tsx';
import { ViewStudentModal } from './ViewStudentModal.tsx';
import { DropoutConfirmModal } from './DropoutConfirmModal.tsx';
import { ChangeStatusModal } from './ChangeStatusModal.tsx';
import { ResetActivationModal } from './ResetActivationModal.tsx';

export const AdminStudentsView: React.FC = () => {
  const { token, user } = useAuth();

  // Data states
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [courses, setCourses] = useState<{ id: number; code: string; title: string }[]>([]);
  const [batches, setBatches] = useState<{ id: number; courseId: number; batchNumber: string; name: string; campus: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters & Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [batchFilter, setBatchFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
  });

  // Modal active states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDropoutOpen, setIsDropoutOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Selected student for modals
  const [activeStudent, setActiveStudent] = useState<StudentProfile | null>(null);
  const [viewStudentId, setViewStudentId] = useState<number | null>(null);

  // Dropdown open menu track
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  // Fetch courses and batches once on mount
  useEffect(() => {
    if (!token) return;

    fetch('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.courses) {
          setCourses(data.courses.map((c: any) => ({ id: c.id, code: c.code, title: c.title })));
        }
        if (data.batches) {
          setBatches(data.batches);
        }
      })
      .catch((err) => console.error('Failed to load courses/batches metadata:', err));
  }, [token]);

  // Load students query
  const loadStudents = useCallback(() => {
    if (!token) return;
    setIsLoading(true);

    const params = new URLSearchParams();
    params.set('page', currentPage.toString());
    params.set('limit', pageSize.toString());
    if (searchQuery.trim()) params.set('query', searchQuery.trim());
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (courseFilter !== 'ALL') params.set('courseId', courseFilter);
    if (batchFilter !== 'ALL') params.set('batchId', batchFilter);

    fetch(`/api/admin/students?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to retrieve student registry.');
        return res.json();
      })
      .then((data) => {
        setStudents(data.students || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      })
      .catch((err) => {
        setFeedback({ type: 'error', message: err.message || 'Error loading students.' });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token, currentPage, pageSize, searchQuery, statusFilter, courseFilter, batchFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadStudents]);

  // Handle feedback auto-dismiss
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Helper for status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF2ED] text-[#527564] border border-[#8FAF9A]/40">
            Active
          </span>
        );
      case 'PENDING_ACTIVATION':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Pending Activation
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            On Leave
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            Suspended
          </span>
        );
      case 'DROPPED_OUT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-200 text-zinc-700 border border-zinc-300">
            Dropped Out
          </span>
        );
      case 'GRADUATED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Graduated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const handleActionSuccess = (msg: string) => {
    setFeedback({ type: 'success', message: msg });
    loadStudents();
  };

  const startRecordIndex = (pagination.page - 1) * pagination.limit + 1;
  const endRecordIndex = Math.min(pagination.page * pagination.limit, pagination.totalCount);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#687477] mb-1">
            <span>Administration</span>
            <span>/</span>
            <span className="text-[#527564]">Student Management</span>
          </div>
          <h1 className="text-2xl font-black text-[#263238] tracking-tight">Academic Student Registry</h1>
          <p className="text-xs text-[#687477] mt-0.5">
            Manage admissions, lifecycle status, cohort enrollments, verification credentials, and academic dossiers.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Admit New Student</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold border transition ${
            feedback.type === 'success'
              ? 'bg-[#EBF2ED] text-[#527564] border-[#8FAF9A]'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#527564]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-[#263238] cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Controls Bar */}
      <div className="bg-white rounded-3xl p-5 border border-[#DDD5F2] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#687477]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by ID, Roll #, Name, Phone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#DDD5F2] text-xs font-medium text-[#263238] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#527564] bg-[#FAF7F0]/30"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564] bg-white cursor-pointer"
            >
              <option value="ALL">All Lifecycle Statuses</option>
              <option value="ACTIVE">Active Students</option>
              <option value="PENDING_ACTIVATION">Pending Activation</option>
              <option value="ON_LEAVE">On Academic Leave</option>
              <option value="SUSPENDED">Suspended Accounts</option>
              <option value="DROPPED_OUT">Dropped Out</option>
              <option value="GRADUATED">Graduated Alumni</option>
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564] bg-white cursor-pointer"
            >
              <option value="ALL">All Academic Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <select
              value={batchFilter}
              onChange={(e) => {
                setBatchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DDD5F2] text-xs font-medium text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#527564] bg-white cursor-pointer"
            >
              <option value="ALL">All Cohort Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id.toString()}>
                  {b.batchNumber}: {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subheader summary & Page size */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#687477] pt-2 border-t border-gray-100">
          <div>
            {pagination.totalCount > 0 ? (
              <span>
                Showing <strong className="text-[#263238]">{startRecordIndex}</strong> -{' '}
                <strong className="text-[#263238]">{endRecordIndex}</strong> of{' '}
                <strong className="text-[#263238]">{pagination.totalCount}</strong> students registered
              </span>
            ) : (
              <span>No matching student records</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-xl border border-[#DDD5F2] text-xs font-semibold text-[#263238] bg-white cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Student Registry Table */}
      <div className="bg-white rounded-3xl border border-[#DDD5F2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF7F0] border-b border-[#DDD5F2] text-[11px] font-bold text-[#687477] uppercase tracking-wider">
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Roll Number</th>
                <th className="py-3.5 px-4">Full Name & Contact</th>
                <th className="py-3.5 px-4">Father Name</th>
                <th className="py-3.5 px-4">Course & Batch</th>
                <th className="py-3.5 px-4">Lifecycle Status</th>
                <th className="py-3.5 px-4">Account Access</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD5F2]/50 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[#687477]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#527564] border-t-transparent rounded-full animate-spin" />
                      <span className="font-semibold">Retrieving verified academic records...</span>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[#687477]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <GraduationCap className="w-10 h-10 text-gray-300" />
                      <p className="font-bold text-sm text-[#263238]">No Students Found</p>
                      <p className="text-xs max-w-sm text-[#687477]">
                        {searchQuery
                          ? `No student matching "${searchQuery}" was located. Try adjusting your query or active filters.`
                          : 'No students currently exist matching the active filter criteria.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((stu) => (
                  <tr key={stu.id} className="hover:bg-[#FAF7F0]/60 transition group">
                    {/* Student ID */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-[#527564] bg-[#EBF2ED] px-2.5 py-1 rounded-lg">
                        {stu.studentId}
                      </span>
                    </td>

                    {/* Roll Number */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-[#263238]">
                        {stu.rollNumber}
                      </span>
                    </td>

                    {/* Full Name & Phone/Email */}
                    <td className="py-3.5 px-4">
                      <div>
                        <button
                          onClick={() => {
                            setViewStudentId(stu.id);
                            setIsViewOpen(true);
                          }}
                          className="font-bold text-[#263238] hover:text-[#527564] transition text-left cursor-pointer"
                        >
                          {stu.fullName}
                        </button>
                        <div className="text-[11px] text-[#687477] font-medium mt-0.5">
                          {stu.phone} {stu.email && `• ${stu.email}`}
                        </div>
                      </div>
                    </td>

                    {/* Father Name */}
                    <td className="py-3.5 px-4 text-[#263238] font-medium">
                      {stu.fatherName}
                    </td>

                    {/* Course & Batch */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-semibold text-[#263238]">
                        {stu.courseCode ? `${stu.courseCode} - ${stu.courseTitle}` : 'Course Assigned'}
                      </div>
                      <div className="text-[11px] text-[#687477]">
                        {stu.batchNumber ? `${stu.batchNumber} (${stu.batchName || stu.campus})` : stu.campus}
                      </div>
                    </td>

                    {/* Lifecycle Status */}
                    <td className="py-3.5 px-4">
                      {renderStatusBadge(stu.status)}
                    </td>

                    {/* Account Status */}
                    <td className="py-3.5 px-4">
                      {stu.isActivated ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#527564]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Activated</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending OTP</span>
                        </span>
                      )}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3.5 px-4 text-right relative">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="View Academic Dossier"
                          onClick={() => {
                            setViewStudentId(stu.id);
                            setIsViewOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-[#687477] hover:text-[#263238] hover:bg-[#DDD5F2]/40 transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          title="Edit Student Record"
                          onClick={() => {
                            setActiveStudent(stu);
                            setIsEditOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-[#687477] hover:text-[#527564] hover:bg-[#EBF2ED] transition cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenActionMenuId(openActionMenuId === stu.id ? null : stu.id)
                            }
                            className="p-1.5 rounded-lg text-[#687477] hover:text-[#263238] hover:bg-gray-100 transition cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Action Dropdown Menu */}
                          {openActionMenuId === stu.id && (
                            <>
                              <div
                                className="fixed inset-0 z-20"
                                onClick={() => setOpenActionMenuId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-[#DDD5F2] py-2 z-30 text-left animate-in fade-in zoom-in-95 duration-150">
                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setViewStudentId(stu.id);
                                    setIsViewOpen(true);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-[#263238] hover:bg-[#FAF7F0] flex items-center gap-2 font-medium cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#527564]" />
                                  <span>View Profile Dossier</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setActiveStudent(stu);
                                    setIsEditOpen(true);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-[#263238] hover:bg-[#FAF7F0] flex items-center gap-2 font-medium cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-[#7B69B8]" />
                                  <span>Edit Academic Record</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setActiveStudent(stu);
                                    setIsStatusOpen(true);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-[#263238] hover:bg-[#FAF7F0] flex items-center gap-2 font-medium cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Change Status</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setActiveStudent(stu);
                                    setIsResetOpen(true);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-[#263238] hover:bg-[#FAF7F0] flex items-center gap-2 font-medium cursor-pointer"
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Reset Activation</span>
                                </button>

                                <div className="border-t border-gray-100 my-1" />

                                {stu.status !== 'DROPPED_OUT' && (
                                  <button
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      setActiveStudent(stu);
                                      setIsDropoutOpen(true);
                                    }}
                                    className="w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium cursor-pointer"
                                  >
                                    <UserX className="w-3.5 h-3.5 text-red-600" />
                                    <span>Drop Out Student</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Real Pagination Footer */}
        <div className="p-4 bg-[#FAF7F0]/60 border-t border-[#DDD5F2] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#687477]">
            Page <strong className="text-[#263238]">{pagination.page}</strong> of{' '}
            <strong className="text-[#263238]">{pagination.totalPages || 1}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#DDD5F2] text-xs font-semibold text-[#263238] hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {/* Page number pill buttons */}
            {Array.from({ length: pagination.totalPages || 1 }, (_, i) => i + 1)
              .filter((p) => {
                // Show first, last, and current +/- 1
                return (
                  p === 1 ||
                  p === pagination.totalPages ||
                  Math.abs(p - pagination.page) <= 1
                );
              })
              .map((pageNum, idx, arr) => {
                const prev = arr[idx - 1];
                const hasGap = prev && pageNum - prev > 1;

                return (
                  <React.Fragment key={pageNum}>
                    {hasGap && <span className="px-1 text-xs text-gray-400">...</span>}
                    <button
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                        pagination.page === pageNum
                          ? 'bg-[#527564] text-white shadow-xs'
                          : 'bg-white border border-[#DDD5F2] text-[#263238] hover:bg-[#FAF7F0]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#DDD5F2] text-xs font-semibold text-[#263238] hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddStudentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleActionSuccess}
        courses={courses}
        batches={batches}
      />

      <EditStudentModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setActiveStudent(null);
        }}
        onSuccess={handleActionSuccess}
        student={activeStudent}
        courses={courses}
        batches={batches}
      />

      <ViewStudentModal
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setViewStudentId(null);
        }}
        studentId={viewStudentId}
        onEditRequested={(stu) => {
          setActiveStudent(stu);
          setIsEditOpen(true);
        }}
      />

      <DropoutConfirmModal
        isOpen={isDropoutOpen}
        onClose={() => {
          setIsDropoutOpen(false);
          setActiveStudent(null);
        }}
        onSuccess={handleActionSuccess}
        student={activeStudent}
      />

      <ChangeStatusModal
        isOpen={isStatusOpen}
        onClose={() => {
          setIsStatusOpen(false);
          setActiveStudent(null);
        }}
        onSuccess={handleActionSuccess}
        student={activeStudent}
      />

      <ResetActivationModal
        isOpen={isResetOpen}
        onClose={() => {
          setIsResetOpen(false);
          setActiveStudent(null);
        }}
        onSuccess={handleActionSuccess}
        student={activeStudent}
      />
    </div>
  );
};
