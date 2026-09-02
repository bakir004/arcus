import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import type { Database } from '@/database/client';
import { DATABASE } from '@/database/database.module';
import { exams } from '@/database/schema';
import type { Exam, ExamCreate, ExamUpdate } from '@/modules/exams/exams/exams.entity';
import { examSchema } from '@/modules/exams/exams/exams.entity';

@Injectable()
export class ExamsRepository {
    constructor(@Inject(DATABASE) private readonly db: Database) {}

    async create(courseId: string, createdById: string, data: ExamCreate): Promise<Exam> {
        const [row] = await this.db
            .insert(exams)
            .values({ ...data, courseId, createdById })
            .returning();

        return examSchema.parse(row);
    }

    async findAll(courseId: string): Promise<Exam[]> {
        const rows = await this.db
            .select()
            .from(exams)
            .where(eq(exams.courseId, courseId))
            .orderBy(asc(exams.createdAt));

        return rows.map((row) => examSchema.parse(row));
    }

    async findById(courseId: string, id: string): Promise<Exam> {
        const [row] = await this.db
            .select()
            .from(exams)
            .where(and(eq(exams.courseId, courseId), eq(exams.id, id)))
            .limit(1);

        if (!row) throw new NotFoundException('exam not found');

        return examSchema.parse(row);
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

        if (!row) throw new NotFoundException('exam not found');

        return examSchema.parse(row);
    }

    async delete(courseId: string, id: string): Promise<void> {
        const rows = await this.db
            .delete(exams)
            .where(and(eq(exams.courseId, courseId), eq(exams.id, id)))
            .returning({ id: exams.id });

        if (rows.length === 0) throw new NotFoundException('exam not found');
    }
}
