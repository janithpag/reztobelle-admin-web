'use client';

import { ProductsManagement } from '@/components/products-management';
import { withAuth } from '@/contexts/auth-context';

function ProductsPage() {
	return <ProductsManagement />;
}

export default withAuth(ProductsPage);
