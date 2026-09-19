import { BadRequestException } from '@nestjs/common';
import { MaterialsService } from '@/modules/courses/materials/materials.service';

const courseId = '11111111-1111-4111-8111-111111111111';
const groupId = '22222222-2222-4222-8222-222222222222';
const materialId = '33333333-3333-4333-8333-333333333333';
const textMaterial = {
    id: materialId,
    courseGroupId: groupId,
    position: 0,
    kind: 'TEXT' as const,
    textContent: 'hello',
    visibility: true,
};
const fileMaterial = {
    ...textMaterial,
    kind: 'FILE' as const,
    fileKey: 'old/file.pdf',
    title: 'old',
    description: null,
    fileName: 'file.pdf',
    fileMimeType: 'application/pdf',
    fileSize: 4,
};

function setup() {
    const materials = {
        findCourseContent: jest.fn().mockResolvedValue([{ id: groupId, materials: [fileMaterial] }]),
        findById: jest.fn().mockResolvedValue(textMaterial),
        nextGroupPosition: jest.fn().mockResolvedValue(2),
        create: jest.fn().mockResolvedValue(textMaterial),
        updateContent: jest.fn().mockResolvedValue(textMaterial),
        updateVisibility: jest.fn().mockResolvedValue({ ...textMaterial, visibility: false }),
        countByGroupId: jest.fn().mockResolvedValue(3),
        updatePositionRanges: jest.fn().mockResolvedValue(textMaterial),
        delete: jest.fn().mockResolvedValue(true),
    };
    const groups = {
        findById: jest.fn().mockResolvedValue({ id: groupId, courseId: courseId, position: 0 }),
        nextPosition: jest.fn().mockResolvedValue(1),
        countByCourseId: jest.fn().mockResolvedValue(2),
        create: jest.fn().mockResolvedValue({ id: groupId }),
        update: jest.fn().mockResolvedValue({ id: groupId }),
        updatePositionRange: jest.fn().mockResolvedValue({ id: groupId }),
        delete: jest.fn().mockResolvedValue(true),
    };
    const storage = {
        upload: jest
            .fn()
            .mockResolvedValue({ key: 'new/file.pdf', fileName: 'file.pdf', mimeType: 'application/pdf', size: 4 }),
        getPresignedUrl: jest.fn().mockResolvedValue('https://example.test/file'),
        cleanup: jest.fn().mockResolvedValue(undefined),
    };
    return {
        service: new MaterialsService(materials as never, groups as never, storage as never),
        materials,
        groups,
        storage,
    };
}

describe('MaterialsService remaining operations', () => {
    it('delegates reads, URLs, group edits and group deletion cleanup', async () => {
        const { service, materials, groups, storage } = setup();
        await expect(service.findCourseContent(courseId)).resolves.toEqual([
            { id: groupId, materials: [fileMaterial] },
        ]);
        await expect(service.findCourseContent(courseId, true)).resolves.toEqual([
            { id: groupId, materials: [fileMaterial] },
        ]);
        await expect(service.findById(courseId, materialId)).resolves.toBe(textMaterial);
        await expect(service.getFileUrl(courseId, materialId)).rejects.toBeInstanceOf(BadRequestException);
        materials.findById.mockResolvedValue(fileMaterial);
        await expect(service.getFileUrl(courseId, materialId)).resolves.toBe('https://example.test/file');
        expect(storage.getPresignedUrl).toHaveBeenCalledWith('old/file.pdf');

        await service.editGroup(courseId, groupId, {
            name: ' New ',
            description: ' Description ',
            labeled: false,
            weekStartDate: '2026-02-04',
        });
        expect(groups.update).toHaveBeenCalledWith(courseId, groupId, {
            name: 'New',
            description: 'Description',
            labeled: false,
            weekStartDate: '2026-02-02',
        });
        await service.editGroup(courseId, groupId, { weekStartDate: null, description: '' });
        expect(groups.update).toHaveBeenLastCalledWith(courseId, groupId, { description: null, weekStartDate: null });

        await expect(service.deleteGroup(courseId, groupId)).resolves.toBe(true);
        expect(storage.cleanup).toHaveBeenCalledWith('old/file.pdf');
        materials.findCourseContent.mockResolvedValue([]);
        await expect(service.deleteGroup(courseId, groupId)).resolves.toBe(true);
    });

    it('creates text materials and cleans up on failed file preparation', async () => {
        const { service, materials, groups } = setup();
        await expect(service.createGroup(courseId, { name: ' New ', weekStartDate: '2026-02-04' })).resolves.toEqual({
            id: groupId,
        });
        expect(groups.create).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'New', weekStartDate: '2026-02-02', position: 1 }),
        );
        await expect(
            service.create(courseId, 'user-1', { groupId, input: { kind: 'TEXT', textContent: 'body' } }),
        ).resolves.toBe(textMaterial);
        expect(materials.create).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'TEXT', uploadedById: 'user-1', position: 2 }),
        );
        await expect(
            service.create(courseId, 'user-1', { groupId, input: { kind: 'FILE', title: 'missing' } }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('cleans a newly uploaded file when persistence fails', async () => {
        const { service, materials, storage } = setup();
        materials.create.mockRejectedValue(new Error('database failed'));
        await expect(
            service.create(courseId, 'user-1', { groupId, input: { kind: 'FILE', title: 'file' } }, {
                originalname: 'file.pdf',
                mimetype: 'application/pdf',
                size: 4,
                buffer: Buffer.from('file'),
            } as Express.Multer.File),
        ).rejects.toThrow('database failed');
        expect(storage.cleanup).toHaveBeenCalledWith('new/file.pdf');
    });

    it('cleans a replacement file when editing fails', async () => {
        const { service, materials, storage } = setup();
        materials.findById.mockResolvedValue(fileMaterial);
        materials.updateContent.mockRejectedValue(new Error('database failed'));
        await expect(
            service.edit(courseId, materialId, { input: { kind: 'FILE', title: 'replacement' } }, {
                originalname: 'replacement.pdf',
                mimetype: 'application/pdf',
                size: 4,
                buffer: Buffer.from('file'),
            } as Express.Multer.File),
        ).rejects.toThrow('database failed');
        expect(storage.cleanup).toHaveBeenCalledWith('new/file.pdf');
    });

    it('edits content, visibility and deletes materials', async () => {
        const { service, materials, storage } = setup();
        await expect(
            service.edit(courseId, materialId, { input: { kind: 'TEXT', textContent: 'updated' }, visibility: false }),
        ).resolves.toMatchObject({ visibility: false });
        expect(materials.updateVisibility).toHaveBeenCalledWith(courseId, materialId, false);
        await expect(service.edit(courseId, materialId, {})).resolves.toBe(textMaterial);
        await expect(service.delete(courseId, materialId)).resolves.toBe(true);
        expect(storage.cleanup).toHaveBeenCalledWith(undefined);
    });

    it('cleans a replaced file when editing changes material kind and fails', async () => {
        const { service, materials, storage } = setup();
        materials.findById.mockResolvedValue(fileMaterial);
        materials.updateContent.mockRejectedValue(new Error('database failed'));
        await expect(
            service.edit(courseId, materialId, { input: { kind: 'TEXT', textContent: 'replacement' } }),
        ).rejects.toThrow('database failed');
        expect(storage.cleanup).toHaveBeenCalledWith(undefined);
    });

    it('moves and handles deletion cleanup failures without masking deletes', async () => {
        const { service, materials, storage } = setup();
        storage.cleanup.mockRejectedValue(new Error('cleanup failed'));
        await expect(service.delete(courseId, materialId)).rejects.toThrow('cleanup failed');
        materials.findById.mockResolvedValue(fileMaterial);
        await expect(service.delete(courseId, materialId)).rejects.toThrow('cleanup failed');
        await expect(service.moveMaterial(courseId, materialId, { groupId, position: 99 })).resolves.toBe(textMaterial);
    });
});
