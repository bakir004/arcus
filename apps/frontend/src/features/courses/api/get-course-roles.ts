import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';

export interface CourseRole {
    id: string;
    name: string;
    permissions: string[];
}

export interface CourseMember {
    id: string;
    userId: string;
    name: string;
    email: string;
    image: string | null;
    roles: Array<{ id: string; name: string }>;
}

const rolesKey = (courseId: string) => ['courses', courseId, 'roles'] as const;
const membersKey = (courseId: string) => ['courses', courseId, 'role-members'] as const;

export const courseRolesOptions = (courseId: string) =>
    queryOptions<CourseRole[]>({
        queryKey: rolesKey(courseId),
        queryFn: () => apiClient<CourseRole[]>(`/courses/${courseId}/roles`),
        enabled: Boolean(courseId),
    });

export const courseMembersOptions = (courseId: string) =>
    queryOptions<CourseMember[]>({
        queryKey: membersKey(courseId),
        queryFn: () => apiClient<CourseMember[]>(`/courses/${courseId}/roles/members`),
        enabled: Boolean(courseId),
    });

export const coursePermissionsOptions = (courseId: string) =>
    queryOptions<string[]>({
        queryKey: ['courses', courseId, 'permissions'],
        queryFn: () => apiClient<string[]>(`/courses/${courseId}/roles/permissions`),
        enabled: Boolean(courseId),
    });

export function useCourseRoles(courseId: string) {
    return useQuery(courseRolesOptions(courseId));
}

export function useCourseMembers(courseId: string) {
    return useQuery(courseMembersOptions(courseId));
}

export function useCoursePermissions(courseId: string) {
    return useQuery(coursePermissionsOptions(courseId));
}

export function useCreateCourseRole(courseId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: { name: string; permissions: string[] }) =>
            apiClient<CourseRole>(`/courses/${courseId}/roles`, { method: 'POST', body: input }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesKey(courseId) }),
    });
}

export function useUpdateCourseRole(courseId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: { roleId: string; permissions: string[] }) =>
            apiClient<CourseRole>(`/courses/${courseId}/roles/${input.roleId}`, {
                method: 'PATCH',
                body: { permissions: input.permissions },
            }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesKey(courseId) }),
    });
}

export function useAssignCourseMemberRole(courseId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: { memberId: string; roleId: string }) =>
            apiClient<{ success: boolean }>(`/courses/${courseId}/roles/members/${input.memberId}/role`, {
                method: 'PATCH',
                body: { roleId: input.roleId },
            }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: membersKey(courseId) }),
    });
}
