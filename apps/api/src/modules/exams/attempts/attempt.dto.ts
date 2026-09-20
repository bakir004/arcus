import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ATTEMPT_STATUSES, AttemptStatus } from '@/database/schema';

const attemptStatuses: string[] = [...ATTEMPT_STATUSES];

export class CreateAttemptDto {}

export class UpdateAttemptDto extends PartialType(CreateAttemptDto) {
    @ApiPropertyOptional({
        description: 'Updated lifecycle status of the attempt.',
        enum: attemptStatuses,
    })
    @IsOptional()
    @IsEnum(attemptStatuses)
    status?: AttemptStatus;

    @ApiPropertyOptional({
        description: 'Updated score awarded to the attempt.',
        minimum: 0,
        maximum: 100,
        nullable: true,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    score?: number | null;

    @ApiPropertyOptional({
        description: 'Submission date and time (ISO string), or null to unset.',
        format: 'date-time',
        nullable: true,
    })
    @IsOptional()
    @IsDateString()
    submittedAt?: string | null;
}

export class AttemptResponseDto {
    @ApiProperty({ description: 'Attempt id.' })
    id: string;

    @ApiProperty({ description: 'Exam id this attempt belongs to.' })
    examId: string;

    @ApiProperty({
        description: 'Identifier of the student who started this attempt.',
    })
    studentId: string;

    @ApiProperty({ description: 'User who created the participation record.' })
    createdById: string;

    @ApiProperty({
        description: 'Attempt lifecycle status.',
        enum: attemptStatuses,
    })
    status: AttemptStatus;

    @ApiPropertyOptional({
        description: 'Score awarded to this attempt.',
        nullable: true,
    })
    score: string | null;

    @ApiPropertyOptional({ description: 'Attempt start date and time.', format: 'date-time', nullable: true })
    startedAt: string | null;

    @ApiPropertyOptional({
        description: 'Attempt submission date and time.',
        format: 'date-time',
        nullable: true,
    })
    submittedAt: string | null;

    @ApiPropertyOptional({ description: 'Attempt grading date and time.', format: 'date-time', nullable: true })
    gradedAt: string | null;
}
