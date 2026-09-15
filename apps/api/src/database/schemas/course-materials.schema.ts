import { relations } from 'drizzle-orm';
import { user } from './auth.schema';
import { courses } from './courses.schema';
import { boolean, index, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

export const courseMaterialKind = pgEnum('course_material_kind', ['TEXT', 'FILE', 'LINK']);

export const courseGroups = pgTable(
    'course_groups',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        courseId: uuid('course_id')
            .notNull()
            .references(() => courses.id, { onDelete: 'cascade' }),
        position: integer('position').notNull(),
        name: text('name').notNull(),
        description: text('description'),
        labeled: boolean('labeled').default(true).notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (t) => [unique('course_groups_course_position_key').on(t.courseId, t.position)],
);

/** Content columns are nullable because only the column matching `kind` is populated. */
export const courseMaterials = pgTable(
    'course_materials',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        uploadedById: text('uploaded_by_id')
            .notNull()
            .references(() => user.id, { onDelete: 'restrict' }),
        courseGroupId: uuid('course_group_id')
            .notNull()
            .references(() => courseGroups.id, { onDelete: 'cascade' }),
        position: integer('position').notNull(),
        kind: courseMaterialKind('kind').notNull(),
        textContent: text('text_content'),
        title: text('title'),
        description: text('description'),
        externalUrl: text('external_url'),
        fileKey: text('file_key'),
        fileName: text('file_name'),
        fileMimeType: text('file_mime_type'),
        fileSize: integer('file_size'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (t) => [
        unique('course_materials_group_position_key').on(t.courseGroupId, t.position),
        index('course_materials_course_group_id_idx').on(t.courseGroupId),
    ],
);

export const courseGroupsRelations = relations(courseGroups, ({ one, many }) => ({
    course: one(courses, { fields: [courseGroups.courseId], references: [courses.id] }),
    materials: many(courseMaterials),
}));

export const courseMaterialsRelations = relations(courseMaterials, ({ one }) => ({
    group: one(courseGroups, { fields: [courseMaterials.courseGroupId], references: [courseGroups.id] }),
}));
