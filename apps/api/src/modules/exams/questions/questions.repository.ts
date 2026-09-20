// Drizzle's transaction/query-builder types are intentionally hidden behind the repository facade.
// @ts-nocheck
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DATABASE } from '@/database/database.module';
import type { Database } from '@/database/client';
import { examAttempts, examItems, examItemStatements, examQuestions } from '@/database/schema';
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

type QuestionRow = typeof examQuestions.$inferSelect & {
    examId: string;
    prompt: string;
    position: number;
    points: string;
};

@Injectable()
export class QuestionsRepository {
    constructor(@Inject(DATABASE) private readonly db: Database) {}

    create(examId: string, data: QuestionCreate): Promise<Question> {
        return this.db.transaction(async (tx) => {
            const [item] = await tx
                .insert(examItems)
                .values({ examId, position: data.position, maxPoints: String(data.points) })
                .returning()
                .catch((error) => {
                    throw this.mapError(error);
                });
            if (!item) throw QuestionCreationFailed();

            await tx.insert(examItemStatements).values({ examItemId: item.id, prompt: data.prompt });
            const [row] = await tx
                .insert(examQuestions)
                .values({ examItemId: item.id, type: data.options.type })
                .returning()
                .catch((error) => {
                    throw this.mapError(error);
                });
            if (!row) throw QuestionCreationFailed();

            await this.replaceOptions(tx, row.id, data.options);
            return this.hydrateOptions(tx, this.toQuestionRow(row, item, data.prompt));
        });
    }

    async findAllByExam(examId: string): Promise<Question[]> {
        await this.ensureExamExists(examId);
        const rows = await this.findRows(this.db, examId);
        return this.hydrateOptionsMany(this.db, rows);
    }

    async findById(examId: string, id: string): Promise<Question> {
        const rows = await this.findRows(this.db, examId, id);
        if (!rows[0]) throw QuestionNotFound(id);
        return this.hydrateOptions(this.db, rows[0]);
    }

    async ensureItemExists(examId: string, examItemId: string): Promise<void> {
        const [item] = await this.db
            .select({ id: examItems.id })
            .from(examItems)
            .where(and(eq(examItems.id, examItemId), eq(examItems.examId, examId)))
            .limit(1);
        if (!item) throw QuestionNotFound(examItemId);
    }

    async findByItemId(examId: string, examItemId: string): Promise<Question> {
        const rows = await this.findRows(this.db, examId);
        const row = rows.find((candidate) => candidate.examItemId === examItemId);
        if (!row) throw QuestionNotFound(examItemId);
        return this.hydrateOptions(this.db, row);
    }

    async update(examId: string, id: string, data: QuestionUpdate): Promise<Question> {
        return this.db
            .transaction(async (tx) => {
                const existing = (await this.findRows(tx, examId, id))[0];
                if (!existing) throw QuestionNotFound(id);

                await tx
                    .update(examItems)
                    .set({
                        ...(data.position !== undefined && { position: data.position }),
                        ...(data.points !== undefined && { maxPoints: String(data.points) }),
                        updatedAt: new Date(),
                    })
                    .where(eq(examItems.id, existing.examItemId));
                if (data.prompt !== undefined) {
                    await tx
                        .update(examItemStatements)
                        .set({ prompt: data.prompt })
                        .where(eq(examItemStatements.examItemId, existing.examItemId));
                }
                if (data.options !== undefined) {
                    await tx.update(examQuestions).set({ type: data.options.type }).where(eq(examQuestions.id, id));
                    await this.replaceOptions(tx, id, data.options);
                }

                const updated = (await this.findRows(tx, examId, id))[0];
                return data.options !== undefined
                    ? questionSchema.parse({ ...updated, options: data.options })
                    : this.hydrateOptions(tx, updated);
            })
            .catch((error) => {
                if (error?.code === '23505') throw QuestionPositionConflict();
                throw error;
            });
    }

    async reorder(examId: string, questionIds: string[]): Promise<Question[]> {
        return this.db.transaction(async (tx) => {
            const existing = await tx
                .select({ id: examQuestions.id, itemId: examQuestions.examItemId })
                .from(examQuestions)
                .innerJoin(examItems, eq(examItems.id, examQuestions.examItemId))
                .where(eq(examItems.examId, examId));
            if (existing.length !== questionIds.length || existing.some((q) => !questionIds.includes(q.id))) {
                throw InvalidQuestionOrder();
            }

            // Move through negative positions to avoid unique-position collisions.
            for (const [index, row] of existing.entries()) {
                await tx
                    .update(examItems)
                    .set({ position: -(index + 1) })
                    .where(eq(examItems.id, row.itemId));
            }
            for (const [index, id] of questionIds.entries()) {
                const row = existing.find((entry) => entry.id === id);
                await tx
                    .update(examItems)
                    .set({ position: index + 1, updatedAt: new Date() })
                    .where(eq(examItems.id, row.itemId));
            }
            return this.hydrateOptionsMany(tx, await this.findRows(tx, examId));
        });
    }

    async delete(examId: string, id: string): Promise<void> {
        const rows = await this.findRows(this.db, examId, id);
        if (!rows[0]) throw QuestionNotFound(id);
        await this.db.delete(examItems).where(eq(examItems.id, rows[0].examItemId));
    }

    async ensureExamExists(examId: string): Promise<void> {
        const exam = await this.db.query.exams.findFirst({
            where: (entry, { eq }) => eq(entry.id, examId),
            columns: { id: true },
        });
        if (!exam) throw ExamNotFound(examId);
    }

    async hasAttempts(examId: string): Promise<boolean> {
        const [attempt] = await this.db
            .select({ id: examAttempts.id })
            .from(examAttempts)
            .where(eq(examAttempts.examId, examId))
            .limit(1);
        return Boolean(attempt);
    }

    private async findRows(db: DbExecutor, examId: string, questionId?: string): Promise<QuestionRow[]> {
        const rows = await db
            .select({
                question: examQuestions,
                item: examItems,
                statement: examItemStatements,
            })
            .from(examQuestions)
            .innerJoin(examItems, eq(examItems.id, examQuestions.examItemId))
            .leftJoin(examItemStatements, eq(examItemStatements.examItemId, examItems.id))
            .where(and(eq(examItems.examId, examId), ...(questionId ? [eq(examQuestions.id, questionId)] : [])))
            .orderBy(asc(examItems.position));
        return rows.map(({ question, item, statement }) => this.toQuestionRow(question, item, statement?.prompt));
    }

    private toQuestionRow(
        question: typeof examQuestions.$inferSelect,
        item: typeof examItems.$inferSelect,
        prompt?: string,
    ): QuestionRow {
        return {
            ...question,
            examId: item.examId,
            prompt: prompt ?? '',
            position: item.position,
            points: item.maxPoints,
        };
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
        for (const row of rows) idsByType.set(row.type, [...(idsByType.get(row.type) ?? []), row.id]);
        const optionsById = new Map<string, Question['options']>();
        await Promise.all(
            [...idsByType.entries()].map(async ([type, ids]) => {
                const options = await getQuestionRepository(type).loadOptionsMany(db, ids);
                for (const [id, value] of options) optionsById.set(id, value);
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
        if (code === '23505') return QuestionPositionConflict();
        if (code === '23503') return ExamNotFound();
        return error as Error;
    }
}
