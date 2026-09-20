// @ts-nocheck
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import type { Database } from '@/database/client';
import { DATABASE } from '@/database/database.module';
import { examAnswers, examAttempts, examItemGrades, examItems, examItemStatements, user } from '@/database/schema';
import type { Answer, AnswerPayload, GradeAnswer } from '@/modules/exams/answers/answer.entity';
import { answerSchema } from '@/modules/exams/answers/answer.entity';
import type { DbExecutor } from '@/modules/exams/answers/answers.repository.interface';
import { getAllAnswerRepositories, getAnswerRepository } from '@/modules/exams/answers/answers.repository.registry';

export type ExamAnswerTable = {
    items: { id: string; position: number; prompt: string | null }[];
    rows: {
        attemptId: string;
        studentId: string;
        studentName: string;
        studentFacultyIndex: string | null;
        answers: Answer[];
    }[];
};

type AnswerRow = typeof examAnswers.$inferSelect;

@Injectable()
export class AnswersRepository {
    constructor(@Inject(DATABASE) private readonly db: Database) {}

    async findAttempt(examId: string, attemptId: string) {
        const [attempt] = await this.db
            .select()
            .from(examAttempts)
            .where(and(eq(examAttempts.id, attemptId), eq(examAttempts.examId, examId)))
            .limit(1);
        if (!attempt) throw new NotFoundException('attempt not found');
        return attempt;
    }

    async findAllByAttempt(attemptId: string): Promise<Answer[]> {
        const rows = await this.db
            .select()
            .from(examAnswers)
            .where(eq(examAnswers.attemptId, attemptId))
            .orderBy(asc(examAnswers.createdAt));
        return this.hydrateAnswersMany(this.db, rows);
    }

    async findAllByAttempts(attemptIds: string[]): Promise<Answer[]> {
        if (attemptIds.length === 0) return [];
        const rows = await this.db
            .select()
            .from(examAnswers)
            .where(inArray(examAnswers.attemptId, attemptIds))
            .orderBy(asc(examAnswers.createdAt));
        return this.hydrateAnswersMany(this.db, rows);
    }

    async findByAttemptAndItem(attemptId: string, examItemId: string): Promise<Answer | undefined> {
        const [row] = await this.db
            .select()
            .from(examAnswers)
            .where(and(eq(examAnswers.attemptId, attemptId), eq(examAnswers.examItemId, examItemId)))
            .limit(1);
        return row ? this.hydrateAnswer(this.db, row) : undefined;
    }

    async upsert(attemptId: string, examItemId: string, answer: AnswerPayload): Promise<Answer> {
        return this.db.transaction(async (tx) => {
            const [row] = await tx
                .insert(examAnswers)
                .values({ attemptId, examItemId, type: answer.type })
                .onConflictDoUpdate({
                    target: [examAnswers.attemptId, examAnswers.examItemId],
                    set: { type: answer.type, updatedAt: new Date() },
                })
                .returning();
            if (!row) throw new NotFoundException('answer could not be saved');
            await Promise.all(getAllAnswerRepositories().map((repository) => repository.clearAnswer(tx, row.id)));
            await getAnswerRepository(answer.type).saveAnswer(tx, row.id, answer);
            return this.hydrateAnswer(tx, row);
        });
    }

    async grade(attemptId: string, examItemId: string, payload: GradeAnswer, gradedById: string) {
        await this.db
            .insert(examItemGrades)
            .values({
                attemptId,
                examItemId,
                pointsAwarded: String(payload.score),
                status: 'graded',
                feedback: payload.feedback ?? null,
                gradedById,
                gradedAt: new Date(),
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: [examItemGrades.attemptId, examItemGrades.examItemId],
                set: {
                    pointsAwarded: String(payload.score),
                    status: 'graded',
                    feedback: payload.feedback ?? null,
                    gradedById,
                    gradedAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        await this.recalculateAttemptScore(attemptId);
        const [grade] = await this.db
            .select()
            .from(examItemGrades)
            .where(and(eq(examItemGrades.attemptId, attemptId), eq(examItemGrades.examItemId, examItemId)))
            .limit(1);
        return grade;
    }

    async recalculateAttemptScore(attemptId: string): Promise<void> {
        const [row] = await this.db
            .select({ score: sql<string>`sum(${examItemGrades.pointsAwarded})` })
            .from(examItemGrades)
            .where(and(eq(examItemGrades.attemptId, attemptId), eq(examItemGrades.status, 'graded')));
        await this.db
            .update(examAttempts)
            .set({ score: row?.score ?? null })
            .where(eq(examAttempts.id, attemptId));
    }

    async getExamAnswerTable(examId: string): Promise<ExamAnswerTable> {
        const items = await this.db
            .select({ id: examItems.id, position: examItems.position, prompt: examItemStatements.prompt })
            .from(examItems)
            .leftJoin(examItemStatements, eq(examItemStatements.examItemId, examItems.id))
            .where(eq(examItems.examId, examId))
            .orderBy(asc(examItems.position));
        const attempts = await this.db
            .select({
                attemptId: examAttempts.id,
                studentId: examAttempts.studentId,
                studentName: user.name,
                studentFacultyIndex: user.facultyIndex,
            })
            .from(examAttempts)
            .leftJoin(user, eq(user.id, examAttempts.studentId))
            .where(eq(examAttempts.examId, examId))
            .orderBy(asc(user.name), asc(examAttempts.startedAt));
        const answers = await this.findAllByAttempts(attempts.map((attempt) => attempt.attemptId));
        const byAttempt = new Map<string, Answer[]>();
        for (const answer of answers)
            byAttempt.set(answer.attemptId, [...(byAttempt.get(answer.attemptId) ?? []), answer]);
        return {
            items,
            rows: attempts.map((attempt) => ({
                ...attempt,
                studentName: attempt.studentName ?? attempt.studentId,
                answers: byAttempt.get(attempt.attemptId) ?? [],
            })),
        };
    }

    private async hydrateAnswer(db: DbExecutor, row: AnswerRow): Promise<Answer> {
        const answer = await getAnswerRepository(row.type).loadAnswer(db, row.id);
        const [grade] = await db
            .select()
            .from(examItemGrades)
            .where(and(eq(examItemGrades.attemptId, row.attemptId), eq(examItemGrades.examItemId, row.examItemId)))
            .limit(1);
        return answerSchema.parse({
            ...row,
            answer,
            score: grade?.pointsAwarded ?? null,
            feedback: grade?.feedback ?? null,
            gradedAt: grade?.gradedAt ?? null,
            gradedBy: grade?.gradedById ?? null,
        });
    }

    private async hydrateAnswersMany(db: DbExecutor, rows: AnswerRow[]): Promise<Answer[]> {
        if (rows.length === 0) return [];
        const idsByType = new Map<AnswerRow['type'], string[]>();
        for (const row of rows) idsByType.set(row.type, [...(idsByType.get(row.type) ?? []), row.id]);
        const payloads = new Map<string, AnswerPayload>();
        await Promise.all(
            [...idsByType].map(async ([type, ids]) => {
                for (const [id, payload] of await getAnswerRepository(type).loadAnswersMany(db, ids))
                    payloads.set(id, payload);
            }),
        );
        const grades = await db
            .select()
            .from(examItemGrades)
            .where(
                inArray(
                    examItemGrades.attemptId,
                    rows.map((row) => row.attemptId),
                ),
            );
        const gradeByKey = new Map(grades.map((grade) => [`${grade.attemptId}:${grade.examItemId}`, grade]));
        return rows.map((row) => {
            const grade = gradeByKey.get(`${row.attemptId}:${row.examItemId}`);
            return answerSchema.parse({
                ...row,
                answer: payloads.get(row.id),
                score: grade?.pointsAwarded ?? null,
                feedback: grade?.feedback ?? null,
                gradedAt: grade?.gradedAt ?? null,
                gradedBy: grade?.gradedById ?? null,
            });
        });
    }
}
