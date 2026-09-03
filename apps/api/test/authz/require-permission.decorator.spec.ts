import { Reflector } from '@nestjs/core';
import { Permissions } from '@/authz/permissions';
import { RequirePermission } from '@/authz/require-permission.decorator';

const metadata = {
    scope: 'course' as const,
    routeParam: 'courseId',
    permissions: [Permissions.ExamRead],
};

describe('RequirePermission', () => {
    it('stores permission metadata on a handler', () => {
        class Controller {
            @RequirePermission(metadata)
            handler() {}
        }

        const reflector = new Reflector();
        expect(reflector.getAllAndOverride(RequirePermission, [Controller.prototype.handler])).toEqual(metadata);
    });

    it('allows class metadata to be read when no handler override exists', () => {
        @RequirePermission(metadata)
        class Controller {}

        const reflector = new Reflector();
        expect(reflector.getAllAndOverride(RequirePermission, [Controller])).toEqual(metadata);
    });

    it('keeps handler metadata more specific than class metadata', () => {
        const handlerMetadata = { ...metadata, permissions: [Permissions.ExamUpdate] };

        @RequirePermission(metadata)
        class Controller {
            @RequirePermission(handlerMetadata)
            handler() {}
        }

        const reflector = new Reflector();
        expect(reflector.getAllAndOverride(RequirePermission, [Controller.prototype.handler, Controller])).toEqual(handlerMetadata);
    });
});

describe('Permissions', () => {
    it('exposes stable names for all supported permission families', () => {
        expect(Object.values(Permissions)).toEqual(expect.arrayContaining([
            Permissions.CourseRead,
            Permissions.ExamCreate,
            Permissions.ExamRead,
            Permissions.ExamUpdate,
            Permissions.ExamDelete,
            Permissions.AttemptSubmit,
            Permissions.AnswerGrade,
        ]));
        expect(new Set(Object.values(Permissions)).size).toBe(Object.values(Permissions).length);
    });
});
