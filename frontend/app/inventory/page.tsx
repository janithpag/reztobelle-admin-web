import { AdminLayout } from '@/components/admin-layout';
import { InventoryManagement } from '@/components/inventory-management';

export default function InventoryPage() {
	return (
		<AdminLayout>
			<InventoryManagement />
		</AdminLayout>
	);
}
