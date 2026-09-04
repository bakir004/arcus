import { asc, courseMaterials, eq } from '@/database';
import type { Database } from '@/database/client';
import { DATABASE } from '@/database/database.module';
import { Inject, Injectable } from '@nestjs/common';
import type {
    CourseContentElement,
    CourseMaterial,
    CreateMaterial,
    EditMaterialContent,
    Material,
} from './materials.entity';
import { InvalidMaterialRecord, MaterialNotFound } from './materials.errors';
import { getMaterialRepository } from './materials.repository.registry';

@Injectable()
export class MaterialsRepository {
    constructor(@Inject(DATABASE) private readonly database: Database) {}

    private toMaterial(record: CourseMaterial): Material {
        return getMaterialRepository(record.kind).fromRecord(record);
    }

    async findCourseContent(courseId: string): Promise<CourseContentElement[]> {
        const groups = await this.database.query.courseGroups.findMany({
            where: (group) => eq(group.courseId, courseId),
            orderBy: (group) => asc(group.position),
            with: {
                materials: {
                    orderBy: (material) => asc(material.position),
                },
            },
        });

        return groups.map((group) => {
            const materials = group.materials.map((material) => this.toMaterial(material));
            if (group.name !== null) return { ...group, name: group.name, materials };
            if (materials.length !== 1) throw InvalidMaterialRecord(group.id);
            return {
                groupId: group.id,
                position: group.position,
                material: materials[0],
            };
        });
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

    async updatePlacement(courseId: string, id: string, courseGroupId: string, position: number): Promise<Material> {
        await this.findById(courseId, id);
        const [material] = await this.database
            .update(courseMaterials)
            .set({ courseGroupId, position, updatedAt: new Date() })
            .where(eq(courseMaterials.id, id))
            .returning();
        if (!material) throw MaterialNotFound(id);
        return this.toMaterial(material);
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
