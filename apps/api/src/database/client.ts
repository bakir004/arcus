import path from 'node:path';
import dotenv from 'dotenv';

// Resolve the API environment relative to this module so root-launched commands work.
dotenv.config({
    path: [
        path.resolve(__dirname, '../../.env'),
        path.resolve(process.cwd(), 'apps/api/.env'),
        path.resolve(process.cwd(), '.env'),
    ],
    quiet: process.env.NODE_ENV === 'test',
});
import { ConfigService } from '@nestjs/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schemas';

const config = new ConfigService({
    DATABASE_URL: process.env.DATABASE_URL,
});
const connectionString = config.getOrThrow<string>('DATABASE_URL');

export const sql = postgres(connectionString, { max: 10 });
export const db = drizzle(sql, { schema });

export type Database = typeof db;
