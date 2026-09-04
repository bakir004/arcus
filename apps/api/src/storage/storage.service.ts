import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import {
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    StorageDeleteFailed,
    StorageListFailed,
    StorageUploadFailed,
    StorageUrlGenerationFailed,
} from './storage.errors';

const BUCKET = 'arcus';
const URL_EXPIRY_SECONDS = 3600;
const REGION = 'us-east-1';

@Injectable()
export class StorageService {
    private readonly s3: S3Client;
    private readonly s3Public: S3Client;

    constructor(config: ConfigService) {
        const endpoint = config.getOrThrow<string>('MINIO_ENDPOINT');
        const publicEndpoint = config.get<string>('MINIO_PUBLIC_ENDPOINT') ?? endpoint;
        const credentials = {
            accessKeyId: config.getOrThrow<string>('MINIO_ACCESS_KEY'),
            secretAccessKey: config.getOrThrow<string>('MINIO_SECRET_KEY'),
        };

        this.s3 = new S3Client({ endpoint, region: REGION, credentials, forcePathStyle: true });
        this.s3Public = new S3Client({
            endpoint: publicEndpoint,
            region: REGION,
            credentials,
            forcePathStyle: true,
        });
    }

    async upload(
        file: Express.Multer.File,
    ): Promise<{ key: string; fileName: string; mimeType: string; size: number }> {
        const fileName = file.originalname || 'file';
        const suffix = extname(fileName)
            .toLowerCase()
            .replace(/[^a-z0-9.]/g, '');
        const key = `course-materials/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${suffix}`;
        await this.uploadObject(key, file.buffer, file.mimetype);
        return { key, fileName, mimeType: file.mimetype, size: file.size };
    }

    async cleanup(key: string | null | undefined): Promise<void> {
        if (!key) return;
        try {
            await this.deleteObject(key);
        } catch {
            // Cleanup must not hide the original operation failure.
        }
    }

    async uploadObject(key: string, buffer: Buffer, mimeType: string): Promise<string> {
        try {
            await this.s3.send(
                new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: key,
                    Body: buffer,
                    ContentType: mimeType,
                }),
            );
            return key;
        } catch {
            throw StorageUploadFailed();
        }
    }

    async listObjects(prefix: string): Promise<{ key: string; size: number; lastModified: Date }[]> {
        try {
            const response = await this.s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }));
            return (response.Contents ?? []).flatMap((obj) =>
                obj.Key
                    ? [
                          {
                              key: obj.Key,
                              size: obj.Size ?? 0,
                              lastModified: obj.LastModified ?? new Date(),
                          },
                      ]
                    : [],
            );
        } catch {
            throw StorageListFailed();
        }
    }

    async getPresignedUrl(key: string): Promise<string> {
        try {
            return await getSignedUrl(this.s3Public, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
                expiresIn: URL_EXPIRY_SECONDS,
            });
        } catch {
            throw StorageUrlGenerationFailed();
        }
    }

    async deleteObject(key: string): Promise<void> {
        try {
            await this.s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
        } catch {
            throw StorageDeleteFailed();
        }
    }
}
