import { db } from './index.ts';
import {
  users, admins, teachers, students, courses, batches, teacherAssignments,
  enrollments, attendances, assignments, quizzes, quizQuestions, payments, schedules
} from './schema.ts';
import { hashPassword } from '../lib/auth/jwt.ts';
import { sql } from 'drizzle-orm';

export async function runSeed() {
  console.log('Seeding LMS database with initial records...');

  try {
    // Check if superadmin already exists
    const existingUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    if (Number(existingUsers[0]?.count || 0) > 0) {
      console.log('Database already populated, skipping seed.');
      return;
    }

    const defaultPasswordHash = await hashPassword('Academy123!');
    const superAdminHash = await hashPassword('SuperAdmin123!');

    // 1. Super Admin
    const [superAdminUser] = await db.insert(users).values({
      uid: 'usr-superadmin-01',
      email: 'superadmin@academy.edu',
      fullName: 'Prof. Tariq Mansoor',
      passwordHash: superAdminHash,
      role: 'SUPER_ADMIN',
      phone: '+92 300 1122334',
    }).returning();

    await db.insert(admins).values({
      userId: superAdminUser.id,
      designation: 'Director of Academics & Super Administrator',
      department: 'Executive Academic Council',
      canManageAdmins: true,
    });

    // 2. Admins
    const adminProfiles = [
      { email: 'admin1@academy.edu', name: 'Zeeshan Ali', dept: 'Admissions & Records' },
      { email: 'admin2@academy.edu', name: 'Sarah Farooq', dept: 'Examination & Evaluation' },
    ];

    for (const adm of adminProfiles) {
      const [u] = await db.insert(users).values({
        uid: `usr-${adm.email.split('@')[0]}`,
        email: adm.email,
        fullName: adm.name,
        passwordHash: defaultPasswordHash,
        role: 'ADMIN',
        phone: '+92 321 9988776',
      }).returning();

      await db.insert(admins).values({
        userId: u.id,
        designation: 'Academic Operations Officer',
        department: adm.dept,
        canManageAdmins: false,
      });
    }

    // 3. Teachers (5 Teachers)
    const teacherData = [
      { code: 'TCH-001', name: 'Dr. Asad Qasim', email: 'tariq.qasim@academy.edu', spec: 'Full-Stack Architecture' },
      { code: 'TCH-002', name: 'Engr. Ayesha Malik', email: 'ayesha.malik@academy.edu', spec: 'Frontend Engineering & UI/UX' },
      { code: 'TCH-003', name: 'Bilal Ahmed', email: 'bilal.ahmed@academy.edu', spec: 'Database & Cloud Systems' },
      { code: 'TCH-004', name: 'Hina Siddiqui', email: 'hina.siddiqui@academy.edu', spec: 'Algorithms & Problem Solving' },
      { code: 'TCH-005', name: 'M. Usman Khan', email: 'usman.khan@academy.edu', spec: 'Mobile & PWA Technologies' },
    ];

    const teacherRecords: any[] = [];
    for (const tch of teacherData) {
      const [u] = await db.insert(users).values({
        uid: `usr-${tch.code.toLowerCase()}`,
        email: tch.email,
        fullName: tch.name,
        passwordHash: defaultPasswordHash,
        role: 'TEACHER',
        phone: '+92 333 4455667',
      }).returning();

      const [t] = await db.insert(teachers).values({
        userId: u.id,
        teacherCode: tch.code,
        qualification: 'MS Computer Science',
        specialization: tch.spec,
        bio: `Senior Instructor in ${tch.spec} with over 8 years of pedagogical experience.`,
      }).returning();
      teacherRecords.push(t);
    }

    // 4. Courses (3 Courses)
    const [course1] = await db.insert(courses).values({
      code: 'CS-401',
      title: 'Modern Web Application Development',
      description: 'Comprehensive full-stack web engineering with Next.js, TypeScript, PostgreSQL, and scalable micro-services.',
      durationWeeks: 16,
      level: 'Advanced',
      syllabus: 'Module 1: React & Next.js Core\nModule 2: Database Modeling with SQL\nModule 3: Security & Authorization\nModule 4: Enterprise Capstone',
    }).returning();

    const [course2] = await db.insert(courses).values({
      code: 'CS-302',
      title: 'Cloud Systems & Database Architecture',
      description: 'Relational data modeling, connection pooling, indexing strategies, and Cloud SQL infrastructure.',
      durationWeeks: 14,
      level: 'Intermediate',
    }).returning();

    const [course3] = await db.insert(courses).values({
      code: 'CS-205',
      title: 'UI/UX Design Systems & Motion Interfaces',
      description: 'Modern design patterns, Tailwind CSS styling, GSAP physics animations, and accessibility compliance.',
      durationWeeks: 12,
      level: 'Foundational',
    }).returning();

    // 5. Batches (2 Batches for Course 1)
    const [batch20] = await db.insert(batches).values({
      courseId: course1.id,
      batchNumber: '20',
      name: 'Batch 20 - Morning Cohort',
      campus: 'Zaitoon Ashraf IT Park',
      capacity: 40,
      startDate: new Date('2026-08-01'),
    }).returning();

    const [batch21] = await db.insert(batches).values({
      courseId: course1.id,
      batchNumber: '21',
      name: 'Batch 21 - Afternoon Cohort',
      campus: 'Zaitoon Ashraf IT Park',
      capacity: 40,
      startDate: new Date('2026-09-01'),
    }).returning();

    // Assign Primary Teacher to Batch 20 & 21
    await db.insert(teacherAssignments).values({
      teacherId: teacherRecords[0].id,
      courseId: course1.id,
      batchId: batch20.id,
    });
    await db.insert(teacherAssignments).values({
      teacherId: teacherRecords[1].id,
      courseId: course1.id,
      batchId: batch21.id,
    });

    // 6. Schedules
    const scheduleEntries = [
      { day: 'Monday', start: '01:00 PM', end: '03:00 PM', room: 'Lab 4 - Level 2', campus: 'Zaitoon Ashraf IT Park' },
      { day: 'Wednesday', start: '01:00 PM', end: '03:00 PM', room: 'Lab 4 - Level 2', campus: 'Zaitoon Ashraf IT Park' },
      { day: 'Friday', start: '01:00 PM', end: '03:00 PM', room: 'Lab 4 - Level 2', campus: 'Zaitoon Ashraf IT Park' },
    ];

    for (const sch of scheduleEntries) {
      await db.insert(schedules).values({
        courseId: course1.id,
        batchId: batch20.id,
        teacherId: teacherRecords[0].id,
        dayOfWeek: sch.day,
        startTime: sch.start,
        endTime: sch.end,
        room: sch.room,
        campus: sch.campus,
      });
    }

    // 7. Students (20 Pre-created Student records in database)
    const studentSeedList = [
      { id: 'STU-2026-001', roll: '772873', name: 'Hamza Sheikh', father: 'Sheikh Munir', phone: '+92 312 3456781', email: 'hamza.sheikh@student.academy.edu', activated: true },
      { id: 'STU-2026-002', roll: '772874', name: 'Fatima Zahra', father: 'Zahoor Ahmed', phone: '+92 312 3456782', email: 'fatima.zahra@student.academy.edu', activated: true },
      { id: 'STU-2026-003', roll: '772875', name: 'Daniyal Raza', father: 'Syed Raza Ali', phone: '+92 312 3456783', email: 'daniyal.raza@student.academy.edu', activated: false },
      { id: 'STU-2026-004', roll: '772876', name: 'Zainab Bibi', father: 'Muhammad Arshad', phone: '+92 312 3456784', email: 'zainab.bibi@student.academy.edu', activated: false },
      { id: 'STU-2026-005', roll: '772877', name: 'Omer Farooq', father: 'Farooq Azam', phone: '+92 312 3456785', email: 'omer.farooq@student.academy.edu', activated: false },
    ];

  
    // Generate up to 20 students
    for (let i = 6; i <= 20; i++) {
      studentSeedList.push({
        id: `STU-2026-0${i < 10 ? '0' + i : i}`,
        roll: `${772872 + i}`,
        name: `Cadet Student ${i}`,
        father: `Guardian ${i}`,
        phone: `+92 312 34567${i < 10 ? '0' + i : i}`,
        email: `student${i}@student.academy.edu`,
        activated: false,
      });
    }

    for (const stu of studentSeedList) {
      let createdUserId: number | null = null;

      if (stu.activated) {
        // Pre-activate first 2 students so they can login immediately
        const [u] = await db.insert(users).values({
          uid: `usr-${stu.id.toLowerCase()}`,
          email: stu.email,
          fullName: stu.name,
          passwordHash: defaultPasswordHash,
          role: 'STUDENT',
          phone: stu.phone,
        }).returning();
        createdUserId = u.id;
      }

      const [studentRow] = await db.insert(students).values({
        userId: createdUserId,
        studentId: stu.id,
        rollNumber: stu.roll,
        fullName: stu.name,
        fatherName: stu.father,
        phone: stu.phone,
        email: stu.email,
        campus: 'Zaitoon Ashraf IT Park',
        city: 'Karachi',
        isActivated: stu.activated,
      }).returning();

      // Enroll student into Batch 20
      await db.insert(enrollments).values({
        studentId: studentRow.id,
        courseId: course1.id,
        batchId: batch20.id,
        status: 'ENROLLED',
        progressPercentage: stu.activated ? 73 : 10,
      });

      // Seed fee record
      await db.insert(payments).values({
        studentId: studentRow.id,
        courseId: course1.id,
        voucherId: `VCH-2026-${studentRow.id.toString().padStart(4, '0')}`,
        month: 'September 2026',
        amount: 8500,
        type: 'Tuition Fee',
        dueDate: '2026-09-25',
        status: stu.activated ? 'PAID' : 'PENDING',
        paidDate: stu.activated ? '2026-09-05' : null,
        receiptNumber: stu.activated ? `REC-${studentRow.id}0926` : null,
      });
    }

    // 8. Assignments & Quizzes
    const [asgn] = await db.insert(assignments).values({
      courseId: course1.id,
      batchId: batch20.id,
      teacherId: teacherRecords[0].id,
      title: 'Full-Stack REST Architecture with Role Authorization',
      description: 'Implement secure JWT role verification and dynamic route protection with unit tests.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      totalMarks: 100,
      instructions: 'Submit GitHub repository link along with postman test run screenshots.',
    }).returning();

    const [quiz] = await db.insert(quizzes).values({
      courseId: course1.id,
      batchId: batch20.id,
      teacherId: teacherRecords[0].id,
      title: 'Relational Schema & Connection Pooling Assessment',
      description: 'Test your understanding of PostgreSQL connection pools, transaction locks, and relational foreign keys.',
      durationMinutes: 25,
      passingMarks: 60,
      totalMarks: 100,
      status: 'PUBLISHED',
    }).returning();

    await db.insert(quizQuestions).values([
      {
        quizId: quiz.id,
        questionText: 'Why should database connection pooling be handled via an Object method in serverless runtimes?',
        options: [
          'It re-creates connections on every keystroke',
          'It manages idle client connections lazily without startup blocking',
          'It disables SSL completely',
          'It replaces relational keys with raw text files'
        ],
        correctOptionIndex: 1,
        marks: 50,
      },
      {
        quizId: quiz.id,
        questionText: 'Where must role-based authorization be enforced to guarantee real system security?',
        options: [
          'Only by disabling buttons on the landing page',
          'Only inside CSS stylesheets',
          'Server-side at route, API, and database mutation layers',
          'Inside localStorage role properties'
        ],
        correctOptionIndex: 2,
        marks: 50,
      }
    ]);

    console.log('Database seeding finished successfully!');
  } catch (error) {
    console.error('Database seed error:', error);
  }
}
