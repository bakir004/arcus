import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Payload for creating a course. */
export class CreateCourseDto {
    /** The course name. */
    @ApiProperty({ description: 'Course name.', minLength: 1, maxLength: 255 })
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    name: string;

    /** Optional course code. */
    @ApiPropertyOptional({ description: 'Course code.', maxLength: 64, nullable: true })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(64)
    code?: string | null;

    /** Optional faculty this course belongs to. */
    @ApiPropertyOptional({ description: 'Faculty id this course belongs to.', format: 'uuid', nullable: true })
    @IsOptional()
    @IsUUID()
    facultyId?: string | null;
}

/** Payload for updating a course. All fields are optional. */
export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

/** Course returned by the API. */
export class CourseResponseDto {
    /** Unique course identifier. */
    @ApiProperty({ description: 'Course id.' })
    id: string;

    /** The course name. */
    @ApiProperty({ description: 'Course name.' })
    name: string;

    /** Optional course code. */
    @ApiPropertyOptional({ description: 'Course code.', nullable: true })
    code: string | null;

    /** Faculty this course belongs to. */
    @ApiPropertyOptional({ description: 'Faculty id this course belongs to.', nullable: true })
    facultyId: string | null;

    /** Identifier of the user who created this course. */
    @ApiProperty({ description: 'User id that created this course.' })
    createdById: string;

    /** ISO 8601 timestamp when the course was created. */
    @ApiProperty({ description: 'Course creation date and time.', format: 'date-time' })
    createdAt: string;

    /** ISO 8601 timestamp when the course was last updated. */
    @ApiProperty({ description: 'Course last update date and time.', format: 'date-time' })
    updatedAt: string;
}
