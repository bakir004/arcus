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
    UseGuards,
} from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
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
import { Permissions } from '@/authz/permissions';
import { PermissionsGuard } from '@/authz/permissions.guard';
import { RequirePermission } from '@/authz/require-permission.decorator';
import { ErrorDto } from '@/common/error.dto';
import { CreateExamDto, ExamResponseDto, UpdateExamDto } from '@/modules/exams/exams/exams.dto';
import type { Exam } from '@/modules/exams/exams/exams.entity';
import { ExamsService } from '@/modules/exams/exams/exams.service';

@ApiTags('Exams')
@UseGuards(PermissionsGuard)
@Controller({ path: 'courses/:courseId/exams', version: '1' })
export class ExamsController {
    constructor(private readonly examsService: ExamsService) {}

    private toResponse(value: Exam): ExamResponseDto {
        return {
            ...value,
            createdAt: value.createdAt.toISOString(),
            updatedAt: value.updatedAt.toISOString(),
        };
    }

    @ApiOperation({ summary: 'Create an exam' })
    @ApiCreatedResponse({ type: ExamResponseDto })
    @ApiBadRequestResponse({ type: ErrorDto })
    @ApiUnauthorizedResponse({ type: ErrorDto })
    @Post()
    @RequirePermission({
        scope: 'course',
        routeParam: 'courseId',
        permissions: [Permissions.ExamCreate],
    })
    async create(
        @Param('courseId', ParseUUIDPipe) courseId: string,
        @Session() session: UserSession<typeof auth>,
        @Body() dto: CreateExamDto,
    ): Promise<ExamResponseDto> {
        const exam = await this.examsService.create(courseId, session.user.id, dto);
        return this.toResponse(exam);
    }

    @ApiOperation({ summary: 'List all exams' })
    @ApiOkResponse({ type: [ExamResponseDto] })
    @Get()
    @RequirePermission({
        scope: 'course',
        routeParam: 'courseId',
        permissions: [Permissions.ExamRead],
    })
    async findAll(@Param('courseId', ParseUUIDPipe) courseId: string): Promise<ExamResponseDto[]> {
        const exams = await this.examsService.findAll(courseId);
        return exams.map((exam) => this.toResponse(exam));
    }

    @ApiOperation({ summary: 'Get an exam by id' })
    @ApiOkResponse({ type: ExamResponseDto })
    @ApiBadRequestResponse({ type: ErrorDto })
    @ApiNotFoundResponse({ type: ErrorDto })
    @Get(':id')
    @RequirePermission({
        scope: 'course',
        routeParam: 'courseId',
        permissions: [Permissions.ExamRead],
    })
    async findById(
        @Param('courseId', ParseUUIDPipe) courseId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<ExamResponseDto> {
        const exam = await this.examsService.findById(courseId, id);
        return this.toResponse(exam);
    }

    @ApiOperation({ summary: 'Update an exam' })
    @ApiOkResponse({ type: ExamResponseDto })
    @ApiBadRequestResponse({ type: ErrorDto })
    @ApiNotFoundResponse({ type: ErrorDto })
    @Patch(':id')
    @RequirePermission({
        scope: 'course',
        routeParam: 'courseId',
        permissions: [Permissions.ExamUpdate],
    })
    async update(
        @Param('courseId', ParseUUIDPipe) courseId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateExamDto,
    ): Promise<ExamResponseDto> {
        const exam = await this.examsService.update(courseId, id, dto);
        return this.toResponse(exam);
    }

    @ApiOperation({ summary: 'Delete an exam' })
    @ApiNoContentResponse()
    @ApiBadRequestResponse({ type: ErrorDto })
    @ApiNotFoundResponse({ type: ErrorDto })
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @RequirePermission({
        scope: 'course',
        routeParam: 'courseId',
        permissions: [Permissions.ExamDelete],
    })
    remove(@Param('courseId', ParseUUIDPipe) courseId: string, @Param('id', ParseUUIDPipe) id: string) {
        return this.examsService.delete(courseId, id);
    }
}
