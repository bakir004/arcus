import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Session } from '@thallesp/nestjs-better-auth';
import { auth } from '@/auth';
import { PermissionsGuard } from '@/authz/permissions.guard';
import { Permissions } from '@/authz/permissions';
import { RequirePermission } from '@/authz/require-permission.decorator';
import { ErrorDto } from '@/common/error.dto';
import { AttemptResponseDto, CreateAttemptDto } from '@/modules/exams/attempts/attempt.dto';
import { type Attempt } from '@/modules/exams/attempts/attempt.entity';
import { AttemptsService } from '@/modules/exams/attempts/attempts.service';

@ApiTags('Attempts')
@Controller({ path: 'courses/:courseId/exams/:examId/attempts', version: '1' })
export class AttemptsController {
    constructor(private readonly attemptsService: AttemptsService) {}

    private toResponse(value: Attempt): AttemptResponseDto {
        return {
            ...value,
            startedAt: value.startedAt ? value.startedAt.toISOString() : null,
            submittedAt: value.submittedAt ? value.submittedAt.toISOString() : null,
            gradedAt: value.gradedAt ? value.gradedAt.toISOString() : null,
        };
    }

    @ApiOperation({ summary: 'Start a new exam attempt' })
    @ApiResponse({
        status: 201,
        description: 'Attempt started',
        type: AttemptResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Validation failed',
        type: ErrorDto,
    })
    @Post()
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.AttemptCreate] })
    async create(
        @Param('examId', ParseUUIDPipe) examId: string,
        @Session() session: UserSession<typeof auth>,
        @Body() dto: CreateAttemptDto,
    ): Promise<AttemptResponseDto> {
        if (!session) throw new UnauthorizedException();
        const attempt = await this.attemptsService.create(examId, session.user.id, dto);
        return this.toResponse(attempt);
    }

    @ApiOperation({ summary: 'List all attempts for an exam' })
    @ApiResponse({
        status: 200,
        description: 'List of attempts',
        type: [AttemptResponseDto],
    })
    @Get()
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.AttemptReadAll] })
    async findAll(@Param('examId', ParseUUIDPipe) examId: string): Promise<AttemptResponseDto[]> {
        const attempts = await this.attemptsService.findAll(examId);
        return attempts.map((attempt) => this.toResponse(attempt));
    }

    @ApiOperation({
        summary: "List the current student's attempts for an exam",
    })
    @ApiResponse({
        status: 200,
        description: "Current student's attempts",
        type: [AttemptResponseDto],
    })
    @Get('mine')
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.AttemptRead] })
    async findAllOwn(
        @Param('examId', ParseUUIDPipe) examId: string,
        @Session() session: UserSession<typeof auth>,
    ): Promise<AttemptResponseDto[]> {
        if (!session) throw new UnauthorizedException();
        const attempts = await this.attemptsService.findAllOwn(examId, session.user.id);
        return attempts.map((attempt) => this.toResponse(attempt));
    }

    @ApiOperation({ summary: 'Get a single attempt by id' })
    @ApiResponse({
        status: 200,
        description: 'Attempt found',
        type: AttemptResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid UUID', type: ErrorDto })
    @ApiResponse({
        status: 404,
        description: 'Attempt not found',
        type: ErrorDto,
    })
    @Get(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.AttemptRead] })
    async findById(
        @Param('examId', ParseUUIDPipe) examId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Session() session: UserSession<typeof auth>,
    ): Promise<AttemptResponseDto> {
        if (!session) throw new UnauthorizedException();
        const attempt = await this.attemptsService.findOwnById(examId, id, session.user.id);
        return this.toResponse(attempt);
    }

    @ApiOperation({ summary: 'Submit an attempt' })
    @ApiResponse({
        status: 200,
        description: 'Attempt submitted',
        type: AttemptResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Attempt not found',
        type: ErrorDto,
    })
    @Post(':id/submit')
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.AttemptSubmit] })
    async submit(
        @Param('examId', ParseUUIDPipe) examId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Session() session: UserSession<typeof auth>,
    ): Promise<AttemptResponseDto> {
        if (!session) throw new UnauthorizedException();
        const attempt = await this.attemptsService.submitOwn(examId, id, session.user.id);
        return this.toResponse(attempt);
    }
}
