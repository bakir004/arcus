// @ts-nocheck
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { Database } from '@/database/client';
import { DATABASE } from '@/database/database.module';
import { examAnnouncements } from '@/database/schema';
import type {
    Announcement,
    AnnouncementCreate,
    AnnouncementUpdate,
} from '@/modules/exams/announcements/announcement.entity';
import { announcementSchema } from '@/modules/exams/announcements/announcement.entity';

@Injectable()
export class AnnouncementsRepository {
    constructor(@Inject(DATABASE) private readonly db: Database) {}

    async create(examId: string, data: AnnouncementCreate): Promise<Announcement> {
        const [row] = await this.db
            .insert(examAnnouncements)
            .values({
                examId,
                title: data.title ?? null,
                message: data.message,
            })
            .returning()
            .catch((error) => {
                throw error;
            });

        return announcementSchema.parse(row);
    }

    async findAllByExam(examId: string): Promise<Announcement[]> {
        await this.ensureExamExists(examId);

        const rows = await this.db.query.examAnnouncements.findMany({
            where: (announcement, { eq }) => eq(announcement.examId, examId),
            orderBy: (announcement, { desc }) => desc(announcement.createdAt),
        });

        return rows.map((row) => announcementSchema.parse(row));
    }

    async findById(examId: string, id: string): Promise<Announcement> {
        const row = await this.db.query.examAnnouncements.findFirst({
            where: (announcement, { and, eq }) => and(eq(announcement.id, id), eq(announcement.examId, examId)),
        });

        if (!row) throw new NotFoundException('announcement not found');
        return announcementSchema.parse(row);
    }

    async update(examId: string, id: string, data: AnnouncementUpdate): Promise<Announcement> {
        const [row] = await this.db
            .update(examAnnouncements)
            .set({
                ...(data.title !== undefined && { title: data.title }),
                ...(data.message !== undefined && { message: data.message }),
                updatedAt: new Date(),
            })
            .where(sql`${examAnnouncements.id} = ${id}::uuid and ${examAnnouncements.examId} = ${examId}::uuid`)
            .returning();

        if (!row) throw new NotFoundException('announcement not found');
        return announcementSchema.parse(row);
    }

    async delete(examId: string, id: string): Promise<void> {
        const rows = await this.db
            .delete(examAnnouncements)
            .where(sql`${examAnnouncements.id} = ${id}::uuid and ${examAnnouncements.examId} = ${examId}::uuid`)
            .returning({ id: examAnnouncements.id });

        if (rows.length === 0) throw new NotFoundException('announcement not found');
    }

    async ensureExamExists(examId: string): Promise<void> {
        const exam = await this.db.query.exams.findFirst({
            where: (entry, { eq }) => eq(entry.id, examId),
            columns: { id: true },
        });

        if (!exam) throw new NotFoundException('exam not found');
    }
}
