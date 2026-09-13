import { courseMaterials, eq } from '@/database';
import type { Database } from '@/database/client';
import { Injectable } from '@nestjs/common';
import type { CourseMaterial } from '../materials.entity';
import type { TextMaterial, CreateTextMaterial, EditTextMaterial } from './text-material.entity';
import { InvalidMaterialRecord, MaterialCreationFailed, MaterialNotFound } from '../materials.errors';
import type { MaterialTypeRepository } from '../materials.repository.interface';

@Injectable()
export class TextMaterialRepository
    implements MaterialTypeRepository<CreateTextMaterial, EditTextMaterial, TextMaterial>
{
    apiSchema: {
        title: 'TextMaterialRequest';
        type: 'object';
        required: ['kind', 'textContent'];
        properties: {
            kind: { const: 'TEXT'; type: 'string' };
            textContent: { type: 'string'; maxLength: 100000 };
        };
    };
    updateApiSchema: {
        title: 'TextMaterialUpdateRequest';
        type: 'object';
        properties: {
            kind: { const: 'TEXT'; type: 'string' };
            textContent: { type: 'string'; maxLength: 100000 };
        };
    };
    fromRecord(record: CourseMaterial): TextMaterial {
        if (record.kind !== 'TEXT' || record.textContent === null) throw InvalidMaterialRecord(record.id);
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

    async create(database: Database, data: CreateTextMaterial): Promise<TextMaterial> {
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

    async update(database: Database, id: string, data: EditTextMaterial): Promise<TextMaterial> {
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
