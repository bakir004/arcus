import { MaterialsService } from '@/modules/courses/materials/materials.service';

const COURSE_ID = '00000000-0000-4000-8000-000000000003';
const SOURCE_GROUP_ID = '00000000-0000-4000-8000-000000000101';
const TARGET_GROUP_ID = '00000000-0000-4000-8000-000000000102';
const MATERIAL_ID = '00000000-0000-4000-8000-000000002001';

const material = (id: string, courseGroupId: string, position: number) => ({
    id,
    courseGroupId,
    position,
    kind: 'TEXT' as const,
    textContent: id,
});

function createService(current: ReturnType<typeof material>, destinationCount: number) {
    const materials = {
        findById: jest.fn().mockResolvedValue(current),
        countByGroupId: jest.fn().mockResolvedValue(destinationCount),
        updatePositionRanges: jest.fn().mockResolvedValue(current),
    };
    const courseGroups = { findById: jest.fn().mockResolvedValue({ id: TARGET_GROUP_ID, courseId: COURSE_ID }) };
    const service = new MaterialsService(materials as never, courseGroups as never, {} as never);
    return { service, materials, courseGroups };
}

describe('MaterialsService.createGroup', () => {
    it('persists the label visibility and defaults it to visible', async () => {
        const created = {
            id: SOURCE_GROUP_ID,
            courseId: COURSE_ID,
            position: 0,
            name: 'Internal identifier',
            description: null,
            labeled: false,
        };
        const groups = {
            nextPosition: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue(created),
        };
        const service = new MaterialsService({} as never, groups as never, {} as never);

        await expect(
            service.createGroup(COURSE_ID, { name: ' Internal identifier ', description: '', labeled: false }),
        ).resolves.toBe(created);
        expect(groups.create).toHaveBeenCalledWith({
            courseId: COURSE_ID,
            position: 0,
            name: 'Internal identifier',
            description: null,
            labeled: false,
        });

        await service.createGroup(COURSE_ID, { name: 'Visible group' });
        expect(groups.create).toHaveBeenLastCalledWith({
            courseId: COURSE_ID,
            position: 0,
            name: 'Visible group',
            description: null,
            labeled: true,
        });
    });
});

describe('MaterialsService.moveGroup', () => {
    const current = { id: SOURCE_GROUP_ID, courseId: COURSE_ID, position: 3 };

    function createGroupService(groupCount = 5) {
        const groups = {
            findById: jest.fn().mockResolvedValue(current),
            countByCourseId: jest.fn().mockResolvedValue(groupCount),
            updatePositionRange: jest.fn().mockResolvedValue(current),
        };
        return { service: new MaterialsService({} as never, groups as never, {} as never), groups };
    }

    it('increments the range when moving a group earlier', async () => {
        const { service, groups } = createGroupService();

        await service.moveGroup(COURSE_ID, SOURCE_GROUP_ID, 1);

        expect(groups.updatePositionRange).toHaveBeenCalledWith(COURSE_ID, SOURCE_GROUP_ID, 1, {
            start: 1,
            end: 2,
            offset: 1,
        });
    });

    it('decrements the range when moving a group later', async () => {
        const { service, groups } = createGroupService(7);

        await service.moveGroup(COURSE_ID, SOURCE_GROUP_ID, 5);

        expect(groups.updatePositionRange).toHaveBeenCalledWith(COURSE_ID, SOURCE_GROUP_ID, 5, {
            start: 4,
            end: 5,
            offset: -1,
        });
    });

    it('clamps the target and skips updates when the position does not change', async () => {
        const { service, groups } = createGroupService(4);

        await expect(service.moveGroup(COURSE_ID, SOURCE_GROUP_ID, 99)).resolves.toBe(current);
        expect(groups.updatePositionRange).not.toHaveBeenCalled();
    });
});

describe('MaterialsService.moveMaterial', () => {
    it('shifts both ranges when moving between groups', async () => {
        const current = material(MATERIAL_ID, SOURCE_GROUP_ID, 1);
        const { service, materials, courseGroups } = createService(current, 2);

        await service.moveMaterial(COURSE_ID, MATERIAL_ID, { groupId: TARGET_GROUP_ID, position: 1 });

        expect(courseGroups.findById).toHaveBeenCalledWith(COURSE_ID, TARGET_GROUP_ID);
        expect(materials.countByGroupId).toHaveBeenCalledWith(TARGET_GROUP_ID);
        expect(materials.updatePositionRanges).toHaveBeenCalledWith(MATERIAL_ID, TARGET_GROUP_ID, 1, [
            { groupId: SOURCE_GROUP_ID, start: 2, offset: -1 },
            { groupId: TARGET_GROUP_ID, start: 1, offset: 1 },
        ]);
    });

    it('decrements one range when moving later within a group', async () => {
        const current = material(MATERIAL_ID, SOURCE_GROUP_ID, 0);
        const { service, materials } = createService(current, 3);

        await service.moveMaterial(COURSE_ID, MATERIAL_ID, { groupId: SOURCE_GROUP_ID, position: 99 });

        expect(materials.updatePositionRanges).toHaveBeenCalledWith(MATERIAL_ID, SOURCE_GROUP_ID, 2, [
            { groupId: SOURCE_GROUP_ID, start: 1, end: 2, offset: -1 },
        ]);
    });

    it('increments one range when moving earlier within a group', async () => {
        const current = material(MATERIAL_ID, SOURCE_GROUP_ID, 2);
        const { service, materials } = createService(current, 3);

        await service.moveMaterial(COURSE_ID, MATERIAL_ID, { groupId: SOURCE_GROUP_ID, position: 0 });

        expect(materials.updatePositionRanges).toHaveBeenCalledWith(MATERIAL_ID, SOURCE_GROUP_ID, 0, [
            { groupId: SOURCE_GROUP_ID, start: 0, end: 1, offset: 1 },
        ]);
    });

    it('returns immediately when group and position do not change', async () => {
        const current = material(MATERIAL_ID, SOURCE_GROUP_ID, 1);
        const { service, materials, courseGroups } = createService(current, 3);

        await expect(
            service.moveMaterial(COURSE_ID, MATERIAL_ID, { groupId: SOURCE_GROUP_ID, position: 1 }),
        ).resolves.toBe(current);

        expect(courseGroups.findById).not.toHaveBeenCalled();
        expect(materials.countByGroupId).not.toHaveBeenCalled();
        expect(materials.updatePositionRanges).not.toHaveBeenCalled();
    });
});
