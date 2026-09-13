import { courseGroups, db, eq } from '@/database';
import { DATABASE } from '@/database/database.module';
import { Inject, Injectable } from '@nestjs/common';
import type { CourseGroup, CreateCourseGroup, EditCourseGroup } from './materials.entity';
import { MaterialGroupCreationFailed, MaterialGroupNotFound } from './materials.errors';

@Injectable()
export class CourseGroupsRepository {
    constructor(@Inject(DATABASE) private readonly database: typeof db) {}

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
