'use client';

import { DashboardOverview } from '@/components/dashboard-overview';
import { withAuth } from '@/contexts/auth-context';

function HomePage() {
	return <DashboardOverview />;
}

export default withAuth(HomePage);
