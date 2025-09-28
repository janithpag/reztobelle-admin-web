'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
} from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination';
import { inventoryAPI, productsAPI } from '@/lib/api';
import { 
	Inventory, 
	Product, 
	StockMovement, 
	StockMovementType, 
	StockReferenceType 
} from '@/types';

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
	const [error, setError] = useState<string | null>(null);
	
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
		setError(null);
		try {
			const params: any = {};
			if (filterType === 'low_stock') {
				params.lowStock = true;
			}
			
			const response = await inventoryAPI.getInventory(params);
			setInventoryData(response.inventory || []);
		} catch (error) {
			console.error('Failed to load inventory:', error);
			setError('Failed to load inventory. Please try again.');
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
			setIsLoading(true);
			
			if (!stockForm.productId || !stockForm.quantity) {
				setError('Please fill in required fields (product and quantity).');
				return;
			}

			await inventoryAPI.adjustStock(parseInt(stockForm.productId), {
				quantity: parseInt(stockForm.quantity),
				movementType: 'IN',
				referenceType: stockForm.reason,
				unitCost: stockForm.unitCost ? parseFloat(stockForm.unitCost) : undefined,
				notes: stockForm.notes || undefined,
			});

			setIsAddStockOpen(false);
			resetStockForm();
			setError(null);
			await loadInventory();
		} catch (error: any) {
			console.error('Failed to add stock:', error);
			setError(error.response?.data?.error || 'Failed to add stock. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleRemoveStock = async () => {
		try {
			setIsLoading(true);
			
			if (!stockForm.productId || !stockForm.quantity || !stockForm.reason) {
				setError('Please fill in required fields (product, quantity, and reason).');
				return;
			}

			await inventoryAPI.adjustStock(parseInt(stockForm.productId), {
				quantity: -parseInt(stockForm.quantity), // Negative for stock removal
				movementType: 'OUT',
				referenceType: stockForm.reason,
				notes: stockForm.notes || undefined,
			});

			setIsRemoveStockOpen(false);
			resetStockForm();
			setError(null);
			await loadInventory();
		} catch (error: any) {
			console.error('Failed to remove stock:', error);
			setError(error.response?.data?.error || 'Failed to remove stock. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdateInventorySettings = async () => {
		if (!selectedInventory) return;

		try {
			setIsLoading(true);

			await inventoryAPI.updateInventory(selectedInventory.productId, {
				reorderLevel: settingsForm.reorderLevel ? parseInt(settingsForm.reorderLevel) : undefined,
				maxStockLevel: settingsForm.maxStockLevel ? parseInt(settingsForm.maxStockLevel) : undefined,
			});

			setIsInventorySettingsOpen(false);
			setSelectedInventory(null);
			resetSettingsForm();
			setError(null);
			await loadInventory();
		} catch (error: any) {
			console.error('Failed to update inventory settings:', error);
			setError(error.response?.data?.error || 'Failed to update inventory settings.');
		} finally {
			setIsLoading(false);
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

	if (isLoading && inventoryData.length === 0) {
		return <Loading />;
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
					<p className="text-muted-foreground">Track and manage product stock levels</p>
				</div>
				<div className="flex gap-2">
					<Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
						<DialogTrigger asChild>
							<Button className="gap-2">
								<Plus className="h-4 w-4" />
								Add Stock
							</Button>
						</DialogTrigger>
					</Dialog>
					<Dialog open={isRemoveStockOpen} onOpenChange={setIsRemoveStockOpen}>
						<DialogTrigger asChild>
							<Button variant="outline" className="gap-2">
								<Minus className="h-4 w-4" />
								Remove Stock
							</Button>
						</DialogTrigger>
					</Dialog>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Products</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalProducts}</div>
						<p className="text-xs text-muted-foreground">In inventory</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Low Stock</CardTitle>
						<AlertTriangle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-orange-600">{lowStockProducts}</div>
						<p className="text-xs text-muted-foreground">Need restocking</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
						<TrendingDown className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">{outOfStockProducts}</div>
						<p className="text-xs text-muted-foreground">Unavailable products</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Stock Value</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">LKR {totalStockValue.toFixed(2)}</div>
						<p className="text-xs text-muted-foreground">Total inventory value</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters and Search */}
			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search products..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-8"
							/>
						</div>
						<Select value={filterType} onValueChange={setFilterType}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Filter by" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Products</SelectItem>
								<SelectItem value="low_stock">Low Stock</SelectItem>
								<SelectItem value="out_of_stock">Out of Stock</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardHeader>
			</Card>

			{/* Inventory Table */}
			<Card>
				<CardHeader>
					<CardTitle>Inventory ({filteredInventory.length})</CardTitle>
					<CardDescription>Current stock levels and inventory management</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Product</TableHead>
									<TableHead>Available</TableHead>
									<TableHead>Reserved</TableHead>
									<TableHead>Reorder Level</TableHead>
									<TableHead>Max Stock</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedInventory.map((inventory) => (
									<TableRow key={inventory.id}>
										<TableCell className="font-medium">
											<div>
												<div className="font-medium">{inventory.product.name}</div>
												<div className="text-sm text-muted-foreground">
													SKU: {inventory.product.sku}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="font-medium">{inventory.quantityAvailable}</div>
										</TableCell>
										<TableCell>
											<div className="text-muted-foreground">{inventory.quantityReserved}</div>
										</TableCell>
										<TableCell>{inventory.reorderLevel}</TableCell>
										<TableCell>{inventory.maxStockLevel}</TableCell>
										<TableCell>
											{inventory.quantityAvailable === 0 ? (
												<Badge variant="destructive">Out of Stock</Badge>
											) : inventory.quantityAvailable <= inventory.reorderLevel ? (
												<Badge variant="secondary" className="bg-orange-100 text-orange-800">
													Low Stock
												</Badge>
											) : (
												<Badge variant="default" className="bg-green-100 text-green-800">
													In Stock
												</Badge>
											)}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end space-x-2">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleOpenAddStock(inventory)}
													title="Add Stock"
												>
													<Plus className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleOpenRemoveStock(inventory)}
													title="Remove Stock"
												>
													<Minus className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleViewMovements(inventory)}
													title="View History"
												>
													<History className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleOpenSettings(inventory)}
													title="Settings"
												>
													<Settings className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>

						{totalPages > 1 && (
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											href="#"
											onClick={(e) => {
												e.preventDefault();
												setCurrentPage(Math.max(1, currentPage - 1));
											}}
										/>
									</PaginationItem>
									{[...Array(totalPages)].map((_, i) => (
										<PaginationItem key={i}>
											<PaginationLink
												href="#"
												onClick={(e) => {
													e.preventDefault();
													setCurrentPage(i + 1);
												}}
												isActive={currentPage === i + 1}
											>
												{i + 1}
											</PaginationLink>
										</PaginationItem>
									))}
									<PaginationItem>
										<PaginationNext
											href="#"
											onClick={(e) => {
												e.preventDefault();
												setCurrentPage(Math.min(totalPages, currentPage + 1));
											}}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Add Stock Dialog */}
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Add Stock</DialogTitle>
					<DialogDescription>Increase inventory for a product</DialogDescription>
				</DialogHeader>

				{error && (
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<div className="space-y-4">
					<div>
						<Label htmlFor="addProduct">Product</Label>
						<Select
							value={stockForm.productId}
							onValueChange={(value) => setStockForm({...stockForm, productId: value})}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select product" />
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

					<div>
						<Label htmlFor="addQuantity">Quantity to Add *</Label>
						<Input
							id="addQuantity"
							type="number"
							min="1"
							value={stockForm.quantity}
							onChange={(e) => setStockForm({...stockForm, quantity: e.target.value})}
							placeholder="Enter quantity"
						/>
					</div>

					<div>
						<Label htmlFor="addUnitCost">Unit Cost</Label>
						<Input
							id="addUnitCost"
							type="number"
							step="0.01"
							value={stockForm.unitCost}
							onChange={(e) => setStockForm({...stockForm, unitCost: e.target.value})}
							placeholder="Cost per unit"
						/>
					</div>

					<div>
						<Label htmlFor="addNotes">Notes</Label>
						<Textarea
							id="addNotes"
							value={stockForm.notes}
							onChange={(e) => setStockForm({...stockForm, notes: e.target.value})}
							placeholder="Optional notes about this stock addition"
							rows={3}
						/>
					</div>
				</div>

				<div className="flex justify-end space-x-2">
					<Button variant="outline" onClick={() => setIsAddStockOpen(false)}>
						Cancel
					</Button>
					<Button onClick={handleAddStock} disabled={isLoading}>
						{isLoading ? 'Adding...' : 'Add Stock'}
					</Button>
				</div>
			</DialogContent>

			{/* Remove Stock Dialog */}
			<Dialog open={isRemoveStockOpen} onOpenChange={setIsRemoveStockOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Remove Stock</DialogTitle>
						<DialogDescription>Reduce inventory for a product</DialogDescription>
					</DialogHeader>

					{error && (
						<Alert>
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="space-y-4">
						<div>
							<Label htmlFor="removeProduct">Product</Label>
							<Select
								value={stockForm.productId}
								onValueChange={(value) => setStockForm({...stockForm, productId: value})}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select product" />
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

						<div>
							<Label htmlFor="removeQuantity">Quantity to Remove *</Label>
							<Input
								id="removeQuantity"
								type="number"
								min="1"
								value={stockForm.quantity}
								onChange={(e) => setStockForm({...stockForm, quantity: e.target.value})}
								placeholder="Enter quantity"
							/>
						</div>

						<div>
							<Label htmlFor="removeReason">Reason *</Label>
							<Select
								value={stockForm.reason}
								onValueChange={(value) => setStockForm({...stockForm, reason: value as StockReferenceType})}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={StockReferenceType.SALE}>Sale</SelectItem>
									<SelectItem value={StockReferenceType.DAMAGE}>Damage</SelectItem>
									<SelectItem value={StockReferenceType.RETURN}>Return</SelectItem>
									<SelectItem value={StockReferenceType.ADJUSTMENT}>Adjustment</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label htmlFor="removeNotes">Notes</Label>
							<Textarea
								id="removeNotes"
								value={stockForm.notes}
								onChange={(e) => setStockForm({...stockForm, notes: e.target.value})}
								placeholder="Optional notes about this stock removal"
								rows={3}
							/>
						</div>
					</div>

					<div className="flex justify-end space-x-2">
						<Button variant="outline" onClick={() => setIsRemoveStockOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleRemoveStock} disabled={isLoading} variant="destructive">
							{isLoading ? 'Removing...' : 'Remove Stock'}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* View Stock Movements Dialog */}
			<Dialog open={isViewMovementsOpen} onOpenChange={setIsViewMovementsOpen}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Stock Movement History</DialogTitle>
						<DialogDescription>
							{selectedInventory && `${selectedInventory.product.name} (${selectedInventory.product.sku})`}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<Table>
							<TableHeader>
								<TableRow>
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
										<TableCell>
											{new Date(movement.createdAt).toLocaleDateString()}
										</TableCell>
										<TableCell>
											<Badge variant={
												movement.movementType === StockMovementType.IN ? 'default' :
												movement.movementType === StockMovementType.OUT ? 'destructive' :
												'secondary'
											}>
												{movement.movementType}
											</Badge>
										</TableCell>
										<TableCell>
											<span className={
												movement.movementType === StockMovementType.IN ? 'text-green-600' :
												movement.movementType === StockMovementType.OUT ? 'text-red-600' :
												'text-blue-600'
											}>
												{movement.movementType === StockMovementType.OUT ? '-' : '+'}
												{movement.quantity}
											</span>
										</TableCell>
										<TableCell>
											<Badge variant="outline">
												{movement.referenceType.replace(/_/g, ' ')}
											</Badge>
										</TableCell>
										<TableCell>
											{movement.unitCost ? `LKR ${Number(movement.unitCost).toFixed(2)}` : 'N/A'}
										</TableCell>
										<TableCell>{movement.notes || 'N/A'}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</DialogContent>
			</Dialog>

			{/* Inventory Settings Dialog */}
			<Dialog open={isInventorySettingsOpen} onOpenChange={setIsInventorySettingsOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Inventory Settings</DialogTitle>
						<DialogDescription>
							{selectedInventory && `${selectedInventory.product.name}`}
						</DialogDescription>
					</DialogHeader>

					{error && (
						<Alert>
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="space-y-4">
						<div>
							<Label htmlFor="reorderLevel">Reorder Level</Label>
							<Input
								id="reorderLevel"
								type="number"
								min="0"
								value={settingsForm.reorderLevel}
								onChange={(e) => setSettingsForm({...settingsForm, reorderLevel: e.target.value})}
								placeholder="Minimum stock level"
							/>
							<p className="text-xs text-muted-foreground mt-1">
								Alert when stock reaches this level
							</p>
						</div>

						<div>
							<Label htmlFor="maxStockLevel">Maximum Stock Level</Label>
							<Input
								id="maxStockLevel"
								type="number"
								min="0"
								value={settingsForm.maxStockLevel}
								onChange={(e) => setSettingsForm({...settingsForm, maxStockLevel: e.target.value})}
								placeholder="Maximum stock capacity"
							/>
							<p className="text-xs text-muted-foreground mt-1">
								Maximum inventory capacity for this product
							</p>
						</div>
					</div>

					<div className="flex justify-end space-x-2">
						<Button variant="outline" onClick={() => setIsInventorySettingsOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleUpdateInventorySettings} disabled={isLoading}>
							{isLoading ? 'Updating...' : 'Update Settings'}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Error Alert */}
			{error && (
				<Alert className="fixed bottom-4 right-4 w-96">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
		</div>
	);
}