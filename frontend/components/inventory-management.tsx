'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
	Search,
	Plus,
	Minus,
	Package,
	AlertTriangle,
	TrendingDown,
	TrendingUp,
	AlertCircle,
	History,
	Settings,
	Box,
} from 'lucide-react';
import { inventoryAPI } from '@/lib/api';
import { 
	Inventory, 
	Product, 
	StockMovement, 
	StockMovementType, 
	StockReferenceType 
} from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StockAdjustmentForm {
	productId: string;
	quantity: string;
	unitCost: string;
	notes: string;
	reason: StockReferenceType;
}

interface InventorySettingsForm {
	reorderLevel: string;
	maxStockLevel: string;
}

export function InventoryManagement() {
	const [searchTerm, setSearchTerm] = useState('');
	const [filterType, setFilterType] = useState<string>('all');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);
	const [isLoading, setIsLoading] = useState(true);
	const [inventoryData, setInventoryData] = useState<(Inventory & { product: Product & { category: { name: string } } })[]>([]);
	const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
	const [selectedInventory, setSelectedInventory] = useState<(Inventory & { product: Product & { category: { name: string } } }) | null>(null);
	
	// Dialog states
	const [isAddStockOpen, setIsAddStockOpen] = useState(false);
	const [isRemoveStockOpen, setIsRemoveStockOpen] = useState(false);
	const [isViewMovementsOpen, setIsViewMovementsOpen] = useState(false);
	const [isInventorySettingsOpen, setIsInventorySettingsOpen] = useState(false);
	
	// Form states
	const [stockForm, setStockForm] = useState<StockAdjustmentForm>({
		productId: '',
		quantity: '',
		unitCost: '',
		notes: '',
		reason: StockReferenceType.PURCHASE,
	});

	const [settingsForm, setSettingsForm] = useState<InventorySettingsForm>({
		reorderLevel: '',
		maxStockLevel: '',
	});

	const resetStockForm = () => {
		setStockForm({
			productId: '',
			quantity: '',
			unitCost: '',
			notes: '',
			reason: StockReferenceType.PURCHASE,
		});
	};

	const resetSettingsForm = () => {
		setSettingsForm({
			reorderLevel: '',
			maxStockLevel: '',
		});
	};

	// Load data functions
	const loadInventory = useCallback(async () => {
		setIsLoading(true);
		try {
			const params: any = {};
			if (filterType === 'low_stock') {
				params.lowStock = true;
			}
			
			const response = await inventoryAPI.getInventory(params);
			setInventoryData(response.inventory || []);
		} catch (error) {
			console.error('Failed to load inventory:', error);
			toast.error('Failed to load inventory');
		} finally {
			setIsLoading(false);
		}
	}, [filterType]);

	const loadStockMovements = useCallback(async (productId?: number) => {
		try {
			const response = await inventoryAPI.getStockMovements(productId);
			setStockMovements(response.movements || []);
		} catch (error) {
			console.error('Failed to load stock movements:', error);
		}
	}, []);

	// Load data on component mount and when filters change
	useEffect(() => {
		loadInventory();
	}, [loadInventory]);

	// Stock management actions
	const handleAddStock = async () => {
		try {
			if (!stockForm.productId || !stockForm.quantity) {
				toast.error('Please fill in required fields (product and quantity)');
				return;
			}

			await inventoryAPI.adjustStock(parseInt(stockForm.productId), {
				quantity: parseInt(stockForm.quantity),
				movementType: 'IN',
				referenceType: stockForm.reason,
				unitCost: stockForm.unitCost ? parseFloat(stockForm.unitCost) : undefined,
				notes: stockForm.notes || undefined,
			});

			toast.success('Stock added successfully');
			setIsAddStockOpen(false);
			resetStockForm();
			await loadInventory();
		} catch (error: any) {
			console.error('Failed to add stock:', error);
			toast.error(error.response?.data?.error || 'Failed to add stock');
		}
	};

	const handleRemoveStock = async () => {
		try {
			if (!stockForm.productId || !stockForm.quantity || !stockForm.reason) {
				toast.error('Please fill in required fields (product, quantity, and reason)');
				return;
			}

			await inventoryAPI.adjustStock(parseInt(stockForm.productId), {
				quantity: -parseInt(stockForm.quantity), // Negative for stock removal
				movementType: 'OUT',
				referenceType: stockForm.reason,
				notes: stockForm.notes || undefined,
			});

			toast.success('Stock removed successfully');
			setIsRemoveStockOpen(false);
			resetStockForm();
			await loadInventory();
		} catch (error: any) {
			console.error('Failed to remove stock:', error);
			toast.error(error.response?.data?.error || 'Failed to remove stock');
		}
	};

	const handleUpdateInventorySettings = async () => {
		if (!selectedInventory) return;

		try {
			await inventoryAPI.updateInventory(selectedInventory.productId, {
				reorderLevel: settingsForm.reorderLevel ? parseInt(settingsForm.reorderLevel) : undefined,
				maxStockLevel: settingsForm.maxStockLevel ? parseInt(settingsForm.maxStockLevel) : undefined,
			});

			toast.success('Inventory settings updated successfully');
			setIsInventorySettingsOpen(false);
			setSelectedInventory(null);
			resetSettingsForm();
			await loadInventory();
		} catch (error: any) {
			console.error('Failed to update inventory settings:', error);
			toast.error(error.response?.data?.error || 'Failed to update inventory settings');
		}
	};

	const handleViewMovements = async (inventory: Inventory & { product: Product & { category: { name: string } } }) => {
		setSelectedInventory(inventory);
		await loadStockMovements(inventory.productId);
		setIsViewMovementsOpen(true);
	};

	const handleOpenSettings = (inventory: Inventory & { product: Product & { category: { name: string } } }) => {
		setSelectedInventory(inventory);
		setSettingsForm({
			reorderLevel: inventory.reorderLevel.toString(),
			maxStockLevel: inventory.maxStockLevel.toString(),
		});
		setIsInventorySettingsOpen(true);
	};

	const handleOpenAddStock = (inventory?: Inventory & { product: Product & { category: { name: string } } }) => {
		if (inventory) {
			setStockForm({
				...stockForm,
				productId: inventory.productId.toString(),
			});
		}
		setIsAddStockOpen(true);
	};

	const handleOpenRemoveStock = (inventory?: Inventory & { product: Product & { category: { name: string } } }) => {
		if (inventory) {
			setStockForm({
				...stockForm,
				productId: inventory.productId.toString(),
			});
		}
		setIsRemoveStockOpen(true);
	};

	// Filter and search inventory
	const filteredInventory = inventoryData.filter((inventory) => {
		const matchesSearch = 
			inventory.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			inventory.product.sku.toLowerCase().includes(searchTerm.toLowerCase());
		
		let matchesFilter = true;
		if (filterType === 'low_stock') {
			matchesFilter = inventory.quantityAvailable <= inventory.reorderLevel;
		} else if (filterType === 'out_of_stock') {
			matchesFilter = inventory.quantityAvailable === 0;
		}
		
		return matchesSearch && matchesFilter;
	});

	// Pagination
	const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedInventory = filteredInventory.slice(startIndex, endIndex);

	// Stats calculations
	const totalProducts = inventoryData.length;
	const lowStockProducts = inventoryData.filter(inv => inv.quantityAvailable <= inv.reorderLevel).length;
	const outOfStockProducts = inventoryData.filter(inv => inv.quantityAvailable === 0).length;
	const totalStockValue = inventoryData.reduce((sum, inv) => 
		sum + (inv.quantityAvailable * Number(inv.product.costPrice)), 0
	);

	return (
		<div className="space-y-3">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-primary/5 via-primary/10 to-green-500/5 dark:from-primary/10 dark:via-primary/20 dark:to-green-500/10 border border-primary/20 shadow-md">
				<div>
					<h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-green-600 dark:from-primary dark:via-primary dark:to-green-400 bg-clip-text text-transparent">Inventory Management</h1>
					<p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-1.5">
						<Box className="h-3.5 w-3.5" />
						Track and manage product stock levels, movements, and settings
					</p>
				</div>
				<div className="flex gap-2">
					<Dialog open={isAddStockOpen} onOpenChange={(open) => {
						setIsAddStockOpen(open);
						if (!open) {
							resetStockForm();
						}
					}}>
						<DialogTrigger asChild>
							<Button className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white">
								<Plus className="mr-2 h-4 w-4" />
								Add Stock
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[550px] w-full border-primary/20 shadow-2xl">
							<DialogHeader className="border-b border-primary/10 pb-4 bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent rounded-t-lg">
								<DialogTitle className="text-2xl flex items-center gap-3">
									<Plus className="h-6 w-6 text-green-600 flex-shrink-0" />
									<span>Add Stock</span>
								</DialogTitle>
								<DialogDescription className="pl-9">
									Increase inventory quantity for a product
								</DialogDescription>
							</DialogHeader>

							<DialogBody className="space-y-4 p-6">
								<div className="space-y-2">
									<Label htmlFor="addProduct" className="text-sm font-medium">Product *</Label>
									<Select
										value={stockForm.productId}
										onValueChange={(value) => setStockForm({...stockForm, productId: value})}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select a product" />
										</SelectTrigger>
										<SelectContent>
											{inventoryData.map((inventory) => (
												<SelectItem key={inventory.productId} value={inventory.productId.toString()}>
													{inventory.product.name} (SKU: {inventory.product.sku})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="addQuantity" className="text-sm font-medium">Quantity to Add *</Label>
										<Input
											id="addQuantity"
											type="number"
											min="1"
											value={stockForm.quantity}
											onChange={(e) => setStockForm({...stockForm, quantity: e.target.value})}
											placeholder="0"
											className="w-full"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="addUnitCost" className="text-sm font-medium">Unit Cost (LKR)</Label>
										<Input
											id="addUnitCost"
											type="number"
											step="0.01"
											min="0"
											value={stockForm.unitCost}
											onChange={(e) => setStockForm({...stockForm, unitCost: e.target.value})}
											placeholder="0.00"
											className="w-full"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="addNotes" className="text-sm font-medium">Notes</Label>
									<Textarea
										id="addNotes"
										value={stockForm.notes}
										onChange={(e) => setStockForm({...stockForm, notes: e.target.value})}
										placeholder="Optional notes about this stock addition..."
										className="w-full min-h-[80px] resize-none"
									/>
								</div>
							</DialogBody>

							<DialogFooter className="border-t border-primary/10 pt-4 px-6 pb-6 flex justify-end space-x-2 bg-gradient-to-r from-transparent to-primary/5 dark:from-transparent dark:to-primary/10 rounded-b-lg">
								<Button variant="outline" onClick={() => setIsAddStockOpen(false)} disabled={isLoading}>
									Cancel
								</Button>
								<Button onClick={handleAddStock} disabled={isLoading} className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white">
									{isLoading ? 'Adding...' : 'Add Stock'}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
					<Dialog open={isRemoveStockOpen} onOpenChange={(open) => {
						setIsRemoveStockOpen(open);
						if (!open) {
							resetStockForm();
						}
					}}>
						<DialogTrigger asChild>
							<Button variant="outline" className="border-primary/30 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950/20">
								<Minus className="mr-2 h-4 w-4" />
								Remove Stock
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[550px] w-full border-primary/20 shadow-2xl">
							<DialogHeader className="border-b border-primary/10 pb-4 bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent rounded-t-lg">
								<DialogTitle className="text-2xl flex items-center gap-3">
									<Minus className="h-6 w-6 text-red-600 flex-shrink-0" />
									<span>Remove Stock</span>
								</DialogTitle>
								<DialogDescription className="pl-9">
									Reduce inventory quantity for a product
								</DialogDescription>
							</DialogHeader>

							<DialogBody className="space-y-4 p-6">
								<div className="space-y-2">
									<Label htmlFor="removeProduct" className="text-sm font-medium">Product *</Label>
									<Select
										value={stockForm.productId}
										onValueChange={(value) => setStockForm({...stockForm, productId: value})}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select a product" />
										</SelectTrigger>
										<SelectContent>
											{inventoryData.map((inventory) => (
												<SelectItem key={inventory.productId} value={inventory.productId.toString()}>
													{inventory.product.name} (Available: {inventory.quantityAvailable})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="removeQuantity" className="text-sm font-medium">Quantity to Remove *</Label>
										<Input
											id="removeQuantity"
											type="number"
											min="1"
											value={stockForm.quantity}
											onChange={(e) => setStockForm({...stockForm, quantity: e.target.value})}
											placeholder="0"
											className="w-full"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="removeReason" className="text-sm font-medium">Reason *</Label>
										<Select
											value={stockForm.reason}
											onValueChange={(value) => setStockForm({...stockForm, reason: value as StockReferenceType})}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select reason" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value={StockReferenceType.SALE}>Sale</SelectItem>
												<SelectItem value={StockReferenceType.DAMAGE}>Damage</SelectItem>
												<SelectItem value={StockReferenceType.RETURN}>Return</SelectItem>
												<SelectItem value={StockReferenceType.ADJUSTMENT}>Adjustment</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="removeNotes" className="text-sm font-medium">Notes</Label>
									<Textarea
										id="removeNotes"
										value={stockForm.notes}
										onChange={(e) => setStockForm({...stockForm, notes: e.target.value})}
										placeholder="Optional notes about this stock removal..."
										className="w-full min-h-[80px] resize-none"
									/>
								</div>
							</DialogBody>

							<DialogFooter className="border-t border-primary/10 pt-4 px-6 pb-6 flex justify-end space-x-2 bg-gradient-to-r from-transparent to-primary/5 dark:from-transparent dark:to-primary/10 rounded-b-lg">
								<Button variant="outline" onClick={() => setIsRemoveStockOpen(false)} disabled={isLoading}>
									Cancel
								</Button>
								<Button variant="destructive" onClick={handleRemoveStock} disabled={isLoading}>
									{isLoading ? 'Removing...' : 'Remove Stock'}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<Card className="border-none shadow-md bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 dark:shadow-lg dark:shadow-primary/10 py-4 gap-0">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-xs font-medium text-primary dark:text-primary-foreground">Total Products</CardTitle>
						<div className="h-8 w-8 rounded-full bg-primary dark:bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
							<Package className="h-4 w-4 text-white" />
						</div>
					</CardHeader>
					<CardContent className="pt-2 pb-4">
						<div className="text-2xl font-bold text-primary dark:text-primary-foreground">{totalProducts}</div>
						<p className="text-xs text-primary/80 dark:text-primary-foreground/80 mt-0.5">In inventory</p>
					</CardContent>
				</Card>
				<Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/40 dark:shadow-lg dark:shadow-amber-900/20 py-4 gap-0">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-xs font-medium text-amber-900 dark:text-amber-200">Low Stock Alert</CardTitle>
						<div className="h-8 w-8 rounded-full bg-amber-500 dark:bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
							<AlertTriangle className="h-4 w-4 text-white" />
						</div>
					</CardHeader>
					<CardContent className="pt-2 pb-4">
						<div className="text-2xl font-bold text-amber-900 dark:text-amber-50">{lowStockProducts}</div>
						<p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">Need attention</p>
					</CardContent>
				</Card>
				<Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-800/40 dark:shadow-lg dark:shadow-red-900/20 py-4 gap-0">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-xs font-medium text-red-900 dark:text-red-200">Out of Stock</CardTitle>
						<div className="h-8 w-8 rounded-full bg-red-500 dark:bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
							<TrendingDown className="h-4 w-4 text-white" />
						</div>
					</CardHeader>
					<CardContent className="pt-2 pb-4">
						<div className="text-2xl font-bold text-red-900 dark:text-red-50">{outOfStockProducts}</div>
						<p className="text-xs text-red-700 dark:text-red-300 mt-0.5">Unavailable</p>
					</CardContent>
				</Card>
				<Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/40 dark:shadow-lg dark:shadow-green-900/20 py-4 gap-0">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-xs font-medium text-green-900 dark:text-green-200">Stock Value</CardTitle>
						<div className="h-8 w-8 rounded-full bg-green-500 dark:bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
							<TrendingUp className="h-4 w-4 text-white" />
						</div>
					</CardHeader>
					<CardContent className="pt-2 pb-4">
						<div className="text-2xl font-bold text-green-900 dark:text-green-50">LKR {totalStockValue.toFixed(2)}</div>
						<p className="text-xs text-green-700 dark:text-green-300 mt-0.5">Total value</p>
					</CardContent>
				</Card>
			</div>

			{/* Search and Filters */}
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
					<Input
						placeholder="Search products..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10 bg-gradient-to-r from-background to-primary/5 dark:from-background dark:to-primary/10 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm hover:shadow-md"
					/>
				</div>
				<Select value={filterType} onValueChange={setFilterType}>
					<SelectTrigger className="w-[200px] border-primary/30 focus:ring-2 focus:ring-primary/20 shadow-sm hover:shadow-md transition-all">
						<SelectValue placeholder="Filter by" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Products</SelectItem>
						<SelectItem value="low_stock">Low Stock</SelectItem>
						<SelectItem value="out_of_stock">Out of Stock</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Inventory Table */}
			{isLoading ? (
				<div className="flex items-center justify-center py-8">
					<div className="text-muted-foreground">Loading inventory...</div>
				</div>
			) : filteredInventory.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-8 text-center">
					<Package className="h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-medium text-muted-foreground mb-2">
						{inventoryData.length === 0 ? 'No inventory data' : 'No products match your search'}
					</h3>
					<p className="text-sm text-muted-foreground max-w-sm mb-4">
						{inventoryData.length === 0
							? 'Inventory data will appear here once products are added.'
							: 'Try adjusting your search terms or filters to find what you\'re looking for.'}
					</p>
				</div>
			) : (
				<>
					<div className="border border-primary/20 rounded-lg overflow-hidden shadow-lg bg-card">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-gradient-to-r from-muted/50 via-muted/70 to-primary/10 dark:from-muted/30 dark:via-muted/50 dark:to-primary/20 border-b-2 border-primary/20">
										<TableHead className="w-[250px]">Product</TableHead>
										<TableHead className="w-[100px] text-center">Available</TableHead>
										<TableHead className="w-[100px] text-center">Reserved</TableHead>
										<TableHead className="w-[120px] text-center">Reorder Level</TableHead>
										<TableHead className="w-[120px] text-center">Max Stock</TableHead>
										<TableHead className="w-[150px]">Status</TableHead>
										<TableHead className="w-[200px] text-center">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{paginatedInventory.map((inventory) => (
										<TableRow key={inventory.id} className="hover:bg-muted/50 transition-colors">
											<TableCell className="font-medium">
												<div>
													<div className="font-semibold text-foreground">{inventory.product.name}</div>
													<div className="text-sm text-muted-foreground">
														SKU: {inventory.product.sku}
													</div>
												</div>
											</TableCell>
											<TableCell className="text-center">
												<div className="font-bold text-lg">{inventory.quantityAvailable}</div>
											</TableCell>
											<TableCell className="text-center">
												<div className="text-muted-foreground">{inventory.quantityReserved}</div>
											</TableCell>
											<TableCell className="text-center">{inventory.reorderLevel}</TableCell>
											<TableCell className="text-center">{inventory.maxStockLevel}</TableCell>
											<TableCell>
												{inventory.quantityAvailable === 0 ? (
													<Badge variant="destructive" className="shadow-sm">Out of Stock</Badge>
												) : inventory.quantityAvailable <= inventory.reorderLevel ? (
													<Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/60 shadow-sm border-amber-300 dark:border-amber-700">
														Low Stock
													</Badge>
												) : (
													<Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/60 shadow-sm border-green-300 dark:border-green-700">
														In Stock
													</Badge>
												)}
											</TableCell>
											<TableCell>
												<div className="flex items-center justify-center gap-1">
													<Button
														size="icon"
														variant="outline"
														onClick={() => handleOpenAddStock(inventory)}
														title="Add Stock"
														className="h-7 w-7 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
													>
														<Plus className="h-3.5 w-3.5" />
													</Button>
													<Button
														size="icon"
														variant="outline"
														onClick={() => handleOpenRemoveStock(inventory)}
														title="Remove Stock"
														className="h-7 w-7 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
													>
														<Minus className="h-3.5 w-3.5" />
													</Button>
													<Button
														size="icon"
														variant="outline"
														onClick={() => handleViewMovements(inventory)}
														title="View History"
														className="h-7 w-7 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
													>
														<History className="h-3.5 w-3.5" />
													</Button>
													<Button
														size="icon"
														variant="outline"
														onClick={() => handleOpenSettings(inventory)}
														title="Settings"
														className="h-7 w-7 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
													>
														<Settings className="h-3.5 w-3.5" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex items-center justify-center gap-2 mt-4">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
								disabled={currentPage === 1}
								className="border-primary/30"
							>
								Previous
							</Button>
							<div className="flex items-center gap-1">
								{[...Array(totalPages)].map((_, i) => (
									<Button
										key={i}
										variant={currentPage === i + 1 ? "default" : "outline"}
										size="sm"
										onClick={() => setCurrentPage(i + 1)}
										className={cn(
											"w-8 h-8 p-0",
											currentPage === i + 1
												? "bg-primary text-primary-foreground"
												: "border-primary/30"
										)}
									>
										{i + 1}
									</Button>
								))}
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
								disabled={currentPage === totalPages}
								className="border-primary/30"
							>
								Next
							</Button>
						</div>
					)}
				</>
			)}

			{/* View Stock Movements Dialog */}
			<Dialog open={isViewMovementsOpen} onOpenChange={setIsViewMovementsOpen}>
				<DialogContent className="sm:max-w-[900px] w-full border-primary/20 shadow-2xl max-h-[90vh]">
					<DialogHeader className="border-b border-primary/10 pb-4 bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent rounded-t-lg">
						<DialogTitle className="text-2xl flex items-center gap-3">
							<History className="h-6 w-6 text-primary flex-shrink-0" />
							<span>Stock Movement History</span>
						</DialogTitle>
						<DialogDescription className="pl-9">
							{selectedInventory && `${selectedInventory.product.name} (${selectedInventory.product.sku})`}
						</DialogDescription>
					</DialogHeader>

					<div className="overflow-y-auto max-h-[60vh] p-6">
						{stockMovements.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								No stock movements recorded for this product yet.
							</div>
						) : (
							<div className="border border-primary/20 rounded-lg overflow-hidden">
								<Table>
									<TableHeader>
										<TableRow className="bg-gradient-to-r from-muted/50 to-primary/10 dark:from-muted/30 dark:to-primary/20">
											<TableHead>Date</TableHead>
											<TableHead>Type</TableHead>
											<TableHead>Quantity</TableHead>
											<TableHead>Reference</TableHead>
											<TableHead>Unit Cost</TableHead>
											<TableHead>Notes</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{stockMovements.map((movement) => (
											<TableRow key={movement.id}>
												<TableCell className="text-sm">
													{new Date(movement.createdAt).toLocaleDateString('en-US', {
														year: 'numeric',
														month: 'short',
														day: 'numeric',
														hour: '2-digit',
														minute: '2-digit'
													})}
												</TableCell>
												<TableCell>
													<Badge variant={
														movement.movementType === StockMovementType.IN ? 'default' :
														movement.movementType === StockMovementType.OUT ? 'destructive' :
														'secondary'
													} className="shadow-sm">
														{movement.movementType}
													</Badge>
												</TableCell>
												<TableCell>
													<span className={cn(
														"font-semibold",
														movement.movementType === StockMovementType.IN && 'text-green-600',
														movement.movementType === StockMovementType.OUT && 'text-red-600',
														movement.movementType === StockMovementType.ADJUSTMENT && 'text-blue-600'
													)}>
														{movement.movementType === StockMovementType.OUT ? '-' : '+'}
														{movement.quantity}
													</span>
												</TableCell>
												<TableCell>
													<Badge variant="outline" className="text-xs">
														{movement.referenceType.replace(/_/g, ' ')}
													</Badge>
												</TableCell>
												<TableCell>
													{movement.unitCost ? `LKR ${Number(movement.unitCost).toFixed(2)}` : 'N/A'}
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{movement.notes || 'N/A'}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* Inventory Settings Dialog */}
			<Dialog open={isInventorySettingsOpen} onOpenChange={setIsInventorySettingsOpen}>
				<DialogContent className="sm:max-w-[500px] w-full border-primary/20 shadow-2xl">
					<DialogHeader className="border-b border-primary/10 pb-4 bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent rounded-t-lg">
						<DialogTitle className="text-2xl flex items-center gap-3">
							<Settings className="h-6 w-6 text-primary flex-shrink-0" />
							<span>Inventory Settings</span>
						</DialogTitle>
						<DialogDescription className="pl-9">
							{selectedInventory && `${selectedInventory.product.name}`}
						</DialogDescription>
					</DialogHeader>

					<DialogBody className="space-y-4 p-6">
						<div className="space-y-2">
							<Label htmlFor="reorderLevel" className="text-sm font-medium">Reorder Level</Label>
							<Input
								id="reorderLevel"
								type="number"
								min="0"
								value={settingsForm.reorderLevel}
								onChange={(e) => setSettingsForm({...settingsForm, reorderLevel: e.target.value})}
								placeholder="Minimum stock level"
								className="w-full"
							/>
							<p className="text-xs text-muted-foreground mt-1">
								Alert when stock reaches this level
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="maxStockLevel" className="text-sm font-medium">Maximum Stock Level</Label>
							<Input
								id="maxStockLevel"
								type="number"
								min="0"
								value={settingsForm.maxStockLevel}
								onChange={(e) => setSettingsForm({...settingsForm, maxStockLevel: e.target.value})}
								placeholder="Maximum stock capacity"
								className="w-full"
							/>
							<p className="text-xs text-muted-foreground mt-1">
								Maximum inventory capacity for this product
							</p>
						</div>
					</DialogBody>

					<DialogFooter className="border-t border-primary/10 pt-4 px-6 pb-6 flex justify-end space-x-2 bg-gradient-to-r from-transparent to-primary/5 dark:from-transparent dark:to-primary/10 rounded-b-lg">
						<Button variant="outline" onClick={() => setIsInventorySettingsOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleUpdateInventorySettings} disabled={isLoading}>
							{isLoading ? 'Updating...' : 'Update Settings'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
