'use client';

import { AdminLayout } from '@/components/admin-layout';
import { OrdersManagement } from '@/components/orders-management';
import { withAuth } from '@/contexts/auth-context';

function OrdersPage() {
	return (
		<AdminLayout>
			<OrdersManagement />
		</AdminLayout>
	);
}

export default withAuth(OrdersPage);
