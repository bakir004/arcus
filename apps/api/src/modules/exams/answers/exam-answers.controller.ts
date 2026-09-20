import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from '@/authz/permissions.guard';
import { Permissions } from '@/authz/permissions';
import { RequirePermission } from '@/authz/require-permission.decorator';
import { AnswersService } from '@/modules/exams/answers/answers.service';
import { AnswerTableResponseDto } from '@/modules/exams/answers/answer-table.dto';

@ApiTags('Answers')
@Controller({ path: 'courses/:courseId/exams/:examId/answers', version: '1' })
@UseGuards(PermissionsGuard)
export class ExamAnswersController {
    constructor(private readonly service: AnswersService) {}

    @Get('table')
    @ApiOperation({ summary: 'Get the exam answer table grouped by student and exam item' })
    @ApiResponse({ type: AnswerTableResponseDto })
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.AnswerReadAll] })
    async table(@Param('examId', ParseUUIDPipe) examId: string) {
        return this.service.getExamAnswerTable(examId);
    }
}
