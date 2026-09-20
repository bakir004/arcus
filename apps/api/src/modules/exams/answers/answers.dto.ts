import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';
import { getAllAnswerRepositories } from '@/modules/exams/answers/answers.repository.registry';

const answerApiProperty = { oneOf: getAllAnswerRepositories().map((repository) => repository.answerApiSchema) };

export class SaveAnswerDto {
    @ApiProperty({ ...answerApiProperty }) @IsObject() answer: object;
}

class BulkSaveAnswerItemDto {
    @ApiProperty({ format: 'uuid', description: 'Gradeable exam item id.' }) @IsUUID() examItemId: string;
    @ApiProperty({ ...answerApiProperty }) @IsObject() answer: object;
}

export class BulkSaveAnswersDto {
    @ApiProperty({ type: [BulkSaveAnswerItemDto] })
    @IsArray()
    @ArrayMaxSize(200)
    @ValidateNested({ each: true })
    @Type(() => BulkSaveAnswerItemDto)
    answers: BulkSaveAnswerItemDto[];
}

export class GradeAnswerDto {
    @ApiProperty({ minimum: 0, maximum: 100 }) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) score: number;
    @ApiPropertyOptional({ maxLength: 5000 }) @IsOptional() @IsString() @MaxLength(5000) feedback?: string;
}

export class GradeResponseDto {
    @ApiProperty({ format: 'uuid' }) id: string;
    @ApiProperty({ format: 'uuid' }) attemptId: string;
    @ApiProperty({ format: 'uuid' }) examItemId: string;
    @ApiPropertyOptional({ nullable: true }) pointsAwarded: string | null;
    @ApiProperty() status: string;
    @ApiPropertyOptional({ nullable: true }) feedback: string | null;
    @ApiPropertyOptional({ nullable: true }) gradedById: string | null;
    @ApiPropertyOptional({ nullable: true, format: 'date-time' }) gradedAt: string | null;
}

export class AnswerResponseDto {
    @ApiProperty({ format: 'uuid' }) id: string;
    @ApiProperty({ format: 'uuid' }) attemptId: string;
    @ApiProperty({ format: 'uuid' }) examItemId: string;
    @ApiProperty() type: string;
    @ApiProperty({ ...answerApiProperty }) answer: object;
    @ApiPropertyOptional({ nullable: true }) score: string | null;
    @ApiPropertyOptional({ nullable: true }) feedback: string | null;
    @ApiPropertyOptional({ nullable: true, format: 'date-time' }) gradedAt: string | null;
    @ApiPropertyOptional({ nullable: true }) gradedBy: string | null;
    @ApiProperty({ format: 'date-time' }) createdAt: string;
    @ApiProperty({ format: 'date-time' }) updatedAt: string;
}
