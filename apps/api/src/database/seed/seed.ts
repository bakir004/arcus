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
import { exams } from '@/database/schemas/exams.schema';
import { faculties } from '@/database/schemas/faculties.schema';
import {
    courseAdminPermissions,
    courseAdminRoleName,
    courseRestrictedAdminPermissions,
    courseRestrictedAdminRoleName,
    courseStudentPermissions,
    courseStudentRoleName,
    courseSeeds,
} from '@/database/seed/courses/courses';
import { examSeeds } from '@/database/seed/exams/exams';
import { facultySeeds } from '@/database/seed/faculties/faculties';
import { professorEmail, studentEmail, userSeeds } from '@/database/seed/users/users';
import { seedAspMaterials } from '@/database/seed/courses/materials';

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
            const { adminRoleId, restrictedAdminRoleId, studentRoleId, ...course } = seed;

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

                const assignedRoleId = seededUser.email === studentEmail ? studentRoleId : adminRoleId;

                await transaction
                    .delete(courseMemberRoles)
                    .where(
                        and(
                            eq(courseMemberRoles.courseMemberId, member.id),
                            inArray(courseMemberRoles.courseRoleId, [
                                adminRoleId,
                                restrictedAdminRoleId,
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
    console.log(`Enrolled ${users.length} users in every course (Imran Vlajcic as Student)`);
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

async function seed() {
    const { professor, users } = await seedUsers();
    await seedFacultyAndCourses(professor.id, users);
    await seedAspMaterials(professor.id);
    await seedExams(professor.id);
}

seed()
    .catch((error: unknown) => {
        console.error('Database seed failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sql.end();
    });
