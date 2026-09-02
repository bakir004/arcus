import { useGetMe } from '@/features/auth/api/get-me';
import { isProfessorRole, isStudentRole } from '@/features/auth/lib/roles';

export function useAuth() {
    const query = useGetMe();
    const session = query.data?.session ?? null;
    const user = query.data?.user ?? null;
    const userId = user?.id ?? '';
    const roles = query.data?.roles ?? [];

    return {
        ...query,
        session,
        user,
        userId,
        roles,
        isStudent: isStudentRole(roles),
        isProfessor: isProfessorRole(roles),
        isAuthenticated: Boolean(user),
    };
}
