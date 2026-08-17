import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'postgresql',
    schema: './src/database/schema.ts',
    out: './drizzle',
    dbCredentials: {
        url: new ConfigService().getOrThrow<string>('DATABASE_URL'),
    },
});
