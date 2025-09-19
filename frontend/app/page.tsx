'use client';

import { AdminLayout } from '@/components/admin-layout';
import { DashboardOverview } from '@/components/dashboard-overview';
import { withAuth } from '@/contexts/auth-context';

function HomePage() {
	return (
		<AdminLayout>
			<DashboardOverview />
		</AdminLayout>
	);
}

export default withAuth(HomePage);
