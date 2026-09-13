import { courseMaterials, eq } from '@/database';
import type { Database } from '@/database/client';
import type { CourseMaterial, CreateMaterial, EditMaterialContent, Material, MaterialInput } from '../materials.entity';
import { InvalidMaterialRecord, MaterialCreationFailed, MaterialNotFound } from '../materials.errors';
import type { MaterialTypeRepository } from '../materials.repository.interface';
import {
    textMaterialInputSchema,
    type CreateTextMaterial,
    type EditTextMaterial,
    type TextMaterial,
} from './text-material.entity';

export class TextMaterialRepository implements MaterialTypeRepository {
    readonly kind = 'TEXT' as const;
    readonly inputApiSchema = {
        title: 'TextMaterialInput',
        type: 'object',
        required: ['kind', 'textContent'],
        properties: {
            kind: { const: 'TEXT', type: 'string' },
            textContent: { type: 'string', minLength: 1, maxLength: 100000 },
        },
    };
    readonly responseApiSchema = {
        title: 'TextMaterialResponse',
        type: 'object',
        required: ['id', 'courseGroupId', 'uploadedById', 'position', 'kind', 'textContent', 'createdAt', 'updatedAt'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            courseGroupId: { type: 'string', format: 'uuid' },
            uploadedById: { type: 'string' },
            position: { type: 'integer', minimum: 0 },
            kind: { const: 'TEXT', type: 'string' },
            textContent: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
        },
    };

    parseInput(input: unknown): MaterialInput {
        return textMaterialInputSchema.parse(input);
    }

    async prepareCreate(input: MaterialInput): Promise<EditMaterialContent> {
        return textMaterialInputSchema.parse(input);
    }

    async prepareEdit(input: MaterialInput | undefined, current: Material): Promise<EditMaterialContent> {
        if (input) return textMaterialInputSchema.parse(input);
        if (current.kind !== this.kind) throw new Error('Text material handler received a different material kind');
        return { kind: this.kind, textContent: current.textContent };
    }

    resourceKey(): undefined {
        return undefined;
    }

    toResponse(material: Material): Material {
        return material;
    }

    fromRecord(record: CourseMaterial): TextMaterial {
        if (record.kind !== this.kind || record.textContent === null) throw InvalidMaterialRecord(record.id);
        const {
            kind,
            textContent,
            title: _title,
            description: _description,
            externalUrl: _,
            fileKey: _fileKey,
            fileName: _fileName,
            fileMimeType: _fileMimeType,
            fileSize: _fileSize,
            ...material
        } = record;
        return { ...material, kind, textContent };
    }

    async create(database: Database, value: CreateMaterial): Promise<TextMaterial> {
        const data = value as CreateTextMaterial;
        const [record] = await database
            .insert(courseMaterials)
            .values({
                uploadedById: data.uploadedById,
                courseGroupId: data.courseGroupId,
                position: data.position,
                kind: data.kind,
                textContent: data.textContent,
                title: null,
                description: null,
            })
            .returning();
        if (!record) throw MaterialCreationFailed();
        return this.fromRecord(record);
    }

    async update(database: Database, id: string, value: EditMaterialContent): Promise<TextMaterial> {
        const data = value as EditTextMaterial;
        const [record] = await database
            .update(courseMaterials)
            .set({
                kind: data.kind,
                textContent: data.textContent,
                title: null,
                description: null,
                externalUrl: null,
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
