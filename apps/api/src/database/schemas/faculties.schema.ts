import { index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const faculties = pgTable(
    'faculties',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        name: varchar('name', { length: 255 }).notNull(),
        code: varchar('code', { length: 64 }),
        createdById: text('created_by_id')
            .notNull()
            .references(() => user.id, { onDelete: 'restrict' }),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => [index('faculties_created_by_id_idx').on(table.createdById), index('faculties_code_idx').on(table.code)],
);
