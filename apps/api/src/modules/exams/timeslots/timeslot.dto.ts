import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, Max, Min } from 'class-validator';
import { EXAM_LOCATIONS, type ExamLocation } from '@/database/schema';

export class CreateTimeslotDto {
    @ApiProperty({ enum: EXAM_LOCATIONS })
    @IsIn(EXAM_LOCATIONS)
    location: ExamLocation;

    @ApiProperty({ format: 'date-time' })
    @IsDateString()
    startsAt: string;

    @ApiProperty({ minimum: 1, maximum: 10000 })
    @IsInt()
    @Min(1)
    @Max(10000)
    capacity: number;
}
export class UpdateTimeslotDto extends PartialType(CreateTimeslotDto) {}

export interface TimeslotResponseDto {
    id: string;
    examId: string;
    location: ExamLocation;
    startsAt: string;
    capacity: number;
    registrationCount: number;
    availableSeats: number;
    isRegistered: boolean;
    createdAt: string;
    updatedAt: string;
}
