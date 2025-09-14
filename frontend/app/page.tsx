import { AdminLayout } from "@/components/admin-layout"
import { DashboardOverview } from "@/components/dashboard-overview"

export default function HomePage() {
  return (
    <AdminLayout>
      <DashboardOverview />
    </AdminLayout>
  )
}
