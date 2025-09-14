import { AdminLayout } from "@/components/admin-layout"
import { OrdersManagement } from "@/components/orders-management"

export default function OrdersPage() {
  return (
    <AdminLayout>
      <OrdersManagement />
    </AdminLayout>
  )
}
