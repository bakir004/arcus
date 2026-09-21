import { Permissions, type Permission } from '@/authz/permissions';
import type { courses } from '@/database/schemas/courses.schema';

export const facultyId = '00000000-0000-4000-8000-000000000010';
export const primaryCourseId = '00000000-0000-4000-8000-000000000001';

export type CourseSeed = Omit<typeof courses.$inferInsert, 'id' | 'createdById'> & {
    id: string;
    adminRoleId: string;
    restrictedAdminRoleId: string;
    professorRoleId: string;
    studentRoleId: string;
};

export const courseSeeds: CourseSeed[] = [
    {
        id: primaryCourseId,
        name: 'Diskretna Matematika',
        code: 'DM',
        facultyId,
        adminRoleId: '00000000-0000-4000-8000-000000000201',
        restrictedAdminRoleId: '00000000-0000-4000-8000-000000000301',
        professorRoleId: '00000000-0000-4000-8000-000000000501',
        studentRoleId: '00000000-0000-4000-8000-000000000401',
    },
    {
        id: '00000000-0000-4000-8000-000000000002',
        name: 'Uvod u programiranje',
        code: 'UUP',
        facultyId,
        adminRoleId: '00000000-0000-4000-8000-000000000202',
        restrictedAdminRoleId: '00000000-0000-4000-8000-000000000302',
        professorRoleId: '00000000-0000-4000-8000-000000000502',
        studentRoleId: '00000000-0000-4000-8000-000000000402',
    },
    {
        id: '00000000-0000-4000-8000-000000000003',
        name: 'Algoritmi i strukture podataka',
        code: 'ASP',
        facultyId,
        adminRoleId: '00000000-0000-4000-8000-000000000203',
        restrictedAdminRoleId: '00000000-0000-4000-8000-000000000303',
        professorRoleId: '00000000-0000-4000-8000-000000000503',
        studentRoleId: '00000000-0000-4000-8000-000000000403',
    },
    {
        id: '00000000-0000-4000-8000-000000000004',
        name: 'Baze podataka',
        code: 'BP',
        facultyId,
        adminRoleId: '00000000-0000-4000-8000-000000000204',
        restrictedAdminRoleId: '00000000-0000-4000-8000-000000000304',
        professorRoleId: '00000000-0000-4000-8000-000000000504',
        studentRoleId: '00000000-0000-4000-8000-000000000404',
    },
];

export const courseAdminRoleName = 'Admin';
export const courseRestrictedAdminRoleName = 'Admin (restricted exam management)';
export const courseAdminPermissions: Permission[] = Object.values(Permissions);
export const courseRestrictedAdminPermissions = courseAdminPermissions.filter(
    (permission) => permission !== Permissions.ExamCreate && permission !== Permissions.ExamUpdate,
);
export const courseProfessorRoleName = 'Professor';
export const courseProfessorPermissions: Permission[] = Object.values(Permissions);
export const courseStudentRoleName = 'Student';
export const courseStudentPermissions: Permission[] = [
    Permissions.CourseRead,
    Permissions.CourseMaterialRead,
    Permissions.AssignmentRead,
    Permissions.AssignmentSubmit,
    Permissions.ExamRead,
    Permissions.AnnouncementRead,
    Permissions.QuestionRead,
    Permissions.AttemptCreate,
    Permissions.AttemptRead,
    Permissions.AttemptSubmit,
    Permissions.AnswerSave,
    Permissions.AnswerReadOwn,
];
