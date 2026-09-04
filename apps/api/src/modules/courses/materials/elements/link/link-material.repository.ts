import { courseMaterials, eq } from '@/database';
import type { Database } from '@/database/client';
import { Injectable } from '@nestjs/common';
import type { CourseMaterial } from '../../materials.entity';
import type { LinkMaterial, CreateLinkMaterial, EditLinkMaterial } from './link-material.entity';
import { InvalidMaterialRecord, MaterialCreationFailed, MaterialNotFound } from '../../materials.errors';
import type { MaterialTypeRepository } from '../../materials.repository.interface';

@Injectable()
export class LinkMaterialRepository
    implements MaterialTypeRepository<CreateLinkMaterial, EditLinkMaterial, LinkMaterial>
{
    fromRecord(record: CourseMaterial): LinkMaterial {
        if (record.kind !== 'LINK' || record.externalUrl === null || record.title === null)
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

    async create(database: Database, data: CreateLinkMaterial): Promise<LinkMaterial> {
        const [record] = await database
            .insert(courseMaterials)
            .values({
                uploadedById: data.uploadedById,
                courseGroupId: data.courseGroupId,
                position: data.position,
                kind: data.kind,
                title: data.title,
                description: data.description ?? null,
                externalUrl: data.externalUrl,
            })
            .returning();
        if (!record) throw MaterialCreationFailed();
        return this.fromRecord(record);
    }

    async update(database: Database, id: string, data: EditLinkMaterial): Promise<LinkMaterial> {
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
