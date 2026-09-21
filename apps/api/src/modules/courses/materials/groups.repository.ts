import { courseGroups } from '@/database';
import { and, count, eq } from 'drizzle-orm';
import { DATABASE } from '@/database/database.module';
import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '@/database/client';
import type { CourseGroup, CreateCourseGroup, EditCourseGroup } from './materials.entity';
import { MaterialGroupCreationFailed, MaterialGroupNotFound } from './materials.errors';

@Injectable()
export class CourseGroupsRepository {
    constructor(@Inject(DATABASE) private readonly database: Database) {}

    async nextPosition(courseId: string): Promise<number> {
        const groups = await this.database.query.courseGroups.findMany({
            where: (group) => eq(group.courseId, courseId),
            columns: { position: true },
        });
        return groups.reduce((next, group) => Math.max(next, group.position + 1), 0);
    }

    async findById(courseId: string, id: string): Promise<CourseGroup> {
        const group = await this.database.query.courseGroups.findFirst({
            where: (group) => eq(group.id, id),
        });
        if (!group || group.courseId !== courseId) throw MaterialGroupNotFound(id);
        return group;
    }

    async create(data: CreateCourseGroup): Promise<CourseGroup> {
        const [group] = await this.database
            .insert(courseGroups)
            .values({ ...data, description: data.description ?? null })
            .returning();
        if (!group) throw MaterialGroupCreationFailed();
        return group;
    }

    async countByCourseId(courseId: string): Promise<number> {
        const [result] = await this.database
            .select({ value: count() })
            .from(courseGroups)
            .where(eq(courseGroups.courseId, courseId));
        return result?.value ?? 0;
    }

    async updatePositionRange(
        courseId: string,
        id: string,
        position: number,
        affected: { start: number; end: number; offset: -1 | 1 },
    ): Promise<CourseGroup> {
        return this.database.transaction(async (tx) => {
            const updatedAt = new Date();
            const groups = await tx
                .select({ id: courseGroups.id, position: courseGroups.position })
                .from(courseGroups)
                .where(eq(courseGroups.courseId, courseId));
            const moving = groups.find((group) => group.id === id);
            if (!moving) throw MaterialGroupNotFound(id);

            // A unique (course_id, position) constraint makes an in-place shift
            // fail at the beginning/end of a range. Move every row to a unique
            // temporary position first, then apply the final ordering.
            for (const group of groups) {
                await tx
                    .update(courseGroups)
                    .set({ position: -(group.position + 1), updatedAt })
                    .where(eq(courseGroups.id, group.id));
            }

            for (const group of groups) {
                const finalPosition =
                    group.id === id
                        ? position
                        : group.position >= affected.start && group.position <= affected.end
                          ? group.position + affected.offset
                          : group.position;
                await tx
                    .update(courseGroups)
                    .set({ position: finalPosition, updatedAt })
                    .where(eq(courseGroups.id, group.id));
            }

            const [moved] = await tx
                .select()
                .from(courseGroups)
                .where(and(eq(courseGroups.id, id), eq(courseGroups.courseId, courseId)))
                .limit(1);
            if (!moved) throw MaterialGroupNotFound(id);
            return moved;
        });
    }

    async update(courseId: string, id: string, data: EditCourseGroup): Promise<CourseGroup> {
        await this.findById(courseId, id);
        const [group] = await this.database
            .update(courseGroups)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(courseGroups.id, id))
            .returning();
        if (!group) throw MaterialGroupNotFound(id);
        return group;
    }

    async delete(courseId: string, id: string): Promise<boolean> {
        await this.findById(courseId, id);
        const deleted = await this.database
            .delete(courseGroups)
            .where(eq(courseGroups.id, id))
            .returning({ id: courseGroups.id });
        if (!deleted.length) throw MaterialGroupNotFound(id);
        return true;
    }
}
