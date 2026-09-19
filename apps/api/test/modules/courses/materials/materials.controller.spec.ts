jest.mock('@thallesp/nestjs-better-auth', () => ({ Session: () => () => undefined }));

import { MaterialsController } from '@/modules/courses/materials/materials.controller';

const courseId = '11111111-1111-4111-8111-111111111111';
const groupId = '22222222-2222-4222-8222-222222222222';
const materialId = '33333333-3333-4333-8333-333333333333';
const material = {
    id: materialId,
    uploadedById: 'user-1',
    courseGroupId: groupId,
    position: 0,
    visibility: true,
    kind: 'TEXT' as const,
    textContent: 'content',
    createdAt: new Date(),
    updatedAt: new Date(),
};
const group = {
    id: groupId,
    courseId,
    position: 0,
    name: 'Week 1',
    description: null,
    labeled: true,
    weekStartDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    materials: [material],
};

function setup() {
    const service = {
        findCourseContent: jest.fn().mockResolvedValue([group]),
        createGroup: jest.fn().mockResolvedValue(group),
        editGroup: jest.fn().mockResolvedValue(group),
        moveGroup: jest.fn().mockResolvedValue(group),
        deleteGroup: jest.fn().mockResolvedValue(true),
        create: jest.fn().mockResolvedValue(material),
        moveMaterial: jest.fn().mockResolvedValue(material),
        getFileUrl: jest.fn().mockResolvedValue('https://example.test/file'),
        edit: jest.fn().mockResolvedValue(material),
        delete: jest.fn().mockResolvedValue(true),
    };
    const authz = { getCourseAuthzContext: jest.fn().mockResolvedValue({ roles: ['Student'] }) };
    return { controller: new MaterialsController(service as never, authz as never), service, authz };
}

describe('MaterialsController', () => {
    it('lists content with student visibility and delegates group operations', async () => {
        const { controller, service, authz } = setup();
        await expect(controller.findAll(courseId, { user: { id: 'user-1' } } as never)).resolves.toHaveLength(1);
        expect(authz.getCourseAuthzContext).toHaveBeenCalledWith('user-1', courseId);
        expect(service.findCourseContent).toHaveBeenCalledWith(courseId, true);
        authz.getCourseAuthzContext.mockResolvedValue({ roles: [] });
        await controller.findAll(courseId, { user: { id: 'user-1' } } as never);
        expect(service.findCourseContent).toHaveBeenLastCalledWith(courseId, false);
        await expect(controller.createGroup(courseId, { name: 'new' } as never)).resolves.toBe(group);
        await expect(controller.updateGroup(courseId, groupId, { name: 'updated' } as never)).resolves.toBe(group);
        await expect(controller.moveGroup(courseId, groupId, { position: 1 } as never)).resolves.toBe(group);
        await expect(controller.deleteGroup(courseId, groupId)).resolves.toEqual({ success: true });
        expect(service.deleteGroup).toHaveBeenCalledWith(courseId, groupId);
    });

    it('delegates create, move, URL, update and delete material operations', async () => {
        const { controller, service } = setup();
        const session = { user: { id: 'user-1' } } as never;
        const dto = { groupId, input: { kind: 'TEXT', textContent: 'content' } } as never;
        const file = { originalname: 'file.pdf' } as Express.Multer.File;
        await expect(controller.create(courseId, session, dto, file)).resolves.toBe(material);
        expect(service.create).toHaveBeenCalledWith(courseId, 'user-1', dto, file);
        await expect(controller.move(courseId, materialId, { groupId, position: 1 } as never)).resolves.toBe(material);
        await expect(controller.getFileUrl(courseId, materialId)).resolves.toEqual({
            url: 'https://example.test/file',
        });
        await expect(controller.update(courseId, materialId, { visibility: false } as never, file)).resolves.toBe(
            material,
        );
        await expect(controller.remove(courseId, materialId)).resolves.toEqual({ success: true });
        expect(service.delete).toHaveBeenCalledWith(courseId, materialId);
    });
});
