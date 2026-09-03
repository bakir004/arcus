import { CoursesService } from '@/modules/courses/courses/courses.service';
import { CourseCreationFailed } from '@/modules/courses/courses/courses.errors';

const ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = 'user-1';
const course = {
    id: ID,
    name: 'Algorithms',
    code: 'CS-101',
    facultyId: null,
    createdById: USER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
};

function createRepository() {
    return {
        create: jest.fn().mockResolvedValue(course),
        findAll: jest.fn().mockResolvedValue([course]),
        findById: jest.fn().mockResolvedValue(course),
        findByCode: jest.fn().mockResolvedValue(course),
        update: jest.fn().mockResolvedValue(course),
        delete: jest.fn().mockResolvedValue(undefined),
    };
}

describe('CoursesService', () => {
    it('validates and delegates create with normalized data', async () => {
        const repository = createRepository();
        await expect(new CoursesService(repository as never).create(USER_ID, { name: ' Algorithms ' })).resolves.toBe(course);
        expect(repository.create).toHaveBeenCalledWith(USER_ID, { name: 'Algorithms', code: null, facultyId: null });
    });

    it('rejects invalid create data before repository access', async () => {
        const repository = createRepository();
        expect(() => new CoursesService(repository as never).create(USER_ID, { name: '' } as never)).toThrow();
        expect(repository.create).not.toHaveBeenCalled();
    });

    it('delegates list and lookup operations', async () => {
        const repository = createRepository();
        const service = new CoursesService(repository as never);
        await expect(service.findAll()).resolves.toEqual([course]);
        await expect(service.findById(ID)).resolves.toBe(course);
        await expect(service.findByCode('CS-101')).resolves.toBe(course);
        expect(repository.findAll).toHaveBeenCalledWith();
        expect(repository.findById).toHaveBeenCalledWith(ID);
        expect(repository.findByCode).toHaveBeenCalledWith('CS-101');
    });

    it('validates and delegates partial updates', async () => {
        const repository = createRepository();
        await expect(new CoursesService(repository as never).update(ID, { name: 'Updated', code: null })).resolves.toBe(course);
        expect(repository.update).toHaveBeenCalledWith(ID, { name: 'Updated', code: null });
    });

    it('rejects invalid updates before repository access', async () => {
        const repository = createRepository();
        expect(() => new CoursesService(repository as never).update(ID, { facultyId: 'bad' } as never)).toThrow();
        expect(repository.update).not.toHaveBeenCalled();
    });

    it('delegates delete and propagates repository failures', async () => {
        const repository = createRepository();
        repository.delete.mockRejectedValue(CourseCreationFailed());
        await expect(new CoursesService(repository as never).delete(ID)).rejects.toEqual(CourseCreationFailed());
        expect(repository.delete).toHaveBeenCalledWith(ID);
    });

    it('propagates lookup and update failures', async () => {
        const repository = createRepository();
        const failure = new Error('database unavailable');
        repository.findAll.mockRejectedValue(failure);
        repository.findById.mockRejectedValue(failure);
        repository.findByCode.mockRejectedValue(failure);
        repository.update.mockRejectedValue(failure);
        const service = new CoursesService(repository as never);
        await expect(service.findAll()).rejects.toBe(failure);
        await expect(service.findById(ID)).rejects.toBe(failure);
        await expect(service.findByCode('CS-101')).rejects.toBe(failure);
        await expect(service.update(ID, {})).rejects.toBe(failure);
    });
});
