'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogBody,
	DialogFooter,
} from '@/components/ui/dialog';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/image-upload';
import { Switch } from '@/components/ui/switch';
import {
	Plus,
	Search,
	Edit2,
	Trash2,
	Eye,
	Package,
	Star,
	AlertCircle,
} from 'lucide-react';
import { productsAPI, categoriesAPI } from '@/lib/api';
import { Product, Category, UploadedImage, CreateProductForm, UpdateProductForm } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProductFormData {
	name: string;
	description: string;
	shortDescription: string;
	price: string;
	costPrice: string;
	sku: string;
	categoryId: string;
	material: string;
	color: string;
	size: string;
	weight: string;
	dimensions: string;
	brand: string;
	metaTitle: string;
	metaDescription: string;
	initialStock: string;
	isActive: boolean;
	isFeatured: boolean;
	images: UploadedImage[];
}

export function ProductsManagement() {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
	const [isAddProductOpen, setIsAddProductOpen] = useState(false);
	const [isEditProductOpen, setIsEditProductOpen] = useState(false);
	const [isViewProductOpen, setIsViewProductOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);
	const [isLoading, setIsLoading] = useState(true);
	const [productsData, setProductsData] = useState<Product[]>([]);
	const [categoriesData, setCategoriesData] = useState<Category[]>([]);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

	// Form state for adding/editing products
	const [productForm, setProductForm] = useState<ProductFormData>({
		name: '',
		description: '',
		shortDescription: '',
		price: '',
		costPrice: '',
		sku: '',
		categoryId: '',
		material: '',
		color: '',
		size: '',
		weight: '',
		dimensions: '',
		brand: '',
		metaTitle: '',
		metaDescription: '',
		initialStock: '',
		isActive: true,
		isFeatured: false,
		images: [],
	});

	const resetForm = () => {
		setProductForm({
			name: '',
			description: '',
			shortDescription: '',
			price: '',
			costPrice: '',
			sku: '',
			categoryId: '',
			material: '',
			color: '',
			size: '',
			weight: '',
			dimensions: '',
			brand: '',
			metaTitle: '',
			metaDescription: '',
			initialStock: '',
			isActive: true,
			isFeatured: false,
			images: [],
		});
	};

	const loadProducts = useCallback(async () => {
		setIsLoading(true);
		try {
			const params: any = {};
			if (selectedCategory !== 'all') {
				params.categoryId = selectedCategory;
			}
			if (searchTerm) {
				params.search = searchTerm;
			}
			const response = await productsAPI.getProducts(params);
			setProductsData(response.products || []);
		} catch (error) {
			console.error('Failed to load products:', error);
			toast.error('Failed to load products');
		} finally {
			setIsLoading(false);
		}
	}, [selectedCategory, searchTerm]);

	const loadCategories = async () => {
		try {
			const response = await categoriesAPI.getCategories();
			setCategoriesData(response.categories || []);
		} catch (error) {
			console.error('Failed to load categories:', error);
			toast.error('Failed to load categories');
		}
	};

	// Load data on component mount and when filters change
	useEffect(() => {
		loadCategories();
	}, []);

	useEffect(() => {
		loadProducts();
	}, [loadProducts]);

	const handleFormSubmit = async () => {
		try {
			// Validate required fields
			if (!productForm.name || !productForm.price || !productForm.costPrice || !productForm.sku || !productForm.categoryId) {
				toast.error('Please fill in all required fields (name, price, cost price, SKU, category)');
				return;
			}

			const productData: CreateProductForm = {
				name: productForm.name,
				description: productForm.description || undefined,
				shortDescription: productForm.shortDescription || undefined,
				price: parseFloat(productForm.price),
				costPrice: parseFloat(productForm.costPrice),
				sku: productForm.sku,
				categoryId: parseInt(productForm.categoryId),
				material: productForm.material || undefined,
				color: productForm.color || undefined,
				size: productForm.size || undefined,
				weight: productForm.weight ? parseFloat(productForm.weight) : undefined,
				dimensions: productForm.dimensions || undefined,
				brand: productForm.brand || undefined,
				metaTitle: productForm.metaTitle || undefined,
				metaDescription: productForm.metaDescription || undefined,
				isActive: productForm.isActive,
				isFeatured: productForm.isFeatured,
				images: productForm.images,
				initialStock: productForm.initialStock ? parseInt(productForm.initialStock) : 0
			};

			if (editingProduct) {
				// Update existing product
				const updateData: UpdateProductForm = { ...productData };
				delete (updateData as any).initialStock; // Remove initialStock for updates
				
				await productsAPI.updateProduct(editingProduct.id, updateData);
				toast.success('Product updated successfully');
				setIsEditProductOpen(false);
				setEditingProduct(null);
			} else {
				// Create new product
				await productsAPI.createProduct(productData);
				toast.success('Product created successfully');
				setIsAddProductOpen(false);
			}

			resetForm();
			loadProducts(); // Refresh products list
		} catch (error: any) {
			console.error('Failed to save product:', error);
			toast.error(error.response?.data?.error || 'Failed to save product');
		}
	};

	const handleEditProduct = (product: Product) => {
		setEditingProduct(product);
		setProductForm({
			name: product.name,
			description: product.description || '',
			shortDescription: product.shortDescription || '',
			price: product.price.toString(),
			costPrice: product.costPrice.toString(),
			sku: product.sku,
			categoryId: product.categoryId.toString(),
			material: product.material || '',
			color: product.color || '',
			size: product.size || '',
			weight: product.weight?.toString() || '',
			dimensions: product.dimensions || '',
			brand: product.brand || '',
			metaTitle: product.metaTitle || '',
			metaDescription: product.metaDescription || '',
			initialStock: '0', // Not used for updates
			isActive: product.isActive,
			isFeatured: product.isFeatured,
			images: (product.images || []).map(img => ({
				public_id: img.cloudinaryId,
				url: img.imageUrl,
				secure_url: img.imageUrl,
				width: 0,
				height: 0,
				format: '',
				bytes: 0
			})),
		});
		setIsEditProductOpen(true);
	};

	const handleViewProduct = (product: Product) => {
		setViewingProduct(product);
		setIsViewProductOpen(true);
	};

	const handleDeleteProduct = async () => {
		try {
			if (!selectedProduct) return;

			await productsAPI.deleteProduct(selectedProduct.id);
			toast.success('Product deleted successfully');
			setIsDeleteDialogOpen(false);
			setSelectedProduct(null);
			loadProducts();
		} catch (error: any) {
			console.error('Error deleting product:', error);
			toast.error(error.response?.data?.error || 'Failed to delete product');
		}
	};

	// Open delete dialog
	const openDeleteDialog = (product: Product) => {
		setSelectedProduct(product);
		setIsDeleteDialogOpen(true);
	};

	// Filter products based on search term and category
	const filteredProducts = productsData.filter((product) => {
		const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.sku.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	// Pagination
	const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
	const paginatedProducts = filteredProducts.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// Stats
	const totalProducts = productsData.length;
	const activeProducts = productsData.filter(product => product.isActive).length;
	const lowStockProducts = productsData.filter(product => 
		product.inventory && product.inventory.quantityAvailable <= product.inventory.reorderLevel
	).length;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Products</h1>
					<p className="text-muted-foreground">
						Manage your product catalog, inventory, and pricing
					</p>
				</div>
				<Dialog open={isAddProductOpen} onOpenChange={(open) => {
					setIsAddProductOpen(open);
					if (!open) {
						resetForm();
					}
				}}>
					<DialogTrigger asChild>
						<Button className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white">
							<Plus className="mr-2 h-4 w-4" />
							Add Product
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[800px] w-full">
						<DialogHeader>
							<DialogTitle>Add New Product</DialogTitle>
							<DialogDescription>
								Create a new product with all the necessary details.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-6 p-6 max-h-[80vh] overflow-y-auto">
							<div className="grid grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label htmlFor="name" className="text-sm font-medium">Product Name *</Label>
									<Input
										id="name"
										value={productForm.name}
										onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
										placeholder="Enter product name"
										className="w-full"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="sku" className="text-sm font-medium">SKU *</Label>
									<Input
										id="sku"
										value={productForm.sku}
										onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
										placeholder="Enter SKU"
										className="w-full"
									/>
								</div>
							</div>
							
							<div className="space-y-2">
								<Label htmlFor="description" className="text-sm font-medium">Description</Label>
								<Textarea
									id="description"
									value={productForm.description}
									onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
									placeholder="Enter product description"
									className="w-full min-h-[100px] resize-none"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="shortDescription" className="text-sm font-medium">Short Description</Label>
								<Input
									id="shortDescription"
									value={productForm.shortDescription}
									onChange={(e) => setProductForm(prev => ({ ...prev, shortDescription: e.target.value }))}
									placeholder="Brief product description"
									className="w-full"
								/>
							</div>

							<div className="grid grid-cols-3 gap-6">
								<div className="space-y-2">
									<Label htmlFor="price" className="text-sm font-medium">Selling Price *</Label>
									<Input
										id="price"
										type="number"
										step="0.01"
										min="0"
										value={productForm.price}
										onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
										placeholder="0.00"
										className="w-full"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="costPrice" className="text-sm font-medium">Cost Price *</Label>
									<Input
										id="costPrice"
										type="number"
										step="0.01"
										min="0"
										value={productForm.costPrice}
										onChange={(e) => setProductForm(prev => ({ ...prev, costPrice: e.target.value }))}
										placeholder="0.00"
										className="w-full"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="category" className="text-sm font-medium">Category *</Label>
									<Select
										value={productForm.categoryId}
										onValueChange={(value) => setProductForm(prev => ({ ...prev, categoryId: value }))}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select category" />
										</SelectTrigger>
										<SelectContent>
											{categoriesData.map((category) => (
												<SelectItem key={category.id} value={category.id.toString()}>
													{category.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid grid-cols-3 gap-6">
								<div className="space-y-2">
									<Label htmlFor="brand" className="text-sm font-medium">Brand</Label>
									<Input
										id="brand"
										value={productForm.brand}
										onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
										placeholder="Enter brand name"
										className="w-full"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="initialStock" className="text-sm font-medium">Initial Stock</Label>
									<Input
										id="initialStock"
										type="number"
										min="0"
										value={productForm.initialStock}
										onChange={(e) => setProductForm(prev => ({ ...prev, initialStock: e.target.value }))}
										placeholder="0"
										className="w-full"
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-medium">Status Options</Label>
									<div className="flex flex-col space-y-3 pt-2">
										<div className="flex items-center space-x-2">
											<Switch
												id="isActive"
												checked={productForm.isActive}
												onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isActive: checked }))}
											/>
											<Label htmlFor="isActive" className="text-sm font-medium">Active</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Switch
												id="isFeatured"
												checked={productForm.isFeatured}
												onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isFeatured: checked }))}
											/>
											<Label htmlFor="isFeatured" className="text-sm font-medium">Featured</Label>
										</div>
									</div>
								</div>
							</div>							<div className="space-y-2">
								<Label className="text-sm font-medium">Product Images (Optional)</Label>
								<ImageUpload
									initialImages={productForm.images}
									onImagesChange={(images) => setProductForm(prev => ({ ...prev, images }))}
									maxImages={5}
									maxFileSize={5}
									className="mt-2"
								/>
							</div>
						</div>
						<div className="flex justify-end gap-3 px-6 py-4 border-t">
							<Button variant="outline" onClick={() => {
								setIsAddProductOpen(false);
								resetForm();
							}}>
								Cancel
							</Button>
							<Button onClick={handleFormSubmit} className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white">
								Create Product
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Products</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalProducts}</div>
						<p className="text-xs text-muted-foreground">
							{activeProducts} active products
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
						<AlertCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{lowStockProducts}</div>
						<p className="text-xs text-muted-foreground">
							Items need restocking
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Featured Products</CardTitle>
						<Star className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{productsData.filter(p => p.isFeatured).length}
						</div>
						<p className="text-xs text-muted-foreground">
							Highlighted products
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Search and Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search products..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
				<Select
					value={selectedCategory === 'all' ? 'all' : selectedCategory.toString()}
					onValueChange={(value) => setSelectedCategory(value === 'all' ? 'all' : parseInt(value))}
				>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder="Filter by category" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Categories</SelectItem>
						{categoriesData.map((category) => (
							<SelectItem key={category.id} value={category.id.toString()}>
								{category.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Products Table */}
			<Card>
				<CardHeader>
					<CardTitle>Products ({filteredProducts.length})</CardTitle>
					<CardDescription>
						All products in your catalog
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<div className="text-muted-foreground">Loading products...</div>
						</div>
					) : filteredProducts.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-8 text-center">
							<Package className="h-12 w-12 text-muted-foreground mb-4" />
							<h3 className="text-lg font-medium text-muted-foreground mb-2">
								{productsData.length === 0 ? 'No products yet' : 'No products match your search'}
							</h3>
							<p className="text-sm text-muted-foreground max-w-sm mb-4">
								{productsData.length === 0
									? 'Get started by creating your first product using the "Add Product" button above.'
									: 'Try adjusting your search terms to find what you\'re looking for.'}
							</p>
						</div>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Product</TableHead>
										<TableHead>Category</TableHead>
										<TableHead>Price</TableHead>
										<TableHead>Stock</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="w-[70px]">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{paginatedProducts.map((product) => (
										<TableRow key={product.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<div className="relative w-10 h-10">
														<Image
															src={product.images?.[0]?.imageUrl || '/placeholder.svg'}
															alt={product.name}
															fill
															className="object-cover rounded"
														/>
													</div>
													<div>
														<div className="font-medium">{product.name}</div>
														<div className="text-sm text-muted-foreground">
															SKU: {product.sku}
														</div>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<span className="text-sm">{product.category?.name}</span>
											</TableCell>
											<TableCell>
												<div className="font-medium">LKR {product.price}</div>
												<div className="text-sm text-muted-foreground">
													Cost: LKR {product.costPrice}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center space-x-2">
													<span className="font-medium">
														{product.inventory?.quantityAvailable || 0}
													</span>
													{product.inventory && product.inventory.quantityAvailable <= product.inventory.reorderLevel && (
														<Badge variant="destructive" className="text-xs">
															Low Stock
														</Badge>
													)}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center space-x-2">
													<Badge
														variant={product.isActive ? 'default' : 'secondary'}
														className={cn(
															"text-xs",
															product.isActive
																? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600"
																: "bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
														)}
													>
														{product.isActive ? 'Active' : 'Inactive'}
													</Badge>
													{product.isFeatured && (
														<Badge 
															variant="outline"
															className="text-xs font-medium bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600"
														>
															<Star className="w-3 h-3 mr-1 fill-current" />
															Featured
														</Badge>
													)}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center justify-center gap-1">
													<Button
														size="icon"
														variant="outline"
														onClick={() => handleViewProduct(product)}
														className="h-8 w-8 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-700"
														title="View Product"
													>
														<Eye className="h-4 w-4" />
													</Button>
													<Button
														size="icon"
														variant="outline"
														onClick={() => handleEditProduct(product)}
														className="h-8 w-8 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-700 dark:hover:text-yellow-300 hover:border-yellow-300 dark:hover:border-yellow-700"
														title="Edit Product"
													>
														<Edit2 className="h-4 w-4" />
													</Button>
													<Button
														size="icon"
														variant="outline"
														onClick={() => openDeleteDialog(product)}
														className="h-8 w-8 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 hover:border-red-300 dark:hover:border-red-700"
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

							{/* Pagination */}
							{totalPages > 1 && (
								<div className="flex items-center justify-between mt-4">
									<div className="text-sm text-muted-foreground">
										Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
										{Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{' '}
										{filteredProducts.length} products
									</div>
									<div className="flex space-x-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
											disabled={currentPage === 1}
										>
											Previous
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
											disabled={currentPage === totalPages}
										>
											Next
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Edit Product Dialog */}
			<Dialog open={isEditProductOpen} onOpenChange={(open) => {
				setIsEditProductOpen(open);
				if (!open) {
					setEditingProduct(null);
				}
			}}>
				<DialogContent className="sm:max-w-[800px] w-full">
					<DialogHeader>
						<DialogTitle>Edit Product</DialogTitle>
						<DialogDescription>
							Update product information and settings.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-6 p-6 max-h-[80vh] overflow-y-auto">
						<div className="grid grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="edit-name" className="text-sm font-medium">Product Name *</Label>
								<Input
									id="edit-name"
									value={productForm.name}
									onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
									placeholder="Enter product name"
									className="w-full"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-sku" className="text-sm font-medium">SKU *</Label>
								<Input
									id="edit-sku"
									value={productForm.sku}
									onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
									placeholder="Enter SKU"
									className="w-full"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="edit-description" className="text-sm font-medium">Description</Label>
							<Textarea
								id="edit-description"
								value={productForm.description}
								onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
								placeholder="Enter product description"
								className="w-full min-h-[100px] resize-none"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="edit-shortDescription" className="text-sm font-medium">Short Description</Label>
							<Input
								id="edit-shortDescription"
								value={productForm.shortDescription}
								onChange={(e) => setProductForm(prev => ({ ...prev, shortDescription: e.target.value }))}
								placeholder="Brief product description"
								className="w-full"
							/>
						</div>

						<div className="grid grid-cols-3 gap-6">
							<div className="space-y-2">
								<Label htmlFor="edit-price" className="text-sm font-medium">Selling Price *</Label>
								<Input
									id="edit-price"
									type="number"
									step="0.01"
									min="0"
									value={productForm.price}
									onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
									placeholder="0.00"
									className="w-full"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-costPrice" className="text-sm font-medium">Cost Price *</Label>
								<Input
									id="edit-costPrice"
									type="number"
									step="0.01"
									min="0"
									value={productForm.costPrice}
									onChange={(e) => setProductForm(prev => ({ ...prev, costPrice: e.target.value }))}
									placeholder="0.00"
									className="w-full"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-category" className="text-sm font-medium">Category *</Label>
								<Select
									value={productForm.categoryId}
									onValueChange={(value) => setProductForm(prev => ({ ...prev, categoryId: value }))}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select category" />
									</SelectTrigger>
									<SelectContent>
										{categoriesData.map((category) => (
											<SelectItem key={category.id} value={category.id.toString()}>
												{category.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="flex items-center space-x-6">
							<div className="flex items-center space-x-2">
								<Switch
									id="edit-isActive"
									checked={productForm.isActive}
									onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isActive: checked }))}
								/>
								<Label htmlFor="edit-isActive" className="text-sm font-medium">Active</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Switch
									id="edit-isFeatured"
									checked={productForm.isFeatured}
									onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isFeatured: checked }))}
								/>
								<Label htmlFor="edit-isFeatured" className="text-sm font-medium">Featured</Label>
							</div>
						</div>

						<div className="space-y-2">
							<Label className="text-sm font-medium">Product Images (Optional)</Label>
							<ImageUpload
								initialImages={productForm.images}
								onImagesChange={(images) => setProductForm(prev => ({ ...prev, images }))}
								maxImages={5}
								maxFileSize={5}
								className="mt-2"
							/>
						</div>
					</div>
					<div className="flex justify-end gap-3 px-6 py-4 border-t">
						<Button variant="outline" onClick={() => {
							setIsEditProductOpen(false);
							setEditingProduct(null);
						}}>
							Cancel
						</Button>
						<Button onClick={handleFormSubmit} className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white">
							Update Product
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* View Product Dialog */}
			<Dialog open={isViewProductOpen} onOpenChange={setIsViewProductOpen}>
				<DialogContent className="sm:max-w-[700px] w-full">
					<DialogHeader>
						<DialogTitle>Product Details</DialogTitle>
						<DialogDescription>
							View complete product information
						</DialogDescription>
					</DialogHeader>
					{viewingProduct && (
						<div className="grid gap-6 p-6">
							{/* Images */}
							<div className="space-y-2">
								<h3 className="text-sm font-medium">Images</h3>
								<div className="grid grid-cols-3 gap-2">
									{viewingProduct.images && viewingProduct.images.length > 0 ? (
										viewingProduct.images.map((image, index) => (
											<div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
												<Image
													src={image.imageUrl}
													alt={`${viewingProduct.name} ${index + 1}`}
													fill
													className="object-cover"
												/>
											</div>
										))
									) : (
										<div className="text-sm text-muted-foreground">No images available</div>
									)}
								</div>
							</div>

							{/* Basic Info */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<h3 className="text-sm font-medium">Product Name</h3>
									<p className="text-sm">{viewingProduct.name}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium">SKU</h3>
									<p className="text-sm">{viewingProduct.sku}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium">Category</h3>
									<p className="text-sm">{viewingProduct.category?.name}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium">Brand</h3>
									<p className="text-sm">{viewingProduct.brand || 'N/A'}</p>
								</div>
							</div>

							{/* Pricing */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<h3 className="text-sm font-medium">Selling Price</h3>
									<p className="text-lg font-semibold text-green-600 dark:text-green-400">LKR {viewingProduct.price}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium">Cost Price</h3>
									<p className="text-lg font-semibold text-orange-600 dark:text-orange-400">LKR {viewingProduct.costPrice}</p>
								</div>
							</div>

							{/* Description */}
							{viewingProduct.description && (
								<div>
									<h3 className="text-sm font-medium">Description</h3>
									<p className="text-sm">{viewingProduct.description}</p>
								</div>
							)}

							{/* Inventory */}
							{viewingProduct.inventory && (
								<div>
									<h3 className="text-sm font-medium">Inventory</h3>
									<div className="grid grid-cols-2 gap-4 mt-2">
										<div>
											<p className="text-xs text-muted-foreground">Available</p>
											<p className="text-sm font-medium">{viewingProduct.inventory.quantityAvailable}</p>
										</div>
										<div>
											<p className="text-xs text-muted-foreground">Reserved</p>
											<p className="text-sm font-medium">{viewingProduct.inventory.quantityReserved}</p>
										</div>
									</div>
								</div>
							)}

							{/* Status */}
							<div className="flex items-center space-x-4">
								<Badge 
									variant={viewingProduct.isActive ? "default" : "secondary"}
									className={cn(
										"text-xs font-medium",
										viewingProduct.isActive 
											? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-300 dark:border-green-600"
											: "bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600"
									)}
								>
									{viewingProduct.isActive ? 'Active' : 'Inactive'}
								</Badge>
								{viewingProduct.isFeatured && (
									<Badge 
										variant="outline"
										className="text-xs font-medium bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600"
									>
										<Star className="w-3 h-3 mr-1 fill-current" />
										Featured
									</Badge>
								)}
							</div>
						</div>
					)}
					<div className="flex justify-end gap-3 px-6 py-4 border-t">
						<Button variant="outline" onClick={() => setIsViewProductOpen(false)}>
							Close
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Product</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete &quot;{selectedProduct?.name}&quot;? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => {
							setIsDeleteDialogOpen(false);
							setSelectedProduct(null);
						}}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteProduct}
							className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white"
						>
							Delete Product
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}