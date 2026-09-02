import { ApiProperty } from '@nestjs/swagger';

/** Standard error response returned by the API. */
export class ErrorDto {
    /** One or more human-readable error messages. */
    @ApiProperty({
        type: [String],
        example: [
            'title must be shorter than or equal to 200 characters',
            'title should not be empty',
            'title must be a string',
        ],
    })
    message: string[];

    /** Short description of the HTTP error. */
    @ApiProperty({ example: 'Bad Request' })
    error: string;

    /** HTTP status code. */
    @ApiProperty({ example: 400 })
    statusCode: number;
}

export { ErrorDto as ErrorResponseDto };
