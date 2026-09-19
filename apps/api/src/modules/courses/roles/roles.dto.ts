import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCourseRoleDto {
    @ApiProperty({ example: 'Teaching Assistant' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(128)
    name: string;

    @ApiProperty({ type: [String], example: ['course:material:read'] })
    @IsArray()
    @IsString({ each: true })
    permissions: string[];
}

export class UpdateCourseRoleDto {
    @ApiProperty({ required: false, example: 'Teaching Assistant' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(128)
    name?: string;

    @ApiProperty({ type: [String], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    permissions?: string[];
}

export class AssignCourseMemberRoleDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    roleId: string;
}

export class CourseRolePermissionDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ type: [String] })
    permissions: string[];
}

export class CourseMemberRoleDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    @ApiProperty({ format: 'uuid' })
    userId: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    email: string;

    @ApiProperty({ nullable: true })
    image: string | null;

    @ApiProperty({ type: [CourseRolePermissionDto] })
    roles: Array<{ id: string; name: string }>;
}
