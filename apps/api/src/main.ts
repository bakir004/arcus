import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { VersioningType } from '@nestjs/common/enums/version-type.enum';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import 'dotenv/config';
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
    const useJsonLogs =
        config.get<string>('LOG_FORMAT') === 'json' ||
        (config.get<string>('NODE_ENV') ?? 'development') === 'production';
    const logger = new ConsoleLogger({
        json: useJsonLogs,
        colors: !useJsonLogs,
    });
    const app = await NestFactory.create(AppModule, { logger });

    app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.enableCors({ origin: corsOrigins, credentials: true });
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: apiVersion,
    });
    app.setGlobalPrefix(apiPrefix);

    await setupSwagger(app);
    await app.listen(port);
    logger.log(`API running at http://localhost:${port}`, 'Bootstrap');
    logger.log(
        `API reference at http://localhost:${port}/reference`,
        'Bootstrap',
    );
}

bootstrap();
