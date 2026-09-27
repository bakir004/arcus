import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, or } from 'drizzle-orm';
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

    async findById(courseId: string, reference: string): Promise<Exam> {
        const [row] = await this.db
            .select()
            .from(exams)
            .where(and(
                eq(exams.courseId, courseId),
                /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reference)
                    ? or(eq(exams.slug, reference), eq(exams.id, reference))
                    : eq(exams.slug, reference),
            ))
            .limit(1);

        if (!row) throw ExamNotFound(reference);

        return row;
    }

    async update(courseId: string, reference: string, data: ExamUpdate): Promise<Exam> {
        const exam = await this.findById(courseId, reference);
        const [row] = await this.db
            .update(exams)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(and(eq(exams.courseId, courseId), eq(exams.id, exam.id)))
            .returning();

        if (!row) throw ExamNotFound(reference);

        return row;
    }

    async delete(courseId: string, reference: string): Promise<void> {
        const exam = await this.findById(courseId, reference);
        const rows = await this.db
            .delete(exams)
            .where(and(eq(exams.courseId, courseId), eq(exams.id, exam.id)))
            .returning({ id: exams.id });

        if (rows.length === 0) throw ExamNotFound(reference);
    }

    /* Kept for callers that need the stable database id behind a URL slug. */
    async resolveId(courseId: string, reference: string): Promise<string> {
        return (await this.findById(courseId, reference)).id;
    }

}
