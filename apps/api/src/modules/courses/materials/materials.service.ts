import { StorageService } from '@/storage/storage.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import type {
    CreateMaterialDto,
    CreateMaterialGroupDto,
    EditMaterialDto,
    EditMaterialGroupDto,
    MoveMaterialDto,
} from './materials.dto';
import type { CourseGroup, EditMaterialContent, Material, MaterialGroup } from './materials.entity';
import { CourseGroupsRepository } from './groups.repository';
import { MaterialsRepository } from './materials.repository';
import { getMaterialRepository, parseMaterialInput } from './materials.repository.registry';

@Injectable()
export class MaterialsService {
    constructor(
        private readonly materials: MaterialsRepository,
        private readonly groups: CourseGroupsRepository,
        private readonly storage: StorageService,
    ) {}

    findCourseContent(courseId: string): Promise<MaterialGroup[]> {
        return this.materials.findCourseContent(courseId);
    }

    findById(courseId: string, materialId: string): Promise<Material> {
        return this.materials.findById(courseId, materialId);
    }

    async getFileUrl(courseId: string, materialId: string): Promise<string> {
        const material = await this.findById(courseId, materialId);
        if (material.kind !== 'FILE') throw new BadRequestException('Only file materials have download URLs');
        return this.storage.getPresignedUrl(material.fileKey);
    }

    async createGroup(courseId: string, dto: CreateMaterialGroupDto): Promise<CourseGroup> {
        return this.groups.create({
            courseId,
            position: await this.groups.nextPosition(courseId),
            name: dto.name.trim(),
            description: dto.description?.trim() || null,
            labeled: dto.labeled ?? true,
        });
    }

    async moveGroup(courseId: string, groupId: string, position: number): Promise<CourseGroup> {
        const current = await this.groups.findById(courseId, groupId);
        const groupCount = await this.groups.countByCourseId(courseId);
        const targetPosition = Math.max(0, Math.min(position, groupCount - 1));
        if (targetPosition === current.position) return current;

        const movingEarlier = targetPosition < current.position;
        return this.groups.updatePositionRange(courseId, groupId, targetPosition, {
            start: movingEarlier ? targetPosition : current.position + 1,
            end: movingEarlier ? current.position - 1 : targetPosition,
            offset: movingEarlier ? 1 : -1,
        });
    }

    async editGroup(courseId: string, groupId: string, dto: EditMaterialGroupDto): Promise<CourseGroup> {
        await this.groups.findById(courseId, groupId);
        return this.groups.update(courseId, groupId, {
            ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
            ...(dto.description === undefined ? {} : { description: dto.description?.trim() || null }),
            ...(dto.labeled === undefined ? {} : { labeled: dto.labeled }),
        });
    }

    async deleteGroup(courseId: string, groupId: string): Promise<boolean> {
        await this.groups.findById(courseId, groupId);
        const content = await this.materials.findCourseContent(courseId);
        const group = content.find((candidate) => candidate.id === groupId);
        const resourceKeys =
            group?.materials
                .map((material) => getMaterialRepository(material.kind).resourceKey(material))
                .filter((key): key is string => key !== undefined) ?? [];
        const deleted = await this.groups.delete(courseId, groupId);
        await Promise.all(resourceKeys.map((key) => this.storage.cleanup(key)));
        return deleted;
    }

    async create(
        courseId: string,
        uploadedById: string,
        dto: CreateMaterialDto,
        file?: Express.Multer.File,
    ): Promise<Material> {
        await this.groups.findById(courseId, dto.groupId);

        let content: EditMaterialContent | undefined;
        try {
            const input = parseMaterialInput(dto.input);
            const handler = getMaterialRepository(input.kind);
            content = await handler.prepareCreate(input, file, this.storage);
            return await this.materials.create({
                ...content,
                uploadedById,
                courseGroupId: dto.groupId,
                position: await this.materials.nextGroupPosition(dto.groupId),
            });
        } catch (error) {
            if (content) await this.storage.cleanup(getMaterialRepository(content.kind).resourceKey(content));
            throw error;
        }
    }

    async edit(
        courseId: string,
        materialId: string,
        dto: EditMaterialDto,
        file?: Express.Multer.File,
    ): Promise<Material> {
        const current = await this.materials.findById(courseId, materialId);
        const input = dto.input === undefined ? undefined : parseMaterialInput(dto.input);
        const handler = getMaterialRepository(input?.kind ?? current.kind);
        const currentKey = getMaterialRepository(current.kind).resourceKey(current);
        let content: EditMaterialContent | undefined;

        try {
            content = await handler.prepareEdit(input, current, file, this.storage);
            const replacementKey = handler.resourceKey(content);
            const updated = await this.materials.updateContent(courseId, materialId, content);
            if (currentKey !== replacementKey) await this.storage.cleanup(currentKey);
            return updated;
        } catch (error) {
            if (content) {
                const replacementKey = handler.resourceKey(content);
                if (replacementKey !== currentKey) await this.storage.cleanup(replacementKey);
            }
            throw error;
        }
    }

    async moveMaterial(courseId: string, materialId: string, dto: MoveMaterialDto): Promise<Material> {
        const current = await this.findById(courseId, materialId);
        const sameGroup = current.courseGroupId === dto.groupId;
        if (sameGroup && dto.position === current.position) return current;

        await this.groups.findById(courseId, dto.groupId);
        const destinationCount = await this.materials.countByGroupId(dto.groupId);
        const lastPosition = sameGroup ? destinationCount - 1 : destinationCount;
        const targetPosition = Math.max(0, Math.min(dto.position, lastPosition));
        if (sameGroup && targetPosition === current.position) return current;

        if (sameGroup) {
            const movingEarlier = targetPosition < current.position;
            return this.materials.updatePositionRanges(materialId, dto.groupId, targetPosition, [
                {
                    groupId: dto.groupId,
                    start: movingEarlier ? targetPosition : current.position + 1,
                    end: movingEarlier ? current.position - 1 : targetPosition,
                    offset: movingEarlier ? 1 : -1,
                },
            ]);
        }

        return this.materials.updatePositionRanges(materialId, dto.groupId, targetPosition, [
            { groupId: current.courseGroupId, start: current.position + 1, offset: -1 },
            { groupId: dto.groupId, start: targetPosition, offset: 1 },
        ]);
    }

    async delete(courseId: string, materialId: string): Promise<boolean> {
        const material = await this.materials.findById(courseId, materialId);
        const deleted = await this.materials.delete(courseId, materialId);
        await this.storage.cleanup(getMaterialRepository(material.kind).resourceKey(material));

        return deleted;
    }
}
