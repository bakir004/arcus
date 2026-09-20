import { Body, Controller, Get, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Session } from '@thallesp/nestjs-better-auth';
import { auth } from '@/auth';
import { PermissionsGuard } from '@/authz/permissions.guard';
import { Permissions } from '@/authz/permissions';
import { RequirePermission } from '@/authz/require-permission.decorator';
import { AnswersService } from '@/modules/exams/answers/answers.service';
import {
    AnswerResponseDto,
    BulkSaveAnswersDto,
    GradeAnswerDto,
    GradeResponseDto,
    SaveAnswerDto,
} from '@/modules/exams/answers/answers.dto';
import type { Answer } from '@/modules/exams/answers/answer.entity';

@ApiTags('Answers')
@Controller({ path: 'courses/:courseId/exams/:examId/attempts/:attemptId/answers', version: '1' })
@UseGuards(PermissionsGuard)
export class AnswersController {
    constructor(private readonly service: AnswersService) {}
    private response(value: Answer): AnswerResponseDto {
        return {
            ...value,
            gradedAt: value.gradedAt?.toISOString() ?? null,
            createdAt: value.createdAt.toISOString(),
            updatedAt: value.updatedAt.toISOString(),
        };
    }

    @Put(':examItemId')
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.AnswerSave] })
    async save(
        @Param('examId', ParseUUIDPipe) examId: string,
        @Param('attemptId', ParseUUIDPipe) attemptId: string,
        @Param('examItemId', ParseUUIDPipe) examItemId: string,
        @Session() session: UserSession<typeof auth>,
        @Body() dto: SaveAnswerDto,
    ) {
        return this.response(await this.service.saveAnswer(examId, attemptId, examItemId, session.user.id, dto));
    }

    @Put()
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.AnswerSave] })
    async bulk(
        @Param('examId', ParseUUIDPipe) examId: string,
        @Param('attemptId', ParseUUIDPipe) attemptId: string,
        @Session() session: UserSession<typeof auth>,
        @Body() dto: BulkSaveAnswersDto,
    ) {
        const answers = await this.service.bulkSaveAnswers(examId, attemptId, session.user.id, dto);
        return answers.map((answer) => this.response(answer));
    }

    @Get()
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.AnswerReadOwn] })
    async list(
        @Param('examId', ParseUUIDPipe) examId: string,
        @Param('attemptId', ParseUUIDPipe) attemptId: string,
        @Session() session: UserSession<typeof auth>,
    ) {
        const answers = await this.service.getOwnAnswers(examId, attemptId, session.user.id);
        return answers.map((answer) => this.response(answer));
    }

    @Put(':examItemId/grade')
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.AnswerGrade] })
    async grade(
        @Param('examId', ParseUUIDPipe) examId: string,
        @Param('attemptId', ParseUUIDPipe) attemptId: string,
        @Param('examItemId', ParseUUIDPipe) examItemId: string,
        @Session() session: UserSession<typeof auth>,
        @Body() dto: GradeAnswerDto,
    ): Promise<GradeResponseDto> {
        const grade = await this.service.gradeAnswer(examId, attemptId, examItemId, session.user.id, dto);
        return { ...grade, gradedAt: grade.gradedAt?.toISOString() ?? null };
    }
}
