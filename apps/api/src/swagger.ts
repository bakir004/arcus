import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

export async function setupSwagger(app: INestApplication): Promise<void> {
    const configService = new ConfigService();
    const port = configService.get<string>('PORT') ?? '3000';
    const apiUrl =
        configService.get<string>('API_URL') ?? `http://localhost:${port}`;

    const config = new DocumentBuilder()
        .setTitle('Arcus API')
        .setDescription('REST API for the Arcus faculty management system.')
        .setVersion('1.0')
        .addServer(apiUrl)
        .build();

    const document = SwaggerModule.createDocument(app, config);
    // const betterAuthDocument = await auth.api.generateOpenAPISchema();
    // const betterAuthPaths = Object.fromEntries(
    //     Object.entries(betterAuthDocument.paths).map(([path, pathItem]) => [
    //         `/api/v1/auth${path}`,
    //         pathItem,
    //     ]),
    // );
    // tagBetterAuthPathsAsAuth(betterAuthPaths);
    //
    // Object.assign(document.paths, betterAuthPaths);

    // document.tags = [
    //     ...(document.tags ?? []).filter((tag) => tag.name !== 'Default'),
    //     { name: BETTER_AUTH_TAG, description: 'Better Auth endpoints' },
    // ];

    SwaggerModule.setup('api', app, document);

    app.use(
        '/reference',
        apiReference({
            content: document,
        }),
    );
}
