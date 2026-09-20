import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAnnouncementDto {
    @ApiPropertyOptional({
        description: 'Short title of the announcement.',
        minLength: 1,
        maxLength: 255,
        nullable: true,
    })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    title?: string | null;

    @ApiProperty({
        description: 'Full announcement text shown to students.',
        minLength: 1,
        maxLength: 1000,
    })
    @IsString()
    @MinLength(1)
    @MaxLength(1000)
    message: string;
}

export class UpdateAnnouncementDto extends PartialType(CreateAnnouncementDto) {}

export class AnnouncementResponseDto {
    @ApiProperty({ description: 'Announcement id.' })
    id: string;

    @ApiProperty({ description: 'Exam id this announcement belongs to.' })
    examId: string;

    @ApiPropertyOptional({
        description: 'Short title of the announcement.',
        nullable: true,
    })
    title: string | null;

    @ApiProperty({ description: 'Full announcement text shown to students.' })
    message: string;

    @ApiProperty({
        description: 'Announcement creation date and time.',
        format: 'date-time',
    })
    createdAt: string;

    @ApiProperty({
        description: 'Announcement last update date and time.',
        format: 'date-time',
    })
    updatedAt: string;
}
