import { AdminLayout } from "@/components/admin-layout"
import { ExpensesManagement } from "@/components/expenses-management"

export default function ExpensesPage() {
	return (
		<AdminLayout>
			<ExpensesManagement />
		</AdminLayout>
	)
}
