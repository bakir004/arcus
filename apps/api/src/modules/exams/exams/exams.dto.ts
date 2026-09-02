import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { EXAM_TYPES, EXAM_VISIBILITIES, ExamType, ExamVisibility } from '@/database/schema';

const examVisibilities: string[] = [...EXAM_VISIBILITIES];

/** Payload for creating an exam. */
export class CreateExamDto {
    /** The exam title. */
    @ApiProperty({ description: 'Exam title.', minLength: 1, maxLength: 255 })
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    title: string;

    /** Optional description shown with the exam. */
    @ApiPropertyOptional({
        description: 'Exam description.',
        maxLength: 5000,
        nullable: true,
    })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    description?: string | null;

    /** The type of exam. */
    @ApiProperty({ enum: EXAM_TYPES })
    @IsEnum(EXAM_TYPES)
    type: ExamType;

    /** Duration of the exam, in minutes. */
    @ApiProperty({
        description: 'Exam duration in minutes.',
        minimum: 1,
        maximum: 1440,
    })
    @IsInt()
    @Min(1)
    @Max(1440)
    durationMinutes: number;

    /** Maximum number of attempts allowed for each participant. */
    @ApiProperty({
        description: 'Maximum number of attempts.',
        minimum: 1,
        maximum: 20,
    })
    @IsInt()
    @Min(1)
    @Max(20)
    maxAttempts: number;

    /** Controls who can see the exam. */
    @ApiProperty({
        description: 'Exam visibility state.',
        enum: examVisibilities,
    })
    @IsEnum(examVisibilities)
    visibility: ExamVisibility;
}

/** Payload for updating an exam. All fields are optional. */
export class UpdateExamDto extends PartialType(CreateExamDto) {}

/** Exam returned by the API. */
export class ExamResponseDto {
    /** Unique exam identifier. */
    @ApiProperty({ description: 'Exam id.' })
    id: string;

    /** Identifier of the course this exam belongs to. */
    @ApiProperty({ description: 'Course id this exam belongs to.' })
    courseId: string;

    /** Identifier of the user who created this exam. */
    @ApiProperty({ description: 'User id that created this exam.' })
    createdById: string;

    /** The exam title. */
    @ApiProperty({ description: 'Exam title.' })
    title: string;

    /** Optional description shown with the exam. */
    @ApiPropertyOptional({ description: 'Exam description.', nullable: true })
    description: string | null;

    /** The type of exam. */
    @ApiProperty({ enum: EXAM_TYPES })
    type: ExamType;

    /** Duration of the exam, in minutes. */
    @ApiProperty({ description: 'Exam duration in minutes.' })
    durationMinutes: number;

    /** Maximum number of attempts allowed for each participant. */
    @ApiProperty({ description: 'Maximum number of attempts.' })
    maxAttempts: number;

    /** Controls who can see the exam. */
    @ApiProperty({
        description: 'Exam visibility state.',
        enum: examVisibilities,
    })
    visibility: ExamVisibility;

    /** ISO 8601 timestamp when the exam was created. */
    @ApiProperty({
        description: 'Exam creation date and time.',
        format: 'date-time',
    })
    createdAt: string;

    /** ISO 8601 timestamp when the exam was last updated. */
    @ApiProperty({
        description: 'Exam last update date and time.',
        format: 'date-time',
    })
    updatedAt: string;
}
