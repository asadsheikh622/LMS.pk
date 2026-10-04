import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  requestedPortal: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).optional(),
});

export const studentVerifySchema = z.object({
  studentId: z.string().min(3, 'Valid Student ID is required'),
  phone: z.string().min(7, 'Valid registered phone number is required'),
});

export const studentOtpSchema = z.object({
  studentId: z.string().min(3, 'Valid Student ID is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const studentSetPasswordSchema = z.object({
  studentId: z.string().min(3, 'Valid Student ID is required'),
  otpToken: z.string().min(10, 'Verification token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must match'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export const createStudentSchema = z.object({
  studentId: z.string().min(3, 'Student ID required'),
  rollNumber: z.string().min(3, 'Roll number required'),
  fullName: z.string().min(2, 'Full name required'),
  fatherName: z.string().min(2, 'Father name required'),
  phone: z.string().min(8, 'Phone number required'),
  email: z.string().email('Valid email required'),
  cnic: z.string().optional(),
  campus: z.string().default('Main Campus'),
  city: z.string().default('Karachi'),
  courseId: z.number().int().positive(),
  batchId: z.number().int().positive(),
});

export const createTeacherSchema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  teacherCode: z.string().min(2, 'Teacher Code required'),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
});

export const createCourseSchema = z.object({
  code: z.string().min(2, 'Course code required'),
  title: z.string().min(3, 'Course title required'),
  description: z.string().optional(),
  durationWeeks: z.number().int().min(1).default(16),
  level: z.string().default('Intermediate'),
  syllabus: z.string().optional(),
});

export const createBatchSchema = z.object({
  courseId: z.number().int().positive(),
  batchNumber: z.string().min(1, 'Batch number required'),
  name: z.string().min(2, 'Batch name required'),
  campus: z.string().default('Main Campus'),
  capacity: z.number().int().positive().default(40),
  startDate: z.string(),
  endDate: z.string().optional(),
});

export const markAttendanceSchema = z.object({
  courseId: z.number().int().positive(),
  batchId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  records: z.array(z.object({
    studentId: z.number().int().positive(),
    status: z.enum(['PRESENT', 'ABSENT', 'LEAVE', 'LATE']),
    remarks: z.string().optional(),
  })),
});
