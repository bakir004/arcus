import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateExamItemDto {
    @IsInt() @Min(1) position: number;
    @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) maxPoints: number;
    @IsOptional() @IsString() @MaxLength(64) label?: string | null;
    @IsOptional() @IsString() @MinLength(1) @MaxLength(4000) prompt?: string;
}

export class UpdateExamItemDto {
    @IsOptional() @IsInt() @Min(1) position?: number;
    @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) maxPoints?: number;
    @IsOptional() @IsString() @MaxLength(64) label?: string | null;
    @IsOptional() @IsString() @MinLength(1) @MaxLength(4000) prompt?: string | null;
}
