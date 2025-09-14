"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination"
import { Plus, Search, Filter, Receipt, Calendar, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Sample expenses data
const expensesData = [
	{
		id: "EXP-001",
		description: "Office Rent",
		category: "Rent",
		amount: 50000,
		date: "2024-01-01",
		status: "paid",
		vendor: "Property Management Co.",
	},
	{
		id: "EXP-002",
		description: "Marketing Campaign",
		category: "Marketing",
		amount: 25000,
		date: "2024-01-02",
		status: "paid",
		vendor: "Digital Marketing Agency",
	},
	{
		id: "EXP-003",
		description: "Inventory Purchase",
		category: "Inventory",
		amount: 150000,
		date: "2024-01-03",
		status: "paid",
		vendor: "Jewelry Supplier Ltd.",
	},
	{
		id: "EXP-004",
		description: "Utility Bills",
		category: "Utilities",
		amount: 8500,
		date: "2024-01-04",
		status: "pending",
		vendor: "Electricity Board",
	},
	{
		id: "EXP-005",
		description: "Packaging Materials",
		category: "Supplies",
		amount: 12000,
		date: "2024-01-05",
		status: "paid",
		vendor: "Packaging Solutions",
	},
	{
		id: "EXP-006",
		description: "Staff Salaries",
		category: "Payroll",
		amount: 75000,
		date: "2024-01-06",
		status: "paid",
		vendor: "Internal",
	},
	{
		id: "EXP-007",
		description: "Website Maintenance",
		category: "Technology",
		amount: 15000,
		date: "2024-01-07",
		status: "pending",
		vendor: "Web Development Co.",
	},
]

const categories = ["All", "Rent", "Marketing", "Inventory", "Utilities", "Supplies", "Payroll", "Technology"]

export function ExpensesManagement() {
	const [expenses, setExpenses] = useState(expensesData)
	const [searchTerm, setSearchTerm] = useState("")
	const [selectedCategory, setSelectedCategory] = useState("All")
	const [currentPage, setCurrentPage] = useState(1)
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const itemsPerPage = 5

	// Filter expenses
	const filteredExpenses = expenses.filter((expense) => {
		const matchesSearch =
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.id.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesCategory = selectedCategory === "All" || expense.category === selectedCategory
		return matchesSearch && matchesCategory
	})

	// Pagination
	const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage)
	const startIndex = (currentPage - 1) * itemsPerPage
	const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage)

	// Calculate totals
	const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
	const monthlyExpenses = expenses
		.filter((expense) => {
			const expenseDate = new Date(expense.date)
			const currentDate = new Date()
			return (
				expenseDate.getMonth() === currentDate.getMonth() && expenseDate.getFullYear() === currentDate.getFullYear()
			)
		})
		.reduce((sum, expense) => sum + expense.amount, 0)

	const pendingExpenses = expenses.filter((expense) => expense.status === "pending").length

	const handleAddExpense = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const formData = new FormData(event.currentTarget)
		const newExpense = {
			id: `EXP-${String(expenses.length + 1).padStart(3, "0")}`,
			description: formData.get("description") as string,
			category: formData.get("category") as string,
			amount: Number(formData.get("amount")),
			date: formData.get("date") as string,
			status: "pending" as const,
			vendor: formData.get("vendor") as string,
		}
		setExpenses([newExpense, ...expenses])
		setIsAddDialogOpen(false)
		event.currentTarget.reset()
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold text-sidebar-foreground text-balance">Expenses</h1>
					<p className="text-sm sm:text-base text-sidebar-foreground/70 font-medium">
            Track and manage your business expenses
					</p>
				</div>
				<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
					<DialogTrigger asChild>
						<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
							<Plus className="mr-2 h-4 w-4" />
              Add Expense
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<form onSubmit={handleAddExpense}>
							<DialogHeader>
								<DialogTitle>Add New Expense</DialogTitle>
								<DialogDescription>Enter the details of the new expense.</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<Label htmlFor="description">Description</Label>
									<Input id="description" name="description" placeholder="Enter expense description" required />
								</div>
								<div className="grid gap-2">
									<Label htmlFor="category">Category</Label>
									<Select name="category" required>
										<SelectTrigger>
											<SelectValue placeholder="Select category" />
										</SelectTrigger>
										<SelectContent>
											{categories
												.filter((cat) => cat !== "All")
												.map((category) => (
													<SelectItem key={category} value={category}>
														{category}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="amount">Amount (LKR)</Label>
									<Input id="amount" name="amount" type="number" placeholder="0.00" required />
								</div>
								<div className="grid gap-2">
									<Label htmlFor="vendor">Vendor</Label>
									<Input id="vendor" name="vendor" placeholder="Enter vendor name" required />
								</div>
								<div className="grid gap-2">
									<Label htmlFor="date">Date</Label>
									<Input id="date" name="date" type="date" required />
								</div>
							</div>
							<DialogFooter>
								<Button type="submit">Add Expense</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{/* Summary Cards */}
			<div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-3">
				<Card className="hover:shadow-lg transition-shadow border-sidebar-border">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-semibold text-sidebar-foreground">Total Expenses</CardTitle>
						<DollarSign className="h-3 w-3 text-sidebar-foreground/70" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg sm:text-xl font-bold text-sidebar-foreground">
              LKR {totalExpenses.toLocaleString()}
						</div>
						<div className="flex items-center text-xs text-sidebar-foreground/70 font-medium">
							<TrendingUp className="mr-1 h-2 w-2 text-red-500" />
              All time expenses
						</div>
					</CardContent>
				</Card>

				<Card className="hover:shadow-lg transition-shadow border-sidebar-border">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-semibold text-sidebar-foreground">This Month</CardTitle>
						<Calendar className="h-3 w-3 text-sidebar-foreground/70" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg sm:text-xl font-bold text-sidebar-foreground">
              LKR {monthlyExpenses.toLocaleString()}
						</div>
						<div className="flex items-center text-xs text-sidebar-foreground/70 font-medium">
							<TrendingDown className="mr-1 h-2 w-2 text-blue-500" />
              Current month
						</div>
					</CardContent>
				</Card>

				<Card className="hover:shadow-lg transition-shadow border-orange-200 dark:border-orange-800">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-semibold text-sidebar-foreground">Pending</CardTitle>
						<Receipt className="h-3 w-3 text-orange-500" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg sm:text-xl font-bold text-orange-600">{pendingExpenses}</div>
						<div className="flex items-center text-xs text-orange-600 font-medium">
							<Receipt className="mr-1 h-2 w-2" />
              Awaiting payment
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters and Search */}
			<Card className="border-sidebar-border">
				<CardHeader>
					<CardTitle className="text-base sm:text-lg text-sidebar-foreground font-semibold">Expense Records</CardTitle>
					<CardDescription className="text-sm text-sidebar-foreground/70 font-medium">
            Manage and track all your business expenses
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search expenses..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Select value={selectedCategory} onValueChange={setSelectedCategory}>
							<SelectTrigger className="w-full sm:w-[180px]">
								<Filter className="mr-2 h-4 w-4" />
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{categories.map((category) => (
									<SelectItem key={category} value={category}>
										{category}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Expenses Table */}
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="border-sidebar-border">
									<TableHead className="text-sidebar-foreground font-semibold">ID</TableHead>
									<TableHead className="text-sidebar-foreground font-semibold">Description</TableHead>
									<TableHead className="text-sidebar-foreground font-semibold">Category</TableHead>
									<TableHead className="text-sidebar-foreground font-semibold">Vendor</TableHead>
									<TableHead className="text-sidebar-foreground font-semibold">Amount</TableHead>
									<TableHead className="text-sidebar-foreground font-semibold">Date</TableHead>
									<TableHead className="text-sidebar-foreground font-semibold">Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedExpenses.map((expense) => (
									<TableRow key={expense.id} className="border-sidebar-border">
										<TableCell className="font-semibold text-sidebar-foreground">{expense.id}</TableCell>
										<TableCell className="text-sidebar-foreground font-medium">{expense.description}</TableCell>
										<TableCell>
											<Badge variant="outline" className="text-sidebar-foreground">
												{expense.category}
											</Badge>
										</TableCell>
										<TableCell className="text-sidebar-foreground font-medium">{expense.vendor}</TableCell>
										<TableCell className="text-sidebar-foreground font-semibold">
                      LKR {expense.amount.toLocaleString()}
										</TableCell>
										<TableCell className="text-sidebar-foreground/70 font-medium">{expense.date}</TableCell>
										<TableCell>
											<Badge
												variant={expense.status === "paid" ? "default" : "secondary"}
												className={cn(
													"text-xs font-medium",
													expense.status === "paid"
														? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
														: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
												)}
											>
												{expense.status}
											</Badge>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex items-center justify-between mt-6">
							<div className="text-sm text-sidebar-foreground/70">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredExpenses.length)} of{" "}
								{filteredExpenses.length} expenses
							</div>
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											href="#"
											onClick={(e) => {
												e.preventDefault()
												if (currentPage > 1) setCurrentPage(currentPage - 1)
											}}
											className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
										/>
									</PaginationItem>
									{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
										<PaginationItem key={page}>
											<PaginationLink
												href="#"
												onClick={(e) => {
													e.preventDefault()
													setCurrentPage(page)
												}}
												isActive={currentPage === page}
											>
												{page}
											</PaginationLink>
										</PaginationItem>
									))}
									<PaginationItem>
										<PaginationNext
											href="#"
											onClick={(e) => {
												e.preventDefault()
												if (currentPage < totalPages) setCurrentPage(currentPage + 1)
											}}
											className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
