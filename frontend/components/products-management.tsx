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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/image-upload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
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
import { productsAPI, categoriesAPI } from '@/lib/api';
import { Product, Category, UploadedImage, CreateProductForm, UpdateProductForm } from '@/types';

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
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);
	const [isLoading, setIsLoading] = useState(true);
	const [productsData, setProductsData] = useState<Product[]>([]);
	const [categoriesData, setCategoriesData] = useState<Category[]>([]);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Form state for adding/editing products with all new fields
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
		setError(null);
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
			setError('Failed to load products. Please try again.');
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
			setIsLoading(true);
			setError(null);

			// Validate required fields
			if (!productForm.name || !productForm.price || !productForm.costPrice || !productForm.sku || !productForm.categoryId) {
				setError('Please fill in all required fields (name, price, cost price, SKU, category)');
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
				setIsEditProductOpen(false);
				setEditingProduct(null);
			} else {
				// Create new product
				await productsAPI.createProduct(productData);
				setIsAddProductOpen(false);
			}

			resetForm();
			loadProducts(); // Refresh products list
		} catch (error: any) {
			console.error('Failed to save product:', error);
			setError(error.response?.data?.message || error.message || 'Failed to save product. Please try again.');
		} finally {
			setIsLoading(false);
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

	const handleDeleteProduct = async (productId: number) => {
		if (window.confirm('Are you sure you want to delete this product?')) {
			try {
				setIsLoading(true);
				await productsAPI.deleteProduct(productId);
				loadProducts(); // Refresh products list
			} catch (error: any) {
				console.error('Failed to delete product:', error);
				setError(error.response?.data?.message || 'Failed to delete product. Please try again.');
			} finally {
				setIsLoading(false);
			}
		}
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
		<div className="flex-1 space-y-6 p-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Products Management</h1>
					<p className="text-muted-foreground">
						Manage your product catalog, inventory, and pricing
					</p>
				</div>
				<Button
					onClick={() => {
						resetForm();
						setIsAddProductOpen(true);
					}}
					className="font-semibold"
				>
					<Plus className="h-4 w-4 mr-2" />
					Add Product
				</Button>
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

			{/* Error Alert */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
					<Input
						placeholder="Search products by name or SKU..."
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
						Manage your product catalog and inventory
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="text-center py-8">Loading products...</div>
					) : paginatedProducts.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							{searchTerm || selectedCategory !== 'all' 
								? 'No products match your search criteria.' 
								: 'No products found. Add your first product to get started.'
							}
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
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{paginatedProducts.map((product) => (
										<TableRow key={product.id}>
											<TableCell>
												<div className="flex items-center space-x-3">
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
														<div className="text-sm text-muted-foreground">{product.sku}</div>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<span className="text-sm">{product.category?.name}</span>
											</TableCell>
											<TableCell>
												<div className="font-medium">₹{product.price}</div>
												<div className="text-sm text-muted-foreground">
													Cost: ₹{product.costPrice}
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
													<Badge variant={product.isActive ? "default" : "secondary"}>
														{product.isActive ? 'Active' : 'Inactive'}
													</Badge>
													{product.isFeatured && (
														<Badge variant="outline">
															<Star className="w-3 h-3 mr-1" />
															Featured
														</Badge>
													)}
												</div>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end space-x-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleViewProduct(product)}
													>
														<Eye className="h-4 w-4" />
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleEditProduct(product)}
													>
														<Edit className="h-4 w-4" />
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleDeleteProduct(product.id)}
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

			{/* Add Product Dialog */}
			<Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
				<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Add New Product</DialogTitle>
						<DialogDescription>
							Create a new product with all the necessary details.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 py-4">
						{/* Basic Information */}
						<div className="space-y-4">
							<h3 className="text-sm font-medium">Basic Information</h3>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="name">Product Name *</Label>
									<Input
										id="name"
										value={productForm.name}
										onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
										placeholder="Enter product name"
									/>
								</div>
								<div>
									<Label htmlFor="sku">SKU *</Label>
									<Input
										id="sku"
										value={productForm.sku}
										onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
										placeholder="Enter SKU"
									/>
								</div>
							</div>

							<div>
								<Label htmlFor="description">Description</Label>
								<Textarea
									id="description"
									value={productForm.description}
									onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
									placeholder="Enter product description"
									rows={3}
								/>
							</div>

							<div>
								<Label htmlFor="shortDescription">Short Description</Label>
								<Input
									id="shortDescription"
									value={productForm.shortDescription}
									onChange={(e) => setProductForm(prev => ({ ...prev, shortDescription: e.target.value }))}
									placeholder="Brief product description"
								/>
							</div>
						</div>

						{/* Pricing & Category */}
						<div className="space-y-4">
							<h3 className="text-sm font-medium">Pricing & Category</h3>
							<div className="grid grid-cols-3 gap-4">
								<div>
									<Label htmlFor="price">Selling Price *</Label>
									<Input
										id="price"
										type="number"
										step="0.01"
										value={productForm.price}
										onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
										placeholder="0.00"
									/>
								</div>
								<div>
									<Label htmlFor="costPrice">Cost Price *</Label>
									<Input
										id="costPrice"
										type="number"
										step="0.01"
										value={productForm.costPrice}
										onChange={(e) => setProductForm(prev => ({ ...prev, costPrice: e.target.value }))}
										placeholder="0.00"
									/>
								</div>
								<div>
									<Label htmlFor="category">Category *</Label>
									<Select
										value={productForm.categoryId}
										onValueChange={(value) => setProductForm(prev => ({ ...prev, categoryId: value }))}
									>
										<SelectTrigger>
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
						</div>

						{/* Product Attributes */}
						<div className="space-y-4">
							<h3 className="text-sm font-medium">Product Attributes</h3>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="brand">Brand</Label>
									<Input
										id="brand"
										value={productForm.brand}
										onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
										placeholder="Brand name"
									/>
								</div>
								<div>
									<Label htmlFor="material">Material</Label>
									<Input
										id="material"
										value={productForm.material}
										onChange={(e) => setProductForm(prev => ({ ...prev, material: e.target.value }))}
										placeholder="Material type"
									/>
								</div>
								<div>
									<Label htmlFor="color">Color</Label>
									<Input
										id="color"
										value={productForm.color}
										onChange={(e) => setProductForm(prev => ({ ...prev, color: e.target.value }))}
										placeholder="Color"
									/>
								</div>
								<div>
									<Label htmlFor="size">Size</Label>
									<Input
										id="size"
										value={productForm.size}
										onChange={(e) => setProductForm(prev => ({ ...prev, size: e.target.value }))}
										placeholder="Size"
									/>
								</div>
								<div>
									<Label htmlFor="weight">Weight (g)</Label>
									<Input
										id="weight"
										type="number"
										step="0.01"
										value={productForm.weight}
										onChange={(e) => setProductForm(prev => ({ ...prev, weight: e.target.value }))}
										placeholder="Weight in grams"
									/>
								</div>
								<div>
									<Label htmlFor="dimensions">Dimensions</Label>
									<Input
										id="dimensions"
										value={productForm.dimensions}
										onChange={(e) => setProductForm(prev => ({ ...prev, dimensions: e.target.value }))}
										placeholder="L x W x H"
									/>
								</div>
							</div>
						</div>

						{/* Inventory */}
						<div className="space-y-4">
							<h3 className="text-sm font-medium">Inventory</h3>
							<div>
								<Label htmlFor="initialStock">Initial Stock</Label>
								<Input
									id="initialStock"
									type="number"
									value={productForm.initialStock}
									onChange={(e) => setProductForm(prev => ({ ...prev, initialStock: e.target.value }))}
									placeholder="Initial stock quantity"
								/>
							</div>
						</div>

						{/* SEO */}
						<div className="space-y-4">
							<h3 className="text-sm font-medium">SEO</h3>
							<div>
								<Label htmlFor="metaTitle">Meta Title</Label>
								<Input
									id="metaTitle"
									value={productForm.metaTitle}
									onChange={(e) => setProductForm(prev => ({ ...prev, metaTitle: e.target.value }))}
									placeholder="SEO meta title"
								/>
							</div>
							<div>
								<Label htmlFor="metaDescription">Meta Description</Label>
								<Textarea
									id="metaDescription"
									value={productForm.metaDescription}
									onChange={(e) => setProductForm(prev => ({ ...prev, metaDescription: e.target.value }))}
									placeholder="SEO meta description"
									rows={2}
								/>
							</div>
						</div>

						{/* Settings */}
						<div className="space-y-4">
							<h3 className="text-sm font-medium">Settings</h3>
							<div className="flex items-center space-x-4">
								<div className="flex items-center space-x-2">
									<Switch
										id="isActive"
										checked={productForm.isActive}
										onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isActive: checked }))}
									/>
									<Label htmlFor="isActive">Active</Label>
								</div>
								<div className="flex items-center space-x-2">
									<Switch
										id="isFeatured"
										checked={productForm.isFeatured}
										onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isFeatured: checked }))}
									/>
									<Label htmlFor="isFeatured">Featured</Label>
								</div>
							</div>
						</div>

						{/* Images */}
						<div className="space-y-4">
							<h3 className="text-sm font-medium">Product Images</h3>
							<ImageUpload
								initialImages={productForm.images}
								onImagesChange={(images) => setProductForm(prev => ({ ...prev, images }))}
								maxImages={5}
							/>
						</div>
					</div>

					<div className="flex justify-end space-x-2">
						<Button variant="outline" onClick={() => setIsAddProductOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleFormSubmit} disabled={isLoading}>
							{isLoading ? 'Creating...' : 'Create Product'}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Edit Product Dialog */}
			<Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
				<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit Product</DialogTitle>
						<DialogDescription>
							Update product information and settings.
						</DialogDescription>
					</DialogHeader>

					{/* Same form fields as Add Product */}
					<div className="grid gap-4 py-4">
						{/* Basic Information */}
						<div className="space-y-4">
							<h3 className="text-sm font-medium">Basic Information</h3>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="edit-name">Product Name *</Label>
									<Input
										id="edit-name"
										value={productForm.name}
										onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
										placeholder="Enter product name"
									/>
								</div>
								<div>
									<Label htmlFor="edit-sku">SKU *</Label>
									<Input
										id="edit-sku"
										value={productForm.sku}
										onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
										placeholder="Enter SKU"
									/>
								</div>
							</div>

							<div>
								<Label htmlFor="edit-description">Description</Label>
								<Textarea
									id="edit-description"
									value={productForm.description}
									onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
									placeholder="Enter product description"
									rows={3}
								/>
							</div>

							<div>
								<Label htmlFor="edit-shortDescription">Short Description</Label>
								<Input
									id="edit-shortDescription"
									value={productForm.shortDescription}
									onChange={(e) => setProductForm(prev => ({ ...prev, shortDescription: e.target.value }))}
									placeholder="Brief product description"
								/>
							</div>
						</div>

						{/* Pricing & Category */}
						<div className="space-y-4">
							<h3 className="text-sm font-medium">Pricing & Category</h3>
							<div className="grid grid-cols-3 gap-4">
								<div>
									<Label htmlFor="edit-price">Selling Price *</Label>
									<Input
										id="edit-price"
										type="number"
										step="0.01"
										value={productForm.price}
										onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
										placeholder="0.00"
									/>
								</div>
								<div>
									<Label htmlFor="edit-costPrice">Cost Price *</Label>
									<Input
										id="edit-costPrice"
										type="number"
										step="0.01"
										value={productForm.costPrice}
										onChange={(e) => setProductForm(prev => ({ ...prev, costPrice: e.target.value }))}
										placeholder="0.00"
									/>
								</div>
								<div>
									<Label htmlFor="edit-category">Category *</Label>
									<Select
										value={productForm.categoryId}
										onValueChange={(value) => setProductForm(prev => ({ ...prev, categoryId: value }))}
									>
										<SelectTrigger>
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
						</div>

						{/* Settings */}
						<div className="space-y-4">
							<h3 className="text-sm font-medium">Settings</h3>
							<div className="flex items-center space-x-4">
								<div className="flex items-center space-x-2">
									<Switch
										id="edit-isActive"
										checked={productForm.isActive}
										onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isActive: checked }))}
									/>
									<Label htmlFor="edit-isActive">Active</Label>
								</div>
								<div className="flex items-center space-x-2">
									<Switch
										id="edit-isFeatured"
										checked={productForm.isFeatured}
										onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isFeatured: checked }))}
									/>
									<Label htmlFor="edit-isFeatured">Featured</Label>
								</div>
							</div>
						</div>

						{/* Images */}
						<div className="space-y-4">
							<h3 className="text-sm font-medium">Product Images</h3>
							<ImageUpload
								initialImages={productForm.images}
								onImagesChange={(images) => setProductForm(prev => ({ ...prev, images }))}
								maxImages={5}
							/>
						</div>
					</div>

					<div className="flex justify-end space-x-2">
						<Button variant="outline" onClick={() => setIsEditProductOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleFormSubmit} disabled={isLoading}>
							{isLoading ? 'Updating...' : 'Update Product'}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* View Product Dialog */}
			<Dialog open={isViewProductOpen} onOpenChange={setIsViewProductOpen}>
				<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Product Details</DialogTitle>
						<DialogDescription>
							View complete product information
						</DialogDescription>
					</DialogHeader>

					{viewingProduct && (
						<div className="grid gap-6 py-4">
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
									<p className="text-lg font-semibold">₹{viewingProduct.price}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium">Cost Price</h3>
									<p className="text-lg font-semibold">₹{viewingProduct.costPrice}</p>
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
								<Badge variant={viewingProduct.isActive ? "default" : "secondary"}>
									{viewingProduct.isActive ? 'Active' : 'Inactive'}
								</Badge>
								{viewingProduct.isFeatured && (
									<Badge variant="outline">
										<Star className="w-3 h-3 mr-1" />
										Featured
									</Badge>
								)}
							</div>
						</div>
					)}

					<div className="flex justify-end">
						<Button variant="outline" onClick={() => setIsViewProductOpen(false)}>
							Close
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}