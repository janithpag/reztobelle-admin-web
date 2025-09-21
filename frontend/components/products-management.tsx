'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
	Plus,
	Search,
	Filter,
	MoreHorizontal,
	Edit,
	Trash2,
	Eye,
	Package,
	Star,
	TrendingUp,
	AlertCircle,
} from 'lucide-react';
import { Loading } from '@/components/ui/loading';

// Sample products data
const products = [
	{
		id: 1,
		name: 'Rose Gold Press-On Nails',
		sku: 'RGN-001', // Added SKU field
		category: 'Press-On Nails',
		price: 150,
		stock: 45,
		status: 'active',
		sales: 156,
		rating: 4.8,
		image: '/rose-gold-press-on-nails.jpg',
		description: 'Elegant rose gold press-on nails with a glossy finish',
	},
	{
		id: 2,
		name: 'Diamond Stud Earrings',
		sku: 'DSE-002', // Added SKU field
		category: 'Earrings',
		price: 299,
		stock: 23,
		status: 'active',
		sales: 134,
		rating: 4.9,
		image: '/diamond-stud-earrings.jpg',
		description: 'Classic diamond stud earrings in sterling silver',
	},
	{
		id: 3,
		name: 'Vintage Gold Rings',
		sku: 'VGR-003', // Added SKU field
		category: 'Rings',
		price: 199,
		stock: 12,
		status: 'active',
		sales: 98,
		rating: 4.7,
		image: '/vintage-gold-rings.jpg',
		description: 'Vintage-inspired gold rings with intricate detailing',
	},
	{
		id: 4,
		name: 'Pearl Drop Earrings',
		sku: 'PDE-004', // Added SKU field
		category: 'Earrings',
		price: 179,
		stock: 8,
		status: 'low_stock',
		sales: 87,
		rating: 4.6,
		image: '/pearl-drop-earrings.png',
		description: 'Elegant pearl drop earrings for special occasions',
	},
	{
		id: 5,
		name: 'French Tip Nails',
		sku: 'FTN-005', // Added SKU field
		category: 'Press-On Nails',
		price: 120,
		stock: 2,
		status: 'low_stock',
		sales: 76,
		rating: 4.5,
		image: '/french-tip-nails.jpg',
		description: 'Classic French tip press-on nails',
	},
	{
		id: 6,
		name: 'Silver Hoop Earrings',
		sku: 'SHE-006', // Added SKU field
		category: 'Earrings',
		price: 89,
		stock: 5,
		status: 'low_stock',
		sales: 65,
		rating: 4.4,
		image: '/silver-hoop-earrings.jpg',
		description: 'Modern silver hoop earrings in various sizes',
	},
];

export function ProductsManagement() {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('all');
	const [isAddProductOpen, setIsAddProductOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(5);
	const [isLoading, setIsLoading] = useState(true);
	const [productsData, setProductsData] = useState<any[]>([]);

	// Simulate loading products data
	useEffect(() => {
		const loadProducts = async () => {
			setIsLoading(true);
			try {
				// Simulate API call
				await new Promise(resolve => setTimeout(resolve, 1000));
				setProductsData(products);
			} catch (error) {
				console.error('Failed to load products:', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadProducts();
	}, []);

	const filteredProducts = productsData.filter((product) => {
		const matchesSearch =
			product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.sku.toLowerCase().includes(searchTerm.toLowerCase()); // Added SKU to search
		const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, selectedCategory]);

	const categories = ['all', 'Press-On Nails', 'Earrings', 'Rings'];

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold text-sidebar-foreground text-balance">Products</h1>
					<p className="text-sm sm:text-base text-sidebar-foreground/70 font-medium">
						Manage your fashion accessories inventory
					</p>
				</div>
				<Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
					<DialogTrigger asChild>
						<Button className="bg-primary hover:bg-primary/90 font-semibold w-full sm:w-auto" disabled={isLoading}>
							<Plus className="mr-2 h-4 w-4" />
							Add Product
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4">
						<DialogHeader>
							<DialogTitle className="text-base sm:text-lg text-sidebar-foreground font-semibold">
								Add New Product
							</DialogTitle>
							<DialogDescription className="text-sm text-sidebar-foreground/70 font-medium">
								Create a new product for your ReztoBelle collection
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="name" className="text-sm text-sidebar-foreground font-semibold">
										Product Name
									</Label>
									<Input id="name" placeholder="Enter product name" className="border-sidebar-border text-sm" />
								</div>
								<div className="space-y-2">
									<Label htmlFor="sku" className="text-sm text-sidebar-foreground font-semibold">
										SKU
									</Label>
									<Input id="sku" placeholder="Enter product SKU" className="border-sidebar-border text-sm" />
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="category" className="text-sm text-sidebar-foreground font-semibold">
										Category
									</Label>
									<Select>
										<SelectTrigger className="border-sidebar-border">
											<SelectValue placeholder="Select category" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="press-on-nails">Press-On Nails</SelectItem>
											<SelectItem value="earrings">Earrings</SelectItem>
											<SelectItem value="rings">Rings</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="price" className="text-sm text-sidebar-foreground font-semibold">
										Price (LKR)
									</Label>
									<Input id="price" type="number" placeholder="0.00" className="border-sidebar-border text-sm" />
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="stock" className="text-sm text-sidebar-foreground font-semibold">
										Stock Quantity
									</Label>
									<Input id="stock" type="number" placeholder="0" className="border-sidebar-border text-sm" />
								</div>
								<div className="space-y-2">
									<Label htmlFor="description" className="text-sm text-sidebar-foreground font-semibold">
										Description
									</Label>
									<Textarea
										id="description"
										placeholder="Enter product description"
										className="border-sidebar-border text-sm"
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="image" className="text-sm text-sidebar-foreground font-semibold">
									Product Image
								</Label>
								<Input id="image" type="file" accept="image/*" className="border-sidebar-border text-sm" />
							</div>
						</div>
						<div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
							<Button
								variant="outline"
								onClick={() => setIsAddProductOpen(false)}
								className="border-sidebar-border text-sidebar-foreground hover:bg-muted/50 font-medium w-full sm:w-auto"
							>
								Cancel
							</Button>
							<Button onClick={() => setIsAddProductOpen(false)} className="font-semibold w-full sm:w-auto">
								Add Product
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Loading State */}
			{isLoading ? (
				<div className="relative min-h-[600px] w-full">
					<Loading variant="overlay" text="Loading products..." />
				</div>
			) : (
				<>
					{/* Stats Cards */}
					<div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
				<Card className="border-sidebar-border">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-semibold text-sidebar-foreground">Total Products</CardTitle>
						<Package className="h-3 w-3 text-sidebar-foreground/70" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg sm:text-xl font-bold text-sidebar-foreground">{products.length}</div>
						<p className="text-xs text-sidebar-foreground/70 font-medium">Active inventory items</p>
					</CardContent>
				</Card>

				<Card className="border-sidebar-border">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-semibold text-sidebar-foreground">Best Seller</CardTitle>
						<Star className="h-3 w-3 text-sidebar-foreground/70" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-sm sm:text-lg lg:text-xl font-bold text-sidebar-foreground">Rose Gold Nails</div>
						<p className="text-xs text-sidebar-foreground/70 font-medium">156 units sold</p>
					</CardContent>
				</Card>

				<Card className="border-sidebar-border">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-semibold text-sidebar-foreground">Total Revenue</CardTitle>
						<TrendingUp className="h-3 w-3 text-sidebar-foreground/70" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg sm:text-xl font-bold text-sidebar-foreground">LKR 1,24,500</div>
						<p className="text-xs text-sidebar-foreground/70 font-medium">From product sales</p>
					</CardContent>
				</Card>

				<Card className="border-orange-200 dark:border-orange-800">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-semibold text-sidebar-foreground">Low Stock</CardTitle>
						<AlertCircle className="h-3 w-3 text-orange-500" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg sm:text-xl font-bold text-orange-600">3</div>
						<p className="text-xs text-orange-600 font-medium">Items need restocking</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters and Search */}
			<Card className="border-sidebar-border">
				<CardHeader>
					<CardTitle className="text-base sm:text-lg text-sidebar-foreground font-semibold">
						Product Inventory
					</CardTitle>
					<CardDescription className="text-sm text-sidebar-foreground/70 font-medium">
						View and manage all your products
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
						<div className="relative flex-1 max-w-full sm:max-w-sm">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/70" />
							<Input
								placeholder="Search products..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10 border-sidebar-border text-sm"
							/>
						</div>
						<Select value={selectedCategory} onValueChange={setSelectedCategory}>
							<SelectTrigger className="w-full sm:w-[180px] border-sidebar-border">
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

					{/* Products Table */}
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="border-sidebar-border">
									<TableHead className="text-sidebar-foreground font-semibold text-xs sm:text-sm">Product</TableHead>
									<TableHead className="text-sidebar-foreground font-semibold text-xs sm:text-sm hidden lg:table-cell">
										SKU
									</TableHead>
									<TableHead className="text-sidebar-foreground font-semibold text-xs sm:text-sm hidden md:table-cell">
										Category
									</TableHead>
									<TableHead className="text-sidebar-foreground font-semibold text-xs sm:text-sm">Price</TableHead>
									<TableHead className="text-sidebar-foreground font-semibold text-xs sm:text-sm">Stock</TableHead>
									<TableHead className="text-sidebar-foreground font-semibold text-xs sm:text-sm hidden sm:table-cell">
										Sales
									</TableHead>
									<TableHead className="text-sidebar-foreground font-semibold text-xs sm:text-sm hidden lg:table-cell">
										Rating
									</TableHead>
									<TableHead className="text-sidebar-foreground font-semibold text-xs sm:text-sm">Status</TableHead>
									<TableHead className="text-right text-sidebar-foreground font-semibold text-xs sm:text-sm">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedProducts.map((product) => (
									<TableRow key={product.id} className="border-sidebar-border">
										<TableCell>
											<div className="flex items-center space-x-2 sm:space-x-3">
												<Image
													src={product.image || '/placeholder.svg'}
													alt={product.name}
													className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover flex-shrink-0"
													width={40}
													height={40}
												/>
												<div className="min-w-0">
													<div className="font-semibold text-sidebar-foreground text-xs sm:text-sm truncate">
														{product.name}
													</div>
													<div className="text-xs text-sidebar-foreground/70 font-medium truncate max-w-[120px] sm:max-w-[200px] hidden sm:block">
														{product.description}
													</div>
													<div className="text-xs text-sidebar-foreground/70 font-medium sm:hidden md:hidden">
														{product.category} • {product.sku}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell className="text-sidebar-foreground font-medium text-xs sm:text-sm hidden lg:table-cell">
											{product.sku}
										</TableCell>
										<TableCell className="text-sidebar-foreground font-medium text-xs sm:text-sm hidden md:table-cell">
											{product.category}
										</TableCell>
										<TableCell className="text-sidebar-foreground font-semibold text-xs sm:text-sm">
											LKR {product.price}
										</TableCell>
										<TableCell>
											<div className="flex items-center space-x-1 sm:space-x-2">
												<span className="text-sidebar-foreground font-medium text-xs sm:text-sm">{product.stock}</span>
												{product.stock <= 10 && (
													<Badge variant="destructive" className="text-xs font-medium">
														Low
													</Badge>
												)}
											</div>
										</TableCell>
										<TableCell className="text-sidebar-foreground font-medium text-xs sm:text-sm hidden sm:table-cell">
											{product.sales}
										</TableCell>
										<TableCell className="hidden lg:table-cell">
											<div className="flex items-center space-x-1">
												<Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
												<span className="text-sidebar-foreground font-medium text-xs sm:text-sm">{product.rating}</span>
											</div>
										</TableCell>
										<TableCell>
											<Badge
												variant={product.status === 'active' ? 'default' : 'secondary'}
												className={
													product.status === 'active'
														? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 font-medium text-xs'
														: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 font-medium text-xs'
												}
											>
												{product.status === 'active' ? 'Active' : 'Low Stock'}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted/50">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel className="text-sidebar-foreground font-semibold">
														Actions
													</DropdownMenuLabel>
													<DropdownMenuItem className="text-sidebar-foreground font-medium">
														<Eye className="mr-2 h-4 w-4" />
														View Details
													</DropdownMenuItem>
													<DropdownMenuItem className="text-sidebar-foreground font-medium">
														<Edit className="mr-2 h-4 w-4" />
														Edit Product
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem className="text-red-600 font-medium">
														<Trash2 className="mr-2 h-4 w-4" />
														Delete Product
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* Pagination Controls */}
					{totalPages > 1 && (
						<div className="flex items-center justify-between space-x-2 py-4">
							<div className="text-sm text-muted-foreground">
								Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length}{' '}
								products
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
				</>
			)}
		</div>
	);
}
