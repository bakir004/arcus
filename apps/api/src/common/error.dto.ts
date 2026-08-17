import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
    @ApiProperty({
        type: [String],
        example: [
            'title must be shorter than or equal to 200 characters',
            'title should not be empty',
            'title must be a string',
        ],
    })
    message: string[];

    @ApiProperty({ example: 'Bad Request' })
    error: string;

    @ApiProperty({ example: 400 })
    statusCode: number;
}
