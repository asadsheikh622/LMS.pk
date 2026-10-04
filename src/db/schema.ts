import { pgTable, serial, text, timestamp, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Role Enum
export const userRoleEnum = pgEnum('user_role', ['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN']);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['ENROLLED', 'COMPLETED', 'DROPPED', 'SUSPENDED']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['PRESENT', 'ABSENT', 'LEAVE', 'LATE']);
export const submissionStatusEnum = pgEnum('submission_status', ['PENDING', 'SUBMITTED', 'LATE', 'GRADED']);
export const quizStatusEnum = pgEnum('quiz_status', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const paymentStatusEnum = pgEnum('payment_status', ['PAID', 'PENDING', 'OVERDUE']);
export const notificationTypeEnum = pgEnum('notification_type', ['ASSIGNMENT', 'QUIZ', 'PAYMENT', 'ATTENDANCE', 'ANNOUNCEMENT', 'SYSTEM']);

// Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Unique identifier or Firebase UID
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // For credentials-based login
  role: userRoleEnum('role').default('STUDENT').notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  isActive: boolean('is_active').default(true).notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Admin Profiles
export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  designation: text('designation').default('Academic Administrator').notNull(),
  department: text('department').default('Academic Operations').notNull(),
  canManageAdmins: boolean('can_manage_admins').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Teacher Profiles
export const teachers = pgTable('teachers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  teacherCode: text('teacher_code').notNull().unique(),
  qualification: text('qualification'),
  specialization: text('specialization'),
  bio: text('bio'),
  joiningDate: timestamp('joining_date').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Student Profiles
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  studentId: text('student_id').notNull().unique(), // Academy Student ID (e.g. STU-2026-001)
  rollNumber: text('roll_number').notNull().unique(),
  fullName: text('full_name').notNull(),
  fatherName: text('father_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  cnic: text('cnic'),
  campus: text('campus').default('Main IT Campus').notNull(),
  city: text('city').default('Karachi').notNull(),
  isActivated: boolean('is_activated').default(false).notNull(),
  status: text('status').default('PENDING_ACTIVATION').notNull(), // PENDING_ACTIVATION, ACTIVE, ON_LEAVE, SUSPENDED, DROPPED_OUT, GRADUATED
  admissionDate: timestamp('admission_date').defaultNow().notNull(),
  dropoutDate: timestamp('dropout_date'),
  dropoutReason: text('dropout_reason'),
  updatedBy: text('updated_by'),
  activationOtp: text('activation_otp'),
  otpExpiresAt: timestamp('otp_expires_at'),
  otpAttempts: integer('otp_attempts').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Courses Table
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  durationWeeks: integer('duration_weeks').default(16).notNull(),
  level: text('level').default('Intermediate').notNull(),
  syllabus: text('syllabus'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Batches Table
export const batches = pgTable('batches', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  batchNumber: text('batch_number').notNull(), // e.g. "Batch 20"
  name: text('name').notNull(),
  campus: text('campus').default('Main Campus').notNull(),
  capacity: integer('capacity').default(40).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Teacher to Batch/Course Assignment
export const teacherAssignments = pgTable('teacher_assignments', {
  id: serial('id').primaryKey(),
  teacherId: integer('teacher_id').references(() => teachers.id, { onDelete: 'cascade' }).notNull(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  batchId: integer('batch_id').references(() => batches.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Enrollments Table
export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  batchId: integer('batch_id').references(() => batches.id, { onDelete: 'cascade' }).notNull(),
  status: enrollmentStatusEnum('status').default('ENROLLED').notNull(),
  progressPercentage: integer('progress_percentage').default(0).notNull(),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
});

// Attendance Table
export const attendances = pgTable('attendances', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  batchId: integer('batch_id').references(() => batches.id, { onDelete: 'cascade' }).notNull(),
  teacherId: integer('teacher_id').references(() => teachers.id),
  date: text('date').notNull(), // YYYY-MM-DD
  status: attendanceStatusEnum('status').notNull(),
  remarks: text('remarks'),
  markedAt: timestamp('marked_at').defaultNow().notNull(),
});

// Assignments Table
export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  batchId: integer('batch_id').references(() => batches.id, { onDelete: 'cascade' }).notNull(),
  teacherId: integer('teacher_id').references(() => teachers.id).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  dueDate: timestamp('due_date').notNull(),
  totalMarks: integer('total_marks').default(100).notNull(),
  instructions: text('instructions'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Assignment Submissions
export const assignmentSubmissions = pgTable('assignment_submissions', {
  id: serial('id').primaryKey(),
  assignmentId: integer('assignment_id').references(() => assignments.id, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  attachmentUrl: text('attachment_url'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  status: submissionStatusEnum('status').default('SUBMITTED').notNull(),
  obtainedMarks: integer('obtained_marks'),
  teacherFeedback: text('teacher_feedback'),
  gradedAt: timestamp('graded_at'),
});

// Quizzes Table
export const quizzes = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  batchId: integer('batch_id').references(() => batches.id, { onDelete: 'cascade' }).notNull(),
  teacherId: integer('teacher_id').references(() => teachers.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').default(30).notNull(),
  passingMarks: integer('passing_marks').default(60).notNull(),
  totalMarks: integer('total_marks').default(100).notNull(),
  status: quizStatusEnum('status').default('PUBLISHED').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Quiz Questions Table
export const quizQuestions = pgTable('quiz_questions', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
  questionText: text('question_text').notNull(),
  options: jsonb('options').$type<string[]>().notNull(), // Array of options
  correctOptionIndex: integer('correct_option_index').notNull(),
  marks: integer('marks').default(10).notNull(),
});

// Quiz Attempts Table
export const quizAttempts = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').notNull(),
  totalMarks: integer('total_marks').notNull(),
  passed: boolean('passed').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
  answers: jsonb('answers').$type<Record<number, number>>(),
});

// Payments Table
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  voucherId: text('voucher_id').notNull().unique(),
  month: text('month').notNull(), // e.g., "September 2026"
  amount: integer('amount').notNull(), // Amount in currency units
  type: text('type').default('Tuition Fee').notNull(),
  dueDate: text('due_date').notNull(), // YYYY-MM-DD
  status: paymentStatusEnum('status').default('PENDING').notNull(),
  paidDate: text('paid_date'),
  receiptNumber: text('receipt_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Schedules Table
export const schedules = pgTable('schedules', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  batchId: integer('batch_id').references(() => batches.id, { onDelete: 'cascade' }).notNull(),
  teacherId: integer('teacher_id').references(() => teachers.id).notNull(),
  dayOfWeek: text('day_of_week').notNull(), // Monday, Wednesday, Friday, etc.
  startTime: text('start_time').notNull(), // "01:00 PM"
  endTime: text('end_time').notNull(), // "03:00 PM"
  room: text('room').default('Lab 4').notNull(),
  campus: text('campus').default('Main Campus').notNull(),
});

// Notifications Table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  senderId: integer('sender_id').references(() => users.id, { onDelete: 'set null' }),
  senderName: text('sender_name'),
  senderRole: text('sender_role'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: notificationTypeEnum('type').default('SYSTEM').notNull(),
  link: text('link'),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Announcements Table
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  targetRole: userRoleEnum('target_role'), // null means all roles
  courseId: integer('course_id').references(() => courses.id),
  batchId: integer('batch_id').references(() => batches.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  student: one(students, { fields: [users.id], references: [students.userId] }),
  teacher: one(teachers, { fields: [users.id], references: [teachers.userId] }),
  admin: one(admins, { fields: [users.id], references: [admins.userId] }),
  notifications: many(notifications),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  enrollments: many(enrollments),
  attendances: many(attendances),
  submissions: many(assignmentSubmissions),
  quizAttempts: many(quizAttempts),
  payments: many(payments),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, { fields: [teachers.userId], references: [users.id] }),
  assignmentsCreated: many(assignments),
  quizzesCreated: many(quizzes),
  teacherAssignments: many(teacherAssignments),
  schedules: many(schedules),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  batches: many(batches),
  enrollments: many(enrollments),
  assignments: many(assignments),
  quizzes: many(quizzes),
  schedules: many(schedules),
}));

export const batchesRelations = relations(batches, ({ one, many }) => ({
  course: one(courses, { fields: [batches.courseId], references: [courses.id] }),
  enrollments: many(enrollments),
  schedules: many(schedules),
  teacherAssignments: many(teacherAssignments),
}));
