// @ts-nocheck
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, sql } from 'drizzle-orm';
import type { Database } from '@/database/client';
import { DATABASE } from '@/database/database.module';
import {
    AttemptStatus,
    examAttempts,
    examTimeslotRegistrations,
    examTimeslots,
    exams,
    type ExamLocation,
} from '@/database/schema';

export type TimeslotView = typeof examTimeslots.$inferSelect & {
    registrationCount: number;
    availableSeats: number;
    isRegistered: boolean;
};

@Injectable()
export class TimeslotsRepository {
    constructor(@Inject(DATABASE) private readonly db: Database) {}

    async list(examId: string, userId?: string): Promise<TimeslotView[]> {
        const slots = await this.db
            .select()
            .from(examTimeslots)
            .where(eq(examTimeslots.examId, examId))
            .orderBy(examTimeslots.startsAt);
        return Promise.all(
            slots.map(async (slot) => {
                const [{ value }] = await this.db
                    .select({ value: count() })
                    .from(examTimeslotRegistrations)
                    .where(eq(examTimeslotRegistrations.timeslotId, slot.id));
                const registered = userId
                    ? await this.db.query.examTimeslotRegistrations.findFirst({
                          where: (r, { and, eq }) => and(eq(r.timeslotId, slot.id), eq(r.studentId, userId)),
                      })
                    : null;
                return {
                    ...slot,
                    registrationCount: value,
                    availableSeats: Math.max(0, slot.capacity - value),
                    isRegistered: Boolean(registered),
                };
            }),
        );
    }

    async create(examId: string, data: { location: ExamLocation; startsAt: Date; capacity: number }) {
        const [row] = await this.db
            .insert(examTimeslots)
            .values({ examId, ...data })
            .returning();
        return row;
    }
    async update(
        examId: string,
        id: string,
        data: Partial<{ location: ExamLocation; startsAt: Date; capacity: number }>,
    ) {
        const [row] = await this.db
            .update(examTimeslots)
            .set({ ...data, updatedAt: new Date() })
            .where(and(eq(examTimeslots.id, id), eq(examTimeslots.examId, examId)))
            .returning();
        if (!row) throw new NotFoundException('timeslot not found');
        const [{ value }] = await this.db
            .select({ value: count() })
            .from(examTimeslotRegistrations)
            .where(eq(examTimeslotRegistrations.timeslotId, id));
        if (row.capacity < value) throw new ConflictException('capacity cannot be lower than registrations');
        return row;
    }
    async delete(examId: string, id: string) {
        const [row] = await this.db
            .delete(examTimeslots)
            .where(and(eq(examTimeslots.id, id), eq(examTimeslots.examId, examId)))
            .returning({ id: examTimeslots.id });
        if (!row) throw new NotFoundException('timeslot not found');
    }
    async register(examId: string, timeslotId: string, studentId: string) {
        return this.db.transaction(async (tx) => {
            const [slot] = (await tx.execute(
                sql`select * from exam_timeslots where id = ${timeslotId}::uuid and exam_id = ${examId}::uuid for update`,
            )) as unknown as [typeof examTimeslots.$inferSelect | undefined];
            if (!slot) throw new NotFoundException('timeslot not found');
            const [existing] = await tx
                .select({ id: examTimeslotRegistrations.id })
                .from(examTimeslotRegistrations)
                .where(
                    and(
                        eq(examTimeslotRegistrations.examId, examId),
                        eq(examTimeslotRegistrations.studentId, studentId),
                    ),
                )
                .limit(1);
            if (existing) throw new ConflictException('student is already registered for this exam');
            const [{ value }] = await tx
                .select({ value: count() })
                .from(examTimeslotRegistrations)
                .where(eq(examTimeslotRegistrations.timeslotId, timeslotId));
            if (value >= Number(slot.capacity)) throw new ConflictException('timeslot is full');
            await tx.insert(examTimeslotRegistrations).values({ examId, timeslotId, studentId });
            await tx.insert(examAttempts).values({
                examId,
                studentId,
                createdById: studentId,
                status: AttemptStatus.Registered,
            });
        });
    }
    async cancel(examId: string, studentId: string) {
        await this.db.transaction(async (tx) => {
            await tx
                .delete(examTimeslotRegistrations)
                .where(
                    and(
                        eq(examTimeslotRegistrations.examId, examId),
                        eq(examTimeslotRegistrations.studentId, studentId),
                    ),
                );
            await tx
                .delete(examAttempts)
                .where(
                    and(
                        eq(examAttempts.examId, examId),
                        eq(examAttempts.studentId, studentId),
                        eq(examAttempts.status, AttemptStatus.Registered),
                    ),
                );
        });
    }
    async ensureExam(examId: string) {
        const row = await this.db.query.exams.findFirst({ where: eq(exams.id, examId), columns: { id: true } });
        if (!row) throw new NotFoundException('exam not found');
    }
}
