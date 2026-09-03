import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { promisify } from 'node:util';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/database/schemas';

const execFileAsync = promisify(execFile);

async function applySchema(databaseUrl: string): Promise<void> {
    const schemaPath = path.resolve(__dirname, '../../src/database/schema.ts');
    const apiRoot = path.resolve(__dirname, '../..');

    try {
        await execFileAsync(
            'bun',
            [
                'x',
                'drizzle-kit',
                'push',
                '--schema',
                schemaPath,
                '--url',
                databaseUrl,
                '--dialect',
                'postgresql',
                '--force',
            ],
            {
                cwd: apiRoot,
                env: process.env,
                maxBuffer: 10 * 1024 * 1024,
            },
        );
    } catch (error) {
        const details = error as { stderr?: string; stdout?: string; message?: string };
        throw new Error(
            `Failed to apply Drizzle schema: ${details.stderr || details.stdout || details.message || String(error)}`,
        );
    }
}

/** Creates a disposable PostgreSQL database dedicated to one integration suite. */
export async function openExamTestDatabase() {
    const configuredUrl = process.env.TEST_DATABASE_URL ?? 'postgres://arcus:arcus@localhost:5432/arcus_test';
    if (configuredUrl === process.env.DATABASE_URL) {
        throw new Error('TEST_DATABASE_URL must not equal DATABASE_URL');
    }

    const databaseName = `arcus_exam_test_${randomUUID().replaceAll('-', '')}`;
    const adminUrl = new URL(configuredUrl);
    adminUrl.pathname = '/postgres';
    const admin = postgres(adminUrl.toString(), { max: 1 });
    let databaseCreated = false;
    let sql: ReturnType<typeof postgres> | undefined;

    try {
        await admin.unsafe(`CREATE DATABASE "${databaseName}"`);
        databaseCreated = true;

        const databaseUrl = new URL(configuredUrl);
        databaseUrl.pathname = `/${databaseName}`;
        sql = postgres(databaseUrl.toString(), { max: 1 });
        const connection = sql;
        const database = drizzle(connection, { schema });

        await applySchema(databaseUrl.toString());

        return {
            sql: connection,
            database,
            async close() {
                await connection.end();
                await admin.unsafe(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
                await admin.end();
            },
        };
    } catch (error) {
        await sql?.end();
        if (databaseCreated) await admin.unsafe(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
        await admin.end();
        throw error;
    }
}
