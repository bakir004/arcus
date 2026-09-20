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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from '@/authz/permissions.guard';
import { Permissions } from '@/authz/permissions';
import { RequirePermission } from '@/authz/require-permission.decorator';
import { ErrorDto } from '@/common/error.dto';
import {
    AnnouncementResponseDto,
    CreateAnnouncementDto,
    UpdateAnnouncementDto,
} from '@/modules/exams/announcements/announcement.dto';
import type { Announcement } from '@/modules/exams/announcements/announcement.entity';
import { AnnouncementsService } from '@/modules/exams/announcements/announcements.service';

@ApiTags('Announcements')
@Controller({
    path: 'courses/:courseId/exams/:examId/announcements',
    version: '1',
})
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) {}

    private toResponse(value: Announcement): AnnouncementResponseDto {
        return {
            ...value,
            createdAt: value.createdAt.toISOString(),
            updatedAt: value.updatedAt.toISOString(),
        };
    }

    @ApiOperation({ summary: 'Create an exam announcement' })
    @ApiResponse({
        status: 201,
        description: 'Announcement created',
        type: AnnouncementResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Validation failed',
        type: ErrorDto,
    })
    @Post()
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.AnnouncementCreate] })
    async create(
        @Param('examId', ParseUUIDPipe) examId: string,
        @Body() dto: CreateAnnouncementDto,
    ): Promise<AnnouncementResponseDto> {
        const announcement = await this.announcementsService.create(examId, dto);
        return this.toResponse(announcement);
    }

    @ApiOperation({ summary: 'List all announcements for an exam' })
    @ApiResponse({
        status: 200,
        description: 'List of announcements',
        type: [AnnouncementResponseDto],
    })
    @Get()
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.AnnouncementRead] })
    async findAll(@Param('examId', ParseUUIDPipe) examId: string): Promise<AnnouncementResponseDto[]> {
        const announcements = await this.announcementsService.findAll(examId);
        return announcements.map((announcement) => this.toResponse(announcement));
    }

    @ApiOperation({ summary: 'Get an announcement by id' })
    @ApiResponse({
        status: 200,
        description: 'Announcement found',
        type: AnnouncementResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Announcement not found',
        type: ErrorDto,
    })
    @Get(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.AnnouncementRead] })
    async findById(
        @Param('examId', ParseUUIDPipe) examId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<AnnouncementResponseDto> {
        const announcement = await this.announcementsService.findById(examId, id);
        return this.toResponse(announcement);
    }

    @ApiOperation({ summary: 'Update an announcement' })
    @ApiResponse({
        status: 200,
        description: 'Announcement updated',
        type: AnnouncementResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Validation failed',
        type: ErrorDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Announcement not found',
        type: ErrorDto,
    })
    @Patch(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.AnnouncementUpdate] })
    async update(
        @Param('examId', ParseUUIDPipe) examId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateAnnouncementDto,
    ): Promise<AnnouncementResponseDto> {
        const announcement = await this.announcementsService.update(examId, id, dto);
        return this.toResponse(announcement);
    }

    @ApiOperation({ summary: 'Delete an announcement' })
    @ApiResponse({ status: 204, description: 'Announcement deleted' })
    @ApiResponse({
        status: 404,
        description: 'Announcement not found',
        type: ErrorDto,
    })
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.AnnouncementDelete] })
    remove(@Param('examId', ParseUUIDPipe) examId: string, @Param('id', ParseUUIDPipe) id: string) {
        return this.announcementsService.delete(examId, id);
    }
}
