import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { InternalServerErrorException } from '@nestjs/common';
import { StorageService } from '@/storage/storage.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: jest.fn(),
}));

type MockS3 = { send: jest.Mock };

function createService() {
    const config = {
        getOrThrow: jest.fn((key: string) => {
            const values: Record<string, string> = {
                MINIO_ENDPOINT: 'http://localhost:9000',
                MINIO_ACCESS_KEY: 'access-key',
                MINIO_SECRET_KEY: 'secret-key',
            };
            return values[key];
        }),
        get: jest.fn((key: string) => (key === 'MINIO_PUBLIC_ENDPOINT' ? 'http://public:9000' : undefined)),
    };
    const service = new StorageService(config as never);
    const s3: MockS3 = { send: jest.fn() };
    const s3Public: MockS3 = { send: jest.fn() };
    (service as unknown as { s3: MockS3; s3Public: MockS3 }).s3 = s3;
    (service as unknown as { s3: MockS3; s3Public: MockS3 }).s3Public = s3Public;
    return { service, s3, s3Public };
}

describe('StorageService', () => {
    beforeEach(() => jest.clearAllMocks());

    it('uploads an object with its key and MIME type', async () => {
        const { service, s3 } = createService();

        await expect(
            service.uploadObject('courses/course-1/file.pdf', Buffer.from('file'), 'application/pdf'),
        ).resolves.toBe('courses/course-1/file.pdf');

        const command = s3.send.mock.calls[0][0];
        expect(command).toBeInstanceOf(PutObjectCommand);
        expect(command.input).toMatchObject({
            Bucket: 'arcus',
            Key: 'courses/course-1/file.pdf',
            Body: Buffer.from('file'),
            ContentType: 'application/pdf',
        });
    });

    it('lists objects by prefix and ignores entries without keys', async () => {
        const { service, s3 } = createService();
        s3.send.mockResolvedValue({
            Contents: [{ Key: 'courses/course-1/a.pdf', Size: 12, LastModified: new Date('2026-01-01') }, { Size: 99 }],
        });

        await expect(service.listObjects('courses/course-1/')).resolves.toEqual([
            {
                key: 'courses/course-1/a.pdf',
                size: 12,
                lastModified: new Date('2026-01-01'),
            },
        ]);

        const command = s3.send.mock.calls[0][0];
        expect(command).toBeInstanceOf(ListObjectsV2Command);
        expect(command.input).toMatchObject({ Bucket: 'arcus', Prefix: 'courses/course-1/' });
    });

    it('generates a presigned URL using the public client', async () => {
        const { service, s3Public } = createService();
        (getSignedUrl as jest.Mock).mockResolvedValue('https://public/file.pdf');

        await expect(service.getPresignedUrl('courses/course-1/file.pdf')).resolves.toBe('https://public/file.pdf');
        expect(getSignedUrl).toHaveBeenCalledWith(
            s3Public,
            expect.objectContaining({ input: { Bucket: 'arcus', Key: 'courses/course-1/file.pdf' } }),
            { expiresIn: 3600 },
        );
    });

    it('deletes an object', async () => {
        const { service, s3 } = createService();

        await expect(service.deleteObject('courses/course-1/file.pdf')).resolves.toBeUndefined();

        const command = s3.send.mock.calls[0][0];
        expect(command).toBeInstanceOf(DeleteObjectCommand);
        expect(command.input).toMatchObject({ Bucket: 'arcus', Key: 'courses/course-1/file.pdf' });
    });

    it.each([
        ['upload', (service: StorageService) => service.uploadObject('key', Buffer.from('file'), 'text/plain')],
        ['list', (service: StorageService) => service.listObjects('prefix')],
        ['delete', (service: StorageService) => service.deleteObject('key')],
    ])('converts %s failures to storage errors', async (_operation, operation) => {
        const { service, s3 } = createService();
        s3.send.mockRejectedValue(new Error('storage failed'));

        await expect(operation(service)).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('converts presigned URL failures to a storage error', async () => {
        const { service } = createService();
        (getSignedUrl as jest.Mock).mockRejectedValue(new Error('signing failed'));

        await expect(service.getPresignedUrl('key')).rejects.toBeInstanceOf(InternalServerErrorException);
    });
});
