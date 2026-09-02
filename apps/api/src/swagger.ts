import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { auth } from '@/auth';

const BETTER_AUTH_TAG = 'Auth';

function tagBetterAuthPaths(paths: Record<string, unknown>) {
    for (const pathItem of Object.values(paths)) {
        if (!pathItem || typeof pathItem !== 'object') continue;

        for (const operation of Object.values(pathItem)) {
            if (!operation || typeof operation !== 'object') continue;
            if (!('tags' in operation)) continue;

            const taggedOperation = operation as { tags?: string[] };
            taggedOperation.tags = taggedOperation.tags?.map((tag) => (tag === 'Default' ? BETTER_AUTH_TAG : tag));
        }
    }
}

export async function setupSwagger(app: INestApplication): Promise<void> {
    const configService = new ConfigService();
    const port = configService.get<string>('PORT') ?? '3000';
    const apiUrl = configService.get<string>('API_URL') ?? `http://localhost:${port}`;
    const apiPrefix = configService.getOrThrow<string>('API_PREFIX');
    const apiVersion = configService.getOrThrow<string>('API_VERSION');
    const authBasePath = `/${apiPrefix}/v${apiVersion}/auth`;

    const config = new DocumentBuilder()
        .setTitle('Arcus API')
        .setDescription('REST API for the Arcus faculty management system.')
        .setVersion('1.0')
        .addServer(apiUrl)
        .build();

    const document = SwaggerModule.createDocument(app, config);
    const betterAuthDocument = await auth.api.generateOpenAPISchema();
    const betterAuthPaths = Object.fromEntries(
        Object.entries(betterAuthDocument.paths).map(([path, pathItem]) => [`${authBasePath}${path}`, pathItem]),
    );

    tagBetterAuthPaths(betterAuthPaths);
    Object.assign(document.paths, betterAuthPaths);
    document.tags = [...(document.tags ?? []).filter((tag) => tag.name !== 'Default'), { name: BETTER_AUTH_TAG }];

    SwaggerModule.setup('api', app, document);
    app.use('/reference', apiReference({ content: document }));
}
