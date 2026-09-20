// @ts-nocheck
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { Database } from '@/database/client';
import { DATABASE } from '@/database/database.module';
import {
    AttemptStatus,
    ExamVisibility,
    examAttempts,
    exams,
    examTimeslotRegistrations,
    examTimeslots,
} from '@/database/schema';
import type { Attempt, AttemptUpdate } from '@/modules/exams/attempts/attempt.entity';
import { attemptSchema } from '@/modules/exams/attempts/attempt.entity';

@Injectable()
export class AttemptsRepository {
    constructor(@Inject(DATABASE) private readonly db: Database) {}

    async create(examId: string, studentId: string, createdById = studentId): Promise<Attempt> {
        const registered = await this.db.query.examAttempts.findFirst({
            where: (attempt, { and, eq }) =>
                and(
                    eq(attempt.examId, examId),
                    eq(attempt.studentId, studentId),
                    eq(attempt.status, AttemptStatus.Registered),
                ),
        });
        if (registered) {
            const [started] = await this.db
                .update(examAttempts)
                .set({ status: AttemptStatus.InProgress, startedAt: new Date() })
                .where(eq(examAttempts.id, registered.id))
                .returning();
            return attemptSchema.parse(started);
        }
        const [row] = await this.db
            .insert(examAttempts)
            .values({ examId, studentId, createdById, status: AttemptStatus.InProgress, startedAt: new Date() })
            .returning()
            .catch((error) => {
                throw error;
            });

        return attemptSchema.parse(row);
    }

    async findAllByExam(examId: string): Promise<Attempt[]> {
        await this.ensureExamExists(examId);

        const rows = await this.db.query.examAttempts.findMany({
            where: (attempt, { eq }) => eq(attempt.examId, examId),
            orderBy: (attempt, { desc }) => desc(attempt.startedAt),
        });

        return rows.map((row) => attemptSchema.parse(row));
    }

    async findAllByStudent(examId: string, studentId: string): Promise<Attempt[]> {
        await this.ensureExamExists(examId);

        const rows = await this.db.query.examAttempts.findMany({
            where: (attempt, { and, eq }) => and(eq(attempt.examId, examId), eq(attempt.studentId, studentId)),
            orderBy: (attempt, { desc }) => desc(attempt.startedAt),
        });

        return rows.map((row) => attemptSchema.parse(row));
    }

    async findExamForAttemptStart(
        examId: string,
        studentId: string,
    ): Promise<{
        id: string;
        startsAt: Date;
        durationMinutes: number;
        maxAttempts: number;
        visibility: ExamVisibility;
    }> {
        const [exam] = await this.db
            .select({
                id: exams.id,
                startsAt: examTimeslots.startsAt,
                durationMinutes: exams.durationMinutes,
                maxAttempts: exams.maxAttempts,
                visibility: exams.visibility,
            })
            .from(exams)
            .innerJoin(
                examTimeslotRegistrations,
                sql`${examTimeslotRegistrations.examId} = ${exams.id} and ${examTimeslotRegistrations.studentId} = ${studentId}`,
            )
            .innerJoin(examTimeslots, sql`${examTimeslots.id} = ${examTimeslotRegistrations.timeslotId}`)
            .where(sql`${exams.id} = ${examId}::uuid`);
        if (!exam) throw new NotFoundException('exam registration not found');
        return exam;
    }

    async hasInProgressAttempt(examId: string, studentId: string): Promise<boolean> {
        const row = await this.db.query.examAttempts.findFirst({
            where: (attempt, { and, eq }) =>
                and(
                    eq(attempt.examId, examId),
                    eq(attempt.studentId, studentId),
                    eq(attempt.status, AttemptStatus.InProgress),
                ),
            columns: { id: true },
        });

        return Boolean(row);
    }

    async countAttemptsByStudent(examId: string, studentId: string): Promise<number> {
        const rows = await this.db.query.examAttempts.findMany({
            where: (attempt, { and, eq }) => and(eq(attempt.examId, examId), eq(attempt.studentId, studentId)),
            columns: { id: true },
        });

        return rows.length;
    }

    async findById(examId: string, id: string): Promise<Attempt> {
        const row = await this.db.query.examAttempts.findFirst({
            where: (attempt, { and, eq }) => and(eq(attempt.id, id), eq(attempt.examId, examId)),
        });

        if (!row) throw new NotFoundException('attempt not found');

        return attemptSchema.parse(row);
    }

    async update(examId: string, id: string, data: AttemptUpdate): Promise<Attempt> {
        const [row] = await this.db
            .update(examAttempts)
            .set({
                ...(data.status !== undefined && { status: data.status }),
                ...(data.score !== undefined && { score: data.score }),
                ...(data.submittedAt !== undefined && {
                    submittedAt: data.submittedAt,
                }),
            })
            .where(sql`${examAttempts.id} = ${id}::uuid and ${examAttempts.examId} = ${examId}::uuid`)
            .returning()
            .catch((error) => {
                throw error;
            });

        if (!row) throw new NotFoundException('attempt not found');

        return attemptSchema.parse(row);
    }

    async submit(examId: string, id: string): Promise<Attempt> {
        const [row] = await this.db
            .update(examAttempts)
            .set({
                status: AttemptStatus.Submitted,
                submittedAt: new Date(),
            })
            .where(
                sql`${examAttempts.id} = ${id}::uuid and ${examAttempts.examId} = ${examId}::uuid and ${examAttempts.status} = ${AttemptStatus.InProgress}`,
            )
            .returning();

        if (!row) throw new ConflictException('attempt is not in progress or does not exist');

        return attemptSchema.parse(row);
    }

    async ensureExamExists(examId: string): Promise<void> {
        const exam = await this.db.query.exams.findFirst({
            where: (entry, { eq }) => eq(entry.id, examId),
            columns: { id: true },
        });

        if (!exam) throw new NotFoundException('exam not found');
    }
}
