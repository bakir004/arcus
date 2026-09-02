import { BadRequestException } from '@nestjs/common';
import { ZodError } from 'zod';

export function mapZodErrorToBadRequest(error: unknown): BadRequestException {
    if (!(error instanceof ZodError)) {
        return new BadRequestException('Validation failed');
    }

    const messages = error.issues.map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
        const message = `${path}${issue.message}`;
        return `${message.charAt(0).toUpperCase()}${message.slice(1)}`;
    });

    return new BadRequestException(messages.length > 0 ? messages : ['Validation failed']);
}
