import { courseMaterials, eq } from '@/database';
import type { Database } from '@/database/client';
import { BadRequestException } from '@nestjs/common';
import type { StorageService } from '@/storage/storage.service';
import type { CourseMaterial, CreateMaterial, EditMaterialContent, Material, MaterialInput } from '../materials.entity';
import { InvalidMaterialRecord, MaterialCreationFailed, MaterialNotFound } from '../materials.errors';
import type { MaterialTypeRepository } from '../materials.repository.interface';
import {
    fileMaterialInputSchema,
    type CreateFileMaterial,
    type EditFileMaterial,
    type FileMaterial,
} from './file-material.entity';

export class FileMaterialRepository implements MaterialTypeRepository {
    readonly kind = 'FILE' as const;
    readonly inputApiSchema = {
        title: 'FileMaterialInput',
        type: 'object',
        required: ['kind', 'title'],
        properties: {
            kind: { const: 'FILE', type: 'string' },
            title: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string', nullable: true, maxLength: 2000 },
        },
    };
    readonly responseApiSchema = {
        title: 'FileMaterialResponse',
        type: 'object',
        required: [
            'id',
            'courseGroupId',
            'uploadedById',
            'position',
            'kind',
            'title',
            'description',
            'fileKey',
            'fileName',
            'fileMimeType',
            'fileSize',
            'createdAt',
            'updatedAt',
        ],
        properties: {
            id: { type: 'string', format: 'uuid' },
            courseGroupId: { type: 'string', format: 'uuid' },
            uploadedById: { type: 'string' },
            position: { type: 'integer', minimum: 0 },
            kind: { const: 'FILE', type: 'string' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            fileKey: { type: 'string' },
            fileName: { type: 'string', nullable: true },
            fileMimeType: { type: 'string', nullable: true },
            fileSize: { type: 'integer', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
        },
    };

    parseInput(input: unknown): MaterialInput {
        return fileMaterialInputSchema.parse(input);
    }

    async prepareCreate(
        input: MaterialInput,
        file: Express.Multer.File | undefined,
        storage: StorageService,
    ): Promise<EditMaterialContent> {
        const parsed = fileMaterialInputSchema.parse(input);
        if (!file) throw new BadRequestException('An uploaded file is required');
        const stored = await storage.upload(file);
        return {
            ...parsed,
            description: parsed.description || null,
            fileKey: stored.key,
            fileName: stored.fileName,
            fileMimeType: stored.mimeType,
            fileSize: stored.size,
        };
    }

    async prepareEdit(
        input: MaterialInput | undefined,
        current: Material,
        file: Express.Multer.File | undefined,
        storage: StorageService,
    ): Promise<EditMaterialContent> {
        const parsed = input
            ? fileMaterialInputSchema.parse(input)
            : current.kind === this.kind
              ? { kind: this.kind, title: current.title, description: current.description }
              : undefined;
        if (!parsed) throw new BadRequestException('File material input is required when changing material kind');

        if (file) {
            const stored = await storage.upload(file);
            return {
                ...parsed,
                description: parsed.description || null,
                fileKey: stored.key,
                fileName: stored.fileName,
                fileMimeType: stored.mimeType,
                fileSize: stored.size,
            };
        }
        if (current.kind !== this.kind) throw new BadRequestException('An uploaded file is required');
        return {
            ...parsed,
            description: parsed.description || null,
            fileKey: current.fileKey,
            fileName: current.fileName,
            fileMimeType: current.fileMimeType,
            fileSize: current.fileSize,
        };
    }

    resourceKey(material: Material | EditMaterialContent): string | undefined {
        return material.kind === this.kind ? material.fileKey : undefined;
    }

    toResponse(material: Material): Material {
        return material;
    }

    fromRecord(record: CourseMaterial): FileMaterial {
        if (record.kind !== this.kind || record.fileKey === null || record.title === null)
            throw InvalidMaterialRecord(record.id);
        const {
            kind,
            title,
            description,
            fileKey,
            fileName,
            fileMimeType,
            fileSize,
            textContent: _,
            externalUrl: _externalUrl,
            ...material
        } = record;
        return { ...material, kind, title, description, fileKey, fileName, fileMimeType, fileSize };
    }

    async create(database: Database, value: CreateMaterial): Promise<FileMaterial> {
        const data = value as CreateFileMaterial;
        const [record] = await database
            .insert(courseMaterials)
            .values({
                uploadedById: data.uploadedById,
                courseGroupId: data.courseGroupId,
                position: data.position,
                kind: data.kind,
                title: data.title,
                description: data.description ?? null,
                fileKey: data.fileKey,
                fileName: data.fileName ?? null,
                fileMimeType: data.fileMimeType ?? null,
                fileSize: data.fileSize ?? null,
            })
            .returning();
        if (!record) throw MaterialCreationFailed();
        return this.fromRecord(record);
    }

    async update(database: Database, id: string, value: EditMaterialContent): Promise<FileMaterial> {
        const data = value as EditFileMaterial;
        const [record] = await database
            .update(courseMaterials)
            .set({
                kind: data.kind,
                textContent: null,
                title: data.title,
                description: data.description ?? null,
                externalUrl: null,
                fileKey: data.fileKey,
                fileName: data.fileName ?? null,
                fileMimeType: data.fileMimeType ?? null,
                fileSize: data.fileSize ?? null,
                updatedAt: new Date(),
            })
            .where(eq(courseMaterials.id, id))
            .returning();
        if (!record) throw MaterialNotFound(id);
        return this.fromRecord(record);
    }
}
