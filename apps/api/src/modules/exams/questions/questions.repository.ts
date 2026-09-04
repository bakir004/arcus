// Drizzle's transaction/query-builder types are intentionally hidden behind the repository facade.
// @ts-nocheck
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DATABASE } from '@/database/database.module';
import type { Database } from '@/database/client';
import { examQuestions } from '@/database/schema';
import {
    ExamNotFound,
    InvalidQuestionOrder,
    QuestionCreationFailed,
    QuestionNotFound,
    QuestionOptionsNotFound,
    QuestionPositionConflict,
} from '@/modules/exams/questions/questions.errors';
import type {
    Question,
    QuestionCreate,
    QuestionOptions,
    QuestionUpdate,
} from '@/modules/exams/questions/questions.entity';
import { questionSchema } from '@/modules/exams/questions/questions.entity';
import type { DbExecutor } from '@/modules/exams/questions/questions.repository.interface';
import {
    getAllQuestionRepositories,
    getQuestionRepository,
} from '@/modules/exams/questions/questions.repository.registry';

type QuestionRow = typeof examQuestions.$inferSelect;

@Injectable()
export class QuestionsRepository {
    constructor(@Inject(DATABASE) private readonly db: Database) {}

    create(examId: string, data: QuestionCreate): Promise<Question> {
        return this.db.transaction(async (tx) => {
            const [row] = await tx
                .insert(examQuestions)
                .values({
                    examId,
                    prompt: data.prompt,
                    position: data.position,
                    points: String(data.points),
                    type: data.options.type,
                })
                .returning()
                .catch((error) => {
                    throw this.mapError(error);
                });

            if (!row) throw QuestionCreationFailed();

            await this.replaceOptions(tx, row.id, data.options);
            return this.hydrateOptions(tx, row);
        });
    }

    async findAllByExam(examId: string): Promise<Question[]> {
        await this.ensureExamExists(examId);

        const rows = await this.db.query.examQuestions.findMany({
            where: (question, { eq }) => eq(question.examId, examId),
            orderBy: (question, { asc }) => asc(question.position),
        });

        return this.hydrateOptionsMany(this.db, rows);
    }

    async findById(examId: string, id: string): Promise<Question> {
        const row = await this.db.query.examQuestions.findFirst({
            where: (question, { and, eq }) => and(eq(question.id, id), eq(question.examId, examId)),
        });

        if (!row) throw QuestionNotFound(id);
        return this.hydrateOptions(this.db, row);
    }

    update(examId: string, id: string, data: QuestionUpdate): Promise<Question> {
        return this.db.transaction(async (tx) => {
            const [row] = await tx
                .update(examQuestions)
                .set({
                    ...(data.prompt !== undefined && { prompt: data.prompt }),
                    ...(data.position !== undefined && {
                        position: data.position,
                    }),
                    ...(data.points !== undefined && {
                        points: String(data.points),
                    }),
                    ...(data.options !== undefined && {
                        type: data.options.type,
                    }),
                })
                .where(and(eq(examQuestions.id, id), eq(examQuestions.examId, examId)))
                .returning()
                .catch((error) => {
                    throw this.mapError(error);
                });

            if (!row) throw QuestionNotFound(id);

            if (data.options !== undefined) {
                await this.replaceOptions(tx, id, data.options);
                return questionSchema.parse({ ...row, options: data.options });
            }

            return this.hydrateOptions(tx, row);
        });
    }

    async reorder(examId: string, questionIds: string[]): Promise<Question[]> {
        return this.db.transaction(async (tx) => {
            const existing = await tx
                .select({ id: examQuestions.id })
                .from(examQuestions)
                .where(eq(examQuestions.examId, examId));

            if (
                existing.length !== questionIds.length ||
                existing.some((question) => !questionIds.includes(question.id))
            ) {
                throw InvalidQuestionOrder();
            }

            await tx.execute(sql`set constraints exam_questions_exam_position_uniq deferred`);
            for (const [index, id] of questionIds.entries()) {
                await tx
                    .update(examQuestions)
                    .set({ position: index + 1 })
                    .where(and(eq(examQuestions.id, id), eq(examQuestions.examId, examId)));
            }

            const rows = await tx.query.examQuestions.findMany({
                where: (question, { eq }) => eq(question.examId, examId),
                orderBy: (question, { asc }) => asc(question.position),
            });
            return this.hydrateOptionsMany(tx, rows);
        });
    }

    async delete(examId: string, id: string): Promise<void> {
        await this.db.transaction(async (tx) => {
            const question = await tx.query.examQuestions.findFirst({
                where: (table, { and, eq }) => and(eq(table.id, id), eq(table.examId, examId)),
                columns: { id: true },
            });

            if (!question) throw QuestionNotFound(id);

            await Promise.all(getAllQuestionRepositories().map((repository) => repository.clearOptions(tx, id)));

            await tx.delete(examQuestions).where(eq(examQuestions.id, id));
        });
    }

    async ensureExamExists(examId: string): Promise<void> {
        const exam = await this.db.query.exams.findFirst({
            where: (entry, { eq }) => eq(entry.id, examId),
            columns: { id: true },
        });

        if (!exam) throw ExamNotFound(examId);
    }

    // Attempts are not part of the migrated API yet; keep this seam for that module.
    async hasAttempts(_examId: string): Promise<boolean> {
        return false;
    }

    private async replaceOptions(db: DbExecutor, questionId: string, options: QuestionOptions): Promise<void> {
        await Promise.all(getAllQuestionRepositories().map((repository) => repository.clearOptions(db, questionId)));
        await getQuestionRepository(options.type).saveOptions(db, questionId, options);
    }

    private async hydrateOptions(db: DbExecutor, row: QuestionRow): Promise<Question> {
        const options = await getQuestionRepository(row.type).loadOptions(db, row.id);
        return questionSchema.parse({ ...row, options });
    }

    private async hydrateOptionsMany(db: DbExecutor, rows: QuestionRow[]): Promise<Question[]> {
        if (rows.length === 0) return [];

        const idsByType = new Map<QuestionRow['type'], string[]>();
        for (const row of rows) {
            const ids = idsByType.get(row.type) ?? [];
            ids.push(row.id);
            idsByType.set(row.type, ids);
        }

        const optionsById = new Map<string, Question['options']>();
        await Promise.all(
            [...idsByType.entries()].map(async ([type, questionIds]) => {
                const optionsMap = await getQuestionRepository(type).loadOptionsMany(db, questionIds);
                for (const [questionId, options] of optionsMap.entries()) {
                    optionsById.set(questionId, options);
                }
            }),
        );

        return rows.map((row) => {
            const options = optionsById.get(row.id);
            if (!options) throw QuestionOptionsNotFound(row.id);
            return questionSchema.parse({ ...row, options });
        });
    }

    private mapError(error: unknown): Error {
        const code = (error as { code?: string })?.code;
        if (code === '23505') {
            return QuestionPositionConflict();
        }
        if (code === '23503') {
            return ExamNotFound();
        }
        return error as Error;
    }
}
