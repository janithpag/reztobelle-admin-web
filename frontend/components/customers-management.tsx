'use client';

import { useState, useEffect } from 'react';
import { customersAPI } from '@/lib/api';
import { Customer, CustomerStats } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Search,
	Users,
	ShoppingBag,
	DollarSign,
	TrendingUp,
	Phone,
	Mail,
	MapPin,
	ChevronLeft,
	ChevronRight,
	Eye,
	Calendar,
	User,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function CustomersManagement() {
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [stats, setStats] = useState<CustomerStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [sortBy, setSortBy] = useState<'name' | 'totalSpent' | 'orderCount' | 'lastOrderDate'>('lastOrderDate');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCustomers, setTotalCustomers] = useState(0);
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
	const [isViewCustomerOpen, setIsViewCustomerOpen] = useState(false);
	const limit = 7;

	const fetchCustomers = async () => {
		try {
			setLoading(true);
			const response = await customersAPI.getCustomers({
				search: searchTerm || undefined,
				sortBy,
				sortOrder,
				page: currentPage,
				limit,
			});

			setCustomers(response.customers);
			setTotalPages(response.pagination.totalPages);
			setTotalCustomers(response.pagination.total);
		} catch (error) {
			console.error('Failed to fetch customers:', error);
		} finally {
			setLoading(false);
		}
	};

	const fetchStats = async () => {
		try {
			const response = await customersAPI.getCustomerStats();
			setStats(response);
		} catch (error) {
			console.error('Failed to fetch customer stats:', error);
		}
	};

	useEffect(() => {
		fetchCustomers();
		fetchStats();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchTerm, sortBy, sortOrder, currentPage]);

	const handleSearch = (value: string) => {
		setSearchTerm(value);
		setCurrentPage(1); // Reset to first page on new search
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'LKR',
			minimumFractionDigits: 2,
		}).format(amount);
	};

	const handleViewCustomer = (customer: Customer) => {
		setSelectedCustomer(customer);
		setIsViewCustomerOpen(true);
	};

	return (
		<div className="space-y-3">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-primary/5 via-primary/10 to-purple-500/5 dark:from-primary/10 dark:via-primary/20 dark:to-purple-500/10 border border-primary/20 shadow-md">
				<div>
					<h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-purple-600 dark:from-primary dark:via-primary dark:to-purple-400 bg-clip-text text-transparent">Customers</h1>
					<p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-1.5">
						<Users className="h-3.5 w-3.5" />
						View and manage customer information from orders
					</p>
				</div>
			</div>

			{/* Statistics Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
				<Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 dark:shadow-lg dark:shadow-blue-900/20 py-4 gap-0">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-xs font-medium text-blue-900 dark:text-blue-200">Total Customers</CardTitle>
						<Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
							{stats ? stats.totalCustomers.toLocaleString() : <Skeleton className="h-8 w-20" />}
						</div>
						<p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Unique customers</p>
					</CardContent>
				</Card>

				<Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/40 dark:shadow-lg dark:shadow-green-900/20 py-4 gap-0">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-xs font-medium text-green-900 dark:text-green-200">Total Orders</CardTitle>
						<ShoppingBag className="h-4 w-4 text-green-600 dark:text-green-400" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-900 dark:text-green-100">
							{stats ? stats.totalOrders.toLocaleString() : <Skeleton className="h-8 w-20" />}
						</div>
						<p className="text-xs text-green-700 dark:text-green-300 mt-1">All orders placed</p>
					</CardContent>
				</Card>

				<Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-800/40 dark:shadow-lg dark:shadow-purple-900/20 py-4 gap-0">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-xs font-medium text-purple-900 dark:text-purple-200">Avg Orders/Customer</CardTitle>
						<TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
							{stats ? stats.avgOrdersPerCustomer.toFixed(1) : <Skeleton className="h-8 w-20" />}
						</div>
						<p className="text-xs text-purple-700 dark:text-purple-300 mt-1">Orders per customer</p>
					</CardContent>
				</Card>

				<Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/40 dark:shadow-lg dark:shadow-amber-900/20 py-4 gap-0">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-xs font-medium text-amber-900 dark:text-amber-200">Avg Spent/Customer</CardTitle>
						<DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
							{stats ? formatCurrency(stats.avgSpentPerCustomer) : <Skeleton className="h-8 w-20" />}
						</div>
						<p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Average customer value</p>
					</CardContent>
				</Card>
			</div>

			{/* Search and Filters */}
			<div className="flex flex-col sm:flex-row gap-4 mb-4">
				<div className="relative flex-1">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search by name, email, or phone..."
						value={searchTerm}
						onChange={(e) => handleSearch(e.target.value)}
						className="pl-8"
					/>
				</div>

				<div className="flex gap-2">
					<Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Sort by" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="lastOrderDate">Last Order</SelectItem>
							<SelectItem value="name">Name</SelectItem>
							<SelectItem value="totalSpent">Total Spent</SelectItem>
							<SelectItem value="orderCount">Order Count</SelectItem>
						</SelectContent>
					</Select>

					<Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
						<SelectTrigger className="w-[120px]">
							<SelectValue placeholder="Order" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="desc">Descending</SelectItem>
							<SelectItem value="asc">Ascending</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Customers Table */}
			{loading ? (
				<div className="space-y-3">
					{[...Array(5)].map((_, i) => (
						<Skeleton key={i} className="h-16 w-full" />
					))}
				</div>
			) : customers.length === 0 ? (
				<div className="text-center py-12 border rounded-lg bg-muted/20">
					<Users className="mx-auto h-12 w-12 text-muted-foreground" />
					<h3 className="mt-4 text-lg font-semibold">No customers found</h3>
					<p className="text-sm text-muted-foreground">
						{searchTerm ? 'Try adjusting your search terms' : 'No customers have placed orders yet'}
					</p>
				</div>
			) : (
				<>
					<div className="rounded-md border border-border/50">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/50 hover:bg-muted/50">
									<TableHead className="w-[200px]">Customer</TableHead>
									<TableHead className="w-[200px]">Contact</TableHead>
									<TableHead className="w-[180px]">Location</TableHead>
									<TableHead className="w-[100px] text-center">Orders</TableHead>
									<TableHead className="w-[130px] text-right">Total Spent</TableHead>
									<TableHead className="w-[130px]">Last Order</TableHead>
									<TableHead className="w-[100px] text-center">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{customers.map((customer, index) => (
									<TableRow 
										key={index}
										className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent dark:hover:from-primary/10 dark:hover:to-transparent transition-all duration-200 border-b border-border/50"
									>
										<TableCell className="w-[200px]">
											<div className="flex items-center gap-2">
												<div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
													<User className="h-4 w-4 text-primary" />
												</div>
												<div className="min-w-0">
													<div className="font-medium text-sm truncate">{customer.customerName}</div>
													<div className="text-xs text-muted-foreground">
														Since {format(new Date(customer.firstOrderDate), 'MMM yyyy')}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell className="w-[200px]">
											<div className="space-y-1">
												{customer.customerPhone && (
													<div className="flex items-center gap-1 text-xs">
														<Phone className="h-3 w-3 text-blue-600 dark:text-blue-400" />
														<span className="truncate">{customer.customerPhone}</span>
													</div>
												)}
												{customer.customerEmail && (
													<div className="flex items-center gap-1 text-xs text-muted-foreground">
														<Mail className="h-3 w-3" />
														<span className="truncate">{customer.customerEmail}</span>
													</div>
												)}
											</div>
										</TableCell>
										<TableCell className="w-[180px]">
											<div className="flex items-start gap-1 text-xs">
												<MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
												<div className="min-w-0">
													<div className="truncate">{customer.cityName}</div>
													<div className="text-muted-foreground truncate">{customer.districtName}</div>
												</div>
											</div>
										</TableCell>
										<TableCell className="w-[100px] text-center">
											<Badge 
												variant="secondary" 
												className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600"
											>
												{customer.orderCount}
											</Badge>
										</TableCell>
										<TableCell className="w-[130px] text-right">
											<div className="font-medium text-sm whitespace-nowrap">
												{formatCurrency(customer.totalSpent)}
											</div>
										</TableCell>
										<TableCell className="w-[130px]">
											<div className="flex items-center gap-1 text-xs">
												<Calendar className="h-3 w-3 text-muted-foreground" />
												<span>{format(new Date(customer.lastOrderDate), 'MMM d, yyyy')}</span>
											</div>
										</TableCell>
										<TableCell className="w-[100px]">
											<div className="flex items-center justify-center">
												<Button
													size="icon"
													variant="outline"
													onClick={() => handleViewCustomer(customer)}
													className="h-7 w-7 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
													title="View customer details"
												>
													<Eye className="h-3.5 w-3.5" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex items-center justify-between mt-4">
							<div className="text-sm text-muted-foreground">
								Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCustomers)} of {totalCustomers} customers
							</div>
							<div className="flex space-x-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
									disabled={currentPage === 1}
								>
									<ChevronLeft className="h-4 w-4 mr-1" />
									Previous
								</Button>
								<div className="flex items-center px-3 text-sm">
									Page {currentPage} of {totalPages}
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
									disabled={currentPage === totalPages}
								>
									Next
									<ChevronRight className="h-4 w-4 ml-1" />
								</Button>
							</div>
						</div>
					)}
				</>
			)}

			{/* View Customer Dialog */}
			<Dialog open={isViewCustomerOpen} onOpenChange={setIsViewCustomerOpen}>
				<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
					<DialogHeader className="space-y-2 px-6 pt-6 pb-4">
						<DialogTitle className="text-xl flex items-center gap-2">
							<User className="h-5 w-5 text-primary" />
							Customer Details
						</DialogTitle>
						<DialogDescription className="text-sm">
							Comprehensive information about this customer
						</DialogDescription>
					</DialogHeader>
					{selectedCustomer && (
						<div className="space-y-5 px-6 pb-6">
							{/* Customer Information */}
							<div className="flex items-start gap-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
								<div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/30 dark:to-purple-500/30 flex items-center justify-center flex-shrink-0 border border-blue-300 dark:border-blue-700">
									<User className="h-7 w-7 text-blue-600 dark:text-blue-400" />
								</div>
								<div className="flex-1 min-w-0 pt-1">
									<h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-1">{selectedCustomer.customerName}</h3>
									<p className="text-sm text-blue-700 dark:text-blue-300">
										Customer since {format(new Date(selectedCustomer.firstOrderDate), 'MMMM d, yyyy')}
									</p>
								</div>
							</div>

							{/* Contact Information */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2.5 p-4 bg-muted/50 rounded-lg border">
									<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
										<Phone className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
										Phone Number
									</div>
									<p className="text-sm font-medium pt-0.5">
										{selectedCustomer.customerPhone || 'N/A'}
									</p>
								</div>
								<div className="space-y-2.5 p-4 bg-muted/50 rounded-lg border">
									<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
										<Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
										Email Address
									</div>
									<p className="text-sm font-medium truncate pt-0.5" title={selectedCustomer.customerEmail || 'N/A'}>
										{selectedCustomer.customerEmail || 'N/A'}
									</p>
								</div>
							</div>

							{/* Location Information */}
							<div className="space-y-2.5 p-4 bg-muted/50 rounded-lg border">
								<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
									<MapPin className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
									Location
								</div>
								<p className="text-sm font-medium pt-0.5">
									{selectedCustomer.cityName}, {selectedCustomer.districtName}
								</p>
							</div>

							{/* Order Statistics */}
							<div className="grid grid-cols-3 gap-3">
								<div className="space-y-2.5 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
									<div className="flex items-center gap-1.5 text-[10px] font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
										<ShoppingBag className="h-3 w-3" />
										Total Orders
									</div>
									<p className="text-2xl font-bold text-blue-900 dark:text-blue-100 pt-1">
										{selectedCustomer.orderCount}
									</p>
								</div>
								<div className="space-y-2.5 p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800/50">
									<div className="flex items-center gap-1.5 text-[10px] font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">
										<DollarSign className="h-3 w-3" />
										Total Spent
									</div>
									<p className="text-lg font-bold text-green-900 dark:text-green-100 truncate pt-1" title={formatCurrency(selectedCustomer.totalSpent)}>
										LKR {selectedCustomer.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
									</p>
								</div>
								<div className="space-y-2.5 p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800/50">
									<div className="flex items-center gap-1.5 text-[10px] font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">
										<TrendingUp className="h-3 w-3" />
										Avg Order
									</div>
									<p className="text-lg font-bold text-purple-900 dark:text-purple-100 truncate pt-1" title={formatCurrency(selectedCustomer.totalSpent / selectedCustomer.orderCount)}>
										LKR {(selectedCustomer.totalSpent / selectedCustomer.orderCount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
									</p>
								</div>
							</div>

							{/* Last Order Date */}
							<div className="space-y-2.5 p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/20 rounded-lg border border-amber-200 dark:border-amber-800/50">
								<div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide">
									<Calendar className="h-3.5 w-3.5" />
									Last Order Date
								</div>
								<p className="text-sm font-medium text-amber-900 dark:text-amber-100 pt-0.5">
									{format(new Date(selectedCustomer.lastOrderDate), 'MMMM d, yyyy')} at {format(new Date(selectedCustomer.lastOrderDate), 'h:mm a')}
								</p>
							</div>
						</div>
					)}
					<div className="flex justify-end gap-3 px-6 py-4 border-t bg-muted/20">
						<Button 
							onClick={() => setIsViewCustomerOpen(false)}
							className="px-8"
						>
							Close
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
