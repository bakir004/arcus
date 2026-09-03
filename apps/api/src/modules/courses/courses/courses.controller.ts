import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Res,
    UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { OptionalAuth, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { auth } from '@/auth';
import { AuthzService } from '@/authz/authz.service';
import { Permissions } from '@/authz/permissions';
import { PermissionsGuard } from '@/authz/permissions.guard';
import { RequirePermission } from '@/authz/require-permission.decorator';
import { ErrorDto } from '@/common/error.dto';
import { MeResponseDto } from '@/common/me.controller';
import { CreateCourseDto, CourseResponseDto, UpdateCourseDto } from '@/modules/courses/courses/courses.dto';
import type { Course } from '@/modules/courses/courses/courses.entity';
import { CoursesService } from '@/modules/courses/courses/courses.service';

@ApiTags('Courses')
@Controller({ path: 'courses', version: '1' })
export class CoursesController {
    constructor(
        private readonly coursesService: CoursesService,
        private readonly authzService: AuthzService,
    ) {}

    private toResponse(value: Course): CourseResponseDto {
        return {
            ...value,
            createdAt: value.createdAt.toISOString(),
            updatedAt: value.updatedAt.toISOString(),
        };
    }

    @ApiOperation({ summary: 'Create a course' })
    @ApiCreatedResponse({ type: CourseResponseDto })
    @ApiBadRequestResponse({ type: ErrorDto })
    @ApiUnauthorizedResponse({ type: ErrorDto })
    @Post()
    async create(
        @Session() session: UserSession<typeof auth>,
        @Body() dto: CreateCourseDto,
    ): Promise<CourseResponseDto> {
        const course = await this.coursesService.create(session.user.id, dto);
        return this.toResponse(course);
    }

    @ApiOperation({ summary: 'List all courses' })
    @ApiOkResponse({ type: [CourseResponseDto] })
    @Get()
    async findAll(): Promise<CourseResponseDto[]> {
        const courses = await this.coursesService.findAll();
        return courses.map((course) => this.toResponse(course));
    }

    @ApiOperation({ summary: 'Get current user course membership, roles, and permissions' })
    @ApiOkResponse({ description: 'Current user course context or null.', type: MeResponseDto })
    @Get(':id/me')
    @OptionalAuth()
    async findMe(
        @Param('id', ParseUUIDPipe) id: string,
        @Session() session: UserSession<typeof auth> | null,
        @Res() response: Response,
    ): Promise<void> {
        if (!session) {
            response.status(200).json(null);
            return;
        }

        // Check that the course exists so an invalid course id is not indistinguishable
        // from a valid course for which the user has no membership.
        await this.coursesService.findById(id);
        const context = await this.authzService.getCourseAuthzContext(session.user.id, id);

        response.status(200).json({
            user: {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
            },
            session: session.session,
            roles: context.roles,
            permissions: context.permissions,
        });
    }

    @ApiOperation({ summary: 'Get a course by code' })
    @ApiOkResponse({ type: CourseResponseDto })
    @ApiNotFoundResponse({ type: ErrorDto })
    @Get('code/:code')
    async findByCode(@Param('code') code: string): Promise<CourseResponseDto> {
        const course = await this.coursesService.findByCode(code);
        return this.toResponse(course);
    }

    @ApiOperation({ summary: 'Get a course by id' })
    @ApiOkResponse({ type: CourseResponseDto })
    @ApiBadRequestResponse({ type: ErrorDto })
    @ApiNotFoundResponse({ type: ErrorDto })
    @Get(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'id', permissions: [Permissions.CourseRead] })
    async findById(@Param('id', ParseUUIDPipe) id: string): Promise<CourseResponseDto> {
        const course = await this.coursesService.findById(id);
        return this.toResponse(course);
    }

    @ApiOperation({ summary: 'Update a course' })
    @ApiOkResponse({ type: CourseResponseDto })
    @ApiBadRequestResponse({ type: ErrorDto })
    @ApiNotFoundResponse({ type: ErrorDto })
    @Patch(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'id', permissions: [Permissions.CourseManage] })
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCourseDto): Promise<CourseResponseDto> {
        const course = await this.coursesService.update(id, dto);
        return this.toResponse(course);
    }

    @ApiOperation({ summary: 'Delete a course' })
    @ApiNoContentResponse()
    @ApiBadRequestResponse({ type: ErrorDto })
    @ApiNotFoundResponse({ type: ErrorDto })
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'id', permissions: [Permissions.CourseManage] })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.coursesService.delete(id);
    }
}
