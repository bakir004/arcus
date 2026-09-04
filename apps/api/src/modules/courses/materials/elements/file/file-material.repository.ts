import { courseMaterials, eq } from '@/database';
import type { Database } from '@/database/client';
import { Injectable } from '@nestjs/common';
import type { CourseMaterial } from '../../materials.entity';
import type { FileMaterial, CreateFileMaterial, EditFileMaterial } from './file-material.entity';
import { InvalidMaterialRecord, MaterialCreationFailed, MaterialNotFound } from '../../materials.errors';
import type { MaterialTypeRepository } from '../../materials.repository.interface';

@Injectable()
export class FileMaterialRepository
    implements MaterialTypeRepository<CreateFileMaterial, EditFileMaterial, FileMaterial>
{
    fromRecord(record: CourseMaterial): FileMaterial {
        if (record.kind !== 'FILE' || record.fileKey === null || record.title === null)
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
        return {
            ...material,
            kind,
            title,
            description,
            fileKey,
            fileName,
            fileMimeType,
            fileSize,
        };
    }

    async create(database: Database, data: CreateFileMaterial): Promise<FileMaterial> {
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

    async update(database: Database, id: string, data: EditFileMaterial): Promise<FileMaterial> {
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
