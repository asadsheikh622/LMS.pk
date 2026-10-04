export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';

export interface UserSession {
  id: number;
  uid: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  studentId?: string;
  teacherCode?: string;
}

export type StudentLifecycleStatus = 'PENDING_ACTIVATION' | 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'DROPPED_OUT' | 'GRADUATED';

export interface StudentProfile {
  id: number;
  userId: number | null;
  studentId: string;
  rollNumber: string;
  fullName: string;
  fatherName: string;
  phone: string;
  email: string;
  cnic?: string | null;
  campus: string;
  city: string;
  status: StudentLifecycleStatus;
  isActivated: boolean;
  admissionDate: string;
  dropoutDate?: string | null;
  dropoutReason?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt?: string;
  // Enrolled course & batch info
  courseId?: number | null;
  courseTitle?: string;
  courseCode?: string;
  batchId?: number | null;
  batchNumber?: string;
  batchName?: string;
  enrollmentStatus?: string;
}

export interface TeacherProfile {
  id: number;
  userId: number;
  teacherCode: string;
  fullName: string;
  email: string;
  qualification?: string | null;
  specialization?: string | null;
  bio?: string | null;
  joiningDate: string;
}

export interface AdminProfile {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  designation: string;
  department: string;
  canManageAdmins: boolean;
}

export interface Course {
  id: number;
  code: string;
  title: string;
  description: string | null;
  durationWeeks: number;
  level: string;
  syllabus: string | null;
  isActive: boolean;
}

export interface Batch {
  id: number;
  courseId: number;
  batchNumber: string;
  name: string;
  campus: string;
  capacity: number;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  courseTitle?: string;
}

export interface AttendanceRecord {
  id: number;
  studentId: number;
  courseId: number;
  batchId: number;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'LATE';
  remarks?: string | null;
  studentName?: string;
  rollNumber?: string;
}

export interface AssignmentItem {
  id: number;
  courseId: number;
  batchId: number;
  teacherId: number;
  title: string;
  description: string;
  dueDate: string;
  totalMarks: number;
  instructions?: string | null;
  courseTitle?: string;
  submissionStatus?: 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED';
  obtainedMarks?: number | null;
  feedback?: string | null;
}

export interface QuizItem {
  id: number;
  courseId: number;
  batchId: number;
  teacherId: number;
  title: string;
  description?: string | null;
  durationMinutes: number;
  passingMarks: number;
  totalMarks: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  courseTitle?: string;
  questionCount?: number;
  attemptScore?: number | null;
  attemptPassed?: boolean | null;
}

export interface PaymentRecord {
  id: number;
  studentId: number;
  courseId: number;
  voucherId: string;
  month: string;
  amount: number;
  type: string;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paidDate?: string | null;
  receiptNumber?: string | null;
  courseTitle?: string;
  studentName?: string;
  rollNumber?: string;
}

export interface ScheduleItem {
  id: number;
  courseId: number;
  batchId: number;
  teacherId: number;
  courseTitle: string;
  teacherName?: string;
  batchNumber?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  campus: string;
}

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'ASSIGNMENT' | 'QUIZ' | 'PAYMENT' | 'ATTENDANCE' | 'ANNOUNCEMENT' | 'SYSTEM';
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AnnouncementItem {
  id: number;
  authorId: number;
  authorName?: string;
  title: string;
  content: string;
  targetRole?: UserRole | null;
  courseId?: number | null;
  courseTitle?: string;
  createdAt: string;
}

export interface QuizQuestionItem {
  id: number;
  quizId: number;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
}

export interface QuizAttemptItem {
  id: number;
  quizId: number;
  studentId: number;
  studentName?: string;
  rollNumber?: string;
  score: number;
  totalMarks: number;
  passed: boolean;
  completedAt: string;
}

export interface AssignmentSubmissionItem {
  id: number;
  assignmentId: number;
  studentId: number;
  studentName: string;
  rollNumber: string;
  content: string;
  attachmentUrl?: string | null;
  submittedAt: string;
  status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED';
  obtainedMarks?: number | null;
  teacherFeedback?: string | null;
  gradedAt?: string | null;
}

