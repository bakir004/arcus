import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { auth } from '@/auth';
import { Permissions } from '@/authz/permissions';
import { PermissionsGuard } from '@/authz/permissions.guard';
import { RequirePermission } from '@/authz/require-permission.decorator';
import {
    AssignCourseMemberRoleDto,
    CourseMemberRoleDto,
    CourseRolePermissionDto,
    CreateCourseRoleDto,
    UpdateCourseRoleDto,
} from './roles.dto';
import { COURSE_PERMISSIONS, RolesService } from './roles.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Course Roles')
@Controller({ path: 'courses/:courseId/roles', version: '1' })
@UseGuards(PermissionsGuard)
@RequirePermission({ scope: 'course', routeParam: 'courseId', permissions: [Permissions.CourseRoleManage] })
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    @Get()
    @ApiOperation({ summary: 'List course roles and their permissions' })
    @ApiOkResponse({ type: [CourseRolePermissionDto] })
    findRoles(@Param('courseId', ParseUUIDPipe) courseId: string) {
        return this.rolesService.findRoles(courseId);
    }

    @Get('permissions')
    @ApiOperation({ summary: 'List available course permissions' })
    findPermissions() {
        return COURSE_PERMISSIONS;
    }

    @Get('members')
    @ApiOperation({ summary: 'List enrolled course members and their roles' })
    @ApiOkResponse({ type: [CourseMemberRoleDto] })
    findMembers(@Param('courseId', ParseUUIDPipe) courseId: string) {
        return this.rolesService.findMembers(courseId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a course role' })
    createRole(
        @Param('courseId', ParseUUIDPipe) courseId: string,
        @Session() session: UserSession<typeof auth>,
        @Body() dto: CreateCourseRoleDto,
    ) {
        return this.rolesService.createRole(courseId, session, dto);
    }

    @Patch(':roleId')
    @ApiOperation({ summary: 'Replace a role permissions' })
    updateRole(
        @Param('courseId', ParseUUIDPipe) courseId: string,
        @Param('roleId', ParseUUIDPipe) roleId: string,
        @Body() dto: UpdateCourseRoleDto,
    ) {
        return this.rolesService.updateRole(courseId, roleId, dto);
    }

    @Delete(':roleId')
    @ApiOperation({ summary: 'Delete a course role' })
    deleteRole(@Param('courseId', ParseUUIDPipe) courseId: string, @Param('roleId', ParseUUIDPipe) roleId: string) {
        return this.rolesService.deleteRole(courseId, roleId).then(() => ({ success: true }));
    }

    @Patch('members/:memberId/role')
    @ApiOperation({ summary: 'Assign a role to an enrolled member' })
    assignRole(
        @Param('courseId', ParseUUIDPipe) courseId: string,
        @Param('memberId', ParseUUIDPipe) memberId: string,
        @Body() dto: AssignCourseMemberRoleDto,
    ) {
        return this.rolesService.assignRole(courseId, memberId, dto.roleId).then(() => ({ success: true }));
    }
}
