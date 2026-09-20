import { ConflictException, NotFoundException } from '@nestjs/common';

export const CourseRoleNameConflict = () =>
    new ConflictException('A role with this name already exists in this course');
export const CourseRoleCreationFailed = () => new NotFoundException('Role could not be created');
export const CourseRoleNotFound = () => new NotFoundException('Role not found');
export const CourseRoleHasAssignedUsers = () => new ConflictException('Role has assigned users');
export const CourseMemberNotFound = () => new NotFoundException('Course member not found');
