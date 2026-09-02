import { redirect, createFileRoute } from '@tanstack/react-router';
import { getMeRequest } from '@/features/auth/api/get-me';
import { LoginForm } from '@/features/auth/components/login-form';
import { AuthShell } from '@/features/auth/components/auth-shell';

export const Route = createFileRoute('/login')({
    loader: async () => {
        const session = await getMeRequest().catch(() => null);
        if (session?.user) throw redirect({ to: '/' });
    },
    component: LoginPage,
});

function LoginPage() {
    return (
        <AuthShell>
            <LoginForm />
        </AuthShell>
    );
}
