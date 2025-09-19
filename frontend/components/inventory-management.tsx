'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	PaginationEllipsis,
} from '@/components/ui/pagination';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
	Search,
	Filter,
	MoreHorizontal,
	Plus,
	Minus,
	Package,
	AlertTriangle,
	TrendingDown,
	RotateCcw,
} from 'lucide-react';

// Sample inventory data
const inventory = [
	{
		id: 1,
		name: 'Rose Gold Press-On Nails',
		sku: 'RGN-001',
		category: 'Press-On Nails',
		currentStock: 45,
		minStock: 10,
		maxStock: 100,
		cost: 75,
		supplier: 'Beauty Supplies Co.',
		lastRestocked: '2024-01-10',
		status: 'in_stock',
	},
	{
		id: 2,
		name: 'Diamond Stud Earrings',
		sku: 'DSE-002',
		category: 'Earrings',
		currentStock: 23,
		minStock: 15,
		maxStock: 50,
		cost: 150,
		supplier: 'Jewelry Wholesale Ltd.',
		lastRestocked: '2024-01-08',
		status: 'in_stock',
	},
	{
		id: 3,
		name: 'Vintage Gold Rings',
		sku: 'VGR-003',
		category: 'Rings',
		currentStock: 12,
		minStock: 20,
		maxStock: 40,
		cost: 100,
		supplier: 'Gold Craft Inc.',
		lastRestocked: '2024-01-05',
		status: 'low_stock',
	},
	{
		id: 4,
		name: 'Pearl Drop Earrings',
		sku: 'PDE-004',
		category: 'Earrings',
		currentStock: 8,
		minStock: 15,
		maxStock: 30,
		cost: 90,
		supplier: 'Pearl Paradise',
		lastRestocked: '2024-01-03',
		status: 'low_stock',
	},
	{
		id: 5,
		name: 'French Tip Nails',
		sku: 'FTN-005',
		category: 'Press-On Nails',
		currentStock: 2,
		minStock: 10,
		maxStock: 80,
		cost: 60,
		supplier: 'Beauty Supplies Co.',
		lastRestocked: '2023-12-28',
		status: 'critical',
	},
];

export function InventoryManagement() {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('all');
	const [selectedItem, setSelectedItem] = useState<(typeof inventory)[0] | null>(null);
	const [isRestockOpen, setIsRestockOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(5);

	const filteredInventory = inventory.filter((item) => {
		const matchesSearch =
			item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.sku.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedInventory = filteredInventory.slice(startIndex, endIndex);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, selectedCategory]);

	const categories = ['all', 'Press-On Nails', 'Earrings', 'Rings'];

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'in_stock':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
			case 'low_stock':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
			case 'critical':
				return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
		}
	};

	const lowStockItems = inventory.filter((item) => item.currentStock <= item.minStock);
	const criticalItems = inventory.filter((item) => item.status === 'critical');
	const totalValue = inventory.reduce((sum, item) => sum + item.currentStock * item.cost, 0);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-balance">Inventory</h1>
					<p className="text-muted-foreground">Monitor stock levels and manage inventory</p>
				</div>
				<Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
					<DialogTrigger asChild>
						<Button className="bg-primary hover:bg-primary/90">
							<RotateCcw className="mr-2 h-4 w-4" />
							Restock Items
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Restock Inventory</DialogTitle>
							<DialogDescription>Add stock to existing products</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>Select Product</Label>
								<Select>
									<SelectTrigger>
										<SelectValue placeholder="Choose product to restock" />
									</SelectTrigger>
									<SelectContent>
										{inventory.map((item) => (
											<SelectItem key={item.id} value={item.id.toString()}>
												{item.name} (Current: {item.currentStock})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Quantity to Add</Label>
								<Input type="number" placeholder="Enter quantity" />
							</div>
							<div className="space-y-2">
								<Label>Cost per Unit</Label>
								<Input type="number" placeholder="Enter cost" />
							</div>
						</div>
						<div className="flex justify-end space-x-2 pt-4">
							<Button variant="outline" onClick={() => setIsRestockOpen(false)}>
								Cancel
							</Button>
							<Button onClick={() => setIsRestockOpen(false)}>Add Stock</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-medium">Total Items</CardTitle>
						<Package className="h-3 w-3 text-muted-foreground" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg font-bold">{inventory.length}</div>
						<p className="text-xs text-muted-foreground">Products in inventory</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-medium">Low Stock</CardTitle>
						<AlertTriangle className="h-3 w-3 text-muted-foreground" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg font-bold text-yellow-600">{lowStockItems.length}</div>
						<p className="text-xs text-muted-foreground">Items need restocking</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-medium">Critical Stock</CardTitle>
						<TrendingDown className="h-3 w-3 text-muted-foreground" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg font-bold text-red-600">{criticalItems.length}</div>
						<p className="text-xs text-muted-foreground">Urgent attention needed</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-medium">Total Value</CardTitle>
						<Package className="h-3 w-3 text-muted-foreground" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg font-bold">LKR {totalValue.toLocaleString()}</div>
						<p className="text-xs text-muted-foreground">Inventory worth</p>
					</CardContent>
				</Card>
			</div>

			{/* Inventory Table */}
			<Card>
				<CardHeader>
					<CardTitle>Stock Management</CardTitle>
					<CardDescription>Monitor and manage your inventory levels</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center space-x-4 mb-6">
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search inventory..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Select value={selectedCategory} onValueChange={setSelectedCategory}>
							<SelectTrigger className="w-[180px]">
								<Filter className="mr-2 h-4 w-4" />
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{categories.map((category) => (
									<SelectItem key={category} value={category}>
										{category === 'all' ? 'All Categories' : category}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Product</TableHead>
									<TableHead>SKU</TableHead>
									<TableHead>Current Stock</TableHead>
									<TableHead>Min/Max</TableHead>
									<TableHead>Cost</TableHead>
									<TableHead>Supplier</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedInventory.map((item) => (
									<TableRow key={item.id}>
										<TableCell>
											<div>
												<div className="font-medium">{item.name}</div>
												<div className="text-sm text-muted-foreground">{item.category}</div>
											</div>
										</TableCell>
										<TableCell className="font-mono text-sm">{item.sku}</TableCell>
										<TableCell>
											<div className="flex items-center space-x-2">
												<span className="font-medium">{item.currentStock}</span>
												{item.currentStock <= item.minStock && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
											</div>
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{item.minStock} / {item.maxStock}
										</TableCell>
										<TableCell>LKR {item.cost}</TableCell>
										<TableCell className="text-sm">{item.supplier}</TableCell>
										<TableCell>
											<Badge className={getStatusColor(item.status)}>
												{item.status === 'in_stock'
													? 'In Stock'
													: item.status === 'low_stock'
														? 'Low Stock'
														: 'Critical'}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" className="h-8 w-8 p-0">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>Actions</DropdownMenuLabel>
													<DropdownMenuItem>
														<Plus className="mr-2 h-4 w-4" />
														Add Stock
													</DropdownMenuItem>
													<DropdownMenuItem>
														<Minus className="mr-2 h-4 w-4" />
														Remove Stock
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem>View History</DropdownMenuItem>
													<DropdownMenuItem>Edit Details</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{totalPages > 1 && (
						<div className="flex items-center justify-between space-x-2 py-4">
							<div className="text-sm text-muted-foreground">
								Showing {startIndex + 1} to {Math.min(endIndex, filteredInventory.length)} of {filteredInventory.length}{' '}
								items
							</div>
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
											className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
										/>
									</PaginationItem>

									{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
										if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
											return (
												<PaginationItem key={page}>
													<PaginationLink
														onClick={() => setCurrentPage(page)}
														isActive={currentPage === page}
														className="cursor-pointer"
													>
														{page}
													</PaginationLink>
												</PaginationItem>
											);
										} else if (page === currentPage - 2 || page === currentPage + 2) {
											return (
												<PaginationItem key={page}>
													<PaginationEllipsis />
												</PaginationItem>
											);
										}
										return null;
									})}

									<PaginationItem>
										<PaginationNext
											onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
											className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
