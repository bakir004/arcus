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
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { auth } from '@/auth';
import { Permissions } from '@/authz/permissions';
import { PermissionsGuard } from '@/authz/permissions.guard';
import { RequirePermission } from '@/authz/require-permission.decorator';
import { Session } from '@thallesp/nestjs-better-auth';
import { CreateTimeslotDto, UpdateTimeslotDto } from './timeslot.dto';
import { TimeslotsService } from './timeslots.service';

@Controller({ path: 'courses/:courseId/exams/:examId/timeslots', version: '1' })
export class TimeslotsController {
    constructor(private readonly service: TimeslotsService) {}
    private response(slot: any) {
        const registrationCount = slot.registrationCount ?? 0;
        return {
            ...slot,
            registrationCount,
            availableSeats: slot.availableSeats ?? Math.max(0, slot.capacity - registrationCount),
            isRegistered: slot.isRegistered ?? false,
            startsAt: slot.startsAt.toISOString(),
            createdAt: slot.createdAt.toISOString(),
            updatedAt: slot.updatedAt.toISOString(),
        };
    }

    @Get()
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.ExamRead] })
    async list(@Param('examId', ParseUUIDPipe) examId: string, @Session() session: UserSession<typeof auth>) {
        return (await this.service.list(examId, session?.user.id)).map((slot) => this.response(slot));
    }
    @Post()
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.ExamUpdate] })
    async create(@Param('examId', ParseUUIDPipe) examId: string, @Body() dto: CreateTimeslotDto) {
        return this.response(await this.service.create(examId, dto));
    }
    @Patch(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.ExamUpdate] })
    async update(
        @Param('examId', ParseUUIDPipe) examId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateTimeslotDto,
    ) {
        return this.response(await this.service.update(examId, id, dto));
    }
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.ExamUpdate] })
    remove(@Param('examId', ParseUUIDPipe) examId: string, @Param('id', ParseUUIDPipe) id: string) {
        return this.service.delete(examId, id);
    }
    @Post(':id/registration')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.AttemptCreate] })
    register(
        @Param('examId', ParseUUIDPipe) examId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Session() session: UserSession<typeof auth>,
    ) {
        if (!session) throw new UnauthorizedException();
        return this.service.register(examId, id, session.user.id);
    }
    @Delete('registration/me')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(PermissionsGuard)
    @RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.AttemptCreate] })
    cancel(@Param('examId', ParseUUIDPipe) examId: string, @Session() session: UserSession<typeof auth>) {
        if (!session) throw new UnauthorizedException();
        return this.service.cancel(examId, session.user.id);
    }
}
