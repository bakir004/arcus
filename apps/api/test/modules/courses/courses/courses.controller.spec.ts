type SessionContext = {
    switchToHttp: () => { getRequest: () => { session?: unknown } };
};

jest.mock('@thallesp/nestjs-better-auth', () => {
    const { createParamDecorator } = jest.requireActual('@nestjs/common');
    return {
        OptionalAuth: () => () => undefined,
        Session: createParamDecorator((_data: unknown, context: SessionContext) => context.switchToHttp().getRequest().session),
    };
});

import { CoursesController } from '@/modules/courses/courses/courses.controller';

const ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = 'user-1';
const course = {
    id: ID,
    name: 'Algorithms',
    code: 'CS-101',
    facultyId: null,
    createdById: USER_ID,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};
const serialized = { ...course, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' };

function createDependencies() {
    return {
        service: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByCode: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        authz: { getCourseAuthzContext: jest.fn() },
    };
}

function response() {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

describe('CoursesController', () => {
    it('creates a course for the session user and serializes dates', async () => {
        const deps = createDependencies();
        deps.service.create.mockResolvedValue(course);
        const dto = { name: 'Algorithms' };
        await expect(new CoursesController(deps.service as never, deps.authz as never).create({ user: { id: USER_ID } } as never, dto as never)).resolves.toEqual(serialized);
        expect(deps.service.create).toHaveBeenCalledWith(USER_ID, dto);
    });

    it('lists courses and serializes every row', async () => {
        const deps = createDependencies();
        deps.service.findAll.mockResolvedValue([course, { ...course, id: '22222222-2222-4222-8222-222222222222' }]);
        await expect(new CoursesController(deps.service as never, deps.authz as never).findAll()).resolves.toEqual([
            serialized,
            { ...serialized, id: '22222222-2222-4222-8222-222222222222' },
        ]);
    });

    it('returns an empty list', async () => {
        const deps = createDependencies();
        deps.service.findAll.mockResolvedValue([]);
        await expect(new CoursesController(deps.service as never, deps.authz as never).findAll()).resolves.toEqual([]);
    });

    it('finds by id and by code', async () => {
        const deps = createDependencies();
        deps.service.findById.mockResolvedValue(course);
        deps.service.findByCode.mockResolvedValue(course);
        const controller = new CoursesController(deps.service as never, deps.authz as never);
        await expect(controller.findById(ID)).resolves.toEqual(serialized);
        await expect(controller.findByCode('CS-101')).resolves.toEqual(serialized);
        expect(deps.service.findById).toHaveBeenCalledWith(ID);
        expect(deps.service.findByCode).toHaveBeenCalledWith('CS-101');
    });

    it('updates and deletes a course', async () => {
        const deps = createDependencies();
        deps.service.update.mockResolvedValue(course);
        deps.service.delete.mockResolvedValue(undefined);
        const controller = new CoursesController(deps.service as never, deps.authz as never);
        await expect(controller.update(ID, { name: 'Updated' } as never)).resolves.toEqual(serialized);
        await expect(controller.remove(ID)).resolves.toBeUndefined();
        expect(deps.service.update).toHaveBeenCalledWith(ID, { name: 'Updated' });
        expect(deps.service.delete).toHaveBeenCalledWith(ID);
    });

    it('returns explicit JSON null for anonymous course membership requests', async () => {
        const deps = createDependencies();
        const res = response();
        await expect(new CoursesController(deps.service as never, deps.authz as never).findMe(ID, null, res as never)).resolves.toBeUndefined();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(null);
        expect(deps.service.findById).not.toHaveBeenCalled();
    });

    it('returns authenticated membership and authz context', async () => {
        const deps = createDependencies();
        deps.service.findById.mockResolvedValue(course);
        deps.authz.getCourseAuthzContext.mockResolvedValue({ roles: ['student'], permissions: ['course:read'] });
        const res = response();
        const session = { user: { id: USER_ID, name: 'User', email: 'u@example.com', image: null }, session: { id: 'session-1' } };
        await new CoursesController(deps.service as never, deps.authz as never).findMe(ID, session as never, res as never);
        expect(deps.service.findById).toHaveBeenCalledWith(ID);
        expect(deps.authz.getCourseAuthzContext).toHaveBeenCalledWith(USER_ID, ID);
        expect(res.json).toHaveBeenCalledWith({
            user: session.user,
            session: session.session,
            roles: ['student'],
            permissions: ['course:read'],
        });
    });

    it('propagates service, authz, and operation failures', async () => {
        const deps = createDependencies();
        const failure = new Error('service failed');
        deps.service.create.mockRejectedValue(failure);
        deps.service.findAll.mockRejectedValue(failure);
        deps.service.findById.mockRejectedValue(failure);
        deps.service.findByCode.mockRejectedValue(failure);
        deps.service.update.mockRejectedValue(failure);
        deps.service.delete.mockRejectedValue(failure);
        deps.service.findById.mockRejectedValueOnce(failure).mockResolvedValue(course);
        deps.authz.getCourseAuthzContext.mockRejectedValue(failure);
        const controller = new CoursesController(deps.service as never, deps.authz as never);
        await expect(controller.create({ user: { id: USER_ID } } as never, {} as never)).rejects.toBe(failure);
        await expect(controller.findAll()).rejects.toBe(failure);
        await expect(controller.findById(ID)).rejects.toBe(failure);
        await expect(controller.findByCode('CS-101')).rejects.toBe(failure);
        await expect(controller.update(ID, {} as never)).rejects.toBe(failure);
        await expect(controller.remove(ID)).rejects.toBe(failure);
        const res = response();
        await expect(controller.findMe(ID, { user: { id: USER_ID } } as never, res as never)).rejects.toBe(failure);
    });
});
