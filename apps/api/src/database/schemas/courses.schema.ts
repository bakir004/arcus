import { index, primaryKey, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';
import { faculties } from './faculties.schema';

export const courses = pgTable(
    'courses',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        name: varchar('name', { length: 255 }).notNull(),
        code: varchar('code', { length: 64 }),
        facultyId: uuid('faculty_id').references(() => faculties.id, {
            onDelete: 'set null',
        }),
        createdById: text('created_by_id')
            .notNull()
            .references(() => user.id, { onDelete: 'restrict' }),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (t) => [
        index('courses_created_by_id_idx').on(t.createdById),
        index('courses_code_idx').on(t.code),
        index('courses_faculty_id_idx').on(t.facultyId),
    ],
);

export const courseMembers = pgTable(
    'course_members',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        courseId: uuid('course_id')
            .notNull()
            .references(() => courses.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (t) => [index('course_members_course_id_idx').on(t.courseId), index('course_members_user_id_idx').on(t.userId)],
);

export const courseRoles = pgTable(
    'course_roles',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        courseId: uuid('course_id')
            .notNull()
            .references(() => courses.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 128 }).notNull(),
        createdById: text('created_by_id')
            .notNull()
            .references(() => user.id, { onDelete: 'restrict' }),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (t) => [
        index('course_roles_course_id_idx').on(t.courseId),
        index('course_roles_created_by_id_idx').on(t.createdById),
    ],
);

export const courseRolePermissions = pgTable(
    'course_role_permissions',
    {
        courseRoleId: uuid('course_role_id')
            .notNull()
            .references(() => courseRoles.id, { onDelete: 'cascade' }),
        permissionKey: varchar('permission_key', { length: 128 }).notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (t) => [
        primaryKey({ columns: [t.courseRoleId, t.permissionKey] }),
        index('course_role_permissions_permission_key_idx').on(t.permissionKey),
    ],
);

export const courseMemberRoles = pgTable(
    'course_member_roles',
    {
        courseMemberId: uuid('course_member_id')
            .notNull()
            .references(() => courseMembers.id, { onDelete: 'cascade' }),
        courseRoleId: uuid('course_role_id')
            .notNull()
            .references(() => courseRoles.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (t) => [
        primaryKey({ columns: [t.courseMemberId, t.courseRoleId] }),
        index('course_member_roles_course_role_id_idx').on(t.courseRoleId),
    ],
);
