import { createFileRoute } from '@tanstack/react-router';

import { DashboardPage } from '@/features/dashboards/components/dashboard-page';

export const Route = createFileRoute('/')({ component: DashboardPage });
