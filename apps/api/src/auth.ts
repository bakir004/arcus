import { ConfigService } from '@nestjs/config';
import { betterAuth, isProduction } from 'better-auth';
import { openAPI } from 'better-auth/plugins';

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
    plugins: [
        openAPI({
            disableDefaultReference: true,
        }),
    ],
});
