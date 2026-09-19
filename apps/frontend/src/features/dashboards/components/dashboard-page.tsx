import { useAuth } from '@/features/auth/lib/use-auth';
import { ProfessorDashboard } from './professor-dashboard';
import { StudentDashboard } from './student-dashboard';

export function DashboardPage() {
    const { isProfessor, isLoading } = useAuth();

    if (isLoading) {
        return (
            <main className="flex min-h-full items-center justify-center p-8 text-sm text-muted-foreground">
                Loading your dashboard…
            </main>
        );
    }

    return isProfessor ? <ProfessorDashboard /> : <StudentDashboard />;
}
