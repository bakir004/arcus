import { Logger, ValidationPipe } from '@nestjs/common';
import { VersioningType } from '@nestjs/common/enums/version-type.enum';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import path from 'node:path';
import dotenv from 'dotenv';
import type { Request, Response } from 'express';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { AppModule } from '@/app.module';
import { HttpExceptionFilter } from '@/common/exception.filter';
import { setupSwagger } from '@/swagger';

async function bootstrap() {
    const config = new ConfigService();
    const port = Number(config.get<string>('PORT') ?? 3000);
    const apiVersion = config.getOrThrow<string>('API_VERSION');
    const apiPrefix = config.getOrThrow<string>('API_PREFIX');
    const corsOrigins = config
        .getOrThrow<string>('CORS_ORIGINS')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    const app = await NestFactory.create(AppModule, {
        bodyParser: false,
    });

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.getHttpAdapter().get('/favicon.ico', (_request: Request, response: Response) => {
        response.status(204).end();
    });
    app.enableCors({ origin: corsOrigins, credentials: true });
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: apiVersion,
    });
    app.setGlobalPrefix(apiPrefix);

    await setupSwagger(app);
    await app.listen(port);
    Logger.log(`API running at http://localhost:${port}`, 'Bootstrap');
    Logger.log(`API reference at http://localhost:${port}/reference`, 'Bootstrap');
}

bootstrap();
