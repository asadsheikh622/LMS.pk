import { Router } from 'express';
import { db } from '../db/index.ts';
import {
  teachers, courses, batches, teacherAssignments, enrollments,
  students, attendances, assignments, assignmentSubmissions,
  quizzes, quizQuestions, quizAttempts, schedules, notifications, announcements, users
} from '../db/schema.ts';
import { eq, and, or, sql, desc, asc, ilike, inArray } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth.ts';

export const teacherRouter = Router();

// Helper to get verified teacher profile for authenticated user
export async function getVerifiedTeacher(userId: number) {
  const teacherRows = await db.select().from(teachers).where(eq(teachers.userId, userId)).limit(1);
  if (teacherRows.length === 0) return null;
  return teacherRows[0];
}

// -------------------------------------------------------------
// 1. TEACHER DASHBOARD STATS & RECENT OVERVIEW
// -------------------------------------------------------------
teacherRouter.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    // Fetch courses & batches assigned to this teacher
    const assignedRows = await db
      .select({
        courseId: teacherAssignments.courseId,
        batchId: teacherAssignments.batchId,
        courseTitle: courses.title,
        courseCode: courses.code,
        batchNumber: batches.batchNumber,
        batchName: batches.name,
      })
      .from(teacherAssignments)
      .innerJoin(courses, eq(teacherAssignments.courseId, courses.id))
      .innerJoin(batches, eq(teacherAssignments.batchId, batches.id))
      .where(eq(teacherAssignments.teacherId, teacher.id));

    const batchIds = assignedRows.map(r => r.batchId);
    const courseIds = [...new Set(assignedRows.map(r => r.courseId))];

    let totalStudents = 0;
    if (batchIds.length > 0) {
      const studentCountResult = await db
        .select({ count: sql<number>`count(distinct ${enrollments.studentId})` })
        .from(enrollments)
        .where(inArray(enrollments.batchId, batchIds));
      totalStudents = Number(studentCountResult[0]?.count || 0);
    }

    // Today's attendance calculation
    const today = new Date().toISOString().split('T')[0];
    let presentToday = 0;
    let absentToday = 0;
    let leaveToday = 0;

    if (batchIds.length > 0) {
      const todayAttendance = await db
        .select({
          status: attendances.status,
          count: sql<number>`count(*)`,
        })
        .from(attendances)
        .where(and(eq(attendances.date, today), inArray(attendances.batchId, batchIds)))
        .groupBy(attendances.status);

      todayAttendance.forEach(a => {
        if (a.status === 'PRESENT') presentToday = Number(a.count);
        if (a.status === 'ABSENT') absentToday = Number(a.count);
        if (a.status === 'LEAVE') leaveToday = Number(a.count);
      });
    }

    // Assignments to grade
    const pendingGradingResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(assignmentSubmissions)
      .innerJoin(assignments, eq(assignmentSubmissions.assignmentId, assignments.id))
      .where(and(eq(assignments.teacherId, teacher.id), eq(assignmentSubmissions.status, 'SUBMITTED')));
    const assignmentsToGrade = Number(pendingGradingResult[0]?.count || 0);

    // Scheduled quizzes
    const quizzesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(quizzes)
      .where(and(eq(quizzes.teacherId, teacher.id), eq(quizzes.status, 'PUBLISHED')));
    const scheduledQuizzes = Number(quizzesResult[0]?.count || 0);

    // Upcoming classes
    const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const upcomingSchedules = await db
      .select({
        id: schedules.id,
        courseTitle: courses.title,
        courseCode: courses.code,
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
      .where(eq(schedules.teacherId, teacher.id))
      .orderBy(asc(schedules.id));

    res.json({
      teacher: {
        id: teacher.id,
        teacherCode: teacher.teacherCode,
        specialization: teacher.specialization,
        qualification: teacher.qualification,
        bio: teacher.bio,
      },
      stats: {
        totalStudents,
        presentToday,
        absentToday,
        leaveToday,
        assignmentsToGrade,
        scheduledQuizzes,
        activeCourses: courseIds.length,
        upcomingClassesCount: upcomingSchedules.length,
      },
      assignedCourses: assignedRows,
      upcomingSchedules,
    });
  } catch (err: any) {
    console.error('Teacher dashboard error:', err);
    res.status(500).json({ error: 'Failed to load teacher dashboard' });
  }
});

// -------------------------------------------------------------
// 2. MY COURSES (List and Specific Course Detail)
// -------------------------------------------------------------
teacherRouter.get('/courses', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const rows = await db
      .select({
        assignmentId: teacherAssignments.id,
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
        endDate: batches.endDate,
        isActive: batches.isActive,
      })
      .from(teacherAssignments)
      .innerJoin(courses, eq(teacherAssignments.courseId, courses.id))
      .innerJoin(batches, eq(teacherAssignments.batchId, batches.id))
      .where(eq(teacherAssignments.teacherId, teacher.id));

    // Get student count for each batch
    const coursesWithDetails = await Promise.all(
      rows.map(async (c) => {
        const studentCountRes = await db
          .select({ count: sql<number>`count(*)` })
          .from(enrollments)
          .where(and(eq(enrollments.batchId, c.batchId), eq(enrollments.status, 'ENROLLED')));
        
        // Progress average
        const avgProgressRes = await db
          .select({ avg: sql<number>`avg(${enrollments.progressPercentage})` })
          .from(enrollments)
          .where(eq(enrollments.batchId, c.batchId));

        return {
          ...c,
          studentCount: Number(studentCountRes[0]?.count || 0),
          averageProgress: Math.round(Number(avgProgressRes[0]?.avg || 0)),
        };
      })
    );

    res.json({ courses: coursesWithDetails });
  } catch (err: any) {
    console.error('Error fetching teacher courses:', err);
    res.status(500).json({ error: 'Failed to fetch assigned courses' });
  }
});

// Course Detail: verifies teacher is assigned to this course
teacherRouter.get('/courses/:courseId', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const courseId = parseInt(req.params.courseId, 10);

    // Authorization check
    const isAssigned = await db
      .select()
      .from(teacherAssignments)
      .where(and(eq(teacherAssignments.teacherId, teacher.id), eq(teacherAssignments.courseId, courseId)))
      .limit(1);

    if (isAssigned.length === 0) {
      return res.status(403).json({ error: 'Access denied: You are not assigned to instruct this course.' });
    }

    const courseRows = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    if (courseRows.length === 0) return res.status(404).json({ error: 'Course not found' });

    // Batches assigned to teacher for this course
    const assignedBatches = await db
      .select({
        id: batches.id,
        batchNumber: batches.batchNumber,
        name: batches.name,
        campus: batches.campus,
        capacity: batches.capacity,
        startDate: batches.startDate,
        endDate: batches.endDate,
        isActive: batches.isActive,
      })
      .from(teacherAssignments)
      .innerJoin(batches, eq(teacherAssignments.batchId, batches.id))
      .where(and(eq(teacherAssignments.teacherId, teacher.id), eq(teacherAssignments.courseId, courseId)));

    res.json({
      course: courseRows[0],
      batches: assignedBatches,
    });
  } catch (err: any) {
    console.error('Error fetching course detail:', err);
    res.status(500).json({ error: 'Failed to fetch course details' });
  }
});

// -------------------------------------------------------------
// 3. TEACHER STUDENTS (List, Filter, Search & Pagination)
// -------------------------------------------------------------
teacherRouter.get('/students', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    // Get all batches assigned to this teacher
    const teacherBatchRows = await db
      .select({ batchId: teacherAssignments.batchId })
      .from(teacherAssignments)
      .where(eq(teacherAssignments.teacherId, teacher.id));

    const allowedBatchIds = teacherBatchRows.map(b => b.batchId);
    if (allowedBatchIds.length === 0) {
      return res.json({ students: [], pagination: { totalCount: 0, page: 1, limit: 10, totalPages: 0 } });
    }

    const query = req.query.query ? String(req.query.query).trim() : '';
    const courseIdFilter = req.query.courseId ? parseInt(String(req.query.courseId), 10) : null;
    const batchIdFilter = req.query.batchId ? parseInt(String(req.query.batchId), 10) : null;
    const statusFilter = req.query.status ? String(req.query.status) : '';
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const offset = (page - 1) * limit;

    const conditions = [inArray(enrollments.batchId, allowedBatchIds)];

    if (courseIdFilter) {
      conditions.push(eq(enrollments.courseId, courseIdFilter));
    }
    if (batchIdFilter) {
      if (allowedBatchIds.includes(batchIdFilter)) {
        conditions.push(eq(enrollments.batchId, batchIdFilter));
      } else {
        return res.status(403).json({ error: 'You are not assigned to this batch.' });
      }
    }
    if (statusFilter) {
      conditions.push(eq(students.status, statusFilter));
    }
    if (query) {
      conditions.push(
        or(
          ilike(students.fullName, `%${query}%`),
          ilike(students.studentId, `%${query}%`),
          ilike(students.rollNumber, `%${query}%`),
          ilike(students.phone, `%${query}%`)
        )!
      );
    }

    const whereClause = and(...conditions);

    // Count
    const totalCountRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .where(whereClause);
    const totalCount = Number(totalCountRes[0]?.count || 0);

    // Records
    const rows = await db
      .select({
        id: students.id,
        studentId: students.studentId,
        rollNumber: students.rollNumber,
        fullName: students.fullName,
        fatherName: students.fatherName,
        phone: students.phone,
        email: students.email,
        campus: students.campus,
        status: students.status,
        isActivated: students.isActivated,
        enrollmentId: enrollments.id,
        courseId: enrollments.courseId,
        courseTitle: courses.title,
        courseCode: courses.code,
        batchId: enrollments.batchId,
        batchNumber: batches.batchNumber,
        batchName: batches.name,
        progressPercentage: enrollments.progressPercentage,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(batches, eq(enrollments.batchId, batches.id))
      .where(whereClause)
      .orderBy(asc(students.rollNumber))
      .limit(limit)
      .offset(offset);

    // Calculate dynamic attendance % for each student in this course/batch
    const studentsWithStats = await Promise.all(
      rows.map(async (stu) => {
        const attRecords = await db
          .select({
            status: attendances.status,
          })
          .from(attendances)
          .where(and(eq(attendances.studentId, stu.id), eq(attendances.batchId, stu.batchId)));

        const totalAtt = attRecords.length;
        const presentAtt = attRecords.filter(a => a.status === 'PRESENT').length;
        const attendancePercentage = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

        return {
          ...stu,
          totalAttendanceRecords: totalAtt,
          attendancePercentage,
        };
      })
    );

    res.json({
      students: studentsWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err: any) {
    console.error('Error fetching teacher students:', err);
    res.status(500).json({ error: 'Failed to fetch student roster' });
  }
});

// -------------------------------------------------------------
// 4. TEACHER ATTENDANCE (View & Bulk Save / Update)
// -------------------------------------------------------------
teacherRouter.get('/attendance', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const courseId = parseInt(String(req.query.courseId), 10);
    const batchId = parseInt(String(req.query.batchId), 10);
    const date = String(req.query.date || new Date().toISOString().split('T')[0]);

    if (!courseId || !batchId) {
      return res.status(400).json({ error: 'courseId and batchId are required query parameters' });
    }

    // Verify teacher owns batch
    const assignmentCheck = await db
      .select()
      .from(teacherAssignments)
      .where(and(
        eq(teacherAssignments.teacherId, teacher.id),
        eq(teacherAssignments.courseId, courseId),
        eq(teacherAssignments.batchId, batchId)
      ))
      .limit(1);

    if (assignmentCheck.length === 0) {
      return res.status(403).json({ error: 'You are not authorized to mark attendance for this batch.' });
    }

    // Get all enrolled students in this batch
    const enrolledStudents = await db
      .select({
        id: students.id,
        studentId: students.studentId,
        rollNumber: students.rollNumber,
        fullName: students.fullName,
        fatherName: students.fatherName,
        status: students.status,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .where(and(eq(enrollments.batchId, batchId), eq(enrollments.courseId, courseId)))
      .orderBy(asc(students.rollNumber));

    // Get existing attendance for this date
    const existingAttendance = await db
      .select()
      .from(attendances)
      .where(and(
        eq(attendances.courseId, courseId),
        eq(attendances.batchId, batchId),
        eq(attendances.date, date)
      ));

    const attendanceMap = new Map(existingAttendance.map(a => [a.studentId, a]));

    let present = 0;
    let absent = 0;
    let leave = 0;
    let late = 0;
    let notMarked = 0;

    const studentAttendanceList = enrolledStudents.map(stu => {
      const att = attendanceMap.get(stu.id);
      const status = att ? att.status : 'NOT_MARKED';
      if (status === 'PRESENT') present++;
      else if (status === 'ABSENT') absent++;
      else if (status === 'LEAVE') leave++;
      else if (status === 'LATE') late++;
      else notMarked++;

      return {
        studentId: stu.id,
        academyStudentId: stu.studentId,
        rollNumber: stu.rollNumber,
        fullName: stu.fullName,
        status,
        remarks: att?.remarks || '',
        attendanceId: att?.id || null,
      };
    });

    res.json({
      date,
      courseId,
      batchId,
      stats: {
        totalStudents: enrolledStudents.length,
        present,
        absent,
        leave,
        late,
        notMarked,
      },
      students: studentAttendanceList,
    });
  } catch (err: any) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ error: 'Failed to fetch attendance sheet' });
  }
});

// Save or Update Attendance for Date (Atomic Upsert)
teacherRouter.post('/attendance', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const { courseId, batchId, date, records } = req.body;
    if (!courseId || !batchId || !date || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Missing required parameters (courseId, batchId, date, records array)' });
    }

    // Verify teacher assignment
    const assignmentCheck = await db
      .select()
      .from(teacherAssignments)
      .where(and(
        eq(teacherAssignments.teacherId, teacher.id),
        eq(teacherAssignments.courseId, courseId),
        eq(teacherAssignments.batchId, batchId)
      ))
      .limit(1);

    if (assignmentCheck.length === 0) {
      return res.status(403).json({ error: 'Unauthorized to save attendance for this batch.' });
    }

    // Upsert each record
    let updatedCount = 0;
    let insertedCount = 0;

    for (const item of records) {
      if (!item.studentId || !item.status) continue;
      if (item.status === 'NOT_MARKED') continue; // Don't persist blank items

      // Check if existing record
      const existing = await db
        .select()
        .from(attendances)
        .where(and(
          eq(attendances.studentId, item.studentId),
          eq(attendances.courseId, courseId),
          eq(attendances.batchId, batchId),
          eq(attendances.date, date)
        ))
        .limit(1);

      if (existing.length > 0) {
        await db.update(attendances).set({
          status: item.status,
          remarks: item.remarks || null,
          teacherId: teacher.id,
          markedAt: new Date(),
        }).where(eq(attendances.id, existing[0].id));
        updatedCount++;
      } else {
        await db.insert(attendances).values({
          studentId: item.studentId,
          courseId,
          batchId,
          teacherId: teacher.id,
          date,
          status: item.status,
          remarks: item.remarks || null,
          markedAt: new Date(),
        });
        insertedCount++;
      }
    }

    res.json({
      success: true,
      message: `Attendance for ${date} successfully recorded. (${insertedCount} new, ${updatedCount} updated)`,
      date,
      insertedCount,
      updatedCount,
    });
  } catch (err: any) {
    console.error('Error saving attendance:', err);
    res.status(500).json({ error: 'Failed to record attendance in database' });
  }
});

// -------------------------------------------------------------
// 5. TEACHER ASSIGNMENTS (CRUD, Submissions, Grading)
// -------------------------------------------------------------
teacherRouter.get('/assignments', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const courseId = req.query.courseId ? parseInt(String(req.query.courseId), 10) : null;
    const batchId = req.query.batchId ? parseInt(String(req.query.batchId), 10) : null;

    const conditions = [eq(assignments.teacherId, teacher.id)];
    if (courseId) conditions.push(eq(assignments.courseId, courseId));
    if (batchId) conditions.push(eq(assignments.batchId, batchId));

    const rows = await db
      .select({
        id: assignments.id,
        courseId: assignments.courseId,
        courseTitle: courses.title,
        courseCode: courses.code,
        batchId: assignments.batchId,
        batchNumber: batches.batchNumber,
        batchName: batches.name,
        title: assignments.title,
        description: assignments.description,
        dueDate: assignments.dueDate,
        totalMarks: assignments.totalMarks,
        instructions: assignments.instructions,
        createdAt: assignments.createdAt,
      })
      .from(assignments)
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .innerJoin(batches, eq(assignments.batchId, batches.id))
      .where(and(...conditions))
      .orderBy(desc(assignments.id));

    // For each assignment, calculate submissions count and pending grading count
    const assignmentsWithStats = await Promise.all(
      rows.map(async (asgn) => {
        const subs = await db
          .select({
            status: assignmentSubmissions.status,
          })
          .from(assignmentSubmissions)
          .where(eq(assignmentSubmissions.assignmentId, asgn.id));

        const totalSubmissions = subs.length;
        const gradedCount = subs.filter(s => s.status === 'GRADED').length;
        const pendingCount = subs.filter(s => s.status === 'SUBMITTED' || s.status === 'LATE').length;

        // Total enrolled in that batch
        const enrolledRes = await db
          .select({ count: sql<number>`count(*)` })
          .from(enrollments)
          .where(eq(enrollments.batchId, asgn.batchId));
        const totalEnrolled = Number(enrolledRes[0]?.count || 0);

        return {
          ...asgn,
          totalSubmissions,
          gradedCount,
          pendingCount,
          totalEnrolled,
        };
      })
    );

    res.json({ assignments: assignmentsWithStats });
  } catch (err: any) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Create Assignment
teacherRouter.post('/assignments', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const { courseId, batchId, title, description, dueDate, totalMarks, instructions } = req.body;
    if (!courseId || !batchId || !title || !description || !dueDate) {
      return res.status(400).json({ error: 'Title, description, course, batch, and dueDate are required.' });
    }

    // Verify teacher assignment to course/batch
    const isAssigned = await db
      .select()
      .from(teacherAssignments)
      .where(and(
        eq(teacherAssignments.teacherId, teacher.id),
        eq(teacherAssignments.courseId, courseId),
        eq(teacherAssignments.batchId, batchId)
      ))
      .limit(1);

    if (isAssigned.length === 0) {
      return res.status(403).json({ error: 'You are not assigned to instruct this batch.' });
    }

    const [newAsgn] = await db.insert(assignments).values({
      courseId,
      batchId,
      teacherId: teacher.id,
      title: title.trim(),
      description: description.trim(),
      dueDate: new Date(dueDate),
      totalMarks: totalMarks ? parseInt(String(totalMarks), 10) : 100,
      instructions: instructions ? instructions.trim() : null,
    }).returning();

    // Create a notification for enrolled students in this batch
    const enrolledStudents = await db
      .select({ userId: students.userId })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .where(eq(enrollments.batchId, batchId));

    for (const stu of enrolledStudents) {
      if (stu.userId) {
        await db.insert(notifications).values({
          userId: stu.userId,
          title: `New Assignment: ${title}`,
          message: `Your instructor posted a new assignment due on ${new Date(dueDate).toLocaleDateString()}.`,
          type: 'ASSIGNMENT',
          link: '/student/dashboard',
        });
      }
    }

    res.status(201).json({ success: true, assignment: newAsgn });
  } catch (err: any) {
    console.error('Error creating assignment:', err);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Edit Assignment
teacherRouter.put('/assignments/:id', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const assignmentId = parseInt(req.params.id, 10);
    const existing = await db.select().from(assignments).where(eq(assignments.id, assignmentId)).limit(1);
    if (existing.length === 0) return res.status(404).json({ error: 'Assignment not found' });
    if (existing[0].teacherId !== teacher.id) {
      return res.status(403).json({ error: 'You can only edit assignments created by you.' });
    }

    const { title, description, dueDate, totalMarks, instructions } = req.body;

    const [updated] = await db.update(assignments).set({
      title: title?.trim() || existing[0].title,
      description: description?.trim() || existing[0].description,
      dueDate: dueDate ? new Date(dueDate) : existing[0].dueDate,
      totalMarks: totalMarks ? parseInt(String(totalMarks), 10) : existing[0].totalMarks,
      instructions: instructions !== undefined ? instructions?.trim() : existing[0].instructions,
    }).where(eq(assignments.id, assignmentId)).returning();

    res.json({ success: true, assignment: updated });
  } catch (err: any) {
    console.error('Error updating assignment:', err);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Delete Assignment
teacherRouter.delete('/assignments/:id', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const assignmentId = parseInt(req.params.id, 10);
    const existing = await db.select().from(assignments).where(eq(assignments.id, assignmentId)).limit(1);
    if (existing.length === 0) return res.status(404).json({ error: 'Assignment not found' });
    if (existing[0].teacherId !== teacher.id) {
      return res.status(403).json({ error: 'You can only delete assignments created by you.' });
    }

    await db.delete(assignments).where(eq(assignments.id, assignmentId));
    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting assignment:', err);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// Assignment Submissions List & Grading
teacherRouter.get('/assignments/:id/submissions', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const assignmentId = parseInt(req.params.id, 10);
    const asgnRows = await db.select().from(assignments).where(eq(assignments.id, assignmentId)).limit(1);
    if (asgnRows.length === 0) return res.status(404).json({ error: 'Assignment not found' });
    if (asgnRows[0].teacherId !== teacher.id) {
      return res.status(403).json({ error: 'You can only view submissions for your assigned coursework.' });
    }

    const asgn = asgnRows[0];

    // Get all students enrolled in this batch
    const enrolledStudents = await db
      .select({
        studentId: students.id,
        rollNumber: students.rollNumber,
        fullName: students.fullName,
        email: students.email,
        phone: students.phone,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .where(eq(enrollments.batchId, asgn.batchId))
      .orderBy(asc(students.rollNumber));

    // Get submissions
    const submissionRows = await db
      .select()
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.assignmentId, assignmentId));

    const submissionMap = new Map(submissionRows.map(s => [s.studentId, s]));

    const result = enrolledStudents.map(stu => {
      const sub = submissionMap.get(stu.studentId);
      return {
        studentId: stu.studentId,
        rollNumber: stu.rollNumber,
        fullName: stu.fullName,
        email: stu.email,
        submissionId: sub?.id || null,
        status: sub ? sub.status : 'PENDING',
        submittedAt: sub?.submittedAt || null,
        content: sub?.content || null,
        attachmentUrl: sub?.attachmentUrl || null,
        obtainedMarks: sub?.obtainedMarks !== undefined ? sub?.obtainedMarks : null,
        teacherFeedback: sub?.teacherFeedback || null,
        gradedAt: sub?.gradedAt || null,
      };
    });

    res.json({
      assignment: asgn,
      submissions: result,
    });
  } catch (err: any) {
    console.error('Error fetching submissions:', err);
    res.status(500).json({ error: 'Failed to fetch student submissions' });
  }
});

// Grade Submission
teacherRouter.post('/assignments/:id/submissions/:studentId/grade', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const assignmentId = parseInt(req.params.id, 10);
    const studentId = parseInt(req.params.studentId, 10);
    const { marks, feedback } = req.body;

    const asgnRows = await db.select().from(assignments).where(eq(assignments.id, assignmentId)).limit(1);
    if (asgnRows.length === 0) return res.status(404).json({ error: 'Assignment not found' });
    if (asgnRows[0].teacherId !== teacher.id) {
      return res.status(403).json({ error: 'Unauthorized to grade this assignment.' });
    }

    const marksNum = parseInt(String(marks), 10);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > asgnRows[0].totalMarks) {
      return res.status(400).json({ error: `Marks must be a number between 0 and ${asgnRows[0].totalMarks}` });
    }

    // Check if submission exists
    const existing = await db
      .select()
      .from(assignmentSubmissions)
      .where(and(eq(assignmentSubmissions.assignmentId, assignmentId), eq(assignmentSubmissions.studentId, studentId)))
      .limit(1);

    let updatedSubmission;
    if (existing.length > 0) {
      [updatedSubmission] = await db.update(assignmentSubmissions).set({
        obtainedMarks: marksNum,
        teacherFeedback: feedback?.trim() || null,
        status: 'GRADED',
        gradedAt: new Date(),
      }).where(eq(assignmentSubmissions.id, existing[0].id)).returning();
    } else {
      // Create graded submission entry directly
      [updatedSubmission] = await db.insert(assignmentSubmissions).values({
        assignmentId,
        studentId,
        content: 'Graded by instructor directly',
        obtainedMarks: marksNum,
        teacherFeedback: feedback?.trim() || null,
        status: 'GRADED',
        gradedAt: new Date(),
        submittedAt: new Date(),
      }).returning();
    }

    // Notify student
    const studentRows = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
    if (studentRows.length > 0 && studentRows[0].userId) {
      await db.insert(notifications).values({
        userId: studentRows[0].userId,
        title: `Grade Posted: ${asgnRows[0].title}`,
        message: `You received ${marksNum}/${asgnRows[0].totalMarks} marks with faculty feedback.`,
        type: 'ASSIGNMENT',
        link: '/student/dashboard',
      });
    }

    res.json({
      success: true,
      message: 'Submission graded successfully',
      submission: updatedSubmission,
    });
  } catch (err: any) {
    console.error('Error grading submission:', err);
    res.status(500).json({ error: 'Failed to record assignment grade' });
  }
});

// -------------------------------------------------------------
// 6. TEACHER QUIZZES & QUIZ BUILDER & RESULTS
// -------------------------------------------------------------
teacherRouter.get('/quizzes', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const rows = await db
      .select({
        id: quizzes.id,
        courseId: quizzes.courseId,
        courseTitle: courses.title,
        courseCode: courses.code,
        batchId: quizzes.batchId,
        batchNumber: batches.batchNumber,
        batchName: batches.name,
        title: quizzes.title,
        description: quizzes.description,
        durationMinutes: quizzes.durationMinutes,
        passingMarks: quizzes.passingMarks,
        totalMarks: quizzes.totalMarks,
        status: quizzes.status,
        createdAt: quizzes.createdAt,
      })
      .from(quizzes)
      .innerJoin(courses, eq(quizzes.courseId, courses.id))
      .innerJoin(batches, eq(quizzes.batchId, batches.id))
      .where(eq(quizzes.teacherId, teacher.id))
      .orderBy(desc(quizzes.id));

    // Stats for each quiz
    const quizzesWithDetails = await Promise.all(
      rows.map(async (q) => {
        const questionCountRes = await db
          .select({ count: sql<number>`count(*)` })
          .from(quizQuestions)
          .where(eq(quizQuestions.quizId, q.id));

        const attemptStats = await db
          .select({
            count: sql<number>`count(*)`,
            passedCount: sql<number>`count(*) filter (where passed = true)`,
            avgScore: sql<number>`avg(score)`,
          })
          .from(quizAttempts)
          .where(eq(quizAttempts.quizId, q.id));

        return {
          ...q,
          questionCount: Number(questionCountRes[0]?.count || 0),
          attemptsCount: Number(attemptStats[0]?.count || 0),
          passedCount: Number(attemptStats[0]?.passedCount || 0),
          averageScore: Math.round(Number(attemptStats[0]?.avgScore || 0)),
        };
      })
    );

    res.json({ quizzes: quizzesWithDetails });
  } catch (err: any) {
    console.error('Error fetching quizzes:', err);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Single Quiz Detail with Questions
teacherRouter.get('/quizzes/:id', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const quizId = parseInt(req.params.id, 10);
    const quizRows = await db
      .select({
        id: quizzes.id,
        courseId: quizzes.courseId,
        courseTitle: courses.title,
        courseCode: courses.code,
        batchId: quizzes.batchId,
        batchNumber: batches.batchNumber,
        batchName: batches.name,
        teacherId: quizzes.teacherId,
        title: quizzes.title,
        description: quizzes.description,
        durationMinutes: quizzes.durationMinutes,
        passingMarks: quizzes.passingMarks,
        totalMarks: quizzes.totalMarks,
        status: quizzes.status,
        createdAt: quizzes.createdAt,
      })
      .from(quizzes)
      .innerJoin(courses, eq(quizzes.courseId, courses.id))
      .innerJoin(batches, eq(quizzes.batchId, batches.id))
      .where(eq(quizzes.id, quizId))
      .limit(1);

    if (quizRows.length === 0) return res.status(404).json({ error: 'Quiz not found' });
    if (quizRows[0].teacherId !== teacher.id) {
      return res.status(403).json({ error: 'You can only view quizzes created by you.' });
    }

    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(asc(quizQuestions.id));

    res.json({
      quiz: quizRows[0],
      questions,
    });
  } catch (err: any) {
    console.error('Error fetching quiz details:', err);
    res.status(500).json({ error: 'Failed to fetch quiz information' });
  }
});

// Create Quiz
teacherRouter.post('/quizzes', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const { courseId, batchId, title, description, durationMinutes, passingMarks, totalMarks, questions } = req.body;
    if (!courseId || !batchId || !title) {
      return res.status(400).json({ error: 'Course, Batch, and Quiz Title are required' });
    }

    // Verify teacher assignment
    const isAssigned = await db
      .select()
      .from(teacherAssignments)
      .where(and(
        eq(teacherAssignments.teacherId, teacher.id),
        eq(teacherAssignments.courseId, courseId),
        eq(teacherAssignments.batchId, batchId)
      ))
      .limit(1);

    if (isAssigned.length === 0) {
      return res.status(403).json({ error: 'You are not assigned to instruct this batch.' });
    }

    const [newQuiz] = await db.insert(quizzes).values({
      courseId,
      batchId,
      teacherId: teacher.id,
      title: title.trim(),
      description: description?.trim() || null,
      durationMinutes: durationMinutes ? parseInt(String(durationMinutes), 10) : 30,
      passingMarks: passingMarks ? parseInt(String(passingMarks), 10) : 60,
      totalMarks: totalMarks ? parseInt(String(totalMarks), 10) : 100,
      status: 'PUBLISHED',
    }).returning();

    // Insert questions if provided
    if (Array.isArray(questions) && questions.length > 0) {
      for (const q of questions) {
        if (!q.questionText || !Array.isArray(q.options)) continue;
        await db.insert(quizQuestions).values({
          quizId: newQuiz.id,
          questionText: q.questionText.trim(),
          options: q.options,
          correctOptionIndex: q.correctOptionIndex !== undefined ? parseInt(String(q.correctOptionIndex), 10) : 0,
          marks: q.marks ? parseInt(String(q.marks), 10) : 10,
        });
      }
    }

    res.status(201).json({ success: true, quiz: newQuiz });
  } catch (err: any) {
    console.error('Error creating quiz:', err);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Add Question to Quiz
teacherRouter.post('/quizzes/:id/questions', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const quizId = parseInt(req.params.id, 10);
    const quiz = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
    if (quiz.length === 0) return res.status(404).json({ error: 'Quiz not found' });
    if (quiz[0].teacherId !== teacher.id) {
      return res.status(403).json({ error: 'Unauthorized to modify questions on this quiz.' });
    }

    const { questionText, options, correctOptionIndex, marks } = req.body;
    if (!questionText || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Question text and at least 2 options are required.' });
    }

    const [newQuestion] = await db.insert(quizQuestions).values({
      quizId,
      questionText: questionText.trim(),
      options,
      correctOptionIndex: parseInt(String(correctOptionIndex || 0), 10),
      marks: marks ? parseInt(String(marks), 10) : 10,
    }).returning();

    res.status(201).json({ success: true, question: newQuestion });
  } catch (err: any) {
    console.error('Error adding question:', err);
    res.status(500).json({ error: 'Failed to add question to quiz' });
  }
});

// Delete Question
teacherRouter.delete('/quizzes/:quizId/questions/:questionId', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const quizId = parseInt(req.params.quizId, 10);
    const questionId = parseInt(req.params.questionId, 10);

    const quiz = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
    if (quiz.length === 0 || quiz[0].teacherId !== teacher.id) {
      return res.status(403).json({ error: 'Unauthorized to remove this question.' });
    }

    await db.delete(quizQuestions).where(and(eq(quizQuestions.id, questionId), eq(quizQuestions.quizId, quizId)));
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting question:', err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Publish/Unpublish/Archive Quiz Status
teacherRouter.patch('/quizzes/:id/status', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const quizId = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be DRAFT, PUBLISHED, or ARCHIVED' });
    }

    const quiz = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
    if (quiz.length === 0 || quiz[0].teacherId !== teacher.id) {
      return res.status(403).json({ error: 'Unauthorized to update this quiz.' });
    }

    const [updated] = await db.update(quizzes).set({ status }).where(eq(quizzes.id, quizId)).returning();
    res.json({ success: true, quiz: updated });
  } catch (err: any) {
    console.error('Error updating quiz status:', err);
    res.status(500).json({ error: 'Failed to update quiz status' });
  }
});

// Quiz Results List
teacherRouter.get('/quizzes/:id/results', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const quizId = parseInt(req.params.id, 10);
    const quiz = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
    if (quiz.length === 0 || quiz[0].teacherId !== teacher.id) {
      return res.status(403).json({ error: 'Unauthorized to inspect results for this quiz.' });
    }

    const attempts = await db
      .select({
        id: quizAttempts.id,
        studentId: students.id,
        rollNumber: students.rollNumber,
        fullName: students.fullName,
        email: students.email,
        score: quizAttempts.score,
        totalMarks: quizAttempts.totalMarks,
        passed: quizAttempts.passed,
        completedAt: quizAttempts.completedAt,
      })
      .from(quizAttempts)
      .innerJoin(students, eq(quizAttempts.studentId, students.id))
      .where(eq(quizAttempts.quizId, quizId))
      .orderBy(desc(quizAttempts.score));

    res.json({
      quiz: quiz[0],
      attempts,
    });
  } catch (err: any) {
    console.error('Error fetching quiz results:', err);
    res.status(500).json({ error: 'Failed to fetch quiz results' });
  }
});

// -------------------------------------------------------------
// 7. COURSE PROGRESS (Calculated from Real Database Records)
// -------------------------------------------------------------
teacherRouter.get('/progress', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const courseId = req.query.courseId ? parseInt(String(req.query.courseId), 10) : null;
    const batchId = req.query.batchId ? parseInt(String(req.query.batchId), 10) : null;

    // Get batches assigned to teacher
    const assignedBatches = await db
      .select({ batchId: teacherAssignments.batchId, courseId: teacherAssignments.courseId })
      .from(teacherAssignments)
      .where(eq(teacherAssignments.teacherId, teacher.id));

    const allowedBatchIds = assignedBatches.map(b => b.batchId);
    if (allowedBatchIds.length === 0) {
      return res.json({ progressData: [] });
    }

    const conditions = [inArray(enrollments.batchId, allowedBatchIds)];
    if (courseId) conditions.push(eq(enrollments.courseId, courseId));
    if (batchId) {
      if (allowedBatchIds.includes(batchId)) {
        conditions.push(eq(enrollments.batchId, batchId));
      } else {
        return res.status(403).json({ error: 'Unauthorized to view progress for this batch.' });
      }
    }

    const studentsInBatches = await db
      .select({
        id: students.id,
        rollNumber: students.rollNumber,
        fullName: students.fullName,
        studentId: students.studentId,
        courseId: enrollments.courseId,
        courseTitle: courses.title,
        courseCode: courses.code,
        batchId: enrollments.batchId,
        batchNumber: batches.batchNumber,
        storedProgress: enrollments.progressPercentage,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(batches, eq(enrollments.batchId, batches.id))
      .where(and(...conditions))
      .orderBy(asc(students.rollNumber));

    // Calculate dynamic stats for each student
    const progressData = await Promise.all(
      studentsInBatches.map(async (stu) => {
        // Attendance
        const attRecords = await db
          .select({ status: attendances.status })
          .from(attendances)
          .where(and(eq(attendances.studentId, stu.id), eq(attendances.batchId, stu.batchId)));
        const attTotal = attRecords.length;
        const attPresent = attRecords.filter(a => a.status === 'PRESENT').length;
        const attendancePercentage = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 100;

        // Assignments in this batch
        const totalBatchAsgns = await db
          .select({ id: assignments.id, totalMarks: assignments.totalMarks })
          .from(assignments)
          .where(eq(assignments.batchId, stu.batchId));

        const studentSubs = await db
          .select({
            obtainedMarks: assignmentSubmissions.obtainedMarks,
            status: assignmentSubmissions.status,
          })
          .from(assignmentSubmissions)
          .where(eq(assignmentSubmissions.studentId, stu.id));

        const submittedCount = studentSubs.filter(s => s.status === 'SUBMITTED' || s.status === 'GRADED').length;
        const assignmentCompletionRate = totalBatchAsgns.length > 0 
          ? Math.round((submittedCount / totalBatchAsgns.length) * 100) 
          : 100;

        const gradedSubs = studentSubs.filter(s => s.obtainedMarks !== null);
        const avgAssignmentScore = gradedSubs.length > 0
          ? Math.round(gradedSubs.reduce((acc, curr) => acc + (curr.obtainedMarks || 0), 0) / gradedSubs.length)
          : 85;

        // Quizzes
        const quizAtts = await db
          .select({ score: quizAttempts.score, totalMarks: quizAttempts.totalMarks, passed: quizAttempts.passed })
          .from(quizAttempts)
          .where(eq(quizAttempts.studentId, stu.id));

        const avgQuizScore = quizAtts.length > 0
          ? Math.round(quizAtts.reduce((acc, q) => acc + (q.score / q.totalMarks) * 100, 0) / quizAtts.length)
          : 80;

        // Overall Weighted Progress (40% Attendance, 40% Assignments, 20% Quizzes)
        const overallProgress = Math.min(100, Math.round(
          attendancePercentage * 0.4 +
          avgAssignmentScore * 0.4 +
          avgQuizScore * 0.2
        ));

        return {
          ...stu,
          attendancePercentage,
          attendanceRatio: `${attPresent}/${attTotal}`,
          assignmentCompletionRate,
          avgAssignmentScore,
          avgQuizScore,
          overallProgress: overallProgress || stu.storedProgress,
        };
      })
    );

    res.json({ progressData });
  } catch (err: any) {
    console.error('Error fetching progress:', err);
    res.status(500).json({ error: 'Failed to calculate course progress records' });
  }
});

// -------------------------------------------------------------
// 8. TEACHER CLASS SCHEDULE
// -------------------------------------------------------------
teacherRouter.get('/schedule', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const rows = await db
      .select({
        id: schedules.id,
        courseId: schedules.courseId,
        courseTitle: courses.title,
        courseCode: courses.code,
        batchId: schedules.batchId,
        batchNumber: batches.batchNumber,
        batchName: batches.name,
        dayOfWeek: schedules.dayOfWeek,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        room: schedules.room,
        campus: schedules.campus,
      })
      .from(schedules)
      .innerJoin(courses, eq(schedules.courseId, courses.id))
      .innerJoin(batches, eq(schedules.batchId, batches.id))
      .where(eq(schedules.teacherId, teacher.id))
      .orderBy(asc(schedules.dayOfWeek), asc(schedules.startTime));

    res.json({ schedules: rows });
  } catch (err: any) {
    console.error('Error fetching schedule:', err);
    res.status(500).json({ error: 'Failed to fetch faculty schedule' });
  }
});

// -------------------------------------------------------------
// 9. TEACHER ANNOUNCEMENTS
// -------------------------------------------------------------
teacherRouter.get('/announcements', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    // Fetch announcements targeted to TEACHER, ALL (null), or authored by this teacher
    const rows = await db
      .select({
        id: announcements.id,
        authorId: announcements.authorId,
        authorName: users.fullName,
        authorRole: users.role,
        title: announcements.title,
        content: announcements.content,
        targetRole: announcements.targetRole,
        courseId: announcements.courseId,
        courseTitle: courses.title,
        batchId: announcements.batchId,
        batchName: batches.name,
        createdAt: announcements.createdAt,
      })
      .from(announcements)
      .innerJoin(users, eq(announcements.authorId, users.id))
      .leftJoin(courses, eq(announcements.courseId, courses.id))
      .leftJoin(batches, eq(announcements.batchId, batches.id))
      .where(
        or(
          eq(announcements.authorId, req.user!.id),
          eq(announcements.targetRole, 'TEACHER'),
          sql`${announcements.targetRole} IS NULL`
        )
      )
      .orderBy(desc(announcements.id));

    res.json({ announcements: rows });
  } catch (err: any) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Create Announcement
teacherRouter.post('/announcements', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const { title, content, message, targetType, courseId, batchId, studentId } = req.body;
    const bodyContent = (content || message || '').trim();
    if (!title || !bodyContent) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Fetch this teacher's authorized assignments
    const assignments = await db
      .select({
        courseId: teacherAssignments.courseId,
        batchId: teacherAssignments.batchId,
      })
      .from(teacherAssignments)
      .where(eq(teacherAssignments.teacherId, teacher.id));

    const allowedBatchIds = [...new Set(assignments.map(a => a.batchId))];
    const allowedCourseIds = [...new Set(assignments.map(a => a.courseId))];

    if (allowedBatchIds.length === 0 && allowedCourseIds.length === 0) {
      return res.status(403).json({ error: 'You do not have any assigned courses or cohorts to broadcast to.' });
    }

    let targetUsers: { id: number }[] = [];
    let targetBatchId: number | null = null;
    let targetCourseId: number | null = null;

    const rawTargetType = (targetType || '').toUpperCase();

    if (rawTargetType === 'BATCH' || (batchId && !courseId && !studentId)) {
      const bId = parseInt(String(batchId), 10);
      if (!allowedBatchIds.includes(bId)) {
        return res.status(403).json({ error: 'Security Violation: You are not authorized to broadcast to this batch.' });
      }
      targetBatchId = bId;
      const matched = assignments.find(a => a.batchId === bId);
      if (matched) targetCourseId = matched.courseId;

      const enrolled = await db
        .select({ userId: students.userId })
        .from(enrollments)
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .where(eq(enrollments.batchId, bId));

      targetUsers = enrolled.filter(s => s.userId !== null).map(s => ({ id: s.userId! }));
    } else if (rawTargetType === 'COURSE' || (courseId && !batchId && !studentId)) {
      const cId = parseInt(String(courseId), 10);
      if (!allowedCourseIds.includes(cId)) {
        return res.status(403).json({ error: 'Security Violation: You are not authorized to broadcast to this course.' });
      }
      targetCourseId = cId;
      const courseBatches = assignments.filter(a => a.courseId === cId).map(a => a.batchId);

      const enrolled = await db
        .select({ userId: students.userId })
        .from(enrollments)
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .where(and(eq(enrollments.courseId, cId), inArray(enrollments.batchId, courseBatches)));

      const uniqueUserIds = [...new Set(enrolled.filter(s => s.userId !== null).map(s => s.userId!))];
      targetUsers = uniqueUserIds.map(id => ({ id }));
    } else if (rawTargetType === 'INDIVIDUAL_STUDENT' || studentId) {
      const sId = parseInt(String(studentId), 10);
      const enrolled = await db
        .select({
          userId: students.userId,
          batchId: enrollments.batchId,
          courseId: enrollments.courseId,
        })
        .from(enrollments)
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .where(
          and(
            or(eq(students.id, sId), eq(students.userId, sId)),
            inArray(enrollments.batchId, allowedBatchIds)
          )
        )
        .limit(1);

      if (enrolled.length === 0 || !enrolled[0].userId) {
        return res.status(403).json({ error: 'Security Violation: Student is not enrolled in any of your assigned classes.' });
      }

      targetUsers = [{ id: enrolled[0].userId }];
      targetBatchId = enrolled[0].batchId;
      targetCourseId = enrolled[0].courseId;
    } else {
      // Default: All students enrolled across all of this teacher's assigned cohorts
      const enrolled = await db
        .select({ userId: students.userId })
        .from(enrollments)
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .where(inArray(enrollments.batchId, allowedBatchIds));

      const uniqueUserIds = [...new Set(enrolled.filter(s => s.userId !== null).map(s => s.userId!))];
      targetUsers = uniqueUserIds.map(id => ({ id }));
      if (allowedCourseIds.length === 1) targetCourseId = allowedCourseIds[0];
    }

    // 1. Create announcement
    const [newAnnouncement] = await db.insert(announcements).values({
      authorId: req.user!.id,
      title: title.trim(),
      content: bodyContent.trim(),
      courseId: targetCourseId,
      batchId: targetBatchId,
      targetRole: 'STUDENT',
    }).returning();

    // 2. Fan-out to notifications table
    if (targetUsers.length > 0) {
      const notifValues = targetUsers.map(u => ({
        userId: u.id,
        senderId: req.user!.id,
        senderName: req.user!.fullName || 'Faculty Instructor',
        senderRole: 'TEACHER',
        title: title.trim(),
        message: bodyContent.trim(),
        type: 'ANNOUNCEMENT' as const,
        link: '/student/notifications',
        isRead: false,
      }));
      await db.insert(notifications).values(notifValues);
    }

    res.status(201).json({
      success: true,
      announcement: newAnnouncement,
      recipientCount: targetUsers.length,
    });
  } catch (err: any) {
    console.error('Error creating announcement:', err);
    res.status(500).json({ error: 'Failed to broadcast announcement' });
  }
});

// -------------------------------------------------------------
// 10. TEACHER NOTIFICATIONS
// -------------------------------------------------------------
teacherRouter.get('/notifications', async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, req.user!.id))
      .orderBy(desc(notifications.id));

    const unreadCount = rows.filter(n => !n.isRead).length;

    res.json({
      notifications: rows,
      unreadCount,
    });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

teacherRouter.post('/notifications/:id/read', async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, req.user!.id)));

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err: any) {
    console.error('Error updating notification:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

teacherRouter.post('/notifications/mark-all-read', async (req: AuthRequest, res) => {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, req.user!.id));

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    console.error('Error updating notifications:', err);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// -------------------------------------------------------------
// 11. TEACHER PROFILE & EDIT ALLOWED FIELDS
// -------------------------------------------------------------
teacherRouter.get('/profile', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const userRows = await db.select().from(users).where(eq(users.id, req.user!.id)).limit(1);
    const userRow = userRows[0];

    // Assigned courses & batches
    const assignedCourses = await db
      .select({
        courseId: courses.id,
        courseTitle: courses.title,
        courseCode: courses.code,
        batchId: batches.id,
        batchNumber: batches.batchNumber,
        batchName: batches.name,
      })
      .from(teacherAssignments)
      .innerJoin(courses, eq(teacherAssignments.courseId, courses.id))
      .innerJoin(batches, eq(teacherAssignments.batchId, batches.id))
      .where(eq(teacherAssignments.teacherId, teacher.id));

    res.json({
      teacher: {
        id: teacher.id,
        userId: userRow.id,
        fullName: userRow.fullName,
        email: userRow.email,
        phone: userRow.phone,
        teacherCode: teacher.teacherCode,
        qualification: teacher.qualification,
        specialization: teacher.specialization,
        bio: teacher.bio,
        joiningDate: teacher.joiningDate,
      },
      assignedCourses,
    });
  } catch (err: any) {
    console.error('Error fetching teacher profile:', err);
    res.status(500).json({ error: 'Failed to fetch faculty profile' });
  }
});

// Update Teacher Profile (Safeguards: cannot change role or sensitive administrative fields)
teacherRouter.put('/profile', async (req: AuthRequest, res) => {
  try {
    const teacher = await getVerifiedTeacher(req.user!.id);
    if (!teacher) return res.status(404).json({ error: 'Faculty profile not found' });

    const { fullName, phone, qualification, specialization, bio } = req.body;

    // Update user profile fields (only fullName & phone allowed)
    if (fullName || phone !== undefined) {
      await db.update(users).set({
        fullName: fullName ? fullName.trim() : undefined,
        phone: phone !== undefined ? phone?.trim() : undefined,
        updatedAt: new Date(),
      }).where(eq(users.id, req.user!.id));
    }

    // Update teacher profile fields
    const [updatedTeacher] = await db.update(teachers).set({
      qualification: qualification !== undefined ? qualification?.trim() : teacher.qualification,
      specialization: specialization !== undefined ? specialization?.trim() : teacher.specialization,
      bio: bio !== undefined ? bio?.trim() : teacher.bio,
    }).where(eq(teachers.id, teacher.id)).returning();

    res.json({
      success: true,
      message: 'Faculty profile updated successfully.',
      teacher: updatedTeacher,
    });
  } catch (err: any) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update faculty profile' });
  }
});
