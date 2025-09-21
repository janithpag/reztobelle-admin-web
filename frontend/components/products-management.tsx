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
import { ImageUpload } from '@/components/image-upload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
	Plus,
	Search,
	Filter,
	Edit,
	Trash2,
	Eye,
	Package,
	Star,
	TrendingUp,
	AlertCircle,
} from 'lucide-react';
import { productsAPI } from '@/lib/api';

// Types for product and uploaded image
interface UploadedImage {
	public_id: string;
	url: string;
	secure_url: string;
	width: number;
	height: number;
	format: string;
	bytes: number;
}

// Product interface matching backend Prisma model
interface Product {
	id: string;
	name: string;
	description?: string;
	price: number;
	sku: string;
	category: string;
	stock: number;
	images: string[];
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

interface ProductFormData {
	name: string;
	description: string;
	price: string;
	sku: string;
	category: string;
	stock: string;
	images: UploadedImage[];
}
import { Loading } from '@/components/ui/loading';

export function ProductsManagement() {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('all');
	const [isAddProductOpen, setIsAddProductOpen] = useState(false);
	const [isEditProductOpen, setIsEditProductOpen] = useState(false);
	const [isViewProductOpen, setIsViewProductOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(5);
	const [isLoading, setIsLoading] = useState(true);
	const [productsData, setProductsData] = useState<Product[]>([]);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
	const [error, setError] = useState<string | null>(null);
	
	// Form state for adding products
	const [productForm, setProductForm] = useState<ProductFormData>({
		name: '',
		description: '',
		price: '',
		sku: '',
		category: 'Press-On Nails', // Default category
		stock: '',
		images: [],
	});

	const resetForm = () => {
		setProductForm({
			name: '',
			description: '',
			price: '',
			sku: '',
			category: 'Press-On Nails', // Default category
			stock: '',
			images: [],
		});
	};

	const loadProducts = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await productsAPI.getProducts();
			setProductsData(response.products || []);
		} catch (error) {
			console.error('Failed to load products:', error);
			setError('Failed to load products. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleFormSubmit = async () => {
		try {
			setIsLoading(true);
			
			// Convert uploaded images to URLs
			const imageUrls = productForm.images.map(img => img.secure_url);
			
			await productsAPI.createProduct({
				name: productForm.name,
				description: productForm.description || undefined,
				price: parseFloat(productForm.price),
				sku: productForm.sku,
				category: productForm.category,
				stock: parseInt(productForm.stock) || 0,
				images: imageUrls,
				isActive: true,
			});
			
			setIsAddProductOpen(false);
			resetForm();
			await loadProducts(); // Reload products
		} catch (error) {
			console.error('Error creating product:', error);
			setError('Failed to create product. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleEditProduct = (product: Product) => {
		setEditingProduct(product);
		setProductForm({
			name: product.name,
			description: product.description || '',
			price: product.price.toString(),
			sku: product.sku,
			category: product.category,
			stock: product.stock.toString(),
			images: product.images.map(url => ({
				public_id: '',
				url,
				secure_url: url,
				width: 0,
				height: 0,
				format: '',
				bytes: 0
			})),
		});
		setIsEditProductOpen(true);
	};

	const handleUpdateProduct = async () => {
		if (!editingProduct) return;
		
		try {
			setIsLoading(true);
			
			// Convert uploaded images to URLs
			const imageUrls = productForm.images.map(img => img.secure_url);
			
			await productsAPI.updateProduct(editingProduct.id, {
				name: productForm.name,
				description: productForm.description || undefined,
				price: parseFloat(productForm.price),
				sku: productForm.sku,
				category: productForm.category,
				stock: parseInt(productForm.stock) || 0,
				images: imageUrls,
			});
			
			setIsEditProductOpen(false);
			setEditingProduct(null);
			resetForm();
			await loadProducts(); // Reload products
		} catch (error) {
			console.error('Error updating product:', error);
			setError('Failed to update product. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleViewProduct = (productId: string) => {
		const product = productsData.find(p => p.id === productId);
		if (product) {
			setViewingProduct(product);
			setIsViewProductOpen(true);
		}
	};

	const handleDeleteProduct = async (productId: string) => {
		if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
			return;
		}
		
		try {
			setIsLoading(true);
			await productsAPI.deleteProduct(productId);
			await loadProducts(); // Reload products
		} catch (error) {
			console.error('Error deleting product:', error);
			setError('Failed to delete product. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	// Load products on component mount
	useEffect(() => {
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

	// Calculate stats from products data
	const totalProducts = productsData.length;
	const lowStockProducts = productsData.filter(product => product.stock <= 10);
	const totalRevenue = productsData.reduce((sum, product) => sum + Number(product.price), 0);
	const bestSellerProduct = productsData.length > 0 ? productsData[0] : null;

	const categories = ['all', 'Press-On Nails', 'Earrings', 'Rings'];

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Error Alert */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

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
									<Input
										id="name"
										placeholder="Enter product name"
										value={productForm.name}
										onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
										className="border-sidebar-border text-sm"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="sku" className="text-sm text-sidebar-foreground font-semibold">
										SKU
									</Label>
									<Input
										id="sku"
										placeholder="Enter product SKU"
										value={productForm.sku}
										onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
										className="border-sidebar-border text-sm"
									/>
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="category" className="text-sm text-sidebar-foreground font-semibold">
										Category
									</Label>
									<Select value={productForm.category} onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}>
										<SelectTrigger className="border-sidebar-border">
											<SelectValue placeholder="Select category" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Press-On Nails">Press-On Nails</SelectItem>
											<SelectItem value="Earrings">Earrings</SelectItem>
											<SelectItem value="Rings">Rings</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="price" className="text-sm text-sidebar-foreground font-semibold">
										Price (LKR)
									</Label>
									<Input
										id="price"
										type="number"
										step="0.01"
										placeholder="0.00"
										value={productForm.price}
										onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
										className="border-sidebar-border text-sm"
									/>
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="stock" className="text-sm text-sidebar-foreground font-semibold">
										Stock Quantity
									</Label>
									<Input
										id="stock"
										type="number"
										placeholder="0"
										value={productForm.stock}
										onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
										className="border-sidebar-border text-sm"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="description" className="text-sm text-sidebar-foreground font-semibold">
										Description
									</Label>
									<Textarea
										id="description"
										placeholder="Enter product description"
										value={productForm.description}
										onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
										className="border-sidebar-border text-sm"
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label className="text-sm text-sidebar-foreground font-semibold">
									Product Images
								</Label>
								<ImageUpload
									onImagesChange={(images) => setProductForm(prev => ({ ...prev, images }))}
									initialImages={productForm.images}
									maxImages={5}
									maxFileSize={10}
									className="w-full"
								/>
							</div>
						</div>
						<div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
							<Button
								variant="outline"
								onClick={() => {
									setIsAddProductOpen(false);
									resetForm();
								}}
								className="border-sidebar-border text-sidebar-foreground hover:bg-muted/50 font-medium w-full sm:w-auto"
							>
								Cancel
							</Button>
							<Button onClick={handleFormSubmit} className="font-semibold w-full sm:w-auto">
								Add Product
							</Button>
						</div>
					</DialogContent>
				</Dialog>

				{/* Edit Product Dialog */}
				<Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
					<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4">
						<DialogHeader>
							<DialogTitle className="text-base sm:text-lg text-sidebar-foreground font-semibold">
								Edit Product
							</DialogTitle>
							<DialogDescription className="text-sm text-sidebar-foreground/70 font-medium">
								Update the product details for your ReztoBelle collection
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="edit-name" className="text-sm text-sidebar-foreground font-semibold">
										Product Name
									</Label>
									<Input
										id="edit-name"
										placeholder="Enter product name"
										value={productForm.name}
										onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
										className="border-sidebar-border text-sm"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="edit-sku" className="text-sm text-sidebar-foreground font-semibold">
										SKU
									</Label>
									<Input
										id="edit-sku"
										placeholder="Enter product SKU"
										value={productForm.sku}
										onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
										className="border-sidebar-border text-sm"
									/>
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="edit-category" className="text-sm text-sidebar-foreground font-semibold">
										Category
									</Label>
									<Select value={productForm.category} onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}>
										<SelectTrigger className="border-sidebar-border">
											<SelectValue placeholder="Select category" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Press-On Nails">Press-On Nails</SelectItem>
											<SelectItem value="Earrings">Earrings</SelectItem>
											<SelectItem value="Rings">Rings</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="edit-price" className="text-sm text-sidebar-foreground font-semibold">
										Price (LKR)
									</Label>
									<Input
										id="edit-price"
										type="number"
										step="0.01"
										placeholder="0.00"
										value={productForm.price}
										onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
										className="border-sidebar-border text-sm"
									/>
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="edit-stock" className="text-sm text-sidebar-foreground font-semibold">
										Stock Quantity
									</Label>
									<Input
										id="edit-stock"
										type="number"
										placeholder="0"
										value={productForm.stock}
										onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
										className="border-sidebar-border text-sm"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="edit-description" className="text-sm text-sidebar-foreground font-semibold">
										Description
									</Label>
									<Textarea
										id="edit-description"
										placeholder="Enter product description"
										value={productForm.description}
										onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
										className="border-sidebar-border text-sm"
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label className="text-sm text-sidebar-foreground font-semibold">
									Product Images
								</Label>
								<ImageUpload
									onImagesChange={(images) => setProductForm(prev => ({ ...prev, images }))}
									initialImages={productForm.images}
									maxImages={5}
									maxFileSize={10}
									className="w-full"
								/>
							</div>
						</div>
						<div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
							<Button
								variant="outline"
								onClick={() => {
									setIsEditProductOpen(false);
									setEditingProduct(null);
									resetForm();
								}}
								className="border-sidebar-border text-sidebar-foreground hover:bg-muted/50 font-medium w-full sm:w-auto"
							>
								Cancel
							</Button>
							<Button onClick={handleUpdateProduct} className="font-semibold w-full sm:w-auto">
								Update Product
							</Button>
						</div>
					</DialogContent>
				</Dialog>

				{/* View Product Dialog */}
				<Dialog open={isViewProductOpen} onOpenChange={setIsViewProductOpen}>
					<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4">
						<DialogHeader>
							<DialogTitle className="text-base sm:text-lg text-sidebar-foreground font-semibold">
								Product Details
							</DialogTitle>
							<DialogDescription className="text-sm text-sidebar-foreground/70 font-medium">
								View detailed information about this product
							</DialogDescription>
						</DialogHeader>
						{viewingProduct && (
							<div className="grid gap-4 py-4">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<Label className="text-sm text-sidebar-foreground font-semibold">Product Name</Label>
										<p className="text-sm text-sidebar-foreground/80 mt-1">{viewingProduct.name}</p>
									</div>
									<div>
										<Label className="text-sm text-sidebar-foreground font-semibold">SKU</Label>
										<p className="text-sm text-sidebar-foreground/80 mt-1">{viewingProduct.sku}</p>
									</div>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<Label className="text-sm text-sidebar-foreground font-semibold">Category</Label>
										<p className="text-sm text-sidebar-foreground/80 mt-1">{viewingProduct.category}</p>
									</div>
									<div>
										<Label className="text-sm text-sidebar-foreground font-semibold">Price</Label>
										<p className="text-sm text-sidebar-foreground/80 mt-1">LKR {Number(viewingProduct.price).toFixed(2)}</p>
									</div>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<Label className="text-sm text-sidebar-foreground font-semibold">Stock</Label>
										<p className="text-sm text-sidebar-foreground/80 mt-1">{viewingProduct.stock} units</p>
									</div>
									<div>
										<Label className="text-sm text-sidebar-foreground font-semibold">Status</Label>
										<Badge
											variant={viewingProduct.isActive ? 'default' : 'secondary'}
											className="mt-1"
										>
											{viewingProduct.isActive ? 'Active' : 'Inactive'}
										</Badge>
									</div>
								</div>
								{viewingProduct.description && (
									<div>
										<Label className="text-sm text-sidebar-foreground font-semibold">Description</Label>
										<p className="text-sm text-sidebar-foreground/80 mt-1">{viewingProduct.description}</p>
									</div>
								)}
								{viewingProduct.images && viewingProduct.images.length > 0 && (
									<div>
										<Label className="text-sm text-sidebar-foreground font-semibold">Images</Label>
										<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
											{viewingProduct.images.map((imageUrl, index) => (
												<Image
													key={index}
													src={imageUrl}
													alt={`${viewingProduct.name} ${index + 1}`}
													className="w-full h-24 object-cover rounded-lg"
													width={100}
													height={100}
												/>
											))}
										</div>
									</div>
								)}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<Label className="text-sm text-sidebar-foreground font-semibold">Created</Label>
										<p className="text-sm text-sidebar-foreground/80 mt-1">{new Date(viewingProduct.createdAt).toLocaleDateString()}</p>
									</div>
									<div>
										<Label className="text-sm text-sidebar-foreground font-semibold">Last Updated</Label>
										<p className="text-sm text-sidebar-foreground/80 mt-1">{new Date(viewingProduct.updatedAt).toLocaleDateString()}</p>
									</div>
								</div>
							</div>
						)}
						<div className="flex justify-end">
							<Button
								variant="outline"
								onClick={() => {
									setIsViewProductOpen(false);
									setViewingProduct(null);
								}}
								className="border-sidebar-border text-sidebar-foreground hover:bg-muted/50 font-medium"
							>
								Close
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
						<div className="text-lg sm:text-xl font-bold text-sidebar-foreground">{totalProducts}</div>
						<p className="text-xs text-sidebar-foreground/70 font-medium">Active inventory items</p>
					</CardContent>
				</Card>

				<Card className="border-sidebar-border">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-semibold text-sidebar-foreground">Best Seller</CardTitle>
						<Star className="h-3 w-3 text-sidebar-foreground/70" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-sm sm:text-lg lg:text-xl font-bold text-sidebar-foreground">
							{bestSellerProduct ? bestSellerProduct.name : 'No products'}
						</div>
						<p className="text-xs text-sidebar-foreground/70 font-medium">
							{bestSellerProduct ? `Stock: ${bestSellerProduct.stock}` : 'Add products to see data'}
						</p>
					</CardContent>
				</Card>

				<Card className="border-sidebar-border">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-semibold text-sidebar-foreground">Total Value</CardTitle>
						<TrendingUp className="h-3 w-3 text-sidebar-foreground/70" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg sm:text-xl font-bold text-sidebar-foreground">LKR {totalRevenue.toFixed(2)}</div>
						<p className="text-xs text-sidebar-foreground/70 font-medium">Inventory value</p>
					</CardContent>
				</Card>

				<Card className="border-orange-200 dark:border-orange-800">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-semibold text-sidebar-foreground">Low Stock</CardTitle>
						<AlertCircle className="h-3 w-3 text-orange-500" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg sm:text-xl font-bold text-orange-600">{lowStockProducts.length}</div>
						<p className="text-xs text-orange-600 font-medium">Items need restocking</p>
					</CardContent>
				</Card>
			</div>			{/* Filters and Search */}
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
										Created
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
													src={(product.images && product.images[0]) || '/placeholder.svg'}
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
											LKR {Number(product.price).toFixed(2)}
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
											{new Date(product.createdAt).toLocaleDateString()}
										</TableCell>
										<TableCell>
											<Badge
												variant={product.isActive ? 'default' : 'secondary'}
												className={
													product.isActive
														? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 font-medium text-xs'
														: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 font-medium text-xs'
												}
											>
												{product.isActive ? 'Active' : 'Inactive'}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end space-x-1">
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 p-0 hover:bg-muted/50"
													onClick={() => handleViewProduct(product.id)}
													title="View Product"
												>
													<Eye className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 p-0 hover:bg-muted/50"
													onClick={() => handleEditProduct(product)}
													title="Edit Product"
												>
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 p-0 hover:bg-muted/50 text-red-600 hover:text-red-700"
													onClick={() => handleDeleteProduct(product.id)}
													title="Delete Product"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
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
