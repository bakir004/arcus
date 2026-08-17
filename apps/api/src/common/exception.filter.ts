import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ErrorResponseDto } from '@/common/error.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const httpException =
            exception instanceof HttpException
                ? exception
                : this.isDatabaseUnavailable(exception)
                  ? new ServiceUnavailableException('Database is unavailable')
                  : new HttpException('Internal server error', 500);
        const response = host.switchToHttp().getResponse<Response>();
        const statusCode = httpException.getStatus();
        const exceptionResponse = httpException.getResponse();
        const body: Record<string, unknown> =
            typeof exceptionResponse === 'string'
                ? { message: exceptionResponse }
                : typeof exceptionResponse === 'object' &&
                    exceptionResponse !== null
                  ? (exceptionResponse as Record<string, unknown>)
                  : { message: String(exceptionResponse) };
        const message = Array.isArray(body.message)
            ? body.message.map(String)
            : [String(body.message ?? httpException.message)];
        const errorResponse: ErrorResponseDto = {
            message,
            error: String(body.error ?? httpException.name),
            statusCode,
        };
        const request = host.switchToHttp().getRequest<Request>();
        this.logger.error(
            JSON.stringify({
                message: 'HTTP exception',
                error: errorResponse.error,
                statusCode,
                method: request.method,
                path: request.url,
                details: errorResponse.message,
            }),
        );
        response.status(statusCode).json(errorResponse);
    }

    private isDatabaseUnavailable(error: unknown): boolean {
        if (!error || typeof error !== 'object') return false;
        const candidate = error as { code?: string; cause?: unknown };
        return (
            candidate.code === 'ECONNREFUSED' ||
            this.isDatabaseUnavailable(candidate.cause)
        );
    }
}
