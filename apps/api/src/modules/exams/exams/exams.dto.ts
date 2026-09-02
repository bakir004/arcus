import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { EXAM_TYPES, EXAM_VISIBILITIES, ExamType, ExamVisibility } from '@/database/schema';

const examVisibilities: string[] = [...EXAM_VISIBILITIES];

export class CreateExamDto {
    @ApiProperty({ description: 'Exam title.', minLength: 1, maxLength: 255 })
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    title: string;

    @ApiPropertyOptional({
        description: 'Exam description.',
        maxLength: 5000,
        nullable: true,
    })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    description?: string | null;

    @ApiProperty({ enum: EXAM_TYPES })
    @IsEnum(EXAM_TYPES)
    type: ExamType;

    @ApiProperty({
        description: 'Exam duration in minutes.',
        minimum: 1,
        maximum: 1440,
    })
    @IsInt()
    @Min(1)
    @Max(1440)
    durationMinutes: number;

    @ApiProperty({
        description: 'Maximum number of attempts.',
        minimum: 1,
        maximum: 20,
    })
    @IsInt()
    @Min(1)
    @Max(20)
    maxAttempts: number;

    @ApiProperty({
        description: 'Exam visibility state.',
        enum: examVisibilities,
    })
    @IsEnum(examVisibilities)
    visibility: ExamVisibility;
}

export class UpdateExamDto extends PartialType(CreateExamDto) {}

export class ExamResponseDto {
    @ApiProperty({ description: 'Exam id.' })
    id: string;

    @ApiProperty({ description: 'Course id this exam belongs to.' })
    courseId: string;

    @ApiProperty({ description: 'User id that created this exam.' })
    createdById: string;

    @ApiProperty({ description: 'Exam title.' })
    title: string;

    @ApiPropertyOptional({ description: 'Exam description.', nullable: true })
    description: string | null;

    @ApiProperty({ enum: EXAM_TYPES })
    type: ExamType;

    @ApiProperty({ description: 'Exam duration in minutes.' })
    durationMinutes: number;

    @ApiProperty({ description: 'Maximum number of attempts.' })
    maxAttempts: number;

    @ApiProperty({
        description: 'Exam visibility state.',
        enum: examVisibilities,
    })
    visibility: ExamVisibility;

    @ApiProperty({
        description: 'Exam creation date and time.',
        format: 'date-time',
    })
    createdAt: string;

    @ApiProperty({
        description: 'Exam last update date and time.',
        format: 'date-time',
    })
    updatedAt: string;
}
