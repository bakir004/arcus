import { and, eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { db, sql } from '@/database/client';
import { user } from '@/database/schemas/auth.schema';
import {
    courseMemberRoles,
    courseMembers,
    courseRolePermissions,
    courseRoles,
    courses,
} from '@/database/schemas/courses.schema';
import { AttemptStatus, CodingLanguage, ExamType, ExamVisibility, QuestionType } from '@/database/schemas/enums.schema';
import {
    examAnswers,
    examCodingAnswers,
    examCodingExecutions,
    examEssayAnswers,
    examItemGrades,
    examItemStatements,
    examItems,
    examMultipleChoiceAnswerSelections,
    examQuestionCodingConfigs,
    examQuestionCodingTestCases,
    examQuestionEssayConfigs,
    examQuestionMultipleChoiceChoices,
    examQuestions,
} from '@/database/schemas';
import { examAttempts } from '@/database/schemas/attempts.schema';
import { examAnnouncements } from '@/database/schemas/announcements.schema';
import { examTimeslotRegistrations, examTimeslots } from '@/database/schemas/timeslots.schema';
import { exams } from '@/database/schemas/exams.schema';
import { faculties } from '@/database/schemas/faculties.schema';
import {
    courseAdminPermissions,
    courseAdminRoleName,
    courseProfessorPermissions,
    courseProfessorRoleName,
    courseRestrictedAdminPermissions,
    courseRestrictedAdminRoleName,
    courseStudentPermissions,
    courseStudentRoleName,
    courseSeeds,
} from '@/database/seed/courses/courses';
import { aspExamId, examSeeds } from '@/database/seed/exams/exams';
import { facultySeeds } from '@/database/seed/faculties/faculties';
import { professorEmail, studentEmail, userSeeds } from '@/database/seed/users/users';
import { seedAspMaterials, seedDiskretnaMaterials } from '@/database/seed/courses/materials';

async function seedUsers() {
    for (const seed of userSeeds) {
        const [existingUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, seed.email)).limit(1);

        if (!existingUser) {
            await auth.api.signUpEmail({
                body: {
                    name: seed.name,
                    email: seed.email,
                    password: seed.password,
                },
                headers: new Headers(),
            });
        }

        await db.update(user).set({ facultyIndex: seed.facultyIndex }).where(eq(user.email, seed.email));
    }

    const seededUsers = await db
        .select({ id: user.id, email: user.email })
        .from(user)
        .where(
            inArray(
                user.email,
                userSeeds.map((seed) => seed.email),
            ),
        );

    if (seededUsers.length !== userSeeds.length) {
        throw new Error('Not all seed users were created');
    }
    const professor = seededUsers.find((seededUser) => seededUser.email === professorEmail);
    if (!professor) throw new Error('Seed professor was not created');

    console.log(`Seeded ${seededUsers.length} users`);
    return { professor, users: seededUsers };
}

async function seedFacultyAndCourses(createdById: string, users: Array<{ id: string; email: string }>) {
    await db.transaction(async (transaction) => {
        for (const faculty of facultySeeds) {
            await transaction
                .insert(faculties)
                .values({ ...faculty, createdById })
                .onConflictDoUpdate({
                    target: faculties.id,
                    set: {
                        name: faculty.name,
                        code: faculty.code,
                        createdById,
                        updatedAt: new Date(),
                    },
                });
        }

        for (const seed of courseSeeds) {
            const { adminRoleId, restrictedAdminRoleId, professorRoleId, studentRoleId, ...course } = seed;

            await transaction
                .insert(courses)
                .values({ ...course, createdById })
                .onConflictDoUpdate({
                    target: courses.id,
                    set: {
                        name: course.name,
                        code: course.code,
                        facultyId: course.facultyId,
                        createdById,
                        updatedAt: new Date(),
                    },
                });

            const roles = [
                {
                    id: adminRoleId,
                    name: courseAdminRoleName,
                    permissions: courseAdminPermissions,
                },
                {
                    id: restrictedAdminRoleId,
                    name: courseRestrictedAdminRoleName,
                    permissions: courseRestrictedAdminPermissions,
                },
                {
                    id: professorRoleId,
                    name: courseProfessorRoleName,
                    permissions: courseProfessorPermissions,
                },
                {
                    id: studentRoleId,
                    name: courseStudentRoleName,
                    permissions: courseStudentPermissions,
                },
            ];

            for (const role of roles) {
                await transaction
                    .insert(courseRoles)
                    .values({
                        id: role.id,
                        courseId: course.id,
                        name: role.name,
                        createdById,
                    })
                    .onConflictDoUpdate({
                        target: courseRoles.id,
                        set: {
                            courseId: course.id,
                            name: role.name,
                            createdById,
                            updatedAt: new Date(),
                        },
                    });

                await transaction.delete(courseRolePermissions).where(eq(courseRolePermissions.courseRoleId, role.id));
                await transaction.insert(courseRolePermissions).values(
                    role.permissions.map((permissionKey) => ({
                        courseRoleId: role.id,
                        permissionKey,
                    })),
                );
            }

            for (const seededUser of users) {
                const [existingMember] = await transaction
                    .select({ id: courseMembers.id })
                    .from(courseMembers)
                    .where(and(eq(courseMembers.courseId, course.id), eq(courseMembers.userId, seededUser.id)))
                    .limit(1);

                const member =
                    existingMember ??
                    (
                        await transaction
                            .insert(courseMembers)
                            .values({ courseId: course.id, userId: seededUser.id })
                            .returning({ id: courseMembers.id })
                    )[0];

                if (!member) throw new Error('Unable to create course member');

                const assignedRoleId = seededUser.email === studentEmail ? studentRoleId : professorRoleId;

                await transaction
                    .delete(courseMemberRoles)
                    .where(
                        and(
                            eq(courseMemberRoles.courseMemberId, member.id),
                            inArray(courseMemberRoles.courseRoleId, [
                                adminRoleId,
                                restrictedAdminRoleId,
                                professorRoleId,
                                studentRoleId,
                            ]),
                        ),
                    );

                await transaction.insert(courseMemberRoles).values({
                    courseMemberId: member.id,
                    courseRoleId: assignedRoleId,
                });
            }
        }
    });

    console.log(`Seeded ${facultySeeds.length} faculty and ${courseSeeds.length} courses`);
    console.log(
        `Enrolled ${users.length} users in every course (Bakir Cinjarevic as Professor, Imran Vlajcic as Student)`,
    );
}

async function seedExams(createdById: string) {
    await db.transaction(async (transaction) => {
        for (const exam of examSeeds) {
            await transaction
                .insert(exams)
                .values({ ...exam, createdById })
                .onConflictDoUpdate({
                    target: exams.id,
                    set: {
                        courseId: exam.courseId,
                        createdById,
                        title: exam.title,
                        description: exam.description,
                        type: exam.type,
                        durationMinutes: exam.durationMinutes,
                        maxAttempts: exam.maxAttempts,
                        visibility: exam.visibility,
                        updatedAt: new Date(),
                    },
                });
        }
    });

    console.log(`Seeded ${examSeeds.length} exams`);
}

async function seedAspOnlineExam(professorId: string, users: Array<{ id: string; email: string }>) {
    const availableStudents = users.filter((candidate) => candidate.email !== professorEmail);
    const imran = availableStudents.find((candidate) => candidate.email === studentEmail);
    const students = [
        ...(imran ? [imran] : []),
        ...availableStudents.filter((candidate) => candidate.email !== studentEmail),
    ].slice(0, 5);
    if (students.length < 5) throw new Error('ASP exam seed requires at least five students');

    const itemIds = [
        '00000000-0000-4000-8000-000000000201',
        '00000000-0000-4000-8000-000000000202',
        '00000000-0000-4000-8000-000000000203',
    ];
    const questionIds = [
        '00000000-0000-4000-8000-000000000301',
        '00000000-0000-4000-8000-000000000302',
        '00000000-0000-4000-8000-000000000303',
    ];
    const timeslotId = '00000000-0000-4000-8000-000000000401';

    await db.transaction(async (transaction) => {
        // Re-running the seed replaces this complete demonstration exam.
        await transaction.delete(exams).where(eq(exams.id, aspExamId));
        await transaction.insert(exams).values({
            id: aspExamId,
            courseId: '00000000-0000-4000-8000-000000000003',
            createdById: professorId,
            title: 'ASP Online Exam',
            description: 'Algorithms and Data Structures assessment',
            type: ExamType.Online,
            durationMinutes: 90,
            maxAttempts: 1,
            visibility: ExamVisibility.Published,
        });

        await transaction.insert(examAnnouncements).values({
            id: '00000000-0000-4000-8000-000000000501',
            examId: aspExamId,
            title: 'Exam instructions',
            message: 'Complete all questions. The third question is intentionally unanswered by three seeded students.',
        });
        await transaction.insert(examTimeslots).values({
            id: timeslotId,
            examId: aspExamId,
            location: 'A-101',
            startsAt: new Date(Date.now() - 60 * 60 * 1000),
            capacity: 10,
        });

        await transaction.insert(examItems).values([
            { id: itemIds[0], examId: aspExamId, position: 1, label: 'Q1', maxPoints: '5' },
            { id: itemIds[1], examId: aspExamId, position: 2, label: 'Q2', maxPoints: '10' },
            { id: itemIds[2], examId: aspExamId, position: 3, label: 'Q3', maxPoints: '15' },
        ]);
        await transaction.insert(examItemStatements).values([
            { examItemId: itemIds[0], prompt: 'Which data structure provides average O(1) lookup by key?' },
            { examItemId: itemIds[1], prompt: 'Explain the invariant maintained by a binary search tree.' },
            {
                examItemId: itemIds[2],
                prompt: `## Shortest path

Implement a function that finds the shortest path in a weighted graph.

- Return the total distance between \`start\` and \`end\`.
- All edge weights are non-negative.
- Return \`-1\` when the destination is unreachable.

\`\`\`javascript
function shortestPath(graph, start, end) {
  // TODO
}
\`\`\``,
            },
        ]);
        await transaction.insert(examQuestions).values([
            { id: questionIds[0], examItemId: itemIds[0], type: QuestionType.MultipleChoice },
            { id: questionIds[1], examItemId: itemIds[1], type: QuestionType.Essay },
            { id: questionIds[2], examItemId: itemIds[2], type: QuestionType.Coding },
        ]);
        await transaction.insert(examQuestionMultipleChoiceChoices).values([
            { questionId: questionIds[0], choiceText: 'Hash table', position: 0, isCorrect: true },
            { questionId: questionIds[0], choiceText: 'Linked list', position: 1, isCorrect: false },
            { questionId: questionIds[0], choiceText: 'Stack', position: 2, isCorrect: false },
        ]);
        await transaction.insert(examQuestionEssayConfigs).values({ questionId: questionIds[1] });
        await transaction.insert(examQuestionCodingConfigs).values({
            questionId: questionIds[2],
            language: CodingLanguage.JavaScript,
            mode: 'function',
            initialCode: 'function shortestPath(graph, start, end) {\n  // TODO\n}',
            solutionCode: 'function shortestPath(graph, start, end) {\n  return dijkstra(graph, start, end);\n}',
        });
        await transaction.insert(examQuestionCodingTestCases).values([
            {
                questionId: questionIds[2],
                name: 'Direct edge',
                input: 'graph = { A: { B: 3 } }, start = A, end = B',
                expectedOutput: '3',
                code: 'const graph = { A: { B: 3 } }; shortestPath(graph, "A", "B");',
                position: 0,
            },
            {
                questionId: questionIds[2],
                name: 'Two-hop path',
                input: 'graph = { A: { B: 2 }, B: { C: 4 } }, start = A, end = C',
                expectedOutput: '6',
                code: 'const graph = { A: { B: 2 }, B: { C: 4 } }; shortestPath(graph, "A", "C");',
                position: 1,
            },
        ]);

        for (const [index, student] of students.entries()) {
            await transaction
                .insert(examTimeslotRegistrations)
                .values({ examId: aspExamId, timeslotId, studentId: student.id });
            if (student.email === studentEmail) continue;

            const attemptId = `00000000-0000-4000-8000-000000000${601 + index}`;
            await transaction.insert(examAttempts).values({
                id: attemptId,
                examId: aspExamId,
                studentId: student.id,
                createdById: professorId,
                status: AttemptStatus.Graded,
                startedAt: new Date(Date.now() - 50 * 60 * 1000),
                submittedAt: new Date(Date.now() - 5 * 60 * 1000),
                gradedAt: new Date(),
                score: index < 3 ? '15' : index === 3 ? '25' : '30',
            });

            const answerIds = itemIds.map(
                (_, itemIndex) => `00000000-0000-4000-8000-000000000${701 + index * 3 + itemIndex}`,
            );
            // Three students intentionally leave Q3 unanswered.
            const answeredItems = index < 3 ? [0, 1] : [0, 1, 2];
            for (const itemIndex of answeredItems) {
                const answerId = answerIds[itemIndex];
                const type = [QuestionType.MultipleChoice, QuestionType.Essay, QuestionType.Coding][itemIndex];
                await transaction
                    .insert(examAnswers)
                    .values({ id: answerId, attemptId, examItemId: itemIds[itemIndex], type });
                if (itemIndex === 0)
                    await transaction.insert(examMultipleChoiceAnswerSelections).values({ answerId, selectedIndex: 0 });
                if (itemIndex === 1)
                    await transaction.insert(examEssayAnswers).values({
                        answerId,
                        text: 'The left subtree contains smaller values and the right subtree contains larger values.',
                    });
                if (itemIndex === 2) {
                    await transaction.insert(examCodingAnswers).values({
                        answerId,
                        code: 'return dijkstra(graph, start, end);',
                        language: CodingLanguage.JavaScript,
                    });
                    await transaction.insert(examCodingExecutions).values({
                        id: `00000000-0000-4000-8000-000000000${901 + index}`,
                        attemptId,
                        examItemId: itemIds[2],
                        jobId: `seed-asp-${index + 1}`,
                        studentCode: 'return dijkstra(graph, start, end);',
                        result: {
                            mode: 'function',
                            passed: index === 4,
                            compile: { stdout: '', stderr: '', exitCode: 0, timedOut: false, passed: true },
                            tests: [],
                        },
                    });
                }
            }

            const points = index < 3 ? ['5', '10', '0'] : index === 3 ? ['5', '10', '10'] : ['5', '10', '15'];
            for (const [itemIndex, pointsAwarded] of points.entries()) {
                await transaction.insert(examItemGrades).values({
                    attemptId,
                    examItemId: itemIds[itemIndex],
                    pointsAwarded,
                    status: 'graded',
                    feedback: pointsAwarded === '0' ? 'No answer submitted.' : 'Seeded grade.',
                    gradedById: professorId,
                    gradedAt: new Date(),
                });
            }
        }
    });
    console.log(
        'Seeded ASP online exam with four attempts, five registrations, questions, answers, grades, and announcement',
    );
}

async function seed() {
    const { professor, users } = await seedUsers();
    await seedFacultyAndCourses(professor.id, users);
    await seedAspMaterials(professor.id);
    await seedDiskretnaMaterials(professor.id);
    await seedExams(professor.id);
    await seedAspOnlineExam(professor.id, users);
}

seed()
    .catch((error: unknown) => {
        console.error('Database seed failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sql.end();
    });
