import { StorageService } from '@/storage/storage.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import type { CreateMaterialDto, CreateMaterialGroupDto, EditMaterialDto, EditMaterialGroupDto } from './materials.dto';
import type { CourseContentElement, CourseGroup, EditMaterialContent, Material } from './materials.entity';
import { MaterialsRepository } from './materials.repository';
import { CourseGroupsRepository } from './groups.repository';

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
        const fileKeys =
            group && 'materials' in group
                ? group.materials.filter((material) => material.kind === 'FILE').map((material) => material.fileKey)
                : [];
        const deleted = await this.groups.delete(courseId, groupId);
        await Promise.all(fileKeys.map((key) => this.storage.cleanup(key)));
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

        let uploadedKey: string | undefined;
        try {
            const content = await this.contentForCreate(dto, file);
            if (content.kind === 'FILE') uploadedKey = content.fileKey;
            return await this.materials.create({
                ...content,
                uploadedById,
                courseGroupId: destinationGroupId,
                position: groupId ? await this.materials.nextGroupPosition(destinationGroupId) : 0,
            });
        } catch (error) {
            await this.storage.cleanup(uploadedKey);
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
        const kind = dto.kind ?? current.kind;
        let replacementKey: string | undefined;

        try {
            const content = await this.contentForEdit(kind, dto, current, file);
            if (content.kind === 'FILE' && (current.kind !== 'FILE' || content.fileKey !== current.fileKey))
                replacementKey = content.fileKey;

            const updated = await this.materials.updateContent(courseId, materialId, content);
            const resultingFileKey = content.kind === 'FILE' ? content.fileKey : undefined;
            if (current.kind === 'FILE' && current.fileKey !== resultingFileKey)
                await this.storage.cleanup(current.fileKey);
            return updated;
        } catch (error) {
            await this.storage.cleanup(replacementKey);
            throw error;
        }
    }

    async delete(courseId: string, materialId: string): Promise<boolean> {
        const material = await this.materials.findById(courseId, materialId);
        const deleted = await this.materials.delete(courseId, materialId);
        if (material.kind === 'FILE') await this.storage.cleanup(material.fileKey);

        const group = await this.groups.findById(courseId, material.courseGroupId);
        if (group.name === null) await this.groups.delete(courseId, group.id);
        return deleted;
    }

    private async findPublicGroup(courseId: string, groupId: string): Promise<CourseGroup> {
        const group = await this.groups.findById(courseId, groupId);
        if (group.name === null) throw new BadRequestException('Solo-material groups are internal');
        return group;
    }

    private async contentForCreate(dto: CreateMaterialDto, file?: Express.Multer.File): Promise<EditMaterialContent> {
        switch (dto.kind) {
            case 'TEXT':
                if (!dto.textContent) throw new BadRequestException('Text content is required');
                return { kind: 'TEXT', textContent: dto.textContent.trim() };
            case 'LINK':
                if (!dto.externalUrl) throw new BadRequestException('External URL is required');
                if (!dto.title?.trim()) throw new BadRequestException('Title is required');
                return {
                    kind: 'LINK',
                    title: dto.title.trim(),
                    description: dto.description?.trim() || null,
                    externalUrl: dto.externalUrl.trim(),
                };
            case 'FILE': {
                if (!file) throw new BadRequestException('An uploaded file is required');
                if (!dto.title?.trim()) throw new BadRequestException('Title is required');
                const stored = await this.storage.upload(file);
                return {
                    kind: 'FILE',
                    title: dto.title.trim(),
                    description: dto.description?.trim() || null,
                    fileKey: stored.key,
                    fileName: stored.fileName,
                    fileMimeType: stored.mimeType,
                    fileSize: stored.size,
                };
            }
        }
    }

    private async contentForEdit(
        kind: Material['kind'],
        dto: EditMaterialDto,
        current: Material,
        file?: Express.Multer.File,
    ): Promise<EditMaterialContent> {
        if (kind === 'TEXT') {
            const textContent = dto.textContent ?? (current.kind === 'TEXT' ? current.textContent : undefined);
            if (!textContent) throw new BadRequestException('Text content is required');
            return { kind, textContent: textContent.trim() };
        }

        if (kind === 'LINK') {
            const externalUrl = dto.externalUrl ?? (current.kind === 'LINK' ? current.externalUrl : undefined);
            if (!externalUrl) throw new BadRequestException('External URL is required');
            const title = dto.title?.trim() || (current.kind === 'LINK' ? current.title : '');
            if (!title) throw new BadRequestException('Title is required');
            return {
                kind,
                title,
                description: dto.description?.trim() || (current.kind === 'LINK' ? current.description : null),
                externalUrl: externalUrl.trim(),
            };
        }

        if (file) {
            if (!dto.title?.trim() && current.kind !== 'FILE') throw new BadRequestException('Title is required');
            const stored = await this.storage.upload(file);
            return {
                kind,
                title: dto.title?.trim() || (current.kind === 'FILE' ? current.title : ''),
                description: dto.description?.trim() || (current.kind === 'FILE' ? current.description : null),
                fileKey: stored.key,
                fileName: stored.fileName,
                fileMimeType: stored.mimeType,
                fileSize: stored.size,
            };
        }
        if (current.kind !== 'FILE') throw new BadRequestException('An uploaded file is required');
        return {
            kind,
            title: current.title,
            description: current.description,
            fileKey: current.fileKey,
            fileName: current.fileName,
            fileMimeType: current.fileMimeType,
            fileSize: current.fileSize,
        };
    }
}
