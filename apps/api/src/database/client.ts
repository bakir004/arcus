import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';

const config = new ConfigService();
const connectionString = config.getOrThrow<string>('DATABASE_URL');

export const sql = postgres(connectionString, { max: 10 });
export const db = drizzle(sql, { schema });

export type Database = typeof db;
