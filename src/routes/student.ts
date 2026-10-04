import { Router } from 'express';
import { db } from '../db/index.ts';
import {
  students, courses, batches, enrollments, attendances,
  assignments, assignmentSubmissions, quizzes, quizQuestions, quizAttempts,
  payments, schedules, notifications, announcements, users
} from '../db/schema.ts';
import { eq, and, or, sql, desc, asc, inArray } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth.ts';

export const studentRouter = Router();

// Helper to get verified student record from user ID
export async function getVerifiedStudent(userId: number) {
  const studentRows = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
  if (studentRows.length === 0) return null;
  return studentRows[0];
}

// -------------------------------------------------------------
// 1. STUDENT DASHBOARD OVERVIEW
// -------------------------------------------------------------
studentRouter.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const student = await getVerifiedStudent(req.user!.id);
    if (!student) return res.status(404).json({ error: 'Student record not found' });

    // Enrollments
    const enrolledCourses = await db
      .select({
        enrollmentId: enrollments.id,
        courseId: courses.id,
        courseCode: courses.code,
        courseTitle: courses.title,
        durationWeeks: courses.durationWeeks,
        batchId: batches.id,
        batchNumber: batches.batchNumber,
        batchName: batches.name,
        campus: batches.campus,
        progressPercentage: enrollments.progressPercentage,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(batches, eq(enrollments.batchId, batches.id))
      .where(and(eq(enrollments.studentId, student.id), eq(enrollments.status, 'ENROLLED')));

    const batchIds = enrolledCourses.map(c => c.batchId);

    // Attendance stats
    const attRecords = await db
      .select({ status: attendances.status })
      .from(attendances)
      .where(eq(attendances.studentId, student.id));

    const totalAttendance = attRecords.length;
    const presentAttendance = attRecords.filter(a => a.status === 'PRESENT').length;
    const attendancePercentage = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 100;

    // Pending Assignments count
    let pendingAssignments = 0;
    if (batchIds.length > 0) {
      const allBatchAssignments = await db
        .select({ id: assignments.id })
        .from(assignments)
        .where(inArray(assignments.batchId, batchIds));

      const submitted = await db
        .select({ assignmentId: assignmentSubmissions.assignmentId })
        .from(assignmentSubmissions)
        .where(eq(assignmentSubmissions.studentId, student.id));

      const submittedIds = new Set(submitted.map(s => s.assignmentId));
      pendingAssignments = allBatchAssignments.filter(a => !submittedIds.has(a.id)).length;
    }

    // Pending Fee count
    const pendingFeesRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(and(eq(payments.studentId, student.id), or(eq(payments.status, 'PENDING'), eq(payments.status, 'OVERDUE'))));

    // Upcoming schedules
    let upcomingClasses: any[] = [];
    if (batchIds.length > 0) {
      upcomingClasses = await db
        .select({
          id: schedules.id,
          courseTitle: courses.title,
          batchNumber: batches.batchNumber,
          dayOfWeek: schedules.dayOfWeek,
          startTime: schedules.startTime,
          endTime: schedules.endTime,
          room: schedules.room,
          campus: schedules.campus,
        })
        .from(schedules)
        .innerJoin(courses, eq(schedules.courseId, courses.id))
        .innerJoin(batches, eq(schedules.batchId, batches.id))
        .where(inArray(schedules.batchId, batchIds))
        .orderBy(asc(schedules.dayOfWeek), asc(schedules.startTime));
    }

    res.json({
      student: {
        id: student.id,
        studentId: student.studentId,
        rollNumber: student.rollNumber,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        campus: student.campus,
        status: student.status,
      },
      stats: {
        enrolledCoursesCount: enrolledCourses.length,
        attendancePercentage,
        attendanceRatio: `${presentAttendance}/${totalAttendance}`,
        pendingAssignments,
        pendingFeesCount: Number(pendingFeesRes[0]?.count || 0),
      },
      courses: enrolledCourses,
      upcomingClasses,
    });
  } catch (err: any) {
    console.error('Error fetching student dashboard:', err);
    res.status(500).json({ error: 'Failed to fetch student dashboard data' });
  }
});

// -------------------------------------------------------------
// 2. STUDENT COURSES
// -------------------------------------------------------------
studentRouter.get('/courses', async (req: AuthRequest, res) => {
  try {
    const student = await getVerifiedStudent(req.user!.id);
    if (!student) return res.status(404).json({ error: 'Student record not found' });

    const rows = await db
      .select({
        enrollmentId: enrollments.id,
        courseId: courses.id,
        courseCode: courses.code,
        courseTitle: courses.title,
        description: courses.description,
        durationWeeks: courses.durationWeeks,
        level: courses.level,
        syllabus: courses.syllabus,
        batchId: batches.id,
        batchNumber: batches.batchNumber,
        batchName: batches.name,
        campus: batches.campus,
        startDate: batches.startDate,
        progressPercentage: enrollments.progressPercentage,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(batches, eq(enrollments.batchId, batches.id))
      .where(eq(enrollments.studentId, student.id));

    res.json({ courses: rows });
  } catch (err: any) {
    console.error('Error fetching student courses:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// -------------------------------------------------------------
// 3. STUDENT ATTENDANCE HISTORY
// -------------------------------------------------------------
studentRouter.get('/attendance', async (req: AuthRequest, res) => {
  try {
    const student = await getVerifiedStudent(req.user!.id);
    if (!student) return res.status(404).json({ error: 'Student record not found' });

    const rows = await db
      .select({
        id: attendances.id,
        courseId: attendances.courseId,
        courseTitle: courses.title,
        batchNumber: batches.batchNumber,
        date: attendances.date,
        status: attendances.status,
        remarks: attendances.remarks,
        markedAt: attendances.markedAt,
      })
      .from(attendances)
      .innerJoin(courses, eq(attendances.courseId, courses.id))
      .innerJoin(batches, eq(attendances.batchId, batches.id))
      .where(eq(attendances.studentId, student.id))
      .orderBy(desc(attendances.date));

    const total = rows.length;
    const present = rows.filter(r => r.status === 'PRESENT').length;
    const absent = rows.filter(r => r.status === 'ABSENT').length;
    const leave = rows.filter(r => r.status === 'LEAVE').length;
    const late = rows.filter(r => r.status === 'LATE').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

    res.json({
      stats: { total, present, absent, leave, late, percentage },
      records: rows,
    });
  } catch (err: any) {
    console.error('Error fetching student attendance:', err);
    res.status(500).json({ error: 'Failed to fetch attendance history' });
  }
});

// -------------------------------------------------------------
// 4. STUDENT ASSIGNMENTS & SUBMISSION
// -------------------------------------------------------------
studentRouter.get('/assignments', async (req: AuthRequest, res) => {
  try {
    const student = await getVerifiedStudent(req.user!.id);
    if (!student) return res.status(404).json({ error: 'Student record not found' });

    const enrolledBatches = await db
      .select({ batchId: enrollments.batchId })
      .from(enrollments)
      .where(eq(enrollments.studentId, student.id));

    const batchIds = enrolledBatches.map(b => b.batchId);
    if (batchIds.length === 0) return res.json({ assignments: [] });

    const rows = await db
      .select({
        id: assignments.id,
        courseId: assignments.courseId,
        courseTitle: courses.title,
        courseCode: courses.code,
        batchId: assignments.batchId,
        batchNumber: batches.batchNumber,
        title: assignments.title,
        description: assignments.description,
        dueDate: assignments.dueDate,
        totalMarks: assignments.totalMarks,
        instructions: assignments.instructions,
      })
      .from(assignments)
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .innerJoin(batches, eq(assignments.batchId, batches.id))
      .where(inArray(assignments.batchId, batchIds))
      .orderBy(desc(assignments.dueDate));

    // Get submissions for this student
    const studentSubmissions = await db
      .select()
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.studentId, student.id));

    const subMap = new Map(studentSubmissions.map(s => [s.assignmentId, s]));

    const result = rows.map(a => {
      const sub = subMap.get(a.id);
      return {
        ...a,
        submission: sub ? {
          id: sub.id,
          content: sub.content,
          attachmentUrl: sub.attachmentUrl,
          submittedAt: sub.submittedAt,
          status: sub.status,
          obtainedMarks: sub.obtainedMarks,
          teacherFeedback: sub.teacherFeedback,
          gradedAt: sub.gradedAt,
        } : null,
      };
    });

    res.json({ assignments: result });
  } catch (err: any) {
    console.error('Error fetching student assignments:', err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Submit assignment
studentRouter.post('/assignments/:id/submit', async (req: AuthRequest, res) => {
  try {
    const student = await getVerifiedStudent(req.user!.id);
    if (!student) return res.status(404).json({ error: 'Student record not found' });

    const assignmentId = parseInt(req.params.id, 10);
    const { content, attachmentUrl } = req.body;
    if (!content && !attachmentUrl) {
      return res.status(400).json({ error: 'Please provide submission notes or a GitHub / Drive link' });
    }

    const asgn = await db.select().from(assignments).where(eq(assignments.id, assignmentId)).limit(1);
    if (asgn.length === 0) return res.status(404).json({ error: 'Assignment not found' });

    const isLate = new Date() > new Date(asgn[0].dueDate);
    const status = isLate ? 'LATE' : 'SUBMITTED';

    // Check if already submitted
    const existing = await db
      .select()
      .from(assignmentSubmissions)
      .where(and(eq(assignmentSubmissions.assignmentId, assignmentId), eq(assignmentSubmissions.studentId, student.id)))
      .limit(1);

    let saved;
    if (existing.length > 0) {
      [saved] = await db.update(assignmentSubmissions).set({
        content: content?.trim() || existing[0].content,
        attachmentUrl: attachmentUrl?.trim() || existing[0].attachmentUrl,
        status,
        submittedAt: new Date(),
      }).where(eq(assignmentSubmissions.id, existing[0].id)).returning();
    } else {
      [saved] = await db.insert(assignmentSubmissions).values({
        assignmentId,
        studentId: student.id,
        content: content?.trim() || 'Online Solution',
        attachmentUrl: attachmentUrl?.trim() || null,
        status,
        submittedAt: new Date(),
      }).returning();
    }

    res.json({ success: true, message: 'Assignment submitted successfully', submission: saved });
  } catch (err: any) {
    console.error('Error submitting assignment:', err);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// -------------------------------------------------------------
// 5. STUDENT QUIZZES & TAKING QUIZ
// -------------------------------------------------------------
studentRouter.get('/quizzes', async (req: AuthRequest, res) => {
  try {
    const student = await getVerifiedStudent(req.user!.id);
    if (!student) return res.status(404).json({ error: 'Student record not found' });

    const enrolledBatches = await db
      .select({ batchId: enrollments.batchId })
      .from(enrollments)
      .where(eq(enrollments.studentId, student.id));

    const batchIds = enrolledBatches.map(b => b.batchId);
    if (batchIds.length === 0) return res.json({ quizzes: [] });

    const quizList = await db
      .select({
        id: quizzes.id,
        courseId: quizzes.courseId,
        courseTitle: courses.title,
        batchId: quizzes.batchId,
        batchNumber: batches.batchNumber,
        title: quizzes.title,
        description: quizzes.description,
        durationMinutes: quizzes.durationMinutes,
        passingMarks: quizzes.passingMarks,
        totalMarks: quizzes.totalMarks,
        status: quizzes.status,
      })
      .from(quizzes)
      .innerJoin(courses, eq(quizzes.courseId, courses.id))
      .innerJoin(batches, eq(quizzes.batchId, batches.id))
      .where(and(inArray(quizzes.batchId, batchIds), eq(quizzes.status, 'PUBLISHED')));

    // Get attempts
    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.studentId, student.id));

    const attemptMap = new Map(attempts.map(a => [a.quizId, a]));

    const result = quizList.map(q => {
      const att = attemptMap.get(q.id);
      return {
        ...q,
        attempt: att ? {
          id: att.id,
          score: att.score,
          totalMarks: att.totalMarks,
          passed: att.passed,
          completedAt: att.completedAt,
        } : null,
      };
    });

    res.json({ quizzes: result });
  } catch (err: any) {
    console.error('Error fetching student quizzes:', err);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get Quiz Questions to Attempt (Masks correct answers!)
studentRouter.get('/quizzes/:id/start', async (req: AuthRequest, res) => {
  try {
    const student = await getVerifiedStudent(req.user!.id);
    if (!student) return res.status(404).json({ error: 'Student record not found' });

    const quizId = parseInt(req.params.id, 10);
    const quizRows = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
    if (quizRows.length === 0) return res.status(404).json({ error: 'Quiz not found' });

    const questions = await db
      .select({
        id: quizQuestions.id,
        questionText: quizQuestions.questionText,
        options: quizQuestions.options,
        marks: quizQuestions.marks,
      })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(asc(quizQuestions.id));

    res.json({
      quiz: {
        id: quizRows[0].id,
        title: quizRows[0].title,
        durationMinutes: quizRows[0].durationMinutes,
        totalMarks: quizRows[0].totalMarks,
      },
      questions,
    });
  } catch (err: any) {
    console.error('Error loading quiz:', err);
    res.status(500).json({ error: 'Failed to load quiz questions' });
  }
});

// Submit Quiz Attempt (Server validates answers)
studentRouter.post('/quizzes/:id/submit', async (req: AuthRequest, res) => {
  try {
    const student = await getVerifiedStudent(req.user!.id);
    if (!student) return res.status(404).json({ error: 'Student record not found' });

    const quizId = parseInt(req.params.id, 10);
    const { answers } = req.body; // map of { [questionId: number]: number }

    const quizRows = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
    if (quizRows.length === 0) return res.status(404).json({ error: 'Quiz not found' });
    const quiz = quizRows[0];

    const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId));

    let score = 0;
    let totalPossible = 0;

    questions.forEach(q => {
      totalPossible += q.marks;
      if (answers && answers[q.id] !== undefined && answers[q.id] === q.correctOptionIndex) {
        score += q.marks;
      }
    });

    const passed = score >= quiz.passingMarks;

    const [attempt] = await db.insert(quizAttempts).values({
      quizId,
      studentId: student.id,
      score,
      totalMarks: totalPossible || quiz.totalMarks,
      passed,
      answers: answers || {},
      completedAt: new Date(),
    }).returning();

    res.json({
      success: true,
      score,
      totalMarks: totalPossible || quiz.totalMarks,
      passed,
      message: passed ? 'Congratulations! You passed the quiz.' : 'Quiz completed. Keep practicing!',
      attempt,
    });
  } catch (err: any) {
    console.error('Error submitting quiz attempt:', err);
    res.status(500).json({ error: 'Failed to evaluate quiz' });
  }
});

// -------------------------------------------------------------
// 6. STUDENT FEES & PAYMENTS
// -------------------------------------------------------------
studentRouter.get('/payments', async (req: AuthRequest, res) => {
  try {
    const student = await getVerifiedStudent(req.user!.id);
    if (!student) return res.status(404).json({ error: 'Student record not found' });

    const rows = await db
      .select({
        id: payments.id,
        voucherId: payments.voucherId,
        courseTitle: courses.title,
        courseCode: courses.code,
        month: payments.month,
        amount: payments.amount,
        type: payments.type,
        dueDate: payments.dueDate,
        status: payments.status,
        paidDate: payments.paidDate,
        receiptNumber: payments.receiptNumber,
      })
      .from(payments)
      .innerJoin(courses, eq(payments.courseId, courses.id))
      .where(eq(payments.studentId, student.id))
      .orderBy(desc(payments.id));

    res.json({ vouchers: rows });
  } catch (err: any) {
    console.error('Error fetching student payments:', err);
    res.status(500).json({ error: 'Failed to fetch fee vouchers' });
  }
});

// -------------------------------------------------------------
// 7. STUDENT SCHEDULE & NOTIFICATIONS
// -------------------------------------------------------------
studentRouter.get('/schedule', async (req: AuthRequest, res) => {
  try {
    const student = await getVerifiedStudent(req.user!.id);
    if (!student) return res.status(404).json({ error: 'Student record not found' });

    const enrolledBatches = await db
      .select({ batchId: enrollments.batchId })
      .from(enrollments)
      .where(eq(enrollments.studentId, student.id));

    const batchIds = enrolledBatches.map(b => b.batchId);
    if (batchIds.length === 0) return res.json({ schedules: [] });

    const rows = await db
      .select({
        id: schedules.id,
        courseTitle: courses.title,
        batchNumber: batches.batchNumber,
        teacherName: users.fullName,
        dayOfWeek: schedules.dayOfWeek,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        room: schedules.room,
        campus: schedules.campus,
      })
      .from(schedules)
      .innerJoin(courses, eq(schedules.courseId, courses.id))
      .innerJoin(batches, eq(schedules.batchId, batches.id))
      .innerJoin(users, eq(schedules.teacherId, users.id))
      .where(inArray(schedules.batchId, batchIds))
      .orderBy(asc(schedules.dayOfWeek), asc(schedules.startTime));

    res.json({ schedules: rows });
  } catch (err: any) {
    console.error('Error fetching student schedule:', err);
    res.status(500).json({ error: 'Failed to fetch class schedule' });
  }
});

// -------------------------------------------------------------
// 8. NOTIFICATIONS & BROADCASTS FOR STUDENTS
// -------------------------------------------------------------
studentRouter.get('/notifications', async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        senderId: notifications.senderId,
        senderName: sql<string>`COALESCE(${notifications.senderName}, ${users.fullName}, 'Administration')`,
        senderRole: sql<string>`COALESCE(${notifications.senderRole}, ${users.role}::text, 'ADMIN')`,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        link: notifications.link,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.senderId, users.id))
      .where(eq(notifications.userId, req.user!.id))
      .orderBy(desc(notifications.id));

    const unreadCount = rows.filter(n => !n.isRead).length;

    res.json({
      notifications: rows,
      unreadCount,
    });
  } catch (err: any) {
    console.error('Error fetching student notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

const markNotificationAsReadHandler = async (req: AuthRequest, res: any) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid notification ID' });

    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, req.user!.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Notification not found or unauthorized' });
    }

    res.json({ success: true, notification: updated });
  } catch (err: any) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

studentRouter.post('/notifications/:id/read', markNotificationAsReadHandler);
studentRouter.patch('/notifications/:id/read', markNotificationAsReadHandler);

const markAllNotificationsAsReadHandler = async (req: AuthRequest, res: any) => {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, req.user!.id), eq(notifications.isRead, false)));

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

studentRouter.post('/notifications/mark-all-read', markAllNotificationsAsReadHandler);
studentRouter.post('/notifications/read-all', markAllNotificationsAsReadHandler);
studentRouter.patch('/notifications/read-all', markAllNotificationsAsReadHandler);
