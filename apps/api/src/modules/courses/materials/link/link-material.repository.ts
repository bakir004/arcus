import { courseMaterials, eq } from '@/database';
import type { Database } from '@/database/client';
import type { CourseMaterial, CreateMaterial, EditMaterialContent, Material, MaterialInput } from '../materials.entity';
import { InvalidMaterialRecord, MaterialCreationFailed, MaterialNotFound } from '../materials.errors';
import type { MaterialTypeRepository } from '../materials.repository.interface';
import {
    linkMaterialInputSchema,
    type CreateLinkMaterial,
    type EditLinkMaterial,
    type LinkMaterial,
} from './link-material.entity';

export class LinkMaterialRepository implements MaterialTypeRepository {
    readonly kind = 'LINK' as const;
    readonly inputApiSchema = {
        title: 'LinkMaterialInput',
        type: 'object',
        required: ['kind', 'title', 'externalUrl'],
        properties: {
            kind: { const: 'LINK', type: 'string' },
            title: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string', nullable: true, maxLength: 2000 },
            externalUrl: { type: 'string', format: 'uri', maxLength: 2048 },
        },
    };
    readonly responseApiSchema = {
        title: 'LinkMaterialResponse',
        type: 'object',
        required: [
            'id',
            'courseGroupId',
            'uploadedById',
            'position',
            'visibility',
            'kind',
            'title',
            'description',
            'externalUrl',
            'createdAt',
            'updatedAt',
        ],
        properties: {
            id: { type: 'string', format: 'uuid' },
            courseGroupId: { type: 'string', format: 'uuid' },
            uploadedById: { type: 'string' },
            position: { type: 'integer', minimum: 0 },
            visibility: { type: 'boolean' },
            kind: { const: 'LINK', type: 'string' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            externalUrl: { type: 'string', format: 'uri' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
        },
    };

    parseInput(input: unknown): MaterialInput {
        return linkMaterialInputSchema.parse(input);
    }

    async prepareCreate(input: MaterialInput): Promise<EditMaterialContent> {
        const parsed = linkMaterialInputSchema.parse(input);
        return { ...parsed, description: parsed.description || null };
    }

    async prepareEdit(input: MaterialInput | undefined, current: Material): Promise<EditMaterialContent> {
        if (input) return this.prepareCreate(input);
        if (current.kind !== this.kind) throw new Error('Link material handler received a different material kind');
        return {
            kind: this.kind,
            title: current.title,
            description: current.description,
            externalUrl: current.externalUrl,
        };
    }

    resourceKey(): undefined {
        return undefined;
    }

    toResponse(material: Material): Material {
        return material;
    }

    fromRecord(record: CourseMaterial): LinkMaterial {
        if (record.kind !== this.kind || record.externalUrl === null || record.title === null)
            throw InvalidMaterialRecord(record.id);
        const {
            kind,
            title,
            description,
            externalUrl,
            textContent: _,
            fileKey: _fileKey,
            fileName: _fileName,
            fileMimeType: _fileMimeType,
            fileSize: _fileSize,
            ...material
        } = record;
        return { ...material, kind, title, description, externalUrl };
    }

    async create(database: Database, value: CreateMaterial): Promise<LinkMaterial> {
        const data = value as CreateLinkMaterial;
        const [record] = await database
            .insert(courseMaterials)
            .values({
                uploadedById: data.uploadedById,
                courseGroupId: data.courseGroupId,
                position: data.position,
                visibility: data.visibility ?? true,
                kind: data.kind,
                title: data.title,
                description: data.description ?? null,
                externalUrl: data.externalUrl,
            })
            .returning();
        if (!record) throw MaterialCreationFailed();
        return this.fromRecord(record);
    }

    async update(database: Database, id: string, value: EditMaterialContent): Promise<LinkMaterial> {
        const data = value as EditLinkMaterial;
        const [record] = await database
            .update(courseMaterials)
            .set({
                kind: data.kind,
                textContent: null,
                title: data.title,
                description: data.description ?? null,
                externalUrl: data.externalUrl,
                fileKey: null,
                fileName: null,
                fileMimeType: null,
                fileSize: null,
                updatedAt: new Date(),
            })
            .where(eq(courseMaterials.id, id))
            .returning();
        if (!record) throw MaterialNotFound(id);
        return this.fromRecord(record);
    }
}
