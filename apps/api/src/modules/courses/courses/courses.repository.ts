import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { Database } from '@/database/client';
import { DATABASE } from '@/database/database.module';
import { courses } from '@/database/schema';
import { CourseCreationFailed, CourseNotFound } from '@/modules/courses/courses/courses.errors';
import type { Course, CourseCreate, CourseUpdate } from '@/modules/courses/courses/courses.entity';

@Injectable()
export class CoursesRepository {
    constructor(@Inject(DATABASE) private readonly db: Database) {}

    async create(createdById: string, data: CourseCreate): Promise<Course> {
        const [row] = await this.db
            .insert(courses)
            .values({ ...data, createdById })
            .returning();

        if (!row) throw CourseCreationFailed();

        return row;
    }

    async findAll(): Promise<Course[]> {
        return this.db.select().from(courses).orderBy(asc(courses.name));
    }

    async findById(id: string): Promise<Course> {
        const [row] = await this.db.select().from(courses).where(eq(courses.id, id)).limit(1);

        if (!row) throw CourseNotFound(id);

        return row;
    }

    async findByCode(code: string): Promise<Course> {
        const [row] = await this.db.select().from(courses).where(eq(courses.code, code)).limit(1);

        if (!row) throw CourseNotFound(code);

        return row;
    }

    async update(id: string, data: CourseUpdate): Promise<Course> {
        const [row] = await this.db
            .update(courses)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(courses.id, id))
            .returning();

        if (!row) throw CourseNotFound(id);

        return row;
    }

    async delete(id: string): Promise<void> {
        const rows = await this.db.delete(courses).where(eq(courses.id, id)).returning({ id: courses.id });

        if (rows.length === 0) throw CourseNotFound(id);
    }
}
