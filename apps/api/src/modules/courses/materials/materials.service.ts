import { StorageService } from '@/storage/storage.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import type {
    CreateMaterialDto,
    CreateMaterialGroupDto,
    EditMaterialDto,
    EditMaterialGroupDto,
    MoveMaterialDto,
} from './materials.dto';
import type { CourseContentElement, CourseGroup, EditMaterialContent, Material } from './materials.entity';
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

    findCourseContent(courseId: string): Promise<CourseContentElement[]> {
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
        });
    }

    async editGroup(courseId: string, groupId: string, dto: EditMaterialGroupDto): Promise<CourseGroup> {
        await this.findPublicGroup(courseId, groupId);
        return this.groups.update(courseId, groupId, {
            ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
            ...(dto.description === undefined ? {} : { description: dto.description?.trim() || null }),
        });
    }

    async deleteGroup(courseId: string, groupId: string): Promise<boolean> {
        await this.findPublicGroup(courseId, groupId);
        const content = await this.materials.findCourseContent(courseId);
        const group = content.find((element) => 'materials' in element && element.id === groupId);
        const resourceKeys =
            group && 'materials' in group
                ? group.materials
                      .map((material) => getMaterialRepository(material.kind).resourceKey(material))
                      .filter((key): key is string => key !== undefined)
                : [];
        const deleted = await this.groups.delete(courseId, groupId);
        await Promise.all(resourceKeys.map((key) => this.storage.cleanup(key)));
        return deleted;
    }

    async create(
        courseId: string,
        uploadedById: string,
        dto: CreateMaterialDto,
        file?: Express.Multer.File,
        groupId?: string,
    ): Promise<Material> {
        let destinationGroupId = groupId;
        let anonymousGroupId: string | undefined;

        if (destinationGroupId) {
            const group = await this.groups.findById(courseId, destinationGroupId);
            if (group.name === null)
                throw new BadRequestException('Materials cannot be added to an internal solo-material group');
        } else {
            const group = await this.groups.create({
                courseId,
                position: await this.groups.nextPosition(courseId),
                name: null,
                description: null,
            });
            destinationGroupId = group.id;
            anonymousGroupId = group.id;
        }

        let content: EditMaterialContent | undefined;
        try {
            const input = parseMaterialInput(dto.input);
            const handler = getMaterialRepository(input.kind);
            content = await handler.prepareCreate(input, file, this.storage);
            return await this.materials.create({
                ...content,
                uploadedById,
                courseGroupId: destinationGroupId,
                position: groupId ? await this.materials.nextGroupPosition(destinationGroupId) : 0,
            });
        } catch (error) {
            if (content) await this.storage.cleanup(getMaterialRepository(content.kind).resourceKey(content));
            if (anonymousGroupId) await this.groups.delete(courseId, anonymousGroupId).catch(() => undefined);
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
        const material = await this.findById(courseId, materialId);
        const sourceGroup = await this.groups.findById(courseId, material.courseGroupId);
        let targetGroupId = dto.groupId;
        if (!targetGroupId) {
            const group = await this.groups.create({
                courseId,
                position: await this.groups.nextPosition(courseId),
                name: null,
                description: null,
            });
            targetGroupId = group.id;
        } else {
            await this.groups.findById(courseId, targetGroupId);
        }
        const moved = await this.materials.move(courseId, materialId, targetGroupId, dto.position);
        if (sourceGroup.name === null && sourceGroup.id !== targetGroupId)
            await this.groups.delete(courseId, sourceGroup.id);
        return moved;
    }

    async delete(courseId: string, materialId: string): Promise<boolean> {
        const material = await this.materials.findById(courseId, materialId);
        const deleted = await this.materials.delete(courseId, materialId);
        await this.storage.cleanup(getMaterialRepository(material.kind).resourceKey(material));

        const group = await this.groups.findById(courseId, material.courseGroupId);
        if (group.name === null) await this.groups.delete(courseId, group.id);
        return deleted;
    }

    private async findPublicGroup(courseId: string, groupId: string): Promise<CourseGroup> {
        const group = await this.groups.findById(courseId, groupId);
        if (group.name === null) throw new BadRequestException('Solo-material groups are internal');
        return group;
    }
}
