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
import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { PermissionsGuard } from '@/authz/permissions.guard';
import { Permissions } from '@/authz/permissions';
import { RequirePermission } from '@/authz/require-permission.decorator';
import { ErrorDto } from '@/common/error.dto';
import {
    CreateQuestionDto,
    QuestionResponseDto,
    ReorderQuestionsDto,
    UpdateQuestionDto,
} from '@/modules/exams/questions/questions.dto';
import type { Question } from '@/modules/exams/questions/questions.entity';
import { QuestionsService } from '@/modules/exams/questions/questions.service';

@ApiTags('Questions')
@UseGuards(PermissionsGuard)
@Controller({ path: 'courses/:courseId/exams/:examId/questions', version: '1' })
export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) {}

    private toResponse(value: Question): QuestionResponseDto {
        return {
            ...value,
            createdAt: value.createdAt.toISOString(),
        };
    }

    @ApiOperation({ summary: 'Add a question to an exam' })
    @ApiCreatedResponse({ type: QuestionResponseDto })
    @ApiBadRequestResponse({ type: ErrorDto })
    @Post()
    @RequirePermission({
        scope: 'course',
        routeParam: 'courseId',
        permissions: [Permissions.QuestionCreate],
    })
    async create(
        @Param('examId', ParseUUIDPipe) examId: string,
        @Body() dto: CreateQuestionDto,
    ): Promise<QuestionResponseDto> {
        const question = await this.questionsService.create(examId, dto);
        return this.toResponse(question);
    }

    @ApiOperation({ summary: 'List unredacted questions for exam authoring' })
    @ApiOkResponse({ type: [QuestionResponseDto] })
    @Get('authoring')
    @RequirePermission({
        scope: 'course',
        routeParam: 'courseId',
        permissions: [Permissions.QuestionUpdate],
    })
    async findAllForAuthoring(@Param('examId', ParseUUIDPipe) examId: string): Promise<QuestionResponseDto[]> {
        const questions = await this.questionsService.findAllForAuthoring(examId);
        return questions.map((question) => this.toResponse(question));
    }

    @ApiOperation({
        summary: 'List all questions for an exam, ordered by position',
    })
    @ApiOkResponse({ type: [QuestionResponseDto] })
    @Get()
    @RequirePermission({
        scope: 'course',
        routeParam: 'courseId',
        permissions: [Permissions.QuestionRead],
    })
    async findAll(@Param('examId', ParseUUIDPipe) examId: string): Promise<QuestionResponseDto[]> {
        const questions = await this.questionsService.findAll(examId);
        return questions.map((question) => this.toResponse(question));
    }

    @ApiOperation({ summary: 'Get a single question by id' })
    @ApiOkResponse({ type: QuestionResponseDto })
    @ApiBadRequestResponse({ type: ErrorDto })
    @ApiNotFoundResponse({ type: ErrorDto })
    @Get(':id')
    @RequirePermission({
        scope: 'course',
        routeParam: 'courseId',
        permissions: [Permissions.QuestionRead],
    })
    async findById(
        @Param('examId', ParseUUIDPipe) examId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<QuestionResponseDto> {
        const question = await this.questionsService.findById(examId, id);
        return this.toResponse(question);
    }

    @ApiOperation({ summary: 'Reorder all questions in an exam' })
    @ApiOkResponse({ type: [QuestionResponseDto] })
    @Patch('reorder')
    @RequirePermission({
        scope: 'course',
        routeParam: 'courseId',
        permissions: [Permissions.QuestionUpdate],
    })
    async reorder(
        @Param('examId', ParseUUIDPipe) examId: string,
        @Body() dto: ReorderQuestionsDto,
    ): Promise<QuestionResponseDto[]> {
        const questions = await this.questionsService.reorder(examId, dto);
        return questions.map((question) => this.toResponse(question));
    }

    @ApiOperation({
        summary: 'Update a question',
        description:
            'When options is provided, it replaces the entire existing options object as-is (it is not merged/patched).',
    })
    @ApiOkResponse({ type: QuestionResponseDto })
    @ApiBadRequestResponse({ type: ErrorDto })
    @ApiNotFoundResponse({ type: ErrorDto })
    @Patch(':id')
    @RequirePermission({
        scope: 'course',
        routeParam: 'courseId',
        permissions: [Permissions.QuestionUpdate],
    })
    async update(
        @Param('examId', ParseUUIDPipe) examId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateQuestionDto,
    ): Promise<QuestionResponseDto> {
        const question = await this.questionsService.update(examId, id, dto);
        return this.toResponse(question);
    }

    @ApiOperation({ summary: 'Delete a question' })
    @ApiNoContentResponse()
    @ApiNotFoundResponse({ type: ErrorDto })
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @RequirePermission({
        scope: 'course',
        routeParam: 'courseId',
        permissions: [Permissions.QuestionDelete],
    })
    remove(@Param('examId', ParseUUIDPipe) examId: string, @Param('id', ParseUUIDPipe) id: string) {
        return this.questionsService.delete(examId, id);
    }
}
