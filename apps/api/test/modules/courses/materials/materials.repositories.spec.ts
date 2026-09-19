import { CourseGroupsRepository } from '@/modules/courses/materials/groups.repository';
import { MaterialsRepository } from '@/modules/courses/materials/materials.repository';
import { FileMaterialRepository } from '@/modules/courses/materials/file/file-material.repository';
import { LinkMaterialRepository } from '@/modules/courses/materials/link/link-material.repository';
import { TextMaterialRepository } from '@/modules/courses/materials/text/text-material.repository';
import {
    InvalidMaterialRecord,
    MaterialCreationFailed,
    MaterialGroupCreationFailed,
    MaterialGroupNotFound,
    MaterialNotFound,
} from '@/modules/courses/materials/materials.errors';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const GROUP_ID = '22222222-2222-4222-8222-222222222222';
const MATERIAL_ID = '33333333-3333-4333-8333-333333333333';
const now = new Date('2026-01-01T00:00:00.000Z');

const group = {
    id: GROUP_ID,
    courseId: COURSE_ID,
    position: 1,
    name: 'Week 1',
    description: null,
    labeled: true,
    weekStartDate: null,
    createdAt: now,
    updatedAt: now,
};
const baseRecord = {
    id: MATERIAL_ID,
    uploadedById: 'user-1',
    courseGroupId: GROUP_ID,
    position: 0,
    visibility: true,
    kind: 'TEXT' as const,
    title: null,
    description: null,
    textContent: 'content',
    externalUrl: null,
    fileKey: null,
    fileName: null,
    fileMimeType: null,
    fileSize: null,
    createdAt: now,
    updatedAt: now,
};

function createGroupsDb() {
    const returning = jest.fn().mockResolvedValue([group]);
    const where = jest.fn().mockReturnValue({ returning });
    const selectWhere = jest.fn().mockResolvedValue([{ value: 2 }]);
    const db: any = {
        query: {
            courseGroups: {
                findMany: jest.fn().mockResolvedValue([group]),
                findFirst: jest.fn().mockResolvedValue(group),
            },
        },
        insert: jest.fn().mockReturnValue({ values: jest.fn().mockReturnValue({ returning }) }),
        select: jest.fn().mockReturnValue({ from: jest.fn().mockReturnValue({ where: selectWhere }) }),
        update: jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where }) }),
        delete: jest.fn().mockReturnValue({ where }),
        transaction: jest.fn(async (callback: (tx: any) => unknown) => callback(db)),
    };
    return { db, returning, where, selectWhere };
}

function createMaterialsDb(record: any = baseRecord) {
    const returning = jest.fn().mockResolvedValue([record]);
    const where = jest.fn().mockReturnValue({ returning });
    const selectWhere = jest.fn().mockResolvedValue([{ value: 2 }]);
    const db: any = {
        query: {
            courseGroups: {
                findMany: jest.fn().mockResolvedValue([{ ...group, materials: [record] }]),
            },
            courseMaterials: {
                findMany: jest.fn().mockResolvedValue([{ position: 0 }]),
                findFirst: jest.fn().mockResolvedValue({ ...record, group }),
            },
        },
        insert: jest.fn().mockReturnValue({ values: jest.fn().mockReturnValue({ returning }) }),
        select: jest.fn().mockReturnValue({ from: jest.fn().mockReturnValue({ where: selectWhere }) }),
        update: jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where }) }),
        delete: jest.fn().mockReturnValue({ where }),
        transaction: jest.fn(async (callback: (tx: any) => unknown) => callback(db)),
    };
    return { db, returning, where, selectWhere };
}

describe('CourseGroupsRepository', () => {
    it('calculates positions, reads, creates and counts groups', async () => {
        const setup = createGroupsDb();
        const { db } = setup;
        const repository = new CourseGroupsRepository(db as never);
        await expect(repository.nextPosition(COURSE_ID)).resolves.toBe(2);
        await expect(repository.findById(COURSE_ID, GROUP_ID)).resolves.toBe(group);
        await expect(
            repository.create(COURSE_ID ? { courseId: COURSE_ID, position: 2, name: 'New' } : ({} as never)),
        ).resolves.toBe(group);
        await expect(repository.countByCourseId(COURSE_ID)).resolves.toBe(2);
        setup.selectWhere.mockResolvedValue([]);
        await expect(repository.countByCourseId(COURSE_ID)).resolves.toBe(0);
    });

    it('handles group creation and lookup failures', async () => {
        const setup = createGroupsDb();
        setup.returning.mockResolvedValue([]);
        const repository = new CourseGroupsRepository(setup.db as never);
        await expect(repository.create({ courseId: COURSE_ID, position: 0, name: 'New' })).rejects.toEqual(
            MaterialGroupCreationFailed(),
        );
        setup.db.query.courseGroups.findFirst.mockResolvedValue(undefined);
        await expect(repository.findById(COURSE_ID, GROUP_ID)).rejects.toEqual(MaterialGroupNotFound(GROUP_ID));
        setup.db.query.courseGroups.findFirst.mockResolvedValue({ ...group, courseId: 'other' });
        await expect(repository.findById(COURSE_ID, GROUP_ID)).rejects.toEqual(MaterialGroupNotFound(GROUP_ID));
    });

    it('moves, updates and deletes groups', async () => {
        const setup = createGroupsDb();
        const repository = new CourseGroupsRepository(setup.db as never);
        await expect(
            repository.updatePositionRange(COURSE_ID, GROUP_ID, 0, { start: 0, end: 1, offset: 1 }),
        ).resolves.toBe(group);
        await expect(repository.update(COURSE_ID, GROUP_ID, { name: 'Updated' })).resolves.toBe(group);
        await expect(repository.delete(COURSE_ID, GROUP_ID)).resolves.toBe(true);
        setup.returning.mockResolvedValue([]);
        await expect(
            repository.updatePositionRange(COURSE_ID, GROUP_ID, 0, { start: 0, end: 1, offset: 1 }),
        ).rejects.toEqual(MaterialGroupNotFound(GROUP_ID));
        await expect(repository.update(COURSE_ID, GROUP_ID, {})).rejects.toEqual(MaterialGroupNotFound(GROUP_ID));
        await expect(repository.delete(COURSE_ID, GROUP_ID)).rejects.toEqual(MaterialGroupNotFound(GROUP_ID));
    });
});

describe('MaterialsRepository', () => {
    it('reads, counts and creates material content', async () => {
        const setup = createMaterialsDb();
        const repository = new MaterialsRepository(setup.db as never);
        await expect(repository.findCourseContent(COURSE_ID)).resolves.toHaveLength(1);
        await expect(repository.findCourseContent(COURSE_ID, true)).resolves.toHaveLength(1);
        await expect(repository.findById(COURSE_ID, MATERIAL_ID)).resolves.toMatchObject({
            kind: 'TEXT',
            textContent: 'content',
        });
        await expect(repository.countByGroupId(GROUP_ID)).resolves.toBe(2);
        setup.selectWhere.mockResolvedValue([]);
        await expect(repository.countByGroupId(GROUP_ID)).resolves.toBe(0);
        setup.selectWhere.mockResolvedValue([{ value: 2 }]);
        await expect(repository.nextGroupPosition(GROUP_ID)).resolves.toBe(1);
        setup.db.query.courseMaterials.findMany.mockResolvedValue([]);
        await expect(repository.nextGroupPosition(GROUP_ID)).resolves.toBe(0);
        await expect(
            repository.create({
                kind: 'TEXT',
                textContent: 'new',
                uploadedById: 'u',
                courseGroupId: GROUP_ID,
                position: 1,
                visibility: true,
            }),
        ).resolves.toMatchObject({ textContent: 'content' });
        await expect(
            repository.updateContent(COURSE_ID, MATERIAL_ID, { kind: 'TEXT', textContent: 'new' }),
        ).resolves.toMatchObject({ textContent: 'content' });
        await expect(repository.updateVisibility(COURSE_ID, MATERIAL_ID, false)).resolves.toMatchObject({
            visibility: true,
        });
        await expect(
            repository.updatePositionRanges(MATERIAL_ID, GROUP_ID, 1, [
                { groupId: GROUP_ID, start: 0, end: 1, offset: -1 },
            ]),
        ).resolves.toMatchObject({ textContent: 'content' });
        await expect(
            repository.updatePositionRanges(MATERIAL_ID, GROUP_ID, 1, [{ groupId: GROUP_ID, start: 0, offset: -1 }]),
        ).resolves.toMatchObject({ textContent: 'content' });
        await expect(repository.delete(COURSE_ID, MATERIAL_ID)).resolves.toBe(true);
    });

    it('rejects missing material records and deletes', async () => {
        const setup = createMaterialsDb();
        const repository = new MaterialsRepository(setup.db as never);
        setup.db.query.courseMaterials.findFirst.mockResolvedValue(undefined);
        await expect(repository.findById(COURSE_ID, MATERIAL_ID)).rejects.toEqual(MaterialNotFound(MATERIAL_ID));
        setup.db.query.courseMaterials.findFirst.mockResolvedValue({
            ...baseRecord,
            group: { ...group, courseId: 'other' },
        });
        await expect(repository.findById(COURSE_ID, MATERIAL_ID)).rejects.toEqual(MaterialNotFound(MATERIAL_ID));
        setup.returning.mockResolvedValue([]);
        setup.db.query.courseMaterials.findFirst.mockResolvedValue({ ...baseRecord, group });
        await expect(repository.updateVisibility(COURSE_ID, MATERIAL_ID, true)).rejects.toEqual(
            MaterialNotFound(MATERIAL_ID),
        );
        await expect(
            repository.updatePositionRanges(MATERIAL_ID, GROUP_ID, 0, [{ groupId: GROUP_ID, start: 0, offset: 1 }]),
        ).rejects.toEqual(MaterialNotFound(MATERIAL_ID));
        await expect(repository.delete(COURSE_ID, MATERIAL_ID)).rejects.toEqual(MaterialNotFound(MATERIAL_ID));
    });
});

function repositoryCases() {
    return [
        [new TextMaterialRepository(), { ...baseRecord }],
        [
            new LinkMaterialRepository(),
            { ...baseRecord, kind: 'LINK', title: 'Link', externalUrl: 'https://example.com', textContent: null },
        ],
        [
            new FileMaterialRepository(),
            {
                ...baseRecord,
                kind: 'FILE',
                title: 'File',
                fileKey: 'files/a',
                fileName: 'a.pdf',
                fileMimeType: 'application/pdf',
                fileSize: 12,
                textContent: null,
            },
        ],
    ] as const;
}

describe.each(repositoryCases())('%s material repository', (repository, record) => {
    it('parses records and prepares create/edit values', async () => {
        const input =
            repository.kind === 'TEXT'
                ? { kind: 'TEXT' as const, textContent: 'body' }
                : repository.kind === 'LINK'
                  ? { kind: 'LINK' as const, title: 'Link', externalUrl: 'https://example.com' }
                  : { kind: 'FILE' as const, title: 'File' };
        expect(repository.parseInput(input)).toEqual(input);
        const storage = {
            upload: jest.fn().mockResolvedValue({ key: 'files/new', fileName: 'new', mimeType: 'text/plain', size: 3 }),
        };
        const file = {
            originalname: 'new',
            mimetype: 'text/plain',
            size: 3,
            buffer: Buffer.from('new'),
        } as Express.Multer.File;
        const created = await repository.prepareCreate(
            input,
            repository.kind === 'FILE' ? file : undefined,
            storage as never,
        );
        expect(created.kind).toBe(repository.kind);
        await expect(
            repository.prepareEdit(
                undefined,
                repository.kind === 'TEXT' ? ({ ...record, kind: 'TEXT' } as never) : (record as never),
                undefined,
                storage as never,
            ),
        ).resolves.toMatchObject({ kind: repository.kind });
        expect(repository.toResponse(record as never)).toBe(record);
        expect(repository.resourceKey(record as never)).toBe(repository.kind === 'FILE' ? record.fileKey : undefined);
        if (repository.kind === 'FILE')
            expect(repository.resourceKey({ kind: 'TEXT', textContent: 'x' } as never)).toBeUndefined();
    });

    it('creates and updates records, and reports database failures', async () => {
        const setup = createMaterialsDb(record);
        const input =
            repository.kind === 'TEXT'
                ? { kind: 'TEXT' as const, textContent: 'body' }
                : repository.kind === 'LINK'
                  ? { kind: 'LINK' as const, title: 'Link', externalUrl: 'https://example.com' }
                  : { kind: 'FILE' as const, title: 'File', fileKey: 'files/a' };
        await expect(
            repository.create(
                setup.db as never,
                { ...input, uploadedById: 'u', courseGroupId: GROUP_ID, position: 0, visibility: true } as never,
            ),
        ).resolves.toMatchObject({ kind: repository.kind });
        await expect(repository.update(setup.db as never, MATERIAL_ID, input as never)).resolves.toMatchObject({
            kind: repository.kind,
        });
        setup.returning.mockResolvedValue([]);
        await expect(
            repository.create(
                setup.db as never,
                { ...input, uploadedById: 'u', courseGroupId: GROUP_ID, position: 0 } as never,
            ),
        ).rejects.toEqual(MaterialCreationFailed());
        await expect(repository.update(setup.db as never, MATERIAL_ID, input as never)).rejects.toEqual(
            MaterialNotFound(MATERIAL_ID),
        );
    });

    it('rejects malformed records and mismatched edits', async () => {
        const invalid =
            repository.kind === 'TEXT'
                ? { ...record, kind: 'TEXT', textContent: null }
                : repository.kind === 'LINK'
                  ? { ...record, kind: 'LINK', title: null, externalUrl: null }
                  : { ...record, kind: 'FILE', title: null, fileKey: null };
        expect(() => repository.fromRecord(invalid as never)).toThrow(InvalidMaterialRecord(MATERIAL_ID));
        if (repository.kind === 'FILE') {
            await expect(
                repository.prepareEdit(undefined, { ...record, kind: 'TEXT' } as never, undefined, {} as never),
            ).rejects.toThrow('File material input is required');
            await expect(
                repository.prepareEdit(
                    { kind: 'FILE', title: 'file' } as never,
                    { ...record, kind: 'TEXT' } as never,
                    undefined,
                    {} as never,
                ),
            ).rejects.toThrow('An uploaded file is required');
        }
        if (repository.kind === 'LINK') {
            await expect(repository.prepareEdit(undefined, { ...record, kind: 'TEXT' } as never)).rejects.toThrow(
                'different material kind',
            );
        }
        if (repository.kind === 'TEXT') {
            await expect(repository.prepareEdit(undefined, { ...record, kind: 'LINK' } as never)).rejects.toThrow(
                'different material kind',
            );
        }
    });
});
