import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/courses/$code/exams')({
    component: () => <Outlet />,
});
