import { courseMaterials } from '@/database';
import { and, asc, count, eq, gte, lte, sql } from 'drizzle-orm';
import type { Database } from '@/database/client';
import { DATABASE } from '@/database/database.module';
import { Inject, Injectable } from '@nestjs/common';
import type { CourseMaterial, MaterialGroup, CreateMaterial, EditMaterialContent, Material } from './materials.entity';
import { MaterialNotFound } from './materials.errors';
import { getMaterialRepository } from './materials.repository.registry';

@Injectable()
export class MaterialsRepository {
    constructor(@Inject(DATABASE) private readonly database: Database) {}

    private toMaterial(record: CourseMaterial): Material {
        return getMaterialRepository(record.kind).fromRecord(record);
    }

    async findCourseContent(courseId: string, visibleOnly = false): Promise<MaterialGroup[]> {
        const groups = await this.database.query.courseGroups.findMany({
            where: (group) => eq(group.courseId, courseId),
            orderBy: (group) => asc(group.position),
            with: {
                materials: {
                    where: visibleOnly ? (material) => eq(material.visibility, true) : undefined,
                    orderBy: (material) => asc(material.position),
                },
            },
        });

        return groups.map((group) => ({
            ...group,
            materials: group.materials.map((material) => this.toMaterial(material)),
        }));
    }

    async findById(courseId: string, id: string): Promise<Material> {
        const record = await this.database.query.courseMaterials.findFirst({
            where: (material) => eq(material.id, id),
            with: { group: true },
        });
        if (!record || record.group.courseId !== courseId) throw MaterialNotFound(id);
        const { group: _, ...material } = record;
        return this.toMaterial(material);
    }

    async countByGroupId(courseGroupId: string): Promise<number> {
        const [result] = await this.database
            .select({ value: count() })
            .from(courseMaterials)
            .where(eq(courseMaterials.courseGroupId, courseGroupId));
        return result?.value ?? 0;
    }

    async nextGroupPosition(courseGroupId: string): Promise<number> {
        const materials = await this.database.query.courseMaterials.findMany({
            where: (material) => eq(material.courseGroupId, courseGroupId),
            columns: { position: true },
        });
        return materials.reduce((next, material) => Math.max(next, material.position + 1), 0);
    }

    async create(data: CreateMaterial): Promise<Material> {
        return getMaterialRepository(data.kind).create(this.database, data);
    }

    async updateContent(courseId: string, id: string, data: EditMaterialContent): Promise<Material> {
        await this.findById(courseId, id);
        return getMaterialRepository(data.kind).update(this.database, id, data);
    }

    async updateVisibility(courseId: string, id: string, visibility: boolean): Promise<Material> {
        await this.findById(courseId, id);
        const [record] = await this.database
            .update(courseMaterials)
            .set({ visibility, updatedAt: new Date() })
            .where(eq(courseMaterials.id, id))
            .returning();
        if (!record) throw MaterialNotFound(id);
        return this.toMaterial(record);
    }

    async updatePositionRanges(
        id: string,
        targetGroupId: string,
        targetPosition: number,
        affected: { groupId: string; start: number; end?: number; offset: -1 | 1 }[],
    ): Promise<Material> {
        return this.database.transaction(async (tx) => {
            const updatedAt = new Date();
            for (const range of affected) {
                await tx
                    .update(courseMaterials)
                    .set({ position: sql`${courseMaterials.position} + ${range.offset}`, updatedAt })
                    .where(
                        and(
                            eq(courseMaterials.courseGroupId, range.groupId),
                            gte(courseMaterials.position, range.start),
                            ...(range.end === undefined ? [] : [lte(courseMaterials.position, range.end)]),
                        ),
                    );
            }
            const [moved] = await tx
                .update(courseMaterials)
                .set({ courseGroupId: targetGroupId, position: targetPosition, updatedAt })
                .where(eq(courseMaterials.id, id))
                .returning();
            if (!moved) throw MaterialNotFound(id);
            return this.toMaterial(moved);
        });
    }

    async delete(courseId: string, id: string): Promise<boolean> {
        await this.findById(courseId, id);
        const deleted = await this.database
            .delete(courseMaterials)
            .where(eq(courseMaterials.id, id))
            .returning({ id: courseMaterials.id });
        if (!deleted.length) throw MaterialNotFound(id);
        return true;
    }
}
