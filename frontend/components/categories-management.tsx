'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, MoreHorizontal, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageUpload } from '@/components/image-upload';
import { categoriesAPI } from '@/lib/api';
import type { Category, CreateCategoryForm, UpdateCategoryForm } from '@/types';
import { toast } from 'sonner';

interface UploadedImage {
	public_id: string;
	url: string;
	secure_url: string;
	width: number;
	height: number;
	format: string;
	bytes: number;
}

export function CategoriesManagement() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

	// Form states
	const [createForm, setCreateForm] = useState<CreateCategoryForm>({
		name: '',
		description: '',
		imageUrl: '',
	});
	const [editForm, setEditForm] = useState<UpdateCategoryForm>({
		id: 0,
		name: '',
		description: '',
		imageUrl: '',
	});
	const [createImages, setCreateImages] = useState<UploadedImage[]>([]);
	const [editImages, setEditImages] = useState<UploadedImage[]>([]);

	// Load categories
	const loadCategories = async () => {
		try {
			setLoading(true);
			const response = await categoriesAPI.getCategories();
			setCategories(response.categories);
		} catch (error) {
			console.error('Error loading categories:', error);
			toast.error('Failed to load categories');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadCategories();
	}, []);

	// Filter categories based on search term
	const filteredCategories = categories.filter((category) =>
		category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		(category.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
	);

	// Handle create category
	const handleCreateCategory = async () => {
		try {
			if (!createForm.name.trim()) {
				toast.error('Category name is required');
				return;
			}

			// Debug: Check if user is authenticated
			const token = localStorage.getItem('authToken');
			const user = localStorage.getItem('user');
			console.log('Auth debug:', { token: !!token, user: !!user });

			const categoryData: any = {
				name: createForm.name,
				description: createForm.description || undefined
			};

			if (createImages.length > 0) {
				categoryData.imageUrl = createImages[0].secure_url;
			}

			// Remove undefined values
			Object.keys(categoryData).forEach(key => {
				if (categoryData[key] === undefined || categoryData[key] === '') {
					delete categoryData[key];
				}
			});

			console.log('Sending category data:', categoryData);
			await categoriesAPI.createCategory(categoryData);
			toast.success('Category created successfully');
			setIsCreateDialogOpen(false);
			setCreateForm({ name: '', description: '', imageUrl: '' });
			setCreateImages([]);
			loadCategories();
		} catch (error: any) {
			console.error('Error creating category:', error);
			toast.error(error.response?.data?.error || 'Failed to create category');
		}
	};

	// Handle edit category
	const handleEditCategory = async () => {
		try {
			if (!editForm.name?.trim()) {
				toast.error('Category name is required');
				return;
			}

			const categoryData: any = {
				name: editForm.name,
				description: editForm.description || undefined
			};

			if (editImages.length > 0) {
				categoryData.imageUrl = editImages[0].secure_url;
			}

			// Remove undefined values
			Object.keys(categoryData).forEach(key => {
				if (categoryData[key] === undefined || categoryData[key] === '') {
					delete categoryData[key];
				}
			});

			await categoriesAPI.updateCategory(editForm.id, categoryData);
			toast.success('Category updated successfully');
			setIsEditDialogOpen(false);
			loadCategories();
		} catch (error: any) {
			console.error('Error updating category:', error);
			toast.error(error.response?.data?.error || 'Failed to update category');
		}
	};

	// Handle delete category
	const handleDeleteCategory = async () => {
		try {
			if (!selectedCategory) return;

			await categoriesAPI.deleteCategory(selectedCategory.id);
			toast.success('Category deleted successfully');
			setIsDeleteDialogOpen(false);
			setSelectedCategory(null);
			loadCategories();
		} catch (error: any) {
			console.error('Error deleting category:', error);
			toast.error(error.response?.data?.error || 'Failed to delete category');
		}
	};

	// Open edit dialog
	const openEditDialog = (category: Category) => {
		setSelectedCategory(category);
		setEditForm({
			id: category.id,
			name: category.name,
			description: category.description || '',
			imageUrl: category.imageUrl || '',
		});
		
		// Set initial images for edit
		if (category.imageUrl) {
			setEditImages([{
				public_id: `category_${category.id}`,
				url: category.imageUrl,
				secure_url: category.imageUrl,
				width: 0,
				height: 0,
				format: '',
				bytes: 0
			}]);
		} else {
			setEditImages([]);
		}
		
		setIsEditDialogOpen(true);
	};

	// Open delete dialog
	const openDeleteDialog = (category: Category) => {
		setSelectedCategory(category);
		setIsDeleteDialogOpen(true);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Categories</h1>
					<p className="text-muted-foreground">
						Manage product categories and organize your inventory
					</p>
				</div>
				<Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
				setIsCreateDialogOpen(open);
				if (!open) {
					setCreateForm({ name: '', description: '', imageUrl: '' });
					setCreateImages([]);
				}
			}}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Add Category
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New Category</DialogTitle>
							<DialogDescription>
								Add a new product category to organize your inventory.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label htmlFor="create-name">Name *</Label>
								<Input
									id="create-name"
									value={createForm.name}
									onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
									placeholder="Enter category name"
								/>
							</div>
							<div>
								<Label htmlFor="create-description">Description</Label>
								<Textarea
									id="create-description"
									value={createForm.description}
									onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
									placeholder="Enter category description"
									rows={3}
								/>
							</div>
							<div>
								<Label>Category Image (Optional)</Label>
								<ImageUpload
									onImagesChange={setCreateImages}
									initialImages={createImages}
									maxImages={1}
									maxFileSize={5}
									className="mt-2"
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => {
								setIsCreateDialogOpen(false);
								setCreateForm({ name: '', description: '', imageUrl: '' });
								setCreateImages([]);
							}}>
								Cancel
							</Button>
							<Button onClick={handleCreateCategory}>Create Category</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{/* Search */}
			<div className="flex items-center space-x-2">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search categories..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
			</div>

			{/* Categories Table */}
			<Card>
				<CardHeader>
					<CardTitle>Categories ({filteredCategories.length})</CardTitle>
					<CardDescription>
						All product categories in your system
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<div className="text-muted-foreground">Loading categories...</div>
						</div>
					) : filteredCategories.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-8 text-center">
							<Package className="h-12 w-12 text-muted-foreground mb-4" />
							<h3 className="text-lg font-medium text-muted-foreground mb-2">
								{categories.length === 0 ? 'No categories yet' : 'No categories match your search'}
							</h3>
							<p className="text-sm text-muted-foreground max-w-sm">
								{categories.length === 0
									? 'Get started by creating your first product category.'
									: 'Try adjusting your search terms to find what you\'re looking for.'}
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Category</TableHead>
									<TableHead>Description</TableHead>
									<TableHead>Products</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created</TableHead>
									<TableHead className="w-[70px]"></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredCategories.map((category) => (
									<TableRow key={category.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<Avatar className="h-10 w-10">
													<AvatarImage src={category.imageUrl} alt={category.name} />
													<AvatarFallback>
														{category.name.slice(0, 2).toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div>
													<div className="font-medium">{category.name}</div>
													<div className="text-sm text-muted-foreground">
														Slug: {category.slug}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="max-w-xs">
												{category.description ? (
													<p className="text-sm text-muted-foreground truncate">
														{category.description}
													</p>
												) : (
													<span className="text-sm text-muted-foreground italic">
														No description
													</span>
												)}
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="secondary">
												{category._count?.products || 0} products
											</Badge>
										</TableCell>
										<TableCell>
											<Badge variant={category.isActive ? 'default' : 'secondary'}>
												{category.isActive ? 'Active' : 'Inactive'}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="text-sm text-muted-foreground">
												{new Date(category.createdAt).toLocaleDateString()}
											</div>
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="sm">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem onClick={() => openEditDialog(category)}>
														<Edit2 className="mr-2 h-4 w-4" />
														Edit
													</DropdownMenuItem>
													<DropdownMenuItem 
														onClick={() => openDeleteDialog(category)}
														className="text-destructive"
													>
														<Trash2 className="mr-2 h-4 w-4" />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Edit Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={(open) => {
				setIsEditDialogOpen(open);
				if (!open) {
					setEditImages([]);
				}
			}}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Category</DialogTitle>
						<DialogDescription>
							Update the category details below.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="edit-name">Name *</Label>
							<Input
								id="edit-name"
								value={editForm.name || ''}
								onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
								placeholder="Enter category name"
							/>
						</div>
						<div>
							<Label htmlFor="edit-description">Description</Label>
							<Textarea
								id="edit-description"
								value={editForm.description || ''}
								onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
								placeholder="Enter category description"
								rows={3}
							/>
						</div>
						<div>
							<Label>Category Image (Optional)</Label>
							<ImageUpload
								onImagesChange={setEditImages}
								initialImages={editImages}
								maxImages={1}
								maxFileSize={5}
								className="mt-2"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => {
							setIsEditDialogOpen(false);
							setEditImages([]);
						}}>
							Cancel
						</Button>
						<Button onClick={handleEditCategory}>Update Category</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the category
							&ldquo;{selectedCategory?.name}&rdquo; and may affect associated products.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}