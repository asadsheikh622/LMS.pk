import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import {
  users, students, teachers, admins, courses, batches, enrollments,
  attendances, assignments, assignmentSubmissions, quizzes, payments, schedules
} from './src/db/schema.ts';
import { eq, and, or, ne, sql, desc, asc, ilike, inArray } from 'drizzle-orm';
import {
  hashPassword, comparePassword, signSessionToken, verifySessionToken
} from './src/lib/auth/jwt.ts';
import {
  loginSchema, studentVerifySchema, studentOtpSchema, studentSetPasswordSchema
} from './src/lib/validation/auth.ts';
import { requireAuth, requireStudent, requireTeacher, requireAdmin, AuthRequest } from './src/middleware/auth.ts';
import { runSeed } from './src/db/seed.ts';
import { UserSession } from './src/types.ts';
import { teacherRouter } from './src/routes/teacher.ts';
import { adminRouter } from './src/routes/admin.ts';
import { studentRouter } from './src/routes/student.ts';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Run seed data on startup (creates initial Super Admin, Admins, Teachers, Courses, Batches, Students)
  try {
    await runSeed();
  } catch (err) {
    console.error('Initial DB seed check error:', err);
  }

  // ==========================================
  // PUBLIC & AUTH API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', async (req, res) => {
    try {
      const result = await db.select({ count: sql<number>`count(*)` }).from(users);
      res.json({
        status: 'ok',
        service: 'LMS Core API Engine',
        dbConnected: true,
        userCount: Number(result[0]?.count || 0),
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // User Login (Supports Student, Teacher, Admin, Super Admin)
  app.post('/api/auth/login', async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          issues: parsed.error.issues,
        });
      }

      const { identifier, password, requestedPortal } = parsed.data;

      // Find user by email, or check if it's a student ID or teacher code
      let foundUser: any = null;
      let studentInfo: any = null;
      let teacherInfo: any = null;

      // Direct email lookup
      const usersByEmail = await db.select().from(users).where(eq(users.email, identifier.trim().toLowerCase())).limit(1);
      if (usersByEmail.length > 0) {
        foundUser = usersByEmail[0];
      } else {
        // Check if identifier is studentId
        const studentRows = await db.select().from(students).where(eq(students.studentId, identifier.trim().toUpperCase())).limit(1);
        if (studentRows.length > 0 && studentRows[0].userId) {
          const userRows = await db.select().from(users).where(eq(users.id, studentRows[0].userId)).limit(1);
          if (userRows.length > 0) {
            foundUser = userRows[0];
            studentInfo = studentRows[0];
          }
        }

        // Check if identifier is teacherCode
        if (!foundUser) {
          const teacherRows = await db.select().from(teachers).where(eq(teachers.teacherCode, identifier.trim().toUpperCase())).limit(1);
          if (teacherRows.length > 0) {
            const userRows = await db.select().from(users).where(eq(users.id, teacherRows[0].userId)).limit(1);
            if (userRows.length > 0) {
              foundUser = userRows[0];
              teacherInfo = teacherRows[0];
            }
          }
        }
      }

      if (!foundUser || !foundUser.passwordHash) {
        return res.status(401).json({
          error: 'Invalid credentials. Please check your credentials and try again.',
        });
      }

      if (!foundUser.isActive) {
        return res.status(403).json({
          error: 'Account deactivated. Please contact your academic administrator.',
        });
      }

      const isPasswordValid = await comparePassword(password, foundUser.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Invalid credentials. Please check your credentials and try again.',
        });
      }

      // If logging into a specific portal, enforce server-side role check
      if (requestedPortal) {
        if (requestedPortal === 'ADMIN' && foundUser.role !== 'ADMIN' && foundUser.role !== 'SUPER_ADMIN') {
          return res.status(403).json({
            error: 'Access denied: You do not have administrative privileges.',
          });
        }
        if (requestedPortal === 'TEACHER' && foundUser.role !== 'TEACHER') {
          return res.status(403).json({
            error: 'Access denied: You do not have an active teacher account.',
          });
        }
        if (requestedPortal === 'STUDENT' && foundUser.role !== 'STUDENT') {
          return res.status(403).json({
            error: 'Access denied: Please use the appropriate portal for your role.',
          });
        }
      }

      // Fetch student or teacher metadata if not already loaded
      if (foundUser.role === 'STUDENT' && !studentInfo) {
        const rows = await db.select().from(students).where(eq(students.userId, foundUser.id)).limit(1);
        if (rows.length > 0) studentInfo = rows[0];
      } else if (foundUser.role === 'TEACHER' && !teacherInfo) {
        const rows = await db.select().from(teachers).where(eq(teachers.userId, foundUser.id)).limit(1);
        if (rows.length > 0) teacherInfo = rows[0];
      }

      const session: UserSession = {
        id: foundUser.id,
        uid: foundUser.uid,
        email: foundUser.email,
        role: foundUser.role,
        fullName: foundUser.fullName,
        phone: foundUser.phone,
        avatarUrl: foundUser.avatarUrl,
        studentId: studentInfo?.studentId,
        teacherCode: teacherInfo?.teacherCode,
      };

      const token = signSessionToken(session);

      res.json({
        token,
        user: session,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Authentication failed. Please try again later.' });
    }
  });

  // Get Current Session User
  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userRows = await db.select().from(users).where(eq(users.id, req.user!.id)).limit(1);
      if (userRows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userRows[0];
      let studentData = null;
      let teacherData = null;

      if (user.role === 'STUDENT') {
        const s = await db.select().from(students).where(eq(students.userId, user.id)).limit(1);
        if (s.length > 0) studentData = s[0];
      } else if (user.role === 'TEACHER') {
        const t = await db.select().from(teachers).where(eq(teachers.userId, user.id)).limit(1);
        if (t.length > 0) teacherData = t[0];
      }

      res.json({
        user: {
          id: user.id,
          uid: user.uid,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          student: studentData,
          teacher: teacherData,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve session' });
    }
  });

  // ==========================================
  // ACADEMY VERIFIED STUDENT ACTIVATION
  // ==========================================

  // Step 1: Verify Student Record
  app.post('/api/auth/student/verify', async (req, res) => {
    try {
      const parsed = studentVerifySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Please provide valid Student ID and phone number' });
      }

      const { studentId, phone } = parsed.data;

      // Clean phone numbers for matching
      const cleanInputPhone = phone.replace(/[\s\-\+]/g, '');

      const studentRows = await db.select().from(students).where(eq(students.studentId, studentId.trim().toUpperCase())).limit(1);
      if (studentRows.length === 0) {
        return res.status(404).json({
          error: 'Student record not found in academy registry. Please ensure your Student ID matches your admission voucher, or contact Academy Administration.',
        });
      }

      const student = studentRows[0];

      if (student.isActivated) {
        return res.status(400).json({
          error: 'This student account is already active. Please proceed directly to the Student Login portal.',
          isAlreadyActive: true,
        });
      }

      const dbCleanPhone = student.phone.replace(/[\s\-\+]/g, '');
      if (!dbCleanPhone.endsWith(cleanInputPhone.slice(-7)) && !cleanInputPhone.endsWith(dbCleanPhone.slice(-7))) {
        return res.status(400).json({
          error: 'Registered phone number does not match academy enrollment records.',
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      await db.update(students)
        .set({
          activationOtp: otp,
          otpExpiresAt: expiresAt,
          otpAttempts: 0,
        })
        .where(eq(students.id, student.id));

      // In development mode, display OTP hint for testing
      console.log(`[STUDENT ACTIVATION OTP] For ${student.studentId} (${student.fullName}): ${otp}`);

      // Mask phone for response
      const maskedPhone = student.phone.slice(0, 4) + ' •••• ' + student.phone.slice(-3);

      res.json({
        success: true,
        message: `OTP sent to registered phone ending in ${student.phone.slice(-4)}`,
        studentId: student.studentId,
        studentName: student.fullName,
        maskedPhone,
        devOtpHint: otp, // For ease of testing academy activation
      });
    } catch (err: any) {
      console.error('Student verification error:', err);
      res.status(500).json({ error: 'Verification service error' });
    }
  });

  // Step 2: Verify OTP
  app.post('/api/auth/student/verify-otp', async (req, res) => {
    try {
      const parsed = studentOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Valid 6-digit OTP required' });
      }

      const { studentId, otp } = parsed.data;

      const studentRows = await db.select().from(students).where(eq(students.studentId, studentId.trim().toUpperCase())).limit(1);
      if (studentRows.length === 0) {
        return res.status(404).json({ error: 'Student record not found' });
      }

      const student = studentRows[0];

      if (student.otpAttempts >= 5) {
        return res.status(429).json({
          error: 'Too many failed attempts. Please request a new verification code.',
        });
      }

      if (!student.activationOtp || !student.otpExpiresAt || new Date() > student.otpExpiresAt) {
        return res.status(400).json({
          error: 'Verification code has expired. Please request a new code.',
        });
      }

      if (student.activationOtp !== otp.trim()) {
        await db.update(students)
          .set({ otpAttempts: student.otpAttempts + 1 })
          .where(eq(students.id, student.id));

        return res.status(400).json({
          error: `Incorrect verification code. ${4 - student.otpAttempts} attempts remaining.`,
        });
      }

      // Generate a temporary activation session token (valid for 15 mins)
      const activationToken = signSessionToken({
        id: student.id,
        uid: `activation-${student.studentId}`,
        email: student.email,
        role: 'STUDENT',
        fullName: student.fullName,
        studentId: student.studentId,
      });

      res.json({
        success: true,
        activationToken,
        message: 'OTP verified successfully. You may now create your secure password.',
      });
    } catch (err: any) {
      console.error('OTP check error:', err);
      res.status(500).json({ error: 'OTP verification failed' });
    }
  });

  // Step 3: Set Password and Complete Activation
  app.post('/api/auth/student/activate', async (req, res) => {
    try {
      const parsed = studentSetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid password requirements',
        });
      }

      const { studentId, otpToken, password } = parsed.data;
      const decoded = verifySessionToken(otpToken);
      if (!decoded || decoded.studentId !== studentId.trim().toUpperCase()) {
        return res.status(401).json({
          error: 'Session expired or invalid. Please verify OTP again.',
        });
      }

      const studentRows = await db.select().from(students).where(eq(students.studentId, studentId.trim().toUpperCase())).limit(1);
      if (studentRows.length === 0) {
        return res.status(404).json({ error: 'Student record not found' });
      }

      const student = studentRows[0];
      const hashedPassword = await hashPassword(password);

      // Create new User record or link existing
      let userId = student.userId;
      let userEmail = student.email.trim().toLowerCase();

      if (userId) {
        // Linked user account already exists, update credentials and active state
        await db.update(users)
          .set({
            passwordHash: hashedPassword,
            isActive: true,
            fullName: student.fullName,
            phone: student.phone,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      } else {
        // student.userId is not set yet.
        // Check if an existing user record with this email already exists
        const existingUsers = await db
          .select()
          .from(users)
          .where(eq(sql`LOWER(${users.email})`, userEmail))
          .limit(1);

        if (existingUsers.length > 0) {
          const existingUser = existingUsers[0];

          // If the existing user account has role STUDENT, link to it
          if (existingUser.role === 'STUDENT') {
            // Check if another student record currently holds this userId
            const otherStudents = await db
              .select({ id: students.id, studentId: students.studentId })
              .from(students)
              .where(and(eq(students.userId, existingUser.id), ne(students.id, student.id)))
              .limit(1);

            if (otherStudents.length > 0) {
              // Unlink from the other student so students_user_id_unique is satisfied
              await db
                .update(students)
                .set({ userId: null, updatedAt: new Date() })
                .where(eq(students.id, otherStudents[0].id));
            }

            userId = existingUser.id;
            await db
              .update(users)
              .set({
                passwordHash: hashedPassword,
                isActive: true,
                fullName: student.fullName,
                phone: student.phone || existingUser.phone,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId));
          } else {
            // The email belongs to a TEACHER, ADMIN, or SUPER_ADMIN account.
            // Do NOT overwrite faculty credentials. Issue a dedicated academy student login email.
            userEmail = `${student.studentId.toLowerCase()}@student.academy.edu`;
            const checkAcademyEmail = await db
              .select({ id: users.id })
              .from(users)
              .where(eq(users.email, userEmail))
              .limit(1);
            if (checkAcademyEmail.length > 0) {
              userEmail = `${student.studentId.toLowerCase()}.${Date.now()}@student.academy.edu`;
            }

            let baseUid = `usr-stu-${student.studentId.toLowerCase()}`;
            const existingUid = await db.select({ id: users.id }).from(users).where(eq(users.uid, baseUid)).limit(1);
            if (existingUid.length > 0) {
              baseUid = `${baseUid}-${Date.now()}`;
            }

            const [newUser] = await db
              .insert(users)
              .values({
                uid: baseUid,
                email: userEmail,
                passwordHash: hashedPassword,
                fullName: student.fullName,
                role: 'STUDENT',
                phone: student.phone,
                isActive: true,
              })
              .returning();
            userId = newUser.id;

            // Also update student's profile email to this official academy email
            await db
              .update(students)
              .set({ email: userEmail, updatedAt: new Date() })
              .where(eq(students.id, student.id));
          }
        } else {
          // No user with this email exists: create a fresh user
          let baseUid = `usr-stu-${student.studentId.toLowerCase()}`;
          const existingUid = await db.select({ id: users.id }).from(users).where(eq(users.uid, baseUid)).limit(1);
          if (existingUid.length > 0) {
            baseUid = `${baseUid}-${Date.now()}`;
          }

          const [newUser] = await db
            .insert(users)
            .values({
              uid: baseUid,
              email: userEmail,
              passwordHash: hashedPassword,
              fullName: student.fullName,
              role: 'STUDENT',
              phone: student.phone,
              isActive: true,
            })
            .returning();
          userId = newUser.id;
        }
      }

      // Mark student as activated
      await db.update(students)
        .set({
          userId,
          isActivated: true,
          status: 'ACTIVE',
          activationOtp: null,
          otpExpiresAt: null,
          otpAttempts: 0,
          updatedAt: new Date(),
        })
        .where(eq(students.id, student.id));

      const session: UserSession = {
        id: userId,
        uid: `usr-stu-${student.studentId.toLowerCase()}`,
        email: userEmail,
        role: 'STUDENT',
        fullName: student.fullName,
        phone: student.phone,
        studentId: student.studentId,
      };

      const token = signSessionToken(session);

      res.json({
        success: true,
        token,
        user: session,
        message: 'Account successfully activated! Welcome to the LMS.',
      });
    } catch (err: any) {
      console.error('Activation finalization error:', err);
      res.status(500).json({ error: 'Activation failed' });
    }
  });

  // ==========================================
  // STUDENT PORTAL API ROUTES (Protected)
  // ==========================================
  app.get('/api/student/dashboard', ...requireStudent, async (req: AuthRequest, res) => {
    try {
      const studentRows = await db.select().from(students).where(eq(students.userId, req.user!.id)).limit(1);
      if (studentRows.length === 0) {
        return res.status(404).json({ error: 'Student profile not found' });
      }
      const student = studentRows[0];

      // Enrolled course & batch
      const enrollmentRows = await db
        .select({
          enrollmentId: enrollments.id,
          progress: enrollments.progressPercentage,
          status: enrollments.status,
          courseId: courses.id,
          courseCode: courses.code,
          courseTitle: courses.title,
          courseDescription: courses.description,
          batchId: batches.id,
          batchNumber: batches.batchNumber,
          batchName: batches.name,
          campus: batches.campus,
        })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .innerJoin(batches, eq(enrollments.batchId, batches.id))
        .where(eq(enrollments.studentId, student.id))
        .limit(1);

      const activeCourse = enrollmentRows[0] || null;

      // Attendance statistics
      const attendanceList = await db
        .select()
        .from(attendances)
        .where(eq(attendances.studentId, student.id));

      const totalClasses = attendanceList.length || 110;
      const presentCount = attendanceList.filter(a => a.status === 'PRESENT').length || 108;
      const absentCount = attendanceList.filter(a => a.status === 'ABSENT').length || 1;
      const leaveCount = attendanceList.filter(a => a.status === 'LEAVE').length || 1;
      const lateCount = attendanceList.filter(a => a.status === 'LATE').length || 0;

      // Assignments
      const assignmentList = activeCourse
        ? await db.select().from(assignments).where(eq(assignments.courseId, activeCourse.courseId))
        : [];
      const submissions = await db.select().from(assignmentSubmissions).where(eq(assignmentSubmissions.studentId, student.id));

      // Quizzes
      const quizList = activeCourse
        ? await db.select().from(quizzes).where(eq(quizzes.courseId, activeCourse.courseId))
        : [];

      // Schedules
      const weeklySchedules = activeCourse
        ? await db.select().from(schedules).where(eq(schedules.courseId, activeCourse.courseId))
        : [];

      // Payments
      const paymentList = await db.select().from(payments).where(eq(payments.studentId, student.id)).orderBy(desc(payments.id));

      res.json({
        student: {
          id: student.id,
          studentId: student.studentId,
          rollNumber: student.rollNumber,
          fullName: student.fullName,
          fatherName: student.fatherName,
          campus: student.campus,
          city: student.city,
        },
        activeCourse: activeCourse ? {
          title: activeCourse.courseTitle,
          code: activeCourse.courseCode,
          status: activeCourse.status,
          batch: activeCourse.batchNumber,
          progress: activeCourse.progress,
          campus: activeCourse.campus,
          city: student.city,
          roll: student.rollNumber,
          schedule: [
            { day: 'Monday', time: '01:00 PM - 03:00 PM' },
            { day: 'Wednesday', time: '01:00 PM - 03:00 PM' },
            { day: 'Friday', time: '01:00 PM - 03:00 PM' },
          ],
        } : null,
        stats: {
          attendanceRatio: `${presentCount} / ${totalClasses}`,
          attendancePercentage: Math.round((presentCount / totalClasses) * 100),
          assignmentRatio: `${submissions.length} / ${Math.max(assignmentList.length, 13)}`,
          assignmentPercentage: Math.round((submissions.length / Math.max(assignmentList.length, 1)) * 100),
          courseProgress: activeCourse ? activeCourse.progress : 73,
          quizScorePercentage: 85,
        },
        attendanceSummary: {
          totalClasses,
          present: presentCount,
          absent: absentCount,
          leave: leaveCount,
          late: lateCount,
        },
        schedules: weeklySchedules,
        recentPayments: paymentList,
        assignments: assignmentList,
        quizzes: quizList,
      });
    } catch (err: any) {
      console.error('Student dashboard error:', err);
      res.status(500).json({ error: 'Failed to load student dashboard' });
    }
  });

  // ==========================================
  // TEACHER PORTAL API ROUTES (Protected)
  // ==========================================
  app.get('/api/teacher/dashboard', ...requireTeacher, async (req: AuthRequest, res) => {
    try {
      const teacherRows = await db.select().from(teachers).where(eq(teachers.userId, req.user!.id)).limit(1);
      if (teacherRows.length === 0) {
        return res.status(404).json({ error: 'Teacher record not found' });
      }
      const teacher = teacherRows[0];

      // Total courses and batches
      const coursesList = await db.select().from(courses);
      const studentCount = await db.select({ count: sql<number>`count(*)` }).from(students);
      const assignmentCount = await db.select({ count: sql<number>`count(*)` }).from(assignments).where(eq(assignments.teacherId, teacher.id));
      const quizCount = await db.select({ count: sql<number>`count(*)` }).from(quizzes).where(eq(quizzes.teacherId, teacher.id));

      res.json({
        teacher: {
          id: teacher.id,
          code: teacher.teacherCode,
          specialization: teacher.specialization,
          qualification: teacher.qualification,
        },
        stats: {
          totalStudents: Number(studentCount[0]?.count || 0),
          presentToday: 18,
          absentToday: 2,
          pendingAssignments: Number(assignmentCount[0]?.count || 3),
          upcomingQuizzes: Number(quizCount[0]?.count || 1),
        },
        courses: coursesList,
      });
    } catch (err: any) {
      console.error('Teacher dashboard error:', err);
      res.status(500).json({ error: 'Failed to load teacher dashboard' });
    }
  });

  // ==========================================
  // ADMIN PORTAL API ROUTES (Protected)
  // ==========================================
  app.get('/api/admin/dashboard', ...requireAdmin, async (req: AuthRequest, res) => {
    try {
      const totalStudents = await db.select({ count: sql<number>`count(*)` }).from(students);
      const activeStudents = await db.select({ count: sql<number>`count(*)` }).from(students).where(eq(students.status, 'ACTIVE'));
      const pendingActivations = await db.select({ count: sql<number>`count(*)` }).from(students).where(eq(students.status, 'PENDING_ACTIVATION'));
      const onLeaveStudents = await db.select({ count: sql<number>`count(*)` }).from(students).where(eq(students.status, 'ON_LEAVE'));
      const droppedOutStudents = await db.select({ count: sql<number>`count(*)` }).from(students).where(eq(students.status, 'DROPPED_OUT'));
      const graduatedStudents = await db.select({ count: sql<number>`count(*)` }).from(students).where(eq(students.status, 'GRADUATED'));
      const totalTeachers = await db.select({ count: sql<number>`count(*)` }).from(teachers);
      const totalCourses = await db.select({ count: sql<number>`count(*)` }).from(courses);
      const totalBatches = await db.select({ count: sql<number>`count(*)` }).from(batches);
      const pendingFees = await db.select({ count: sql<number>`count(*)` }).from(payments).where(eq(payments.status, 'PENDING'));

      // Calculate attendance rate from recent attendance records
      const attStats = await db.select({
        total: sql<number>`count(*)`,
        present: sql<number>`count(*) filter (where status = 'PRESENT')`,
      }).from(attendances);
      const attTotal = Number(attStats[0]?.total || 0);
      const attPresent = Number(attStats[0]?.present || 0);
      const presentPercentage = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 92;

      // Recent 5 admissions
      const studentList = await db.select().from(students).limit(5).orderBy(desc(students.id));

      res.json({
        stats: {
          totalStudents: Number(totalStudents[0]?.count || 0),
          activeStudents: Number(activeStudents[0]?.count || 0),
          pendingActivations: Number(pendingActivations[0]?.count || 0),
          onLeaveStudents: Number(onLeaveStudents[0]?.count || 0),
          droppedOutStudents: Number(droppedOutStudents[0]?.count || 0),
          graduatedStudents: Number(graduatedStudents[0]?.count || 0),
          totalTeachers: Number(totalTeachers[0]?.count || 0),
          totalCourses: Number(totalCourses[0]?.count || 0),
          totalBatches: Number(totalBatches[0]?.count || 0),
          presentToday: presentPercentage,
          absentToday: Math.max(0, 100 - presentPercentage),
          pendingFees: Number(pendingFees[0]?.count || 0),
          upcomingClasses: 8,
        },
        recentStudents: studentList,
      });
    } catch (err: any) {
      console.error('Admin dashboard error:', err);
      res.status(500).json({ error: 'Failed to load admin dashboard' });
    }
  });

  // Admin: Paginated Student Registry with Search & Filters
  app.get('/api/admin/students', ...requireAdmin, async (req: AuthRequest, res) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
      const offset = (page - 1) * limit;
      const search = String(req.query.query || req.query.search || '').trim();
      const statusFilter = String(req.query.status || 'ALL').trim();
      const courseFilter = req.query.courseId ? parseInt(String(req.query.courseId), 10) : null;
      const batchFilter = req.query.batchId ? parseInt(String(req.query.batchId), 10) : null;

      const conditions: any[] = [];

      if (search) {
        const searchPattern = `%${search}%`;
        conditions.push(
          or(
            ilike(students.studentId, searchPattern),
            ilike(students.rollNumber, searchPattern),
            ilike(students.fullName, searchPattern),
            ilike(students.fatherName, searchPattern),
            ilike(students.phone, searchPattern),
            ilike(students.email, searchPattern),
            ilike(students.city, searchPattern)
          )
        );
      }

      if (statusFilter && statusFilter !== 'ALL') {
        conditions.push(eq(students.status, statusFilter));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Count total matching records
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(students)
        .where(whereClause);
      const totalCount = Number(totalResult[0]?.count || 0);

      // Paginated student query
      const studentRows = await db
        .select()
        .from(students)
        .where(whereClause)
        .orderBy(desc(students.id))
        .limit(limit)
        .offset(offset);

      // Fetch enrollment info for these students
      const studentIds = studentRows.map((s) => s.id);
      const enrollmentMap = new Map<number, {
        courseId: number;
        courseTitle: string;
        courseCode: string;
        batchId: number;
        batchNumber: string;
        batchName: string;
        enrollmentStatus: string;
      }>();

      if (studentIds.length > 0) {
        const enrolls = await db
          .select({
            studentId: enrollments.studentId,
            courseId: courses.id,
            courseTitle: courses.title,
            courseCode: courses.code,
            batchId: batches.id,
            batchNumber: batches.batchNumber,
            batchName: batches.name,
            enrollmentStatus: enrollments.status,
          })
          .from(enrollments)
          .innerJoin(courses, eq(enrollments.courseId, courses.id))
          .innerJoin(batches, eq(enrollments.batchId, batches.id))
          .where(inArray(enrollments.studentId, studentIds));

        enrolls.forEach((e) => {
          enrollmentMap.set(e.studentId, {
            courseId: e.courseId,
            courseTitle: e.courseTitle,
            courseCode: e.courseCode,
            batchId: e.batchId,
            batchNumber: e.batchNumber,
            batchName: e.batchName,
            enrollmentStatus: e.enrollmentStatus,
          });
        });
      }

      // Format response rows
      const items = studentRows.map((s) => {
        const en = enrollmentMap.get(s.id);
        return {
          ...s,
          courseId: en?.courseId || null,
          courseTitle: en?.courseTitle || 'Unassigned Course',
          courseCode: en?.courseCode || 'N/A',
          batchId: en?.batchId || null,
          batchNumber: en?.batchNumber || 'Batch 20',
          batchName: en?.batchName || 'General Cohort',
          enrollmentStatus: en?.enrollmentStatus || 'ENROLLED',
        };
      });

      // Filter options for the UI
      const activeCourses = await db.select({ id: courses.id, code: courses.code, title: courses.title }).from(courses).where(eq(courses.isActive, true));
      const activeBatches = await db.select({ id: batches.id, courseId: batches.courseId, batchNumber: batches.batchNumber, name: batches.name, campus: batches.campus }).from(batches).where(eq(batches.isActive, true));

      const totalPages = Math.max(1, Math.ceil(totalCount / limit));

      res.json({
        students: items,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          from: totalCount === 0 ? 0 : offset + 1,
          to: Math.min(offset + limit, totalCount),
        },
        filters: {
          courses: activeCourses,
          batches: activeBatches,
          statuses: [
            { value: 'ALL', label: 'All Lifecycle Statuses' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'PENDING_ACTIVATION', label: 'Pending Activation' },
            { value: 'ON_LEAVE', label: 'On Leave' },
            { value: 'SUSPENDED', label: 'Suspended' },
            { value: 'DROPPED_OUT', label: 'Dropped Out' },
            { value: 'GRADUATED', label: 'Graduated' },
          ],
        },
      });
    } catch (err: any) {
      console.error('Error fetching admin students:', err);
      res.status(500).json({ error: 'Failed to fetch students from registry' });
    }
  });

  // Admin: Admit / Add New Student
  app.post('/api/admin/students', ...requireAdmin, async (req: AuthRequest, res) => {
    try {
      const {
        studentId, rollNumber, fullName, fatherName, phone, email,
        cnic, campus, city, courseId, batchId, status, admissionDate
      } = req.body;

      // Server-side validation
      if (!studentId || !String(studentId).trim()) {
        return res.status(400).json({ error: 'Student ID is required.' });
      }
      if (!rollNumber || !String(rollNumber).trim()) {
        return res.status(400).json({ error: 'Roll Number is required.' });
      }
      if (!fullName || !String(fullName).trim()) {
        return res.status(400).json({ error: 'Full Name is required.' });
      }
      if (!fatherName || !String(fatherName).trim()) {
        return res.status(400).json({ error: 'Father Name is required.' });
      }
      if (!phone || !String(phone).trim()) {
        return res.status(400).json({ error: 'Phone Number is required.' });
      }

      const cleanStudentId = String(studentId).trim().toUpperCase();
      const cleanRoll = String(rollNumber).trim();
      const cleanPhone = String(phone).trim();
      const cleanEmail = email && String(email).trim()
        ? String(email).trim().toLowerCase()
        : `${cleanStudentId.toLowerCase()}@student.academy.edu`;

      // Unique Student ID check
      const existingId = await db.select().from(students).where(eq(students.studentId, cleanStudentId)).limit(1);
      if (existingId.length > 0) {
        return res.status(409).json({ error: `Student ID "${cleanStudentId}" is already assigned to another student.` });
      }

      // Unique Roll Number check
      const existingRoll = await db.select().from(students).where(eq(students.rollNumber, cleanRoll)).limit(1);
      if (existingRoll.length > 0) {
        return res.status(409).json({ error: `Roll Number "${cleanRoll}" already exists in the system.` });
      }

      // Check if email belongs to a faculty or administrator
      const facultyWithEmail = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(sql`LOWER(${users.email})`, cleanEmail))
        .limit(1);

      if (facultyWithEmail.length > 0 && facultyWithEmail[0].role !== 'STUDENT') {
        return res.status(409).json({
          error: `Email "${cleanEmail}" is already registered to a ${facultyWithEmail[0].role.toLowerCase()} account. Please specify a different student email or leave blank.`,
        });
      }

      // Insert Student record
      const [newStudent] = await db.insert(students).values({
        studentId: cleanStudentId,
        rollNumber: cleanRoll,
        fullName: String(fullName).trim(),
        fatherName: String(fatherName).trim(),
        phone: cleanPhone,
        email: cleanEmail,
        cnic: cnic ? String(cnic).trim() : null,
        campus: campus ? String(campus).trim() : 'Main IT Campus',
        city: city ? String(city).trim() : 'Karachi',
        status: status || 'PENDING_ACTIVATION',
        isActivated: false,
        admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
        updatedBy: req.user?.fullName || 'Academy Administrator',
      }).returning();

      // Resolve Course & Batch ID
      const chosenCourseId = courseId ? parseInt(String(courseId), 10) : 1;
      const chosenBatchId = batchId ? parseInt(String(batchId), 10) : 1;

      // Enroll student into course and batch
      await db.insert(enrollments).values({
        studentId: newStudent.id,
        courseId: chosenCourseId,
        batchId: chosenBatchId,
        status: 'ENROLLED',
        progressPercentage: 0,
      });

      // Issue initial tuition fee voucher
      const voucherNum = `VCH-${new Date().getFullYear()}-${String(newStudent.id).padStart(4, '0')}`;
      await db.insert(payments).values({
        studentId: newStudent.id,
        courseId: chosenCourseId,
        voucherId: voucherNum,
        month: 'Admission & Term Fee',
        amount: 8500,
        type: 'Admission & Tuition',
        dueDate: '2026-10-15',
        status: 'PENDING',
      });

      res.status(201).json({
        success: true,
        student: newStudent,
        message: `Student "${newStudent.fullName}" (${newStudent.studentId}) successfully registered and enrolled.`,
      });
    } catch (err: any) {
      console.error('Error admitting student:', err);
      res.status(500).json({ error: err.message || 'Server error while registering student' });
    }
  });

  // Admin: View Single Student Profile & Academic Dossier
  app.get('/api/admin/students/:id', ...requireAdmin, async (req: AuthRequest, res) => {
    try {
      const studentId = parseInt(req.params.id, 10);
      const studentRows = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
      if (studentRows.length === 0) {
        return res.status(404).json({ error: 'Student record not found' });
      }
      const student = studentRows[0];

      // Enrolled course and batch
      const enrolls = await db
        .select({
          enrollmentId: enrollments.id,
          status: enrollments.status,
          progress: enrollments.progressPercentage,
          enrolledAt: enrollments.enrolledAt,
          courseId: courses.id,
          courseTitle: courses.title,
          courseCode: courses.code,
          courseDescription: courses.description,
          batchId: batches.id,
          batchNumber: batches.batchNumber,
          batchName: batches.name,
          campus: batches.campus,
        })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .innerJoin(batches, eq(enrollments.batchId, batches.id))
        .where(eq(enrollments.studentId, student.id));

      // Attendance history
      const attendanceRows = await db.select().from(attendances).where(eq(attendances.studentId, student.id)).orderBy(desc(attendances.date));
      const totalAtt = attendanceRows.length;
      const presentAtt = attendanceRows.filter((a) => a.status === 'PRESENT').length;
      const absentAtt = attendanceRows.filter((a) => a.status === 'ABSENT').length;
      const leaveAtt = attendanceRows.filter((a) => a.status === 'LEAVE').length;

      // Fee vouchers
      const paymentRows = await db.select().from(payments).where(eq(payments.studentId, student.id)).orderBy(desc(payments.id));

      // User account
      let userAccount = null;
      if (student.userId) {
        const userRows = await db.select().from(users).where(eq(users.id, student.userId)).limit(1);
        if (userRows.length > 0) {
          userAccount = {
            id: userRows[0].id,
            email: userRows[0].email,
            isActive: userRows[0].isActive,
            createdAt: userRows[0].createdAt,
          };
        }
      }

      res.json({
        student,
        enrollment: enrolls[0] || null,
        enrollments: enrolls,
        attendanceStats: {
          total: totalAtt,
          present: presentAtt,
          absent: absentAtt,
          leave: leaveAtt,
          percentage: totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100,
        },
        recentAttendance: attendanceRows.slice(0, 10),
        payments: paymentRows,
        userAccount,
      });
    } catch (err: any) {
      console.error('Error fetching student details:', err);
      res.status(500).json({ error: 'Failed to fetch student profile details' });
    }
  });

  // Admin: Update Student Record
  app.put('/api/admin/students/:id', ...requireAdmin, async (req: AuthRequest, res) => {
    try {
      const studentId = parseInt(req.params.id, 10);
      const {
        studentId: newStudentId, rollNumber: newRollNumber, fullName, fatherName,
        phone, email, cnic, campus, city, status, courseId, batchId, admissionDate
      } = req.body;

      const currentRows = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
      if (currentRows.length === 0) {
        return res.status(404).json({ error: 'Student record not found' });
      }
      const current = currentRows[0];

      // Uniqueness validation if changed
      if (newStudentId && newStudentId.trim().toUpperCase() !== current.studentId) {
        const dup = await db.select().from(students).where(eq(students.studentId, newStudentId.trim().toUpperCase())).limit(1);
        if (dup.length > 0) {
          return res.status(409).json({ error: `Student ID "${newStudentId}" is already assigned to another student.` });
        }
      }
      if (newRollNumber && newRollNumber.trim() !== current.rollNumber) {
        const dup = await db.select().from(students).where(eq(students.rollNumber, newRollNumber.trim())).limit(1);
        if (dup.length > 0) {
          return res.status(409).json({ error: `Roll Number "${newRollNumber}" already exists.` });
        }
      }

      // Update student record
      const [updatedStudent] = await db.update(students).set({
        studentId: newStudentId ? newStudentId.trim().toUpperCase() : current.studentId,
        rollNumber: newRollNumber ? newRollNumber.trim() : current.rollNumber,
        fullName: fullName ? String(fullName).trim() : current.fullName,
        fatherName: fatherName ? String(fatherName).trim() : current.fatherName,
        phone: phone ? String(phone).trim() : current.phone,
        email: email ? String(email).trim().toLowerCase() : current.email,
        cnic: cnic !== undefined ? (cnic ? String(cnic).trim() : null) : current.cnic,
        campus: campus ? String(campus).trim() : current.campus,
        city: city ? String(city).trim() : current.city,
        status: status || current.status,
        admissionDate: admissionDate ? new Date(admissionDate) : current.admissionDate,
        updatedBy: req.user?.fullName || 'Academy Administrator',
        updatedAt: new Date(),
      }).where(eq(students.id, studentId)).returning();

      // Update enrollment if courseId or batchId was provided
      if (courseId && batchId) {
        const existingEnroll = await db.select().from(enrollments).where(eq(enrollments.studentId, studentId)).limit(1);
        if (existingEnroll.length > 0) {
          await db.update(enrollments).set({
            courseId: parseInt(String(courseId), 10),
            batchId: parseInt(String(batchId), 10),
          }).where(eq(enrollments.id, existingEnroll[0].id));
        } else {
          await db.insert(enrollments).values({
            studentId,
            courseId: parseInt(String(courseId), 10),
            batchId: parseInt(String(batchId), 10),
            status: 'ENROLLED',
          });
        }
      }

      // If status changed to SUSPENDED or DROPPED_OUT, reflect in user account if any
      if (current.userId && status && (status === 'SUSPENDED' || status === 'DROPPED_OUT')) {
        await db.update(users).set({ isActive: false }).where(eq(users.id, current.userId));
      } else if (current.userId && status && status === 'ACTIVE') {
        await db.update(users).set({ isActive: true }).where(eq(users.id, current.userId));
      }

      res.json({
        success: true,
        student: updatedStudent,
        message: `Student "${updatedStudent.fullName}" (${updatedStudent.studentId}) updated successfully.`,
      });
    } catch (err: any) {
      console.error('Error updating student:', err);
      res.status(500).json({ error: err.message || 'Failed to update student record' });
    }
  });

  // Admin: Drop Out Student (Preserves historical attendance, payments, etc.)
  app.post('/api/admin/students/:id/dropout', ...requireAdmin, async (req: AuthRequest, res) => {
    try {
      const studentId = parseInt(req.params.id, 10);
      const { dropoutReason } = req.body;

      const studentRows = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
      if (studentRows.length === 0) {
        return res.status(404).json({ error: 'Student record not found' });
      }
      const student = studentRows[0];

      const [updated] = await db.update(students).set({
        status: 'DROPPED_OUT',
        dropoutDate: new Date(),
        dropoutReason: dropoutReason ? String(dropoutReason).trim() : 'Administrative Discontinuation',
        updatedBy: req.user?.fullName || 'Academy Administrator',
        updatedAt: new Date(),
      }).where(eq(students.id, studentId)).returning();

      // Update enrollment status
      await db.update(enrollments).set({
        status: 'DROPPED',
      }).where(eq(enrollments.studentId, studentId));

      // Deactivate linked login account if one exists
      if (student.userId) {
        await db.update(users).set({ isActive: false }).where(eq(users.id, student.userId));
      }

      res.json({
        success: true,
        student: updated,
        message: `Student "${student.fullName}" marked as Dropped Out. Historical academic and payment records have been retained.`,
      });
    } catch (err: any) {
      console.error('Error dropping out student:', err);
      res.status(500).json({ error: 'Failed to record student dropout' });
    }
  });

  // Admin: Update Lifecycle Status
  app.post('/api/admin/students/:id/status', ...requireAdmin, async (req: AuthRequest, res) => {
    try {
      const studentId = parseInt(req.params.id, 10);
      const { status } = req.body;

      const validStatuses = ['PENDING_ACTIVATION', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'DROPPED_OUT', 'GRADUATED'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Valid values: ${validStatuses.join(', ')}` });
      }

      const studentRows = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
      if (studentRows.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }
      const student = studentRows[0];

      const [updated] = await db.update(students).set({
        status,
        updatedBy: req.user?.fullName || 'Academy Administrator',
        updatedAt: new Date(),
      }).where(eq(students.id, studentId)).returning();

      // Sync active state on user login
      if (student.userId) {
        const isActive = status === 'ACTIVE';
        await db.update(users).set({ isActive }).where(eq(users.id, student.userId));
      }

      res.json({
        success: true,
        student: updated,
        message: `Student status updated to "${status}".`,
      });
    } catch (err: any) {
      console.error('Error updating student status:', err);
      res.status(500).json({ error: 'Failed to update student status' });
    }
  });

  // Admin: Reset Activation State
  app.post('/api/admin/students/:id/reset-activation', ...requireAdmin, async (req: AuthRequest, res) => {
    try {
      const studentId = parseInt(req.params.id, 10);
      const studentRows = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
      if (studentRows.length === 0) {
        return res.status(404).json({ error: 'Student record not found' });
      }
      const student = studentRows[0];

      await db.update(students).set({
        isActivated: false,
        status: 'PENDING_ACTIVATION',
        activationOtp: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        updatedBy: req.user?.fullName || 'Academy Administrator',
        updatedAt: new Date(),
      }).where(eq(students.id, studentId));

      if (student.userId) {
        await db.update(users).set({
          passwordHash: null,
          isActive: true,
        }).where(eq(users.id, student.userId));
      }

      res.json({
        success: true,
        message: `Activation credentials successfully reset for ${student.fullName}. The student can now activate anew at /student/activate using Student ID (${student.studentId}) and phone (${student.phone}).`,
      });
    } catch (err: any) {
      console.error('Error resetting student activation:', err);
      res.status(500).json({ error: 'Failed to reset student activation' });
    }
  });

  // Admin: Toggle User Account Active/Deactive
  app.post('/api/admin/students/:id/toggle-active', ...requireAdmin, async (req: AuthRequest, res) => {
    try {
      const studentId = parseInt(req.params.id, 10);
      const studentRows = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
      if (studentRows.length === 0) {
        return res.status(404).json({ error: 'Student record not found' });
      }
      const student = studentRows[0];

      const willActivate = !student.isActivated;
      const targetStatus = willActivate ? 'ACTIVE' : 'SUSPENDED';

      const [updated] = await db.update(students).set({
        isActivated: willActivate,
        status: targetStatus,
        updatedBy: req.user?.fullName || 'Academy Administrator',
        updatedAt: new Date(),
      }).where(eq(students.id, studentId)).returning();

      if (student.userId) {
        await db.update(users).set({ isActive: willActivate }).where(eq(users.id, student.userId));
      }

      res.json({
        success: true,
        isActivated: willActivate,
        status: targetStatus,
        message: `Account ${willActivate ? 'Activated' : 'Deactivated / Suspended'} for ${student.fullName}.`,
      });
    } catch (err: any) {
      console.error('Error toggling student active status:', err);
      res.status(500).json({ error: 'Failed to toggle account activation' });
    }
  });

  // Mount Comprehensive Routers
  app.use('/api/teacher', ...requireTeacher, teacherRouter);
  app.use('/api/admin', ...requireAdmin, adminRouter);
  app.use('/api/student', ...requireStudent, studentRouter);

  // Catch-all for unhandled /api/* routes to guarantee JSON response instead of HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.path}`,
      code: 'ROUTE_NOT_FOUND',
    });
  });

  // ==========================================
  // VITE & STATIC SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LMS Server running on port ${PORT}`);
  });
}

startServer();
