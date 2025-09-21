'use client';

import { OrdersManagement } from '@/components/orders-management';
import { withAuth } from '@/contexts/auth-context';

function OrdersPage() {
	return <OrdersManagement />;
}

export default withAuth(OrdersPage);
