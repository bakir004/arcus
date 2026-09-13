import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CreateBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { db } from '@/database/client';
import { courseGroups, courseMaterials } from '@/database/schemas/course-materials.schema';
import { eq } from 'drizzle-orm';

const aspCourseId = '00000000-0000-4000-8000-000000000003';
const assignmentsDir = path.resolve(__dirname, '../assets/assignments');
const bucket = 'arcus';

const groups = [
    {
        id: '00000000-0000-4000-8000-000000001001',
        name: 'Lectures and notes',
        description: 'Lecture notes and reference material.',
    },
    {
        id: '00000000-0000-4000-8000-000000001002',
        name: 'Laboratory exercises',
        description: 'Exercises and starter projects for the laboratory sessions.',
    },
    {
        id: '00000000-0000-4000-8000-000000001003',
        name: 'Practice and assessment',
        description: 'Additional practice material and previous assessments.',
    },
] as const;

const files = [
    ['predavanje 1.pdf', 'Lecture 1: Introduction to algorithms', groups[0].id],
    ['ARM vjezba 22025.pdf', 'ARM architecture notes', groups[0].id],
    ['README.md', 'Laboratory repository README', groups[0].id],
    ['Application.cpp', 'C++ application example', groups[1].id],
    ['main.c', 'C starter example', groups[1].id],
    ['python.py', 'Python algorithm examples', groups[1].id],
    ['test.sql', 'SQL test data', groups[1].id],
    ['graph.png', 'Graph data structure diagram', groups[1].id],
    ['Vježba 2 - Zadatak 2 - Upute.html', 'Exercise 2 instructions', groups[1].id],
    ['UUP_AE12a_LV13.zip', 'Practice project starter files', groups[1].id],
    ['Dodatak vježbi 5 (1).txt', 'Additional exercise notes', groups[2].id],
    ['zavrsni_juni_v1.pdf', 'Previous final exam', groups[2].id],
    ['video 1.mp4', 'Algorithm walkthrough video', groups[2].id],
] as const;

const nonFileMaterials = [
    {
        id: '00000000-0000-4000-8000-000000003001',
        courseGroupId: groups[0].id,
        position: 3,
        kind: 'TEXT' as const,
        textContent:
            '## Algorithm design checklist\n\nStart by defining the input and output, then choose a data structure and estimate the complexity of the solution.',
        title: null,
        description: null,
        externalUrl: null,
    },
    {
        id: '00000000-0000-4000-8000-000000003002',
        courseGroupId: groups[0].id,
        position: 4,
        kind: 'LINK' as const,
        textContent: null,
        title: 'VisuAlgo algorithm visualizations',
        description: 'Interactive visualizations for sorting, graphs, and data structures.',
        externalUrl: 'https://visualgo.net/en',
    },
    {
        id: '00000000-0000-4000-8000-000000003003',
        courseGroupId: groups[2].id,
        position: 3,
        kind: 'TEXT' as const,
        textContent:
            'Use the previous exam as practice: write down the expected complexity before implementing each solution.',
        title: null,
        description: null,
        externalUrl: null,
    },
] as const;

function mimeType(fileName: string) {
    const extension = path.extname(fileName).toLowerCase();
    return (
        {
            '.pdf': 'application/pdf',
            '.md': 'text/markdown',
            '.txt': 'text/plain',
            '.html': 'text/html',
            '.cpp': 'text/x-c++src',
            '.c': 'text/x-c',
            '.py': 'text/x-python',
            '.sql': 'application/sql',
            '.png': 'image/png',
            '.zip': 'application/zip',
            '.mp4': 'video/mp4',
        }[extension] ?? 'application/octet-stream'
    );
}

async function uploadSeedFile(client: S3Client, fileName: string, index: number) {
    const body = await readFile(path.join(assignmentsDir, fileName));
    const key = `course-materials/seed/asp/${String(index + 1).padStart(2, '0')}-${fileName}`;
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: mimeType(fileName) }));
    return { key, size: body.byteLength };
}

export async function seedAspMaterials(uploadedById: string) {
    const endpoint = process.env.MINIO_ENDPOINT;
    const accessKeyId = process.env.MINIO_ACCESS_KEY;
    const secretAccessKey = process.env.MINIO_SECRET_KEY;
    if (!endpoint || !accessKeyId || !secretAccessKey)
        throw new Error('MinIO configuration is required to seed course materials');

    const storage = new S3Client({
        endpoint,
        region: 'us-east-1',
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
    });

    await storage.send(new CreateBucketCommand({ Bucket: bucket })).catch((error: { Code?: string }) => {
        if (error.Code !== 'BucketAlreadyOwnedByYou' && error.Code !== 'BucketAlreadyExists') throw error;
    });

    await db.transaction(async (transaction) => {
        // Replace the ASP fixture so this remains safe when older seed data used different IDs.
        await transaction.delete(courseGroups).where(eq(courseGroups.courseId, aspCourseId));

        for (const [position, group] of groups.entries()) {
            await transaction.insert(courseGroups).values({ ...group, courseId: aspCourseId, position });
        }

        const groupPositions = new Map<string, number>();
        for (const [position, [fileName, title, courseGroupId]] of files.entries()) {
            const materialPosition = groupPositions.get(courseGroupId) ?? 0;
            groupPositions.set(courseGroupId, materialPosition + 1);
            const uploaded = await uploadSeedFile(storage, fileName, position);
            await transaction
                .insert(courseMaterials)
                .values({
                    id: `00000000-0000-4000-8000-${String(2001 + position).padStart(12, '0')}`,
                    uploadedById,
                    courseGroupId,
                    position: materialPosition,
                    kind: 'FILE',
                    title,
                    description: `Seed material: ${fileName}`,
                    fileKey: uploaded.key,
                    fileName,
                    fileMimeType: mimeType(fileName),
                    fileSize: uploaded.size,
                })
                .onConflictDoUpdate({
                    target: courseMaterials.id,
                    set: {
                        courseGroupId,
                        position: materialPosition,
                        title,
                        description: `Seed material: ${fileName}`,
                        fileKey: uploaded.key,
                        fileName,
                        fileMimeType: mimeType(fileName),
                        fileSize: uploaded.size,
                        updatedAt: new Date(),
                    },
                });
        }

        for (const material of nonFileMaterials) {
            await transaction
                .insert(courseMaterials)
                .values({ ...material, uploadedById })
                .onConflictDoUpdate({
                    target: courseMaterials.id,
                    set: {
                        courseGroupId: material.courseGroupId,
                        position: material.position,
                        kind: material.kind,
                        textContent: material.textContent,
                        title: material.title,
                        description: material.description,
                        externalUrl: material.externalUrl,
                        fileKey: null,
                        fileName: null,
                        fileMimeType: null,
                        fileSize: null,
                        updatedAt: new Date(),
                    },
                });
        }
    });

    console.log(`Seeded ${files.length} ASP file materials and ${nonFileMaterials.length} text/link materials`);
}
