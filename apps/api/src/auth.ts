import { ConfigService } from '@nestjs/config';
import { betterAuth, isProduction } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI } from 'better-auth/plugins';
import { db } from '@/database/client';
import * as authSchema from '@/database/schemas/auth.schema';

const config = new ConfigService();
const apiVersion = config.getOrThrow<string>('API_VERSION');
const apiPrefix = config.getOrThrow<string>('API_PREFIX');
const trustedOrigins = config
    .getOrThrow<string>('CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const auth = betterAuth({
    basePath: `/${apiPrefix}/v${apiVersion}/auth`,
    baseURL: config.getOrThrow<string>('BETTER_AUTH_URL'),
    secret: config.getOrThrow<string>('BETTER_AUTH_SECRET'),
    trustedOrigins,
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: authSchema,
    }),
    advanced: {
        trustedProxyHeaders: true,
        defaultCookieAttributes: {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: isProduction,
        },
    },
    emailAndPassword: {
        enabled: true,
    },
    session: {
        expiresIn: 60 * 60 * 24,
    },
    socialProviders: {
        google: {
            clientId: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
            clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
        },
    },
    plugins: [
        openAPI({
            disableDefaultReference: true,
        }),
    ],
});
