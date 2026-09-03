jest.mock('@thallesp/nestjs-better-auth', () => ({
    OptionalAuth: () => (target: object) => target,
    Session: () => () => undefined,
}));

import { AuthzService } from '@/authz/authz.service';
import { MeController } from '@/common/me.controller';
import { Permissions } from '@/authz/permissions';

type ResponseMock = {
    status: jest.Mock;
    json: jest.Mock;
};

function createResponse(): ResponseMock {
    const response = { status: jest.fn(), json: jest.fn() };
    response.status.mockReturnValue(response);
    return response;
}

const session = {
    user: { id: 'user-1', name: 'Ada', email: 'ada@example.com', image: null },
    session: {
        id: 'session-1',
        userId: 'user-1',
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
        createdAt: new Date('2029-01-01T00:00:00.000Z'),
        updatedAt: new Date('2029-01-01T00:00:00.000Z'),
    },
};

describe('MeController', () => {
    it('returns explicit JSON null for an anonymous request', async () => {
        const authzService = { getUserAuthzContext: jest.fn() };
        const response = createResponse();

        await expect(new MeController(authzService as unknown as AuthzService).findMe(null, response as never)).resolves.toBeUndefined();
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(null);
        expect(authzService.getUserAuthzContext).not.toHaveBeenCalled();
    });

    it('returns the authenticated user, session, roles, and permissions', async () => {
        const context = { roles: ['Professor'], permissions: [Permissions.ExamRead] };
        const authzService = { getUserAuthzContext: jest.fn().mockResolvedValue(context) };
        const response = createResponse();

        await new MeController(authzService as unknown as AuthzService).findMe(session as never, response as never);

        expect(authzService.getUserAuthzContext).toHaveBeenCalledWith('user-1');
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith({
            user: session.user,
            session: session.session,
            roles: context.roles,
            permissions: context.permissions,
        });
    });

    it('falls back to empty authorization data when context loading fails with an Error', async () => {
        const authzService = { getUserAuthzContext: jest.fn().mockRejectedValue(new Error('database unavailable')) };
        const response = createResponse();

        await new MeController(authzService as unknown as AuthzService).findMe(session as never, response as never);

        expect(response.json).toHaveBeenCalledWith({
            user: session.user,
            session: session.session,
            roles: [],
            permissions: [],
        });
    });

    it('falls back to empty authorization data for non-Error failures', async () => {
        const authzService = { getUserAuthzContext: jest.fn().mockRejectedValue('database unavailable') };
        const response = createResponse();

        await new MeController(authzService as unknown as AuthzService).findMe(session as never, response as never);

        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ roles: [], permissions: [] }));
    });
});
