import { Router } from 'express';
import { db } from '../db/index.ts';
import {
  users, admins, teachers, students, courses, batches, teacherAssignments,
  enrollments, attendances, assignments, assignmentSubmissions,
  quizzes, quizQuestions, quizAttempts, payments, schedules, notifications, announcements
} from '../db/schema.ts';
import { eq, and, or, sql, desc, asc, ilike, inArray } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth.ts';
import { hashPassword } from '../lib/auth/jwt.ts';

export const adminRouter = Router();

// -------------------------------------------------------------
// 1. TEACHERS MANAGEMENT (/api/admin/teachers)
// -------------------------------------------------------------
adminRouter.get('/teachers', async (req: AuthRequest, res) => {
  try {
    const query = req.query.query ? String(req.query.query).trim() : '';
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (query) {
      conditions.push(
        or(
          ilike(users.fullName, `%${query}%`),
          ilike(teachers.teacherCode, `%${query}%`),
          ilike(users.email, `%${query}%`),
          ilike(teachers.specialization, `%${query}%`)
        )!
      );
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalCountRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(whereClause);
    const totalCount = Number(totalCountRes[0]?.count || 0);

    const rows = await db
      .select({
        id: teachers.id,
        userId: users.id,
        teacherCode: teachers.teacherCode,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        isActive: users.isActive,
        qualification: teachers.qualification,
        specialization: teachers.specialization,
        bio: teachers.bio,
        joiningDate: teachers.joiningDate,
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(whereClause)
      .orderBy(asc(teachers.teacherCode))
      .limit(limit)
      .offset(offset);

    // Get assigned courses & batches for each teacher
    const teachersWithAssignments = await Promise.all(
      rows.map(async (t) => {
        const asgns = await db
          .select({
            courseTitle: courses.title,
            courseCode: courses.code,
            batchNumber: batches.batchNumber,
          })
          .from(teacherAssignments)
          .innerJoin(courses, eq(teacherAssignments.courseId, courses.id))
          .innerJoin(batches, eq(teacherAssignments.batchId, batches.id))
          .where(eq(teacherAssignments.teacherId, t.id));

        return {
          ...t,
          assignedCount: asgns.length,
          assignments: asgns,
        };
      })
    );

    res.json({
      teachers: teachersWithAssignments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err: any) {
    console.error('Error fetching teachers:', err);
    res.status(500).json({ error: 'Failed to fetch teachers registry' });
  }
});

// Create Teacher (Atomic User + Teacher Profile)
adminRouter.post('/teachers', async (req: AuthRequest, res) => {
  try {
    const { fullName, email, phone, qualification, specialization, bio, initialPassword } = req.body;
    if (!fullName || !email) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }

    // Uniqueness checks
    const existingEmail = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: 'A user with this email address already exists.' });
    }

    // Auto-generate teacher code: TCH-00X
    const countRes = await db.select({ count: sql<number>`count(*)` }).from(teachers);
    const nextNum = Number(countRes[0]?.count || 0) + 1;
    const teacherCode = `TCH-${nextNum.toString().padStart(3, '0')}`;

    const passwordHash = await hashPassword(initialPassword || 'Academy123!');

    // 1. Create User
    const [newUser] = await db.insert(users).values({
      uid: `usr-${teacherCode.toLowerCase()}`,
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      phone: phone?.trim() || null,
      role: 'TEACHER',
      passwordHash,
      isActive: true,
    }).returning();

    // 2. Create Teacher
    const [newTeacher] = await db.insert(teachers).values({
      userId: newUser.id,
      teacherCode,
      qualification: qualification?.trim() || 'MS Computer Science',
      specialization: specialization?.trim() || 'Software Engineering',
      bio: bio?.trim() || null,
    }).returning();

    res.status(201).json({
      success: true,
      teacher: {
        ...newTeacher,
        fullName: newUser.fullName,
        email: newUser.email,
      },
    });
  } catch (err: any) {
    console.error('Error creating teacher:', err);
    res.status(500).json({ error: 'Failed to create faculty member' });
  }
});

// Edit Teacher
adminRouter.put('/teachers/:id', async (req: AuthRequest, res) => {
  try {
    const teacherId = parseInt(req.params.id, 10);
    const teacherRows = await db.select().from(teachers).where(eq(teachers.id, teacherId)).limit(1);
    if (teacherRows.length === 0) return res.status(404).json({ error: 'Teacher not found' });
    const teacher = teacherRows[0];

    const { fullName, phone, qualification, specialization, bio, isActive } = req.body;

    if (fullName || phone !== undefined || isActive !== undefined) {
      await db.update(users).set({
        fullName: fullName ? fullName.trim() : undefined,
        phone: phone !== undefined ? phone?.trim() : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        updatedAt: new Date(),
      }).where(eq(users.id, teacher.userId));
    }

    const [updatedTeacher] = await db.update(teachers).set({
      qualification: qualification !== undefined ? qualification?.trim() : teacher.qualification,
      specialization: specialization !== undefined ? specialization?.trim() : teacher.specialization,
      bio: bio !== undefined ? bio?.trim() : teacher.bio,
    }).where(eq(teachers.id, teacherId)).returning();

    res.json({ success: true, teacher: updatedTeacher });
  } catch (err: any) {
    console.error('Error updating teacher:', err);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
});

// Assign Course/Batch to Teacher
adminRouter.post('/teachers/:id/assign', async (req: AuthRequest, res) => {
  try {
    const teacherId = parseInt(req.params.id, 10);
    const { courseId, batchId } = req.body;
    if (!courseId || !batchId) {
      return res.status(400).json({ error: 'Course and Batch are required' });
    }

    // Check if assignment already exists
    const existing = await db
      .select()
      .from(teacherAssignments)
      .where(and(
        eq(teacherAssignments.teacherId, teacherId),
        eq(teacherAssignments.courseId, courseId),
        eq(teacherAssignments.batchId, batchId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return res.json({ success: true, message: 'Teacher is already assigned to this batch.' });
    }

    await db.insert(teacherAssignments).values({
      teacherId,
      courseId,
      batchId,
    });

    res.status(201).json({ success: true, message: 'Faculty assigned to batch successfully' });
  } catch (err: any) {
    console.error('Error assigning teacher:', err);
    res.status(500).json({ error: 'Failed to assign teacher to batch' });
  }
});

// -------------------------------------------------------------
// 2. COURSES MANAGEMENT (/api/admin/courses)
// -------------------------------------------------------------
adminRouter.get('/courses', async (req: AuthRequest, res) => {
  try {
    const rows = await db.select().from(courses).orderBy(asc(courses.code));

    const coursesWithStats = await Promise.all(
      rows.map(async (c) => {
        const batchCountRes = await db.select({ count: sql<number>`count(*)` }).from(batches).where(eq(batches.courseId, c.id));
        const studentCountRes = await db.select({ count: sql<number>`count(*)` }).from(enrollments).where(eq(enrollments.courseId, c.id));
        return {
          ...c,
          batchCount: Number(batchCountRes[0]?.count || 0),
          studentCount: Number(studentCountRes[0]?.count || 0),
        };
      })
    );

    res.json({ courses: coursesWithStats });
  } catch (err: any) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

adminRouter.post('/courses', async (req: AuthRequest, res) => {
  try {
    const { code, title, description, durationWeeks, level, syllabus } = req.body;
    if (!code || !title) return res.status(400).json({ error: 'Course code and title are required' });

    const existing = await db.select().from(courses).where(eq(courses.code, code.trim().toUpperCase())).limit(1);
    if (existing.length > 0) return res.status(400).json({ error: 'A course with this code already exists' });

    const [newCourse] = await db.insert(courses).values({
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description?.trim() || null,
      durationWeeks: durationWeeks ? parseInt(String(durationWeeks), 10) : 16,
      level: level || 'Intermediate',
      syllabus: syllabus?.trim() || null,
      isActive: true,
    }).returning();

    res.status(201).json({ success: true, course: newCourse });
  } catch (err: any) {
    console.error('Error creating course:', err);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

adminRouter.put('/courses/:id', async (req: AuthRequest, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    const { code, title, description, durationWeeks, level, syllabus, isActive } = req.body;

    const [updated] = await db.update(courses).set({
      code: code ? code.trim().toUpperCase() : undefined,
      title: title ? title.trim() : undefined,
      description: description !== undefined ? description?.trim() : undefined,
      durationWeeks: durationWeeks ? parseInt(String(durationWeeks), 10) : undefined,
      level: level || undefined,
      syllabus: syllabus !== undefined ? syllabus?.trim() : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      updatedAt: new Date(),
    }).where(eq(courses.id, courseId)).returning();

    res.json({ success: true, course: updated });
  } catch (err: any) {
    console.error('Error updating course:', err);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// -------------------------------------------------------------
// 3. BATCHES MANAGEMENT (/api/admin/batches)
// -------------------------------------------------------------
adminRouter.get('/batches', async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select({
        id: batches.id,
        courseId: batches.courseId,
        courseTitle: courses.title,
        courseCode: courses.code,
        batchNumber: batches.batchNumber,
        name: batches.name,
        campus: batches.campus,
        capacity: batches.capacity,
        startDate: batches.startDate,
        endDate: batches.endDate,
        isActive: batches.isActive,
      })
      .from(batches)
      .innerJoin(courses, eq(batches.courseId, courses.id))
      .orderBy(desc(batches.id));

    const batchesWithCounts = await Promise.all(
      rows.map(async (b) => {
        const studentCount = await db.select({ count: sql<number>`count(*)` }).from(enrollments).where(eq(enrollments.batchId, b.id));
        const assignedTeachers = await db
          .select({ fullName: users.fullName, teacherCode: teachers.teacherCode })
          .from(teacherAssignments)
          .innerJoin(teachers, eq(teacherAssignments.teacherId, teachers.id))
          .innerJoin(users, eq(teachers.userId, users.id))
          .where(eq(teacherAssignments.batchId, b.id));

        return {
          ...b,
          enrolledStudentsCount: Number(studentCount[0]?.count || 0),
          instructors: assignedTeachers,
        };
      })
    );

    res.json({ batches: batchesWithCounts });
  } catch (err: any) {
    console.error('Error fetching batches:', err);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

adminRouter.post('/batches', async (req: AuthRequest, res) => {
  try {
    const { courseId, batchNumber, name, campus, capacity, startDate, teacherId } = req.body;
    if (!courseId || !batchNumber || !name || !startDate) {
      return res.status(400).json({ error: 'Course, Batch Number, Name, and Start Date are required' });
    }

    const [newBatch] = await db.insert(batches).values({
      courseId: parseInt(String(courseId), 10),
      batchNumber: String(batchNumber).trim(),
      name: name.trim(),
      campus: campus?.trim() || 'Main Campus',
      capacity: capacity ? parseInt(String(capacity), 10) : 40,
      startDate: new Date(startDate),
      isActive: true,
    }).returning();

    // If teacher provided, assign immediately
    if (teacherId) {
      await db.insert(teacherAssignments).values({
        teacherId: parseInt(String(teacherId), 10),
        courseId: parseInt(String(courseId), 10),
        batchId: newBatch.id,
      });
    }

    res.status(201).json({ success: true, batch: newBatch });
  } catch (err: any) {
    console.error('Error creating batch:', err);
    res.status(500).json({ error: 'Failed to create batch' });
  }
});

adminRouter.put('/batches/:id', async (req: AuthRequest, res) => {
  try {
    const batchId = parseInt(req.params.id, 10);
    const { batchNumber, name, campus, capacity, startDate, endDate, isActive } = req.body;

    const [updated] = await db.update(batches).set({
      batchNumber: batchNumber !== undefined ? String(batchNumber).trim() : undefined,
      name: name !== undefined ? name.trim() : undefined,
      campus: campus !== undefined ? campus.trim() : undefined,
      capacity: capacity !== undefined ? parseInt(String(capacity), 10) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
    }).where(eq(batches.id, batchId)).returning();

    res.json({ success: true, batch: updated });
  } catch (err: any) {
    console.error('Error updating batch:', err);
    res.status(500).json({ error: 'Failed to update batch' });
  }
});

// -------------------------------------------------------------
// 4. ADMIN ATTENDANCE MANAGEMENT (/api/admin/attendance)
// -------------------------------------------------------------
adminRouter.get('/attendance', async (req: AuthRequest, res) => {
  try {
    const date = String(req.query.date || new Date().toISOString().split('T')[0]);
    const courseId = req.query.courseId ? parseInt(String(req.query.courseId), 10) : null;
    const batchId = req.query.batchId ? parseInt(String(req.query.batchId), 10) : null;

    const conditions = [eq(attendances.date, date)];
    if (courseId) conditions.push(eq(attendances.courseId, courseId));
    if (batchId) conditions.push(eq(attendances.batchId, batchId));

    const rows = await db
      .select({
        id: attendances.id,
        studentId: students.id,
        studentName: students.fullName,
        studentCode: students.studentId,
        rollNumber: students.rollNumber,
        courseTitle: courses.title,
        batchNumber: batches.batchNumber,
        date: attendances.date,
        status: attendances.status,
        remarks: attendances.remarks,
        markedAt: attendances.markedAt,
      })
      .from(attendances)
      .innerJoin(students, eq(attendances.studentId, students.id))
      .innerJoin(courses, eq(attendances.courseId, courses.id))
      .innerJoin(batches, eq(attendances.batchId, batches.id))
      .where(and(...conditions))
      .orderBy(asc(students.rollNumber));

    // Attendance stats
    const total = rows.length;
    const present = rows.filter(r => r.status === 'PRESENT').length;
    const absent = rows.filter(r => r.status === 'ABSENT').length;
    const leave = rows.filter(r => r.status === 'LEAVE').length;
    const late = rows.filter(r => r.status === 'LATE').length;

    res.json({
      date,
      stats: { total, present, absent, leave, late },
      records: rows,
    });
  } catch (err: any) {
    console.error('Error fetching admin attendance:', err);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// Admin Correct Attendance Record
adminRouter.put('/attendance/:id', async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, remarks } = req.body;
    if (!['PRESENT', 'ABSENT', 'LEAVE', 'LATE'].includes(status)) {
      return res.status(400).json({ error: 'Valid status required' });
    }

    const [updated] = await db.update(attendances).set({
      status,
      remarks: remarks !== undefined ? remarks : undefined,
    }).where(eq(attendances.id, id)).returning();

    res.json({ success: true, record: updated });
  } catch (err: any) {
    console.error('Error updating attendance:', err);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

// -------------------------------------------------------------
// 5. PAYMENTS & FEES MANAGEMENT (/api/admin/payments)
// -------------------------------------------------------------
adminRouter.get('/payments', async (req: AuthRequest, res) => {
  try {
    const query = req.query.query ? String(req.query.query).trim() : '';
    const statusFilter = req.query.status ? String(req.query.status) : '';
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (statusFilter) conditions.push(eq(payments.status, statusFilter as any));
    if (query) {
      conditions.push(
        or(
          ilike(students.fullName, `%${query}%`),
          ilike(students.studentId, `%${query}%`),
          ilike(payments.voucherId, `%${query}%`),
          ilike(payments.receiptNumber, `%${query}%`)
        )!
      );
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalCountRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .innerJoin(students, eq(payments.studentId, students.id))
      .where(whereClause);
    const totalCount = Number(totalCountRes[0]?.count || 0);

    const rows = await db
      .select({
        id: payments.id,
        voucherId: payments.voucherId,
        studentId: students.id,
        studentName: students.fullName,
        studentCode: students.studentId,
        rollNumber: students.rollNumber,
        courseId: payments.courseId,
        courseTitle: courses.title,
        month: payments.month,
        amount: payments.amount,
        type: payments.type,
        dueDate: payments.dueDate,
        status: payments.status,
        paidDate: payments.paidDate,
        receiptNumber: payments.receiptNumber,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .innerJoin(students, eq(payments.studentId, students.id))
      .innerJoin(courses, eq(payments.courseId, courses.id))
      .where(whereClause)
      .orderBy(desc(payments.id))
      .limit(limit)
      .offset(offset);

    // Stats
    const totalRevenueRes = await db
      .select({
        totalCollected: sql<number>`sum(case when status = 'PAID' then amount else 0 end)`,
        totalPending: sql<number>`sum(case when status = 'PENDING' then amount else 0 end)`,
        totalOverdue: sql<number>`sum(case when status = 'OVERDUE' then amount else 0 end)`,
      })
      .from(payments);

    res.json({
      payments: rows,
      stats: {
        totalCollected: Number(totalRevenueRes[0]?.totalCollected || 0),
        totalPending: Number(totalRevenueRes[0]?.totalPending || 0),
        totalOverdue: Number(totalRevenueRes[0]?.totalOverdue || 0),
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err: any) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Record or Generate Fee Voucher
adminRouter.post('/payments', async (req: AuthRequest, res) => {
  try {
    const { studentId, courseId, month, amount, type, dueDate } = req.body;
    if (!studentId || !courseId || !month || !amount || !dueDate) {
      return res.status(400).json({ error: 'Student, course, month, amount, and due date are required' });
    }

    const voucherId = `VCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const [newPayment] = await db.insert(payments).values({
      studentId: parseInt(String(studentId), 10),
      courseId: parseInt(String(courseId), 10),
      voucherId,
      month: month.trim(),
      amount: parseInt(String(amount), 10),
      type: type || 'Tuition Fee',
      dueDate: String(dueDate),
      status: 'PENDING',
    }).returning();

    res.status(201).json({ success: true, payment: newPayment });
  } catch (err: any) {
    console.error('Error creating fee voucher:', err);
    res.status(500).json({ error: 'Failed to create fee voucher' });
  }
});

// Record Payment (Mark Paid / Pending / Overdue)
adminRouter.post('/payments/:id/record', async (req: AuthRequest, res) => {
  try {
    const paymentId = parseInt(req.params.id, 10);
    const { status, receiptNumber, paidDate } = req.body;

    const [updated] = await db.update(payments).set({
      status: status || 'PAID',
      receiptNumber: receiptNumber?.trim() || `REC-${Date.now().toString().slice(-6)}`,
      paidDate: paidDate || new Date().toISOString().split('T')[0],
    }).where(eq(payments.id, paymentId)).returning();

    res.json({ success: true, message: 'Fee status updated successfully', payment: updated });
  } catch (err: any) {
    console.error('Error recording payment:', err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// -------------------------------------------------------------
// 6. SCHEDULES MANAGEMENT (/api/admin/schedules)
// -------------------------------------------------------------
adminRouter.get('/schedules', async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select({
        id: schedules.id,
        courseId: schedules.courseId,
        courseTitle: courses.title,
        courseCode: courses.code,
        batchId: schedules.batchId,
        batchNumber: batches.batchNumber,
        batchName: batches.name,
        teacherId: schedules.teacherId,
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
      .innerJoin(teachers, eq(schedules.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .orderBy(asc(schedules.dayOfWeek), asc(schedules.startTime));

    res.json({ schedules: rows });
  } catch (err: any) {
    console.error('Error fetching schedules:', err);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

adminRouter.post('/schedules', async (req: AuthRequest, res) => {
  try {
    const { courseId, batchId, teacherId, dayOfWeek, startTime, endTime, room, campus } = req.body;
    if (!courseId || !batchId || !teacherId || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ error: 'All schedule timing fields are required' });
    }

    const [newSchedule] = await db.insert(schedules).values({
      courseId: parseInt(String(courseId), 10),
      batchId: parseInt(String(batchId), 10),
      teacherId: parseInt(String(teacherId), 10),
      dayOfWeek: String(dayOfWeek).trim(),
      startTime: String(startTime).trim(),
      endTime: String(endTime).trim(),
      room: room?.trim() || 'Lab 4',
      campus: campus?.trim() || 'Main Campus',
    }).returning();

    res.status(201).json({ success: true, schedule: newSchedule });
  } catch (err: any) {
    console.error('Error creating schedule:', err);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

adminRouter.delete('/schedules/:id', async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(schedules).where(eq(schedules.id, id));
    res.json({ success: true, message: 'Class schedule removed' });
  } catch (err: any) {
    console.error('Error deleting schedule:', err);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

// -------------------------------------------------------------
// 7. ACADEMIC REPORTS (/api/admin/reports)
// -------------------------------------------------------------
adminRouter.get('/reports', async (req: AuthRequest, res) => {
  try {
    // 1. Overall Student Enrollment Statistics by Lifecycle Status
    const statusStats = await db
      .select({
        status: students.status,
        count: sql<number>`count(*)`,
      })
      .from(students)
      .groupBy(students.status);

    // 2. Attendance Summary
    const attStats = await db
      .select({
        total: sql<number>`count(*)`,
        present: sql<number>`count(*) filter (where status = 'PRESENT')`,
        absent: sql<number>`count(*) filter (where status = 'ABSENT')`,
        leave: sql<number>`count(*) filter (where status = 'LEAVE')`,
        late: sql<number>`count(*) filter (where status = 'LATE')`,
      })
      .from(attendances);

    // 3. Fee Collection Summary
    const feeStats = await db
      .select({
        totalVouchers: sql<number>`count(*)`,
        paidVouchers: sql<number>`count(*) filter (where status = 'PAID')`,
        pendingVouchers: sql<number>`count(*) filter (where status = 'PENDING')`,
        totalAmountPaid: sql<number>`sum(case when status = 'PAID' then amount else 0 end)`,
        totalAmountPending: sql<number>`sum(case when status = 'PENDING' then amount else 0 end)`,
      })
      .from(payments);

    // 4. Course Enrollment Counts
    const courseStats = await db
      .select({
        courseTitle: courses.title,
        courseCode: courses.code,
        studentCount: sql<number>`count(${enrollments.id})`,
      })
      .from(courses)
      .leftJoin(enrollments, eq(courses.id, enrollments.courseId))
      .groupBy(courses.id, courses.title, courses.code);

    res.json({
      statusStats,
      attendanceSummary: attStats[0] || { total: 0, present: 0, absent: 0, leave: 0, late: 0 },
      feeSummary: feeStats[0] || { totalVouchers: 0, totalAmountPaid: 0, totalAmountPending: 0 },
      courseStats,
    });
  } catch (err: any) {
    console.error('Error generating reports:', err);
    res.status(500).json({ error: 'Failed to generate academic reports' });
  }
});

// -------------------------------------------------------------
// 8. NOTIFICATIONS & BROADCASTS (/api/admin/notifications)
// -------------------------------------------------------------
adminRouter.get('/notifications', async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select({
        id: notifications.id,
        recipientName: users.fullName,
        recipientRole: users.role,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .innerJoin(users, eq(notifications.userId, users.id))
      .orderBy(desc(notifications.id))
      .limit(50);

    res.json({ notifications: rows });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// -------------------------------------------------------------
// 8. NOTIFICATIONS & BROADCASTS (/api/admin/notifications)
// -------------------------------------------------------------
async function dispatchAdminBroadcast(
  authorUser: { id: number; fullName: string | null; role: any },
  payload: {
    title: string;
    message?: string;
    content?: string;
    target?: string;
    targetType?: string;
    targetAudience?: string;
    targetRole?: string;
    courseId?: number | string | null;
    batchId?: number | string | null;
    studentId?: number | string | null;
  }
) {
  const bodyMessage = (payload.message || payload.content || '').trim();
  const title = (payload.title || '').trim();
  const rawTarget = (payload.targetType || payload.target || payload.targetAudience || 'ALL_STUDENTS').toUpperCase();
  const cId = payload.courseId ? parseInt(String(payload.courseId), 10) : null;
  const bId = payload.batchId ? parseInt(String(payload.batchId), 10) : null;
  const sId = payload.studentId ? parseInt(String(payload.studentId), 10) : null;

  let targetUsers: { id: number }[] = [];
  let assignedRole: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN' | null = 'STUDENT';
  let targetCourseId: number | null = cId;
  let targetBatchId: number | null = bId;

  if (rawTarget === 'INDIVIDUAL_STUDENT' && sId) {
    const stu = await db
      .select({ userId: students.userId, studentId: students.id })
      .from(students)
      .where(or(eq(students.id, sId), eq(students.userId, sId)))
      .limit(1);

    if (stu.length > 0 && stu[0].userId) {
      targetUsers = [{ id: stu[0].userId }];
      const enr = await db
        .select({ courseId: enrollments.courseId, batchId: enrollments.batchId })
        .from(enrollments)
        .where(eq(enrollments.studentId, stu[0].studentId))
        .limit(1);
      if (enr.length > 0) {
        if (!targetCourseId) targetCourseId = enr[0].courseId;
        if (!targetBatchId) targetBatchId = enr[0].batchId;
      }
    }
    assignedRole = 'STUDENT';
  } else if ((rawTarget === 'BATCH' || bId) && bId) {
    targetBatchId = bId;
    const batchStudents = await db
      .select({ userId: students.userId, courseId: enrollments.courseId })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .where(eq(enrollments.batchId, bId));

    if (batchStudents.length > 0 && !targetCourseId) {
      targetCourseId = batchStudents[0].courseId;
    }
    const uniqueUserIds = [...new Set(batchStudents.filter(s => s.userId !== null).map(s => s.userId!))];
    targetUsers = uniqueUserIds.map(id => ({ id }));
    assignedRole = 'STUDENT';
  } else if ((rawTarget === 'COURSE' || cId) && cId) {
    targetCourseId = cId;
    const courseStudents = await db
      .select({ userId: students.userId })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .where(eq(enrollments.courseId, cId));

    const uniqueUserIds = [...new Set(courseStudents.filter(s => s.userId !== null).map(s => s.userId!))];
    targetUsers = uniqueUserIds.map(id => ({ id }));
    assignedRole = 'STUDENT';
  } else if (rawTarget === 'ALL_TEACHERS' || rawTarget === 'TEACHERS' || payload.targetRole === 'TEACHER') {
    targetUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, 'TEACHER'), eq(users.isActive, true)));
    assignedRole = 'TEACHER';
  } else if (rawTarget === 'ALL_CAMPUS' || rawTarget === 'ALL') {
    targetUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(and(inArray(users.role, ['STUDENT', 'TEACHER']), eq(users.isActive, true)));
    assignedRole = null;
  } else {
    // Default: ALL_STUDENTS
    targetUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, 'STUDENT'), eq(users.isActive, true)));
    assignedRole = 'STUDENT';
  }

  // 1. Create announcement entry
  const [newAnnounce] = await db.insert(announcements).values({
    authorId: authorUser.id,
    title,
    content: bodyMessage,
    targetRole: assignedRole,
    courseId: targetCourseId,
    batchId: targetBatchId,
  }).returning();

  // 2. Fan-out to notifications table
  if (targetUsers.length > 0) {
    const notifValues = targetUsers.map(u => ({
      userId: u.id,
      senderId: authorUser.id,
      senderName: authorUser.fullName || 'Academy Administration',
      senderRole: (authorUser.role as string) || 'ADMIN',
      title,
      message: bodyMessage,
      type: 'ANNOUNCEMENT' as const,
      link: '/student/notifications',
      isRead: false,
    }));
    await db.insert(notifications).values(notifValues);
  }

  return { announcement: newAnnounce, recipientCount: targetUsers.length };
}

adminRouter.get('/notifications', async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select({
        id: notifications.id,
        recipientName: users.fullName,
        recipientRole: users.role,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .innerJoin(users, eq(notifications.userId, users.id))
      .orderBy(desc(notifications.id))
      .limit(50);

    res.json({ notifications: rows });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Admin Broadcast Notification
adminRouter.post('/notifications/broadcast', async (req: AuthRequest, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'Title and message are required' });

    const result = await dispatchAdminBroadcast(
      { id: req.user!.id, fullName: req.user!.fullName, role: req.user!.role },
      req.body
    );

    res.json({
      success: true,
      message: `Notification broadcasted to ${result.recipientCount} recipients.`,
      announcement: result.announcement,
      recipientCount: result.recipientCount,
    });
  } catch (err: any) {
    console.error('Error broadcasting notification:', err);
    res.status(500).json({ error: 'Failed to broadcast notification' });
  }
});

// -------------------------------------------------------------
// 9. SYSTEM SETTINGS (/api/admin/settings)
// -------------------------------------------------------------
// In-memory persistent cache fallback for settings metadata
let cachedSettings = {
  academyName: 'Saylani Academy of Modern Sciences',
  logoUrl: '',
  phone: '+92 21 111 729 526',
  email: 'info@academy.edu',
  address: 'Main IT Campus, University Road, Karachi, Pakistan',
  academicYear: '2026-2027',
  attendanceThreshold: 75,
  defaultPageSize: 10,
  smsNotifications: true,
  emailNotifications: true,
  autoVoucherGeneration: true,
};

adminRouter.get('/settings', async (req: AuthRequest, res) => {
  res.json({ settings: cachedSettings });
});

adminRouter.put('/settings', async (req: AuthRequest, res) => {
  try {
    const updates = req.body;
    cachedSettings = {
      ...cachedSettings,
      ...updates,
    };
    res.json({ success: true, message: 'Academy settings updated successfully', settings: cachedSettings });
  } catch (err: any) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// -------------------------------------------------------------
// 10. ANNOUNCEMENTS (/api/admin/announcements)
// -------------------------------------------------------------
adminRouter.get('/announcements', async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        message: announcements.content,
        content: announcements.content,
        targetRole: announcements.targetRole,
        courseId: announcements.courseId,
        courseTitle: courses.title,
        batchId: announcements.batchId,
        batchName: batches.name,
        targetAudience: sql<string>`CASE 
          WHEN ${announcements.batchId} IS NOT NULL THEN 'Batch: ' || ${batches.name}
          WHEN ${announcements.courseId} IS NOT NULL THEN 'Course: ' || ${courses.title}
          WHEN ${announcements.targetRole} = 'STUDENT' THEN 'All Students'
          WHEN ${announcements.targetRole} = 'TEACHER' THEN 'Faculty Only'
          WHEN ${announcements.targetRole} = 'ADMIN' THEN 'Administration'
          ELSE 'Entire Campus'
        END`,
        authorName: users.fullName,
        createdAt: sql<string>`to_char(${announcements.createdAt}, 'YYYY-MM-DD HH24:MI')`,
      })
      .from(announcements)
      .innerJoin(users, eq(announcements.authorId, users.id))
      .leftJoin(courses, eq(announcements.courseId, courses.id))
      .leftJoin(batches, eq(announcements.batchId, batches.id))
      .orderBy(desc(announcements.id));

    res.json({ announcements: rows });
  } catch (err: any) {
    console.error('Error fetching admin announcements:', err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

adminRouter.post('/announcements', async (req: AuthRequest, res) => {
  try {
    const { title, message, content } = req.body;
    const bodyContent = content || message;
    if (!title || !bodyContent) {
      return res.status(400).json({ error: 'Title and announcement message are required' });
    }

    const result = await dispatchAdminBroadcast(
      { id: req.user!.id, fullName: req.user!.fullName, role: req.user!.role },
      req.body
    );

    res.status(201).json({
      success: true,
      announcement: result.announcement,
      recipientCount: result.recipientCount,
    });
  } catch (err: any) {
    console.error('Error creating admin announcement:', err);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// -------------------------------------------------------------
// 11. EXPORT ROSTER (/api/admin/export/students)
// -------------------------------------------------------------
adminRouter.get('/export/students', async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select({
        studentId: students.studentId,
        rollNumber: students.rollNumber,
        fullName: students.fullName,
        fatherName: students.fatherName,
        phone: students.phone,
        email: students.email,
        status: students.status,
        isActivated: students.isActivated,
        createdAt: sql<string>`to_char(${students.createdAt}, 'YYYY-MM-DD')`,
      })
      .from(students)
      .orderBy(asc(students.id));

    const header = 'Student ID,Roll Number,Full Name,Father Name,Phone,Email,Status,Activated,Admission Date\n';
    const csvRows = rows.map((r) =>
      `"${r.studentId}","${r.rollNumber}","${r.fullName}","${r.fatherName}","${r.phone}","${r.email}","${r.status}","${r.isActivated ? 'Yes' : 'No'}","${r.createdAt}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students_roster.csv"');
    res.send(header + csvRows);
  } catch (err: any) {
    console.error('Error exporting student roster:', err);
    res.status(500).json({ error: 'Failed to export student roster' });
  }
});
