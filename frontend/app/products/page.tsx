"use client"

import { AdminLayout } from "@/components/admin-layout"
import { ProductsManagement } from "@/components/products-management"
import { withAuth } from "@/contexts/auth-context"

function ProductsPage() {
	return (
		<AdminLayout>
			<ProductsManagement />
		</AdminLayout>
	)
}

export default withAuth(ProductsPage)
