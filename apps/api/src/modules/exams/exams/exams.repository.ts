import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import type { Database } from '@/database/client';
import { DATABASE } from '@/database/database.module';
import { exams } from '@/database/schema';
import { ExamCreationFailed, ExamNotFound } from '@/modules/exams/exams/exams.errors';
import type { Exam, ExamCreate, ExamUpdate } from '@/modules/exams/exams/exams.entity';

@Injectable()
export class ExamsRepository {
    constructor(@Inject(DATABASE) private readonly db: Database) {}

    async create(courseId: string, createdById: string, data: ExamCreate): Promise<Exam> {
        const [row] = await this.db
            .insert(exams)
            .values({ ...data, courseId, createdById })
            .returning();

        if (!row) throw ExamCreationFailed();

        return row;
    }

    async findAll(courseId: string): Promise<Exam[]> {
        const rows = await this.db
            .select()
            .from(exams)
            .where(eq(exams.courseId, courseId))
            .orderBy(asc(exams.createdAt));

        return rows;
    }

    async findById(courseId: string, id: string): Promise<Exam> {
        const [row] = await this.db
            .select()
            .from(exams)
            .where(and(eq(exams.courseId, courseId), eq(exams.id, id)))
            .limit(1);

        if (!row) throw ExamNotFound(id);

        return row;
    }

    async update(courseId: string, id: string, data: ExamUpdate): Promise<Exam> {
        const [row] = await this.db
            .update(exams)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(and(eq(exams.courseId, courseId), eq(exams.id, id)))
            .returning();

        if (!row) throw ExamNotFound(id);

        return row;
    }

    async delete(courseId: string, id: string): Promise<void> {
        const rows = await this.db
            .delete(exams)
            .where(and(eq(exams.courseId, courseId), eq(exams.id, id)))
            .returning({ id: exams.id });

        if (rows.length === 0) throw ExamNotFound(id);
    }
}
