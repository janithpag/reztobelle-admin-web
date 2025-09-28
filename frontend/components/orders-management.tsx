'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
	Search,
	Filter,
	MoreHorizontal,
	Eye,
	Package,
	Truck,
	CheckCircle,
	Clock,
	AlertCircle,
	DollarSign,
	Plus,
	Loader2,
	Edit,
	CreditCard,
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
import { ordersAPI, productsAPI, deliveriesAPI } from '@/lib/api';
import { 
	Order, 
	Product, 
	OrderStatus, 
	PaymentStatus, 
	PaymentMethod,
	KoombiyoDeliveryStatus,
	CreateOrderForm 
} from '@/types';

interface OrderFormData {
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	address: string;
	cityId: string;
	cityName: string;
	districtId: string;
	districtName: string;
	paymentMethod: PaymentMethod;
	items: Array<{
		productId: number;
		quantity: number;
	}>;
	notes: string;
	specialNotes: string;
	shippingAmount: string;
	discountAmount: string;
}

// Status badge color mappings
const statusColors = {
	[OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
	[OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
	[OrderStatus.PROCESSING]: 'bg-purple-100 text-purple-800',
	[OrderStatus.READY_FOR_DELIVERY]: 'bg-orange-100 text-orange-800',
	[OrderStatus.SENT_TO_DELIVERY]: 'bg-indigo-100 text-indigo-800',
	[OrderStatus.SHIPPED]: 'bg-cyan-100 text-cyan-800',
	[OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
	[OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
	[OrderStatus.REFUNDED]: 'bg-gray-100 text-gray-800',
};

const paymentStatusColors = {
	[PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
	[PaymentStatus.PAID]: 'bg-green-100 text-green-800',
	[PaymentStatus.PARTIALLY_PAID]: 'bg-orange-100 text-orange-800',
	[PaymentStatus.REFUNDED]: 'bg-gray-100 text-gray-800',
	[PaymentStatus.FAILED]: 'bg-red-100 text-red-800',
};

const deliveryStatusColors = {
	[KoombiyoDeliveryStatus.NOT_SENT]: 'bg-gray-100 text-gray-800',
	[KoombiyoDeliveryStatus.SENT_TO_KOOMBIYO]: 'bg-blue-100 text-blue-800',
	[KoombiyoDeliveryStatus.PICKED_UP]: 'bg-purple-100 text-purple-800',
	[KoombiyoDeliveryStatus.IN_TRANSIT]: 'bg-orange-100 text-orange-800',
	[KoombiyoDeliveryStatus.OUT_FOR_DELIVERY]: 'bg-indigo-100 text-indigo-800',
	[KoombiyoDeliveryStatus.DELIVERED]: 'bg-green-100 text-green-800',
	[KoombiyoDeliveryStatus.FAILED_DELIVERY]: 'bg-red-100 text-red-800',
	[KoombiyoDeliveryStatus.RETURNED]: 'bg-yellow-100 text-yellow-800',
	[KoombiyoDeliveryStatus.CANCELLED]: 'bg-red-100 text-red-800',
};

export function OrdersManagement() {
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [paymentFilter, setPaymentFilter] = useState<string>('all');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);
	const [isLoading, setIsLoading] = useState(true);
	const [ordersData, setOrdersData] = useState<Order[]>([]);
	const [productsData, setProductsData] = useState<Product[]>([]);
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const [error, setError] = useState<string | null>(null);
	
	// Dialog states
	const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);
	const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
	const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
	
	// Form state
	const [orderForm, setOrderForm] = useState<OrderFormData>({
		customerName: '',
		customerEmail: '',
		customerPhone: '',
		address: '',
		cityId: '',
		cityName: '',
		districtId: '',
		districtName: '',
		paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
		items: [],
		notes: '',
		specialNotes: '',
		shippingAmount: '0',
		discountAmount: '0',
	});

	const resetForm = () => {
		setOrderForm({
			customerName: '',
			customerEmail: '',
			customerPhone: '',
			address: '',
			cityId: '',
			cityName: '',
			districtId: '',
			districtName: '',
			paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
			items: [],
			notes: '',
			specialNotes: '',
			shippingAmount: '0',
			discountAmount: '0',
		});
	};

	// Load data functions
	const loadOrders = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const params: any = {};
			if (statusFilter !== 'all') {
				params.status = statusFilter;
			}
			if (paymentFilter !== 'all') {
				params.paymentStatus = paymentFilter;
			}
			
			const response = await ordersAPI.getOrders(params);
			setOrdersData(response.orders || []);
		} catch (error) {
			console.error('Failed to load orders:', error);
			setError('Failed to load orders. Please try again.');
		} finally {
			setIsLoading(false);
		}
	}, [statusFilter, paymentFilter]);

	const loadProducts = useCallback(async () => {
		try {
			const response = await productsAPI.getProducts();
			setProductsData(response.products || []);
		} catch (error) {
			console.error('Failed to load products:', error);
		}
	}, []);

	// Load data on component mount and when filters change
	useEffect(() => {
		loadProducts();
	}, [loadProducts]);

	useEffect(() => {
		loadOrders();
	}, [loadOrders]);

	// Order actions
	const handleUpdateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
		try {
			setIsLoading(true);
			await ordersAPI.updateOrderStatus(orderId, newStatus);
			await loadOrders();
		} catch (error: any) {
			console.error('Failed to update order status:', error);
			setError(error.response?.data?.error || 'Failed to update order status.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdatePaymentStatus = async (orderId: number, paymentStatus: PaymentStatus) => {
		try {
			setIsLoading(true);
			await ordersAPI.updatePaymentStatus(orderId, paymentStatus);
			await loadOrders();
		} catch (error: any) {
			console.error('Failed to update payment status:', error);
			setError(error.response?.data?.error || 'Failed to update payment status.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleSendToDelivery = async (orderId: number) => {
		try {
			setIsLoading(true);
			await deliveriesAPI.sendToKoombiyo(orderId);
			await loadOrders();
		} catch (error: any) {
			console.error('Failed to send to delivery:', error);
			setError(error.response?.data?.error || 'Failed to send to delivery service.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancelOrder = async (orderId: number) => {
		if (confirm('Are you sure you want to cancel this order?')) {
			try {
				setIsLoading(true);
				await ordersAPI.cancelOrder(orderId, 'Cancelled by admin');
				await loadOrders();
			} catch (error: any) {
				console.error('Failed to cancel order:', error);
				setError(error.response?.data?.error || 'Failed to cancel order.');
			} finally {
				setIsLoading(false);
			}
		}
	};

	const handleCreateOrder = async () => {
		try {
			setIsLoading(true);
			
			if (!orderForm.customerName || !orderForm.address || orderForm.items.length === 0) {
				setError('Please fill in all required fields and add at least one item.');
				return;
			}

			const orderData: CreateOrderForm = {
				customerName: orderForm.customerName,
				customerEmail: orderForm.customerEmail || undefined,
				customerPhone: orderForm.customerPhone || undefined,
				address: orderForm.address,
				cityId: parseInt(orderForm.cityId),
				cityName: orderForm.cityName,
				districtId: parseInt(orderForm.districtId),
				districtName: orderForm.districtName,
				paymentMethod: orderForm.paymentMethod,
				items: orderForm.items,
				notes: orderForm.notes || undefined,
				specialNotes: orderForm.specialNotes || undefined,
				shippingAmount: parseFloat(orderForm.shippingAmount) || 0,
				discountAmount: parseFloat(orderForm.discountAmount) || 0,
			};

			await ordersAPI.createOrder(orderData);
			setIsAddOrderOpen(false);
			resetForm();
			setError(null);
			await loadOrders();
		} catch (error: any) {
			console.error('Failed to create order:', error);
			setError(error.response?.data?.error || 'Failed to create order. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	// Filter and search orders
	const filteredOrders = ordersData.filter((order) => {
		const matchesSearch = 
			order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
			order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
		
		return matchesSearch;
	});

	// Pagination
	const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

	// Stats calculations
	const totalOrders = ordersData.length;
	const pendingOrders = ordersData.filter(o => o.status === OrderStatus.PENDING).length;
	const deliveredOrders = ordersData.filter(o => o.status === OrderStatus.DELIVERED).length;
	const totalRevenue = ordersData
		.filter(o => o.status === OrderStatus.DELIVERED)
		.reduce((sum, order) => sum + Number(order.totalAmount), 0);

	if (isLoading && ordersData.length === 0) {
		return <Loading />;
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Orders</h1>
					<p className="text-muted-foreground">Manage customer orders and deliveries</p>
				</div>
				<Dialog open={isAddOrderOpen} onOpenChange={setIsAddOrderOpen}>
					<DialogTrigger asChild>
						<Button className="gap-2">
							<Plus className="h-4 w-4" />
							New Order
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create New Order</DialogTitle>
							<DialogDescription>Add a new customer order</DialogDescription>
						</DialogHeader>

						{error && (
							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="space-y-4">
							{/* Customer Information */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="customerName">Customer Name *</Label>
									<Input
										id="customerName"
										value={orderForm.customerName}
										onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
										placeholder="Enter customer name"
									/>
								</div>
								<div>
									<Label htmlFor="customerEmail">Email</Label>
									<Input
										id="customerEmail"
										type="email"
										value={orderForm.customerEmail}
										onChange={(e) => setOrderForm({...orderForm, customerEmail: e.target.value})}
										placeholder="customer@email.com"
									/>
								</div>
								<div>
									<Label htmlFor="customerPhone">Phone</Label>
									<Input
										id="customerPhone"
										value={orderForm.customerPhone}
										onChange={(e) => setOrderForm({...orderForm, customerPhone: e.target.value})}
										placeholder="+94 XX XXX XXXX"
									/>
								</div>
								<div>
									<Label htmlFor="paymentMethod">Payment Method *</Label>
									<Select
										value={orderForm.paymentMethod}
										onValueChange={(value) => setOrderForm({...orderForm, paymentMethod: value as PaymentMethod})}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value={PaymentMethod.CASH_ON_DELIVERY}>Cash on Delivery</SelectItem>
											<SelectItem value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Delivery Address */}
							<div>
								<Label htmlFor="address">Delivery Address *</Label>
								<Textarea
									id="address"
									value={orderForm.address}
									onChange={(e) => setOrderForm({...orderForm, address: e.target.value})}
									placeholder="Enter complete delivery address"
									rows={3}
								/>
							</div>

							{/* Location Information */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="districtName">District *</Label>
									<Input
										id="districtName"
										value={orderForm.districtName}
										onChange={(e) => setOrderForm({...orderForm, districtName: e.target.value})}
										placeholder="e.g., Colombo"
									/>
								</div>
								<div>
									<Label htmlFor="cityName">City *</Label>
									<Input
										id="cityName"
										value={orderForm.cityName}
										onChange={(e) => setOrderForm({...orderForm, cityName: e.target.value})}
										placeholder="e.g., Colombo 03"
									/>
								</div>
							</div>

							{/* Order Details */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="shippingAmount">Shipping Amount</Label>
									<Input
										id="shippingAmount"
										type="number"
										step="0.01"
										value={orderForm.shippingAmount}
										onChange={(e) => setOrderForm({...orderForm, shippingAmount: e.target.value})}
										placeholder="0.00"
									/>
								</div>
								<div>
									<Label htmlFor="discountAmount">Discount Amount</Label>
									<Input
										id="discountAmount"
										type="number"
										step="0.01"
										value={orderForm.discountAmount}
										onChange={(e) => setOrderForm({...orderForm, discountAmount: e.target.value})}
										placeholder="0.00"
									/>
								</div>
							</div>

							{/* Order Notes */}
							<div>
								<Label htmlFor="notes">Order Notes</Label>
								<Textarea
									id="notes"
									value={orderForm.notes}
									onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
									placeholder="General notes about the order"
									rows={2}
								/>
							</div>

							<div>
								<Label htmlFor="specialNotes">Special Instructions</Label>
								<Textarea
									id="specialNotes"
									value={orderForm.specialNotes}
									onChange={(e) => setOrderForm({...orderForm, specialNotes: e.target.value})}
									placeholder="Special delivery or handling instructions"
									rows={2}
								/>
							</div>

							{/* TODO: Add product selection interface */}
							<div>
								<Label>Order Items</Label>
								<p className="text-sm text-muted-foreground">Product selection interface to be implemented</p>
							</div>
						</div>

						<div className="flex justify-end space-x-2">
							<Button variant="outline" onClick={() => setIsAddOrderOpen(false)}>
								Cancel
							</Button>
							<Button onClick={handleCreateOrder} disabled={isLoading}>
								{isLoading ? 'Creating...' : 'Create Order'}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Orders</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalOrders}</div>
						<p className="text-xs text-muted-foreground">All time orders</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{pendingOrders}</div>
						<p className="text-xs text-muted-foreground">Awaiting processing</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Delivered</CardTitle>
						<CheckCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{deliveredOrders}</div>
						<p className="text-xs text-muted-foreground">Successfully delivered</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Revenue</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">LKR {totalRevenue.toFixed(2)}</div>
						<p className="text-xs text-muted-foreground">From delivered orders</p>
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
								placeholder="Search orders, customers..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-8"
							/>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Order Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Statuses</SelectItem>
								{Object.values(OrderStatus).map((status) => (
									<SelectItem key={status} value={status}>
										{status.replace(/_/g, ' ')}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={paymentFilter} onValueChange={setPaymentFilter}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Payment Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Payments</SelectItem>
								{Object.values(PaymentStatus).map((status) => (
									<SelectItem key={status} value={status}>
										{status.replace(/_/g, ' ')}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardHeader>
			</Card>

			{/* Orders Table */}
			<Card>
				<CardHeader>
					<CardTitle>Orders ({filteredOrders.length})</CardTitle>
					<CardDescription>Manage customer orders and track deliveries</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Order</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Items</TableHead>
									<TableHead>Total</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Payment</TableHead>
									<TableHead>Delivery</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedOrders.map((order) => (
									<TableRow key={order.id}>
										<TableCell className="font-medium">
											<div>
												<div className="font-medium">{order.orderNumber}</div>
												<div className="text-sm text-muted-foreground">
													{new Date(order.createdAt).toLocaleDateString()}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div>
												<div className="font-medium">{order.customerName}</div>
												<div className="text-sm text-muted-foreground">
													{order.customerEmail || order.customerPhone}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="text-sm">
												{order.orderItems?.length || 0} item(s)
											</div>
										</TableCell>
										<TableCell>
											<div className="font-medium">LKR {Number(order.totalAmount).toFixed(2)}</div>
										</TableCell>
										<TableCell>
											<Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}>
												{order.status.replace(/_/g, ' ')}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge className={paymentStatusColors[order.paymentStatus] || 'bg-gray-100 text-gray-800'}>
												{order.paymentStatus.replace(/_/g, ' ')}
											</Badge>
										</TableCell>
										<TableCell>
											{order.deliveryStatus && (
												<Badge className={deliveryStatusColors[order.deliveryStatus] || 'bg-gray-100 text-gray-800'}>
													{order.deliveryStatus.replace(/_/g, ' ')}
												</Badge>
											)}
										</TableCell>
										<TableCell className="text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" className="h-8 w-8 p-0">
														<span className="sr-only">Open menu</span>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>Actions</DropdownMenuLabel>
													<DropdownMenuItem onClick={() => {
														setSelectedOrder(order);
														setIsViewOrderOpen(true);
													}}>
														<Eye className="mr-2 h-4 w-4" />
														View Details
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.CONFIRMED)}>
														<CheckCircle className="mr-2 h-4 w-4" />
														Confirm Order
													</DropdownMenuItem>
													<DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.READY_FOR_DELIVERY)}>
														<Package className="mr-2 h-4 w-4" />
														Ready for Delivery
													</DropdownMenuItem>
													<DropdownMenuItem onClick={() => handleSendToDelivery(order.id)}>
														<Truck className="mr-2 h-4 w-4" />
														Send to Delivery
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem onClick={() => handleUpdatePaymentStatus(order.id, PaymentStatus.PAID)}>
														<CreditCard className="mr-2 h-4 w-4" />
														Mark as Paid
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem 
														onClick={() => handleCancelOrder(order.id)}
														className="text-red-600"
													>
														<AlertCircle className="mr-2 h-4 w-4" />
														Cancel Order
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
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

			{/* View Order Dialog */}
			<Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Order Details</DialogTitle>
						<DialogDescription>
							{selectedOrder && `Order ${selectedOrder.orderNumber}`}
						</DialogDescription>
					</DialogHeader>

					{selectedOrder && (
						<div className="space-y-4">
							{/* Customer Information */}
							<div>
								<h4 className="font-semibold mb-2">Customer Information</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
									<div><strong>Name:</strong> {selectedOrder.customerName}</div>
									<div><strong>Email:</strong> {selectedOrder.customerEmail || 'N/A'}</div>
									<div><strong>Phone:</strong> {selectedOrder.customerPhone || 'N/A'}</div>
									<div><strong>Address:</strong> {selectedOrder.address}</div>
								</div>
							</div>

							{/* Order Information */}
							<div>
								<h4 className="font-semibold mb-2">Order Information</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
									<div><strong>Order Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
									<div><strong>Payment Method:</strong> {selectedOrder.paymentMethod.replace(/_/g, ' ')}</div>
									<div><strong>Subtotal:</strong> LKR {Number(selectedOrder.subtotal).toFixed(2)}</div>
									<div><strong>Shipping:</strong> LKR {Number(selectedOrder.shippingAmount).toFixed(2)}</div>
									<div><strong>Discount:</strong> LKR {Number(selectedOrder.discountAmount).toFixed(2)}</div>
									<div><strong>Total:</strong> LKR {Number(selectedOrder.totalAmount).toFixed(2)}</div>
								</div>
							</div>

							{/* Order Items */}
							<div>
								<h4 className="font-semibold mb-2">Order Items</h4>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Product</TableHead>
											<TableHead>Quantity</TableHead>
											<TableHead>Unit Price</TableHead>
											<TableHead>Total</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{selectedOrder.orderItems?.map((item, index) => (
											<TableRow key={index}>
												<TableCell>
													<div>
														<div className="font-medium">{item.productName}</div>
														<div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
													</div>
												</TableCell>
												<TableCell>{item.quantity}</TableCell>
												<TableCell>LKR {Number(item.unitPrice).toFixed(2)}</TableCell>
												<TableCell>LKR {Number(item.totalPrice).toFixed(2)}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							{/* Status Information */}
							<div>
								<h4 className="font-semibold mb-2">Status Information</h4>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<div className="text-sm font-medium">Order Status</div>
										<Badge className={statusColors[selectedOrder.status]}>
											{selectedOrder.status.replace(/_/g, ' ')}
										</Badge>
									</div>
									<div>
										<div className="text-sm font-medium">Payment Status</div>
										<Badge className={paymentStatusColors[selectedOrder.paymentStatus]}>
											{selectedOrder.paymentStatus.replace(/_/g, ' ')}
										</Badge>
									</div>
									{selectedOrder.deliveryStatus && (
										<div>
											<div className="text-sm font-medium">Delivery Status</div>
											<Badge className={deliveryStatusColors[selectedOrder.deliveryStatus]}>
												{selectedOrder.deliveryStatus.replace(/_/g, ' ')}
											</Badge>
										</div>
									)}
								</div>
							</div>

							{/* Notes */}
							{(selectedOrder.notes || selectedOrder.specialNotes || selectedOrder.internalNotes) && (
								<div>
									<h4 className="font-semibold mb-2">Notes</h4>
									<div className="space-y-2 text-sm">
										{selectedOrder.notes && (
											<div>
												<strong>Order Notes:</strong>
												<p className="text-muted-foreground">{selectedOrder.notes}</p>
											</div>
										)}
										{selectedOrder.specialNotes && (
											<div>
												<strong>Special Instructions:</strong>
												<p className="text-muted-foreground">{selectedOrder.specialNotes}</p>
											</div>
										)}
										{selectedOrder.internalNotes && (
											<div>
												<strong>Internal Notes:</strong>
												<p className="text-muted-foreground">{selectedOrder.internalNotes}</p>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Delivery Information */}
							{selectedOrder.waybillId && (
								<div>
									<h4 className="font-semibold mb-2">Delivery Information</h4>
									<div className="text-sm space-y-2">
										<div><strong>Waybill ID:</strong> {selectedOrder.waybillId}</div>
										{selectedOrder.koombiyoOrderId && (
											<div><strong>Koombiyo Order ID:</strong> {selectedOrder.koombiyoOrderId}</div>
										)}
										{selectedOrder.sentToDeliveryAt && (
											<div><strong>Sent to Delivery:</strong> {new Date(selectedOrder.sentToDeliveryAt).toLocaleString()}</div>
										)}
										{selectedOrder.deliveredAt && (
											<div><strong>Delivered:</strong> {new Date(selectedOrder.deliveredAt).toLocaleString()}</div>
										)}
									</div>
								</div>
							)}
						</div>
					)}
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