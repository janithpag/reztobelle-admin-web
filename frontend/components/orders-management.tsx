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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import {
	Search,
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
	CreditCard,
	Check,
	ChevronsUpDown,
	X,
	PackageCheck,
	Send,
	ShipWheel,
	RotateCcw,
	XCircle,
	RefreshCw,
	Trash,
	PackagePlus,
} from 'lucide-react';
import { ordersAPI, productsAPI } from '@/lib/api';
import {
	Order,
	Product,
	OrderStatus,
	PaymentStatus,
	PaymentMethod,
	CreateOrderForm
} from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getDistricts, getCities, sendOrderToKoombiyo, getWaybills, type District, type City, type Waybill } from '@/lib/koombiyo-server';

interface OrderFormData {
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	address: string;
	cityId: number | '';
	cityName: string;
	districtId: number | '';
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
	markAsReadyForDelivery?: boolean;
}

// Status badge color mappings
const statusColors = {
	[OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
	[OrderStatus.READY_FOR_DELIVERY]: 'bg-orange-100 text-orange-800',
	[OrderStatus.SENT_TO_DELIVERY]: 'bg-indigo-100 text-indigo-800',
	[OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
	[OrderStatus.RETURNED]: 'bg-amber-100 text-amber-800',
	[OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
	[OrderStatus.REFUNDED]: 'bg-gray-100 text-gray-800',
	[OrderStatus.DELETED]: 'bg-slate-100 text-slate-800',
};

const paymentStatusColors = {
	[PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
	[PaymentStatus.PAID]: 'bg-green-100 text-green-800',
	[PaymentStatus.REFUNDED]: 'bg-gray-100 text-gray-800',
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
	const [orderStats, setOrderStats] = useState<Record<string, number>>({});

	// Dialog states
	const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);
	const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
	const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
	const [isAttachWaybillOpen, setIsAttachWaybillOpen] = useState(false);
	const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
	const [orderToCancel, setOrderToCancel] = useState<number | null>(null);
	const [waybillId, setWaybillId] = useState('');
	const [availableWaybills, setAvailableWaybills] = useState<Waybill[]>([]);
	const [isLoadingWaybills, setIsLoadingWaybills] = useState(false);
	const [waybillOpen, setWaybillOpen] = useState(false);

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
		shippingAmount: '350',
		discountAmount: '0',
	});

	// Koombiyo location data
	const [districts, setDistricts] = useState<District[]>([]);
	const [cities, setCities] = useState<City[]>([]);
	const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
	const [isLoadingCities, setIsLoadingCities] = useState(false);
	const [districtOpen, setDistrictOpen] = useState(false);
	const [cityOpen, setCityOpen] = useState(false);

	// Product selection state
	const [productOpen, setProductOpen] = useState(false);
	const [productSearchValue, setProductSearchValue] = useState('');

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
			shippingAmount: '350',
			discountAmount: '0',
			markAsReadyForDelivery: false,
		});
		setSelectedOrder(null);
	};

	// Load data functions
	const loadOrderStats = useCallback(async () => {
		try {
			const response = await ordersAPI.getOrderStats();
			setOrderStats(response.stats || {});
		} catch (error) {
			console.error('Failed to load order stats:', error);
			toast.error('Failed to load order statistics');
		}
	}, []);

	const loadOrders = useCallback(async () => {
		setIsLoading(true);
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
			toast.error('Failed to load orders');
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
			toast.error('Failed to load products');
		}
	}, []);

	// Load districts from Koombiyo
	const loadDistricts = useCallback(async () => {
		setIsLoadingDistricts(true);
		try {
			const response = await getDistricts();
			console.log('Koombiyo Districts Response:', response);
			if (response.success && response.data) {
				setDistricts(response.data);
			} else {
				toast.error('Failed to load districts: ' + (response.error || 'Unknown error'));
			}
		} catch (error) {
			console.error('Failed to load districts:', error);
			toast.error('Failed to load districts');
		} finally {
			setIsLoadingDistricts(false);
		}
	}, []);

	// Load cities from Koombiyo based on selected district
	const loadCities = useCallback(async (districtId: number | string) => {
		if (!districtId) return;
		setIsLoadingCities(true);
		try {
			const response = await getCities(districtId);
			if (response.success && response.data) {
				setCities(response.data);
			} else {
				toast.error('Failed to load cities: ' + (response.error || 'Unknown error'));
			}
		} catch (error) {
			console.error('Failed to load cities:', error);
			toast.error('Failed to load cities');
		} finally {
			setIsLoadingCities(false);
		}
	}, []);

	// Load data on component mount and when filters change
	useEffect(() => {
		loadProducts();
		loadDistricts();
		loadOrderStats();
	}, [loadProducts, loadDistricts, loadOrderStats]);

	useEffect(() => {
		loadOrders();
	}, [loadOrders]);

	// Helper function to refresh both orders and stats
	const refreshOrderData = useCallback(async () => {
		await Promise.all([loadOrders(), loadOrderStats()]);
	}, [loadOrders, loadOrderStats]);

	// Order actions
	const handleUpdateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
		try {
			setIsLoading(true);

			// Special handling for SENT_TO_DELIVERY - send to Koombiyo
			if (newStatus === OrderStatus.SENT_TO_DELIVERY) {
				const result = await sendOrderToKoombiyo(orderId);
				if (result.success) {
					toast.success(result.message || 'Order sent to delivery service successfully');
				} else {
					throw new Error(result.error || 'Failed to send order to Koombiyo');
				}
			} else {
				await ordersAPI.updateOrderStatus(orderId, newStatus);
				toast.success('Order status updated successfully');
			}

			await refreshOrderData();
		} catch (error: any) {
			console.error('Failed to update order status:', error);
			toast.error(error.message || error.response?.data?.error || 'Failed to update order status');
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdatePaymentStatus = async (orderId: number, paymentStatus: PaymentStatus) => {
		try {
			setIsLoading(true);
			await ordersAPI.updatePaymentStatus(orderId, paymentStatus);
			toast.success('Payment status updated successfully');
			await refreshOrderData();
		} catch (error: any) {
			console.error('Failed to update payment status:', error);
			toast.error(error.response?.data?.error || 'Failed to update payment status');
		} finally {
			setIsLoading(false);
		}
	};

	const handleOpenCancelConfirm = (orderId: number) => {
		setOrderToCancel(orderId);
		setIsCancelConfirmOpen(true);
	};

	const handleCancelOrder = async () => {
		if (!orderToCancel) return;

		try {
			setIsLoading(true);
			setIsCancelConfirmOpen(false);
			await ordersAPI.cancelOrder(orderToCancel, 'Cancelled by admin');
			toast.success('Order cancelled successfully');
			await refreshOrderData();
		} catch (error: any) {
			console.error('Failed to cancel order:', error);
			toast.error(error.response?.data?.error || 'Failed to cancel order');
		} finally {
			setIsLoading(false);
			setOrderToCancel(null);
		}
	};

	const handleOpenAttachWaybill = async (order: Order) => {
		setSelectedOrder(order);
		setWaybillId('');
		setIsAttachWaybillOpen(true);

		// Load available waybills from Koombiyo
		setIsLoadingWaybills(true);
		try {
			const response = await getWaybills(100);
			if (response.success && response.data) {
				setAvailableWaybills(response.data);
			} else {
				throw new Error(response.error || 'Failed to load waybills');
			}
		} catch (error: any) {
			console.error('Failed to load waybills:', error);
			toast.error(error.message || 'Failed to load available waybills');
		} finally {
			setIsLoadingWaybills(false);
		}
	};

	const handleAttachWaybill = async () => {
		if (!selectedOrder) return;

		if (!waybillId || waybillId.trim() === '') {
			toast.error('Please enter a valid waybill ID');
			return;
		}

		try {
			setIsLoading(true);
			const result = await ordersAPI.attachWaybill(selectedOrder.id, waybillId.trim());
			toast.success(result.message || 'Waybill attached and order sent to Koombiyo successfully');
			setIsAttachWaybillOpen(false);
			setWaybillId('');
			setSelectedOrder(null);
			await refreshOrderData();
		} catch (error: any) {
			console.error('Failed to attach waybill:', error);
			toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to attach waybill and send to Koombiyo');
		} finally {
			setIsLoading(false);
		}
	};

	const handleCreateOrder = async () => {
		try {
			if (!orderForm.customerName || !orderForm.customerPhone || !orderForm.address || !orderForm.districtId || !orderForm.cityId || orderForm.items.length === 0) {
				toast.error('Please fill in all required fields (name, phone, district, city, address) and add at least one item');
				return;
			}

			setIsLoading(true);

			// Map items to include product details required by backend
			const itemsWithDetails = orderForm.items.map(item => {
				const product = productsData.find(p => p.id === item.productId);
				if (!product) {
					throw new Error(`Product not found for ID: ${item.productId}`);
				}
				return {
					productId: item.productId,
					quantity: item.quantity,
					unitPrice: Number(product.price),
					productName: product.name,
					sku: product.sku,
				};
			});

			const orderData: any = {
				customerName: orderForm.customerName,
				customerEmail: orderForm.customerEmail || undefined,
				customerPhone: orderForm.customerPhone,
				address: orderForm.address,
				cityId: typeof orderForm.cityId === 'number' ? orderForm.cityId : parseInt(orderForm.cityId),
				cityName: orderForm.cityName,
				districtId: typeof orderForm.districtId === 'number' ? orderForm.districtId : parseInt(orderForm.districtId),
				districtName: orderForm.districtName,
				paymentMethod: orderForm.paymentMethod,
				items: itemsWithDetails,
				notes: orderForm.notes || undefined,
				specialNotes: orderForm.specialNotes || undefined,
				shippingAmount: parseFloat(orderForm.shippingAmount) || 0,
				discountAmount: parseFloat(orderForm.discountAmount) || 0,
				markAsReadyForDelivery: orderForm.markAsReadyForDelivery || false,
			};

			await ordersAPI.createOrder(orderData);
			toast.success('Order created successfully');
			setIsAddOrderOpen(false);
			resetForm();
			await refreshOrderData();
		} catch (error: any) {
			console.error('Failed to create order:', error);
			toast.error(error.response?.data?.error || 'Failed to create order');
		} finally {
			setIsLoading(false);
		}
	};

	const handleEditOrder = async () => {
		if (!selectedOrder) return;

		try {
			if (!orderForm.customerName || !orderForm.customerPhone || !orderForm.address || !orderForm.districtId || !orderForm.cityId) {
				toast.error('Please fill in all required fields (name, phone, district, city, address)');
				return;
			}

			setIsLoading(true);

			const orderData: any = {
				customerName: orderForm.customerName,
				customerEmail: orderForm.customerEmail || undefined,
				customerPhone: orderForm.customerPhone,
				address: orderForm.address,
				cityId: typeof orderForm.cityId === 'number' ? orderForm.cityId : parseInt(orderForm.cityId as string),
				cityName: orderForm.cityName,
				districtId: typeof orderForm.districtId === 'number' ? orderForm.districtId : parseInt(orderForm.districtId as string),
				districtName: orderForm.districtName,
				notes: orderForm.notes || undefined,
				specialNotes: orderForm.specialNotes || undefined,
				shippingAmount: parseFloat(orderForm.shippingAmount) || 0,
				discountAmount: parseFloat(orderForm.discountAmount) || 0,
			};

			await ordersAPI.updateOrder(selectedOrder.id, orderData);
			toast.success('Order updated successfully');
			setIsEditOrderOpen(false);
			resetForm();
			await refreshOrderData();
		} catch (error: any) {
			console.error('Failed to update order:', error);
			toast.error(error.response?.data?.error || 'Failed to update order');
		} finally {
			setIsLoading(false);
		}
	};

	const handleOpenEditOrder = (order: Order) => {
		if (order.status !== OrderStatus.PENDING) {
			toast.error('Only orders with PENDING status can be edited');
			return;
		}

		setSelectedOrder(order);
		setOrderForm({
			customerName: order.customerName,
			customerEmail: order.customerEmail || '',
			customerPhone: order.customerPhone || '',
			address: order.address,
			cityId: order.cityId,
			cityName: order.cityName,
			districtId: order.districtId,
			districtName: order.districtName,
			paymentMethod: order.paymentMethod,
			items: [], // Items cannot be edited
			notes: order.notes || '',
			specialNotes: order.specialNotes || '',
			shippingAmount: order.shippingAmount.toString(),
			discountAmount: order.discountAmount.toString(),
		});

		// Load cities for the selected district
		if (order.districtId) {
			loadCities(order.districtId);
		}

		setIsEditOrderOpen(true);
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

	return (
		<div className="space-y-3">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-primary/5 via-primary/10 to-purple-500/5 dark:from-primary/10 dark:via-primary/20 dark:to-purple-500/10 border border-primary/20 shadow-md">
				<div>
					<h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-purple-600 dark:from-primary dark:via-primary dark:to-purple-400 bg-clip-text text-transparent">Orders</h1>
					<p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-1.5">
						<Package className="h-3.5 w-3.5" />
						Manage customer orders and deliveries
					</p>
				</div>
				<Dialog open={isAddOrderOpen} onOpenChange={setIsAddOrderOpen}>
					<DialogTrigger asChild>
						<Button className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white">
							<Plus className="mr-2 h-4 w-4" />
							New Order
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[800px] w-full border-primary/20 shadow-2xl">
						<DialogHeader className="border-b border-primary/10 pb-4 bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent rounded-t-lg">
							<DialogTitle className="text-2xl flex items-center gap-3">
								<Package className="h-6 w-6 text-primary flex-shrink-0" />
								<span>Create New Order</span>
							</DialogTitle>
							<DialogDescription className="pl-9">
								Add a new customer order with details
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-6 p-6 max-h-[80vh] overflow-y-auto">
							{/* Customer Information */}
							<div className="grid grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label htmlFor="customerName" className="text-sm font-medium">Customer Name *</Label>
									<Input
										id="customerName"
										value={orderForm.customerName}
										onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
										placeholder="Enter customer name"
										className="w-full"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="customerEmail" className="text-sm font-medium">Email</Label>
									<Input
										id="customerEmail"
										type="email"
										value={orderForm.customerEmail}
										onChange={(e) => setOrderForm({ ...orderForm, customerEmail: e.target.value })}
										placeholder="customer@email.com"
										className="w-full"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="customerPhone" className="text-sm font-medium">Phone *</Label>
									<Input
										id="customerPhone"
										value={orderForm.customerPhone}
										onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
										placeholder="+94 XX XXX XXXX"
										className="w-full"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="paymentMethod" className="text-sm font-medium">Payment Method *</Label>
									<Select
										value={orderForm.paymentMethod}
										onValueChange={(value) => setOrderForm({ ...orderForm, paymentMethod: value as PaymentMethod })}
									>
										<SelectTrigger className="w-full">
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
							<div className="space-y-2">
								<Label htmlFor="address" className="text-sm font-medium">Delivery Address *</Label>
								<Textarea
									id="address"
									value={orderForm.address}
									onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
									placeholder="Enter complete delivery address"
									className="w-full min-h-[80px] resize-none"
								/>
							</div>

							{/* Location Information */}
							<div className="grid grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label className="text-sm font-medium">District *</Label>
									<Popover open={districtOpen} onOpenChange={setDistrictOpen}>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												role="combobox"
												aria-expanded={districtOpen}
												className="w-full justify-between"
												disabled={isLoadingDistricts}
											>
												{orderForm.districtName || (isLoadingDistricts ? "Loading districts..." : "Select district...")}
												<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-full p-0" align="start" side="bottom" sideOffset={4} avoidCollisions={false}>
											<Command>
												<CommandInput placeholder="Search districts..." />
												<CommandEmpty>No district found.</CommandEmpty>
												<CommandList className="max-h-64">
													<CommandGroup>
														{districts.map((district) => (
															<CommandItem
																key={district.id}
																value={district.name}
																onSelect={() => {
																	setOrderForm({
																		...orderForm,
																		districtId: district.id,
																		districtName: district.name,
																		cityId: '',
																		cityName: '',
																	});
																	loadCities(district.id);
																	setDistrictOpen(false);
																}}
															>
																<Check
																	className={cn(
																		"mr-2 h-4 w-4",
																		orderForm.districtId === district.id ? "opacity-100" : "opacity-0"
																	)}
																/>
																{district.name}
															</CommandItem>
														))}
													</CommandGroup>
												</CommandList>
											</Command>
										</PopoverContent>
									</Popover>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-medium">City *</Label>
									<Popover open={cityOpen} onOpenChange={setCityOpen}>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												role="combobox"
												aria-expanded={cityOpen}
												className="w-full justify-between"
												disabled={!orderForm.districtId || isLoadingCities}
											>
												{orderForm.cityName || (isLoadingCities ? "Loading cities..." : orderForm.districtId ? "Select city..." : "Select district first")}
												<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-full p-0" align="start" side="bottom" sideOffset={4} avoidCollisions={false}>
											<Command>
												<CommandInput placeholder="Search cities..." />
												<CommandEmpty>No city found.</CommandEmpty>
												<CommandList className="max-h-64">
													<CommandGroup>
														{cities.map((city) => (
															<CommandItem
																key={city.id}
																value={city.name}
																onSelect={() => {
																	setOrderForm({
																		...orderForm,
																		cityId: city.id,
																		cityName: city.name,
																	});
																	setCityOpen(false);
																}}
															>
																<Check
																	className={cn(
																		"mr-2 h-4 w-4",
																		orderForm.cityId === city.id ? "opacity-100" : "opacity-0"
																	)}
																/>
																{city.name}
															</CommandItem>
														))}
													</CommandGroup>
												</CommandList>
											</Command>
										</PopoverContent>
									</Popover>
								</div>
							</div>

							{/* Order Details */}
							<div className="grid grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label htmlFor="shippingAmount" className="text-sm font-medium">Shipping Amount</Label>
									<Input
										id="shippingAmount"
										type="number"
										step="0.01"
										min="0"
										value={orderForm.shippingAmount}
										onChange={(e) => setOrderForm({ ...orderForm, shippingAmount: e.target.value })}
										placeholder="0.00"
										className="w-full"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="discountAmount" className="text-sm font-medium">Discount Amount</Label>
									<Input
										id="discountAmount"
										type="number"
										step="0.01"
										min="0"
										value={orderForm.discountAmount}
										onChange={(e) => setOrderForm({ ...orderForm, discountAmount: e.target.value })}
										placeholder="0.00"
										className="w-full"
									/>
								</div>
							</div>

							{/* Order Notes */}
							<div className="space-y-2">
								<Label htmlFor="notes" className="text-sm font-medium">Order Notes</Label>
								<Textarea
									id="notes"
									value={orderForm.notes}
									onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
									placeholder="General notes about the order"
									className="w-full min-h-[60px] resize-none"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="specialNotes" className="text-sm font-medium">Special Instructions</Label>
								<Textarea
									id="specialNotes"
									value={orderForm.specialNotes}
									onChange={(e) => setOrderForm({ ...orderForm, specialNotes: e.target.value })}
									placeholder="Special delivery or handling instructions"
									className="w-full min-h-[60px] resize-none"
								/>
							</div>

							{/* Mark as Ready for Delivery Checkbox */}
							<div className="flex items-center space-x-2 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
								<input
									type="checkbox"
									id="markAsReadyForDelivery"
									checked={orderForm.markAsReadyForDelivery || false}
									onChange={(e) => setOrderForm({ ...orderForm, markAsReadyForDelivery: e.target.checked })}
									className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
								/>
								<Label htmlFor="markAsReadyForDelivery" className="text-sm font-medium cursor-pointer flex-1">
									<div className="flex items-center gap-2">
										<Package className="h-4 w-4 text-orange-600" />
										<span>Mark as Ready for Delivery</span>
									</div>
									<p className="text-xs text-muted-foreground mt-1 ml-6">
										Check this to skip the PENDING status and create the order ready for delivery
									</p>
								</Label>
							</div>

							{/* Product Selection Interface */}
							<div className="space-y-3">
								<div className="space-y-2">
									<Label className="text-sm font-medium">Add Products *</Label>
									<Popover open={productOpen} onOpenChange={setProductOpen}>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												role="combobox"
												aria-expanded={productOpen}
												className="w-full justify-between"
											>
												<span className="flex items-center gap-2">
													<Plus className="h-4 w-4" />
													Search and add products...
												</span>
												<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-full p-0" align="start" side="bottom" sideOffset={4}>
											<Command>
												<CommandInput
													placeholder="Search products by name or SKU..."
													value={productSearchValue}
													onValueChange={setProductSearchValue}
												/>
												<CommandEmpty>No products found.</CommandEmpty>
												<CommandList className="max-h-[300px]">
													<CommandGroup>
														{productsData
															.filter(p => p.isActive)
															.map((product) => {
																const isSelected = orderForm.items.some(item => item.productId === product.id);
																const stockAvailable = product.inventory?.quantityAvailable || 0;

																return (
																	<CommandItem
																		key={product.id}
																		value={`${product.name} ${product.sku}`}
																		onSelect={() => {
																			if (!isSelected && stockAvailable > 0) {
																				const newItems = [...orderForm.items, {
																					productId: product.id,
																					quantity: 1,
																				}];
																				setOrderForm({ ...orderForm, items: newItems });
																				toast.success(`${product.name} added to order`);
																			} else if (isSelected) {
																				toast.info(`${product.name} is already in the order`);
																			} else {
																				toast.error(`${product.name} is out of stock`);
																			}
																			setProductOpen(false);
																			setProductSearchValue('');
																		}}
																		disabled={isSelected || stockAvailable === 0}
																		className="flex items-center justify-between py-3"
																	>
																		<div className="flex items-center gap-2 flex-1 min-w-0">
																			{isSelected ? (
																				<Check className="h-4 w-4 text-primary flex-shrink-0" />
																			) : (
																				<div className="h-4 w-4 flex-shrink-0" />
																			)}
																			<div className="flex-1 min-w-0">
																				<div className="font-medium text-sm truncate">{product.name}</div>
																				<div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
																					<span>SKU: {product.sku}</span>
																					<span>•</span>
																					<span className="font-medium">LKR {Number(product.price).toFixed(2)}</span>
																					<span>•</span>
																					<span className={cn(
																						"font-medium",
																						stockAvailable > 10 ? "text-green-600" : stockAvailable > 0 ? "text-orange-600" : "text-red-600"
																					)}>
																						Stock: {stockAvailable}
																					</span>
																				</div>
																			</div>
																		</div>
																		{isSelected && (
																			<Badge variant="secondary" className="ml-2 flex-shrink-0">Added</Badge>
																		)}
																		{!isSelected && stockAvailable === 0 && (
																			<Badge variant="destructive" className="ml-2 flex-shrink-0">Out of Stock</Badge>
																		)}
																	</CommandItem>
																);
															})}
													</CommandGroup>
												</CommandList>
											</Command>
										</PopoverContent>
									</Popover>
									{orderForm.items.length > 0 && (
										<p className="text-xs text-muted-foreground">
											{orderForm.items.length} {orderForm.items.length === 1 ? 'product' : 'products'} added to order
										</p>
									)}
								</div>

								{/* Selected Products Table */}
								{orderForm.items.length > 0 ? (
									<div className="border rounded-lg overflow-hidden">
										<Table>
											<TableHeader>
												<TableRow className="bg-muted/50">
													<TableHead>Product</TableHead>
													<TableHead className="w-[120px]">Quantity</TableHead>
													<TableHead className="w-[100px] text-right">Price</TableHead>
													<TableHead className="w-[100px] text-right">Total</TableHead>
													<TableHead className="w-[60px]"></TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{orderForm.items.map((item, index) => {
													const product = productsData.find(p => p.id === item.productId);
													if (!product) return null;

													const itemTotal = Number(product.price) * item.quantity; return (
														<TableRow key={item.productId}>
															<TableCell>
																<div>
																	<div className="font-medium text-sm">{product.name}</div>
																	<div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
																</div>
															</TableCell>
															<TableCell>
																<Input
																	type="number"
																	min="1"
																	value={item.quantity}
																	onChange={(e) => {
																		const newQuantity = parseInt(e.target.value) || 1;
																		const newItems = [...orderForm.items];
																		newItems[index].quantity = newQuantity;
																		setOrderForm({ ...orderForm, items: newItems });
																	}}
																	className="w-20 h-8"
																/>
															</TableCell>
															<TableCell className="text-right text-sm">
																LKR {Number(product.price).toFixed(2)}
															</TableCell>
															<TableCell className="text-right text-sm font-medium">
																LKR {itemTotal.toFixed(2)}
															</TableCell>
															<TableCell>
																<Button
																	type="button"
																	size="icon"
																	variant="ghost"
																	onClick={() => {
																		const newItems = orderForm.items.filter((_, i) => i !== index);
																		setOrderForm({ ...orderForm, items: newItems });
																		toast.success('Product removed from order');
																	}}
																	className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
																	title="Remove product"
																>
																	<X className="h-4 w-4" />
																</Button>
															</TableCell>
														</TableRow>
													);
												})}
											</TableBody>
										</Table>
										<div className="px-4 py-3 bg-muted/30 border-t">
											<div className="space-y-2">
												<div className="flex justify-between items-center text-sm">
													<span className="text-muted-foreground">Subtotal:</span>
													<span className="font-medium">
														LKR {orderForm.items.reduce((sum, item) => {
															const product = productsData.find(p => p.id === item.productId);
															return sum + (product ? Number(product.price) * item.quantity : 0);
														}, 0).toFixed(2)}
													</span>
												</div>
												<div className="flex justify-between items-center text-sm">
													<span className="text-muted-foreground">Shipping Fee:</span>
													<span className="font-medium">
														LKR {parseFloat(orderForm.shippingAmount || '0').toFixed(2)}
													</span>
												</div>
												{parseFloat(orderForm.discountAmount || '0') > 0 && (
													<div className="flex justify-between items-center text-sm">
														<span className="text-muted-foreground">Discount:</span>
														<span className="font-medium text-green-600 dark:text-green-400">
															-LKR {parseFloat(orderForm.discountAmount || '0').toFixed(2)}
														</span>
													</div>
												)}
												<div className="pt-2 border-t border-border/50">
													<div className="flex justify-between items-center">
														<span className="font-semibold text-base">Total Amount:</span>
														<span className="font-bold text-lg text-primary">
															LKR {(
																orderForm.items.reduce((sum, item) => {
																	const product = productsData.find(p => p.id === item.productId);
																	return sum + (product ? Number(product.price) * item.quantity : 0);
																}, 0) +
																parseFloat(orderForm.shippingAmount || '0') -
																parseFloat(orderForm.discountAmount || '0')
															).toFixed(2)}
														</span>
													</div>
												</div>
											</div>
										</div>
									</div>
								) : null}
							</div>
						</div>
						<div className="flex justify-end gap-3 px-6 py-4 border-t border-primary/10 bg-gradient-to-r from-transparent to-primary/5 dark:from-transparent dark:to-primary/10">
							<Button variant="outline" onClick={() => {
								setIsAddOrderOpen(false);
								resetForm();
							}} className="border-primary/30 hover:bg-primary/5 transition-all">
								Cancel
							</Button>
							<Button onClick={handleCreateOrder} disabled={isLoading} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-600 dark:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300">
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Creating...
									</>
								) : (
									<>
										<Plus className="mr-2 h-4 w-4" />
										Create Order
									</>
								)}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

		{/* Order Status Stats Cards */}
		<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
			<Card className="border-none shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/40 dark:to-yellow-800/40 dark:shadow-lg dark:shadow-yellow-900/20 py-3 gap-0 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter(OrderStatus.PENDING)}>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
					<CardTitle className="text-xs font-medium text-yellow-900 dark:text-yellow-200">Pending</CardTitle>
					<Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
				</CardHeader>
				<CardContent className="pt-1 pb-3">
					<div className="text-2xl font-bold text-yellow-900 dark:text-yellow-50">{orderStats[OrderStatus.PENDING] || 0}</div>
				</CardContent>
			</Card>

			<Card className="border-none shadow-md bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/40 dark:to-orange-800/40 dark:shadow-lg dark:shadow-orange-900/20 py-3 gap-0 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter(OrderStatus.READY_FOR_DELIVERY)}>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
					<CardTitle className="text-xs font-medium text-orange-900 dark:text-orange-200">Ready for Delivery</CardTitle>
					<PackageCheck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
				</CardHeader>
				<CardContent className="pt-1 pb-3">
					<div className="text-2xl font-bold text-orange-900 dark:text-orange-50">{orderStats[OrderStatus.READY_FOR_DELIVERY] || 0}</div>
				</CardContent>
			</Card>

			<Card className="border-none shadow-md bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-800/40 dark:shadow-lg dark:shadow-indigo-900/20 py-3 gap-0 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter(OrderStatus.SENT_TO_DELIVERY)}>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
					<CardTitle className="text-xs font-medium text-indigo-900 dark:text-indigo-200">Sent to Delivery</CardTitle>
					<Send className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
				</CardHeader>
				<CardContent className="pt-1 pb-3">
					<div className="text-2xl font-bold text-indigo-900 dark:text-indigo-50">{orderStats[OrderStatus.SENT_TO_DELIVERY] || 0}</div>
				</CardContent>
			</Card>

			<Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/40 dark:shadow-lg dark:shadow-green-900/20 py-3 gap-0 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter(OrderStatus.DELIVERED)}>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
					<CardTitle className="text-xs font-medium text-green-900 dark:text-green-200">Delivered</CardTitle>
					<CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
				</CardHeader>
				<CardContent className="pt-1 pb-3">
					<div className="text-2xl font-bold text-green-900 dark:text-green-50">{orderStats[OrderStatus.DELIVERED] || 0}</div>
				</CardContent>
			</Card>

			<Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/40 dark:shadow-lg dark:shadow-amber-900/20 py-3 gap-0 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter(OrderStatus.RETURNED)}>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
					<CardTitle className="text-xs font-medium text-amber-900 dark:text-amber-200">Returned</CardTitle>
					<RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-400" />
				</CardHeader>
				<CardContent className="pt-1 pb-3">
					<div className="text-2xl font-bold text-amber-900 dark:text-amber-50">{orderStats[OrderStatus.RETURNED] || 0}</div>
				</CardContent>
			</Card>

			<Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-800/40 dark:shadow-lg dark:shadow-red-900/20 py-3 gap-0 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter(OrderStatus.CANCELLED)}>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
					<CardTitle className="text-xs font-medium text-red-900 dark:text-red-200">Cancelled</CardTitle>
					<XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
				</CardHeader>
				<CardContent className="pt-1 pb-3">
					<div className="text-2xl font-bold text-red-900 dark:text-red-50">{orderStats[OrderStatus.CANCELLED] || 0}</div>
				</CardContent>
			</Card>

			<Card className="border-none shadow-md bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/40 dark:to-gray-800/40 dark:shadow-lg dark:shadow-gray-900/20 py-3 gap-0 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter(OrderStatus.REFUNDED)}>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
					<CardTitle className="text-xs font-medium text-gray-900 dark:text-gray-200">Refunded</CardTitle>
					<RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
				</CardHeader>
				<CardContent className="pt-1 pb-3">
					<div className="text-2xl font-bold text-gray-900 dark:text-gray-50">{orderStats[OrderStatus.REFUNDED] || 0}</div>
				</CardContent>
			</Card>

			<Card className="border-none shadow-md bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 dark:shadow-lg dark:shadow-slate-900/20 py-3 gap-0 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter(OrderStatus.DELETED)}>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
					<CardTitle className="text-xs font-medium text-slate-900 dark:text-slate-200">Deleted</CardTitle>
					<Trash className="h-4 w-4 text-slate-600 dark:text-slate-400" />
				</CardHeader>
				<CardContent className="pt-1 pb-3">
					<div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{orderStats[OrderStatus.DELETED] || 0}</div>
				</CardContent>
			</Card>

			<Card className="border-none shadow-md bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 dark:shadow-lg dark:shadow-primary/20 py-3 gap-0 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('all')}>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
					<CardTitle className="text-xs font-medium text-primary">All Orders</CardTitle>
					<Package className="h-4 w-4 text-primary" />
				</CardHeader>
				<CardContent className="pt-1 pb-3">
					<div className="text-2xl font-bold text-primary">{Object.values(orderStats).reduce((sum, count) => sum + count, 0)}</div>
				</CardContent>
			</Card>
		</div>			{/* Search and Filters */}
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
					<Input
						placeholder="Search orders, customers..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10 bg-gradient-to-r from-background to-primary/5 dark:from-background dark:to-primary/10 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm hover:shadow-md"
					/>
				</div>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-[200px] border-primary/30 focus:ring-2 focus:ring-primary/20 shadow-sm hover:shadow-md transition-all">
						<SelectValue placeholder="Filter by status" />
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
					<SelectTrigger className="w-[200px] border-primary/30 focus:ring-2 focus:ring-primary/20 shadow-sm hover:shadow-md transition-all">
						<SelectValue placeholder="Filter by payment" />
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

			{/* Orders Table */}
			{isLoading ? (
				<div className="flex items-center justify-center py-8">
					<div className="text-muted-foreground">Loading orders...</div>
				</div>
			) : filteredOrders.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-8 text-center">
					<Package className="h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-medium text-muted-foreground mb-2">
						{ordersData.length === 0 ? 'No orders yet' : 'No orders match your search'}
					</h3>
					<p className="text-sm text-muted-foreground max-w-sm mb-4">
						{ordersData.length === 0
							? 'Orders will appear here as customers place them.'
							: 'Try adjusting your filters to find what you\'re looking for.'}
					</p>
				</div>
			) : (
				<>
					<div className="border border-primary/20 rounded-lg overflow-hidden shadow-lg bg-card">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-gradient-to-r from-muted/50 via-muted/70 to-primary/10 dark:from-muted/30 dark:via-muted/50 dark:to-primary/20 border-b-2 border-primary/20">
										<TableHead className="w-[180px]">Order</TableHead>
										<TableHead className="w-[200px]">Customer</TableHead>
										<TableHead className="w-[100px] text-center">Items</TableHead>
										<TableHead className="w-[130px] text-right">Total</TableHead>
										<TableHead className="w-[140px]">Status</TableHead>
										<TableHead className="w-[140px]">Payment</TableHead>
										<TableHead className="w-[140px] text-center">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{paginatedOrders.map((order) => (
										<TableRow key={order.id} className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent dark:hover:from-primary/10 dark:hover:to-transparent transition-all duration-200 border-b border-border/50">
											<TableCell className="w-[180px]">
												<div>
													<div className="font-medium text-sm">{order.orderNumber}</div>
													<div className="text-xs text-muted-foreground">
														{new Date(order.createdAt).toLocaleDateString()}
													</div>
												</div>
											</TableCell>
											<TableCell className="w-[200px]">
												<div className="min-w-0">
													<div className="font-medium text-sm truncate">{order.customerName}</div>
													<div className="text-xs text-muted-foreground truncate">
														{order.customerEmail || order.customerPhone || 'N/A'}
													</div>
												</div>
											</TableCell>
											<TableCell className="w-[100px] text-center">
												<div className="text-sm font-medium">
													{order.orderItems?.length || 0}
												</div>
											</TableCell>
											<TableCell className="w-[130px] text-right">
												<div className="font-medium text-sm whitespace-nowrap">LKR {Number(order.totalAmount).toFixed(2)}</div>
											</TableCell>
											<TableCell className="w-[140px]">
												<Badge className={cn("text-[10px] px-1.5 py-0", statusColors[order.status] || 'bg-gray-100 text-gray-800')}>
													{order.status.replace(/_/g, ' ')}
												</Badge>
											</TableCell>
											<TableCell className="w-[140px]">
												<Badge className={cn("text-[10px] px-1.5 py-0", paymentStatusColors[order.paymentStatus] || 'bg-gray-100 text-gray-800')}>
													{order.paymentStatus.replace(/_/g, ' ')}
												</Badge>
											</TableCell>
											<TableCell className="w-[140px]">
												<div className="flex items-center justify-center gap-1">
													<Button
														size="icon"
														variant="outline"
														onClick={() => {
															setSelectedOrder(order);
															setIsViewOrderOpen(true);
														}}
														className="h-7 w-7 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
														title="View Details"
													>
														<Eye className="h-3.5 w-3.5" />
													</Button>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																size="icon"
																variant="outline"
																className="h-7 w-7 border-primary/30 hover:bg-primary/5"
																title="More Actions"
															>
																<MoreHorizontal className="h-3.5 w-3.5" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuLabel>Actions</DropdownMenuLabel>
															<DropdownMenuSeparator />

															{/* Edit Order - only for PENDING */}
															{order.status === OrderStatus.PENDING && (
																<DropdownMenuItem onClick={() => handleOpenEditOrder(order)}>
																	<Package className="mr-2 h-4 w-4" />
																	Edit Order
																</DropdownMenuItem>
															)}

															{/* PENDING -> READY_FOR_DELIVERY */}
															{order.status === OrderStatus.PENDING && (
																<DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.READY_FOR_DELIVERY)}>
																	<Package className="mr-2 h-4 w-4" />
																	Mark Ready for Delivery
																</DropdownMenuItem>
															)}

															{/* READY_FOR_DELIVERY -> SENT_TO_DELIVERY */}
															{order.status === OrderStatus.READY_FOR_DELIVERY && (
																<DropdownMenuItem onClick={() => handleOpenAttachWaybill(order)}>
																	<Truck className="mr-2 h-4 w-4" />
																	Attach Waybill & Send to Delivery
																</DropdownMenuItem>
															)}

															{/* SENT_TO_DELIVERY -> DELIVERED/RETURNED/REFUNDED */}
															{order.status === OrderStatus.SENT_TO_DELIVERY && (
																<>
																	<DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.DELIVERED)}>
																		<CheckCircle className="mr-2 h-4 w-4 text-green-600" />
																		Mark as Delivered
																	</DropdownMenuItem>
																	<DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.RETURNED)}>
																		<AlertCircle className="mr-2 h-4 w-4 text-orange-600" />
																		Mark as Returned
																	</DropdownMenuItem>
																	<DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.REFUNDED)}>
																		<DollarSign className="mr-2 h-4 w-4 text-blue-600" />
																		Mark as Refunded
																	</DropdownMenuItem>
																</>
															)}

															{/* DELIVERED/RETURNED -> RETURNED/REFUNDED */}
															{(order.status === OrderStatus.DELIVERED || order.status === OrderStatus.RETURNED) && (
																<>
																	{order.status === OrderStatus.DELIVERED && (
																		<DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.RETURNED)}>
																			<AlertCircle className="mr-2 h-4 w-4 text-orange-600" />
																			Mark as Returned
																		</DropdownMenuItem>
																	)}
																	<DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.REFUNDED)}>
																		<DollarSign className="mr-2 h-4 w-4 text-blue-600" />
																		Mark as Refunded
																	</DropdownMenuItem>
																</>
															)}

															<DropdownMenuSeparator />

															{/* Payment Status - separate from order status */}
															<DropdownMenuLabel className="text-xs">Payment Status</DropdownMenuLabel>
															{/* Only allow payment status changes if not REFUNDED (terminal state) */}
															{order.paymentStatus !== PaymentStatus.REFUNDED && (
																<>
																	{order.paymentStatus !== PaymentStatus.PAID && (
																		<DropdownMenuItem onClick={() => handleUpdatePaymentStatus(order.id, PaymentStatus.PAID)}>
																			<CreditCard className="mr-2 h-4 w-4 text-green-600" />
																			Mark as Paid
																		</DropdownMenuItem>
																	)}
																	{/* Cannot change from PAID to PENDING */}
																	{order.paymentStatus !== PaymentStatus.PENDING && order.paymentStatus !== PaymentStatus.PAID && (
																		<DropdownMenuItem onClick={() => handleUpdatePaymentStatus(order.id, PaymentStatus.PENDING)}>
																			<Clock className="mr-2 h-4 w-4 text-yellow-600" />
																			Mark as Pending
																		</DropdownMenuItem>
																	)}
																</>
															)}
															{order.paymentStatus === PaymentStatus.REFUNDED && (
																<DropdownMenuItem disabled>
																	<DollarSign className="mr-2 h-4 w-4 text-gray-400" />
																	Payment Refunded (Locked)
																</DropdownMenuItem>
															)}

															<DropdownMenuSeparator />															{/* Cancel Order - available for non-cancelled/non-refunded */}
															{order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.REFUNDED && (
																<DropdownMenuItem
																	onClick={() => handleOpenCancelConfirm(order.id)}
																	className="text-red-600"
																>
																	<AlertCircle className="mr-2 h-4 w-4" />
																	Cancel Order
																</DropdownMenuItem>
															)}
														</DropdownMenuContent>
													</DropdownMenu>
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
						<div className="flex items-center justify-between mt-4">
							<div className="text-sm text-muted-foreground">
								Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
								{Math.min(currentPage * itemsPerPage, filteredOrders.length)} of{' '}
								{filteredOrders.length} orders
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

			{/* View Order Dialog */}
			<Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
				<DialogContent className="sm:max-w-[900px] w-full max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Order Details</DialogTitle>
						<DialogDescription>
							{selectedOrder && `Order ${selectedOrder.orderNumber}`}
						</DialogDescription>
					</DialogHeader>

					{selectedOrder && (
						<div className="grid gap-6 p-6">
							{/* Customer Information */}
							<div>
								<h3 className="text-sm font-medium mb-3">Customer Information</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-xs text-muted-foreground">Name</p>
										<p className="text-sm">{selectedOrder.customerName}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Email</p>
										<p className="text-sm">{selectedOrder.customerEmail || 'N/A'}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Phone</p>
										<p className="text-sm">{selectedOrder.customerPhone || 'N/A'}</p>
									</div>
									<div className="col-span-2">
										<p className="text-xs text-muted-foreground">Delivery Address</p>
										<p className="text-sm">{selectedOrder.address}</p>
									</div>
								</div>
							</div>

							{/* Order Information */}
							<div>
								<h3 className="text-sm font-medium mb-3">Order Information</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-xs text-muted-foreground">Order Date</p>
										<p className="text-sm">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Payment Method</p>
										<p className="text-sm">{selectedOrder.paymentMethod.replace(/_/g, ' ')}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Subtotal</p>
										<p className="text-sm font-semibold">LKR {Number(selectedOrder.subtotal).toFixed(2)}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Shipping</p>
										<p className="text-sm">LKR {Number(selectedOrder.shippingAmount).toFixed(2)}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Discount</p>
										<p className="text-sm text-green-600 dark:text-green-400">-LKR {Number(selectedOrder.discountAmount).toFixed(2)}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Total Amount</p>
										<p className="text-lg font-bold text-primary">LKR {Number(selectedOrder.totalAmount).toFixed(2)}</p>
									</div>
								</div>
							</div>

							{/* Order Items */}
							<div>
								<h3 className="text-sm font-medium mb-3">Order Items</h3>
								<div className="border rounded-lg overflow-hidden">
									<Table>
										<TableHeader>
											<TableRow className="bg-muted/50">
												<TableHead>Product</TableHead>
												<TableHead className="text-center">Quantity</TableHead>
												<TableHead className="text-right">Unit Price</TableHead>
												<TableHead className="text-right">Total</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{selectedOrder.orderItems?.map((item, index) => (
												<TableRow key={index}>
													<TableCell>
														<div>
															<div className="font-medium text-sm">{item.productName}</div>
															<div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
														</div>
													</TableCell>
													<TableCell className="text-center">{item.quantity}</TableCell>
													<TableCell className="text-right">LKR {Number(item.unitPrice).toFixed(2)}</TableCell>
													<TableCell className="text-right font-medium">LKR {Number(item.totalPrice).toFixed(2)}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>

							{/* Status Information */}
							<div>
								<h3 className="text-sm font-medium mb-3">Status Information</h3>
								<div className="flex items-center gap-2 flex-wrap">
									<div>
										<p className="text-xs text-muted-foreground mb-1">Order Status</p>
										<Badge className={cn("text-xs", statusColors[selectedOrder.status])}>
											{selectedOrder.status.replace(/_/g, ' ')}
										</Badge>
									</div>
									<div>
										<p className="text-xs text-muted-foreground mb-1">Payment Status</p>
										<Badge className={cn("text-xs", paymentStatusColors[selectedOrder.paymentStatus])}>
											{selectedOrder.paymentStatus.replace(/_/g, ' ')}
										</Badge>
									</div>
								</div>
							</div>

							{/* Notes */}
							{(selectedOrder.notes || selectedOrder.specialNotes || selectedOrder.internalNotes) && (
								<div>
									<h3 className="text-sm font-medium mb-3">Notes</h3>
									<div className="space-y-3">
										{selectedOrder.notes && (
											<div>
												<p className="text-xs text-muted-foreground">Order Notes</p>
												<p className="text-sm">{selectedOrder.notes}</p>
											</div>
										)}
										{selectedOrder.specialNotes && (
											<div>
												<p className="text-xs text-muted-foreground">Special Instructions</p>
												<p className="text-sm">{selectedOrder.specialNotes}</p>
											</div>
										)}
										{selectedOrder.internalNotes && (
											<div>
												<p className="text-xs text-muted-foreground">Internal Notes</p>
												<p className="text-sm">{selectedOrder.internalNotes}</p>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Delivery Information */}
							{selectedOrder.waybillId && (
								<div>
									<h3 className="text-sm font-medium mb-3">Delivery Information</h3>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<p className="text-xs text-muted-foreground">Waybill ID</p>
											<p className="text-sm font-mono">{selectedOrder.waybillId}</p>
										</div>
										{selectedOrder.sentToDeliveryAt && (
											<div>
												<p className="text-xs text-muted-foreground">Sent to Delivery</p>
												<p className="text-sm">{new Date(selectedOrder.sentToDeliveryAt).toLocaleString()}</p>
											</div>
										)}
										{selectedOrder.deliveredAt && (
											<div>
												<p className="text-xs text-muted-foreground">Delivered At</p>
												<p className="text-sm">{new Date(selectedOrder.deliveredAt).toLocaleString()}</p>
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					)}
					<div className="flex justify-end gap-3 px-6 py-4 border-t">
						<Button variant="outline" onClick={() => setIsViewOrderOpen(false)}>
							Close
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Edit Order Dialog (Only for PENDING orders) */}
			<Dialog open={isEditOrderOpen} onOpenChange={setIsEditOrderOpen}>
				<DialogContent className="sm:max-w-[700px] w-full border-primary/20 shadow-2xl">
					<DialogHeader className="border-b border-primary/10 pb-4">
						<DialogTitle className="text-2xl flex items-center gap-3">
							<Package className="h-6 w-6 text-primary" />
							<span>Edit Order</span>
						</DialogTitle>
						<DialogDescription>
							{selectedOrder && `Edit order ${selectedOrder.orderNumber} (PENDING status only)`}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6 p-6 max-h-[70vh] overflow-y-auto">
						{/* Customer Information */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit-customerName">Customer Name *</Label>
								<Input
									id="edit-customerName"
									value={orderForm.customerName}
									onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-customerEmail">Email</Label>
								<Input
									id="edit-customerEmail"
									type="email"
									value={orderForm.customerEmail}
									onChange={(e) => setOrderForm({ ...orderForm, customerEmail: e.target.value })}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-customerPhone">Phone *</Label>
								<Input
									id="edit-customerPhone"
									value={orderForm.customerPhone}
									onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
								/>
							</div>
						</div>

						{/* Address */}
						<div className="space-y-2">
							<Label htmlFor="edit-address">Delivery Address *</Label>
							<Textarea
								id="edit-address"
								value={orderForm.address}
								onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
								className="min-h-[80px] resize-none"
							/>
						</div>

						{/* Location */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>District *</Label>
								<Popover open={districtOpen} onOpenChange={setDistrictOpen}>
									<PopoverTrigger asChild>
										<Button variant="outline" role="combobox" className="w-full justify-between">
											{orderForm.districtName || "Select district..."}
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-full p-0">
										<Command>
											<CommandInput placeholder="Search district..." />
											<CommandList>
												<CommandEmpty>No district found.</CommandEmpty>
												<CommandGroup>
													{districts.map((district) => (
														<CommandItem
															key={district.id}
															value={district.name}
															onSelect={() => {
																setOrderForm({
																	...orderForm,
																	districtId: district.id,
																	districtName: district.name,
																	cityId: '',
																	cityName: ''
																});
																loadCities(district.id);
																setDistrictOpen(false);
															}}
														>
															<Check className={cn("mr-2 h-4 w-4", orderForm.districtId === district.id ? "opacity-100" : "opacity-0")} />
															{district.name}
														</CommandItem>
													))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
							</div>
							<div className="space-y-2">
								<Label>City *</Label>
								<Popover open={cityOpen} onOpenChange={setCityOpen}>
									<PopoverTrigger asChild>
										<Button variant="outline" role="combobox" disabled={!orderForm.districtId} className="w-full justify-between">
											{orderForm.cityName || "Select city..."}
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-full p-0">
										<Command>
											<CommandInput placeholder="Search city..." />
											<CommandList>
												<CommandEmpty>No city found.</CommandEmpty>
												<CommandGroup>
													{cities.map((city) => (
														<CommandItem
															key={city.id}
															value={city.name}
															onSelect={() => {
																setOrderForm({
																	...orderForm,
																	cityId: city.id,
																	cityName: city.name
																});
																setCityOpen(false);
															}}
														>
															<Check className={cn("mr-2 h-4 w-4", orderForm.cityId === city.id ? "opacity-100" : "opacity-0")} />
															{city.name}
														</CommandItem>
													))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
							</div>
						</div>

						{/* Shipping & Discount */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit-shippingAmount">Shipping Amount</Label>
								<Input
									id="edit-shippingAmount"
									type="number"
									step="0.01"
									min="0"
									value={orderForm.shippingAmount}
									onChange={(e) => setOrderForm({ ...orderForm, shippingAmount: e.target.value })}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-discountAmount">Discount Amount</Label>
								<Input
									id="edit-discountAmount"
									type="number"
									step="0.01"
									min="0"
									value={orderForm.discountAmount}
									onChange={(e) => setOrderForm({ ...orderForm, discountAmount: e.target.value })}
								/>
							</div>
						</div>

						{/* Notes */}
						<div className="space-y-2">
							<Label htmlFor="edit-notes">Order Notes</Label>
							<Textarea
								id="edit-notes"
								value={orderForm.notes}
								onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
								className="min-h-[60px] resize-none"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-specialNotes">Special Instructions</Label>
							<Textarea
								id="edit-specialNotes"
								value={orderForm.specialNotes}
								onChange={(e) => setOrderForm({ ...orderForm, specialNotes: e.target.value })}
								className="min-h-[60px] resize-none"
							/>
						</div>

						<div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
							<p className="text-xs text-blue-800 dark:text-blue-200">
								<strong>Note:</strong> Order items cannot be modified after creation. Only customer information, delivery details, and amounts can be updated for PENDING orders.
							</p>
						</div>
					</div>

					<div className="flex justify-end gap-3 px-6 py-4 border-t">
						<Button variant="outline" onClick={() => {
							setIsEditOrderOpen(false);
							resetForm();
						}}>
							Cancel
						</Button>
						<Button onClick={handleEditOrder} disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Updating...
								</>
							) : (
								'Update Order'
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Attach Waybill Dialog */}
			<Dialog open={isAttachWaybillOpen} onOpenChange={setIsAttachWaybillOpen}>
				<DialogContent className="sm:max-w-[750px] max-h-[95vh] p-0 gap-0 flex flex-col">
					{/* Fixed Header */}
					<div className="px-6 py-4 border-b bg-background sticky top-0 z-10">
						<DialogHeader className="space-y-3">
							<div className="flex items-center gap-3">
								<div className="p-2.5 bg-primary/10 rounded-lg">
									<Truck className="h-5 w-5 text-primary" />
								</div>
								<div className="flex-1">
									<DialogTitle className="text-xl">Attach Waybill & Send to Delivery</DialogTitle>
									<DialogDescription className="text-sm mt-1">
										{selectedOrder && `Order ${selectedOrder.orderNumber}`}
									</DialogDescription>
								</div>
							</div>
						</DialogHeader>
					</div>

					{/* Scrollable Content */}
					{selectedOrder && (
						<div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 pb-6">
							<div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-l-4 border-blue-500 rounded-lg shadow-sm">
								<div className="flex gap-3">
									<AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
									<div className="flex-1">
										<p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2.5">
											Important Notice
										</p>
										<ul className="text-xs text-blue-800 dark:text-blue-200 space-y-2">
											<li className="flex items-start gap-2">
												<span className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0">•</span>
												<span className="leading-relaxed">Select an available waybill from Koombiyo&apos;s list</span>
											</li>
											<li className="flex items-start gap-2">
												<span className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0">•</span>
												<span className="leading-relaxed">Order status will automatically change to &quot;SENT_TO_DELIVERY&quot;</span>
											</li>
											<li className="flex items-start gap-2">
												<span className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0">•</span>
												<span className="leading-relaxed">Delivery tracking will begin immediately after submission</span>
											</li>
										</ul>
									</div>
								</div>
							</div>

							<div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
								<div className="flex items-center justify-between">
									<Label className="text-sm font-semibold">Select Waybill ID *</Label>
									<Badge variant="secondary" className="font-mono text-xs">
										{availableWaybills.length} available
									</Badge>
								</div>
								<Popover open={waybillOpen} onOpenChange={setWaybillOpen}>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											role="combobox"
											aria-expanded={waybillOpen}
											className="w-full justify-between font-mono h-11 text-base hover:bg-primary/5"
											disabled={isLoadingWaybills}
										>
											{isLoadingWaybills ? (
												<span className="flex items-center text-muted-foreground">
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Loading waybills from Koombiyo...
												</span>
											) : waybillId ? (
												<span className="flex items-center gap-2">
													<Package className="h-4 w-4 text-primary" />
													{availableWaybills.find((w) => w.waybill_id === waybillId)?.waybill_id || waybillId}
												</span>
											) : (
												<span className="text-muted-foreground">Select waybill number...</span>
											)}
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
										<Command>
											<CommandInput placeholder="Search waybill number..." className="h-10" />
											<CommandList>
												<CommandEmpty>
													<div className="py-6 text-center text-sm text-muted-foreground">
														{isLoadingWaybills ? (
															<div className="flex items-center justify-center gap-2">
																<Loader2 className="h-4 w-4 animate-spin" />
																Loading...
															</div>
														) : (
															'No waybills available'
														)}
													</div>
												</CommandEmpty>
												<CommandGroup>
													{availableWaybills.map((waybill) => (
														<CommandItem
															key={waybill.waybill_id}
															value={waybill.waybill_id}
															onSelect={() => {
																setWaybillId(waybill.waybill_id);
																setWaybillOpen(false);
															}}
															className="font-mono"
														>
															<Check
																className={cn(
																	"mr-2 h-4 w-4",
																	waybillId === waybill.waybill_id ? "opacity-100" : "opacity-0"
																)}
															/>
															<Package className="mr-2 h-4 w-4 text-muted-foreground" />
															<span>{waybill.waybill_id}</span>
														</CommandItem>
													))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
								<p className="text-xs text-muted-foreground flex items-center gap-1.5">
									<Clock className="h-3 w-3" />
									Fetched from Koombiyo delivery service
								</p>
							</div>

							{/* Customer & Delivery Information */}
							<div className="border rounded-lg overflow-hidden">
								<div className="bg-muted/50 px-4 py-2.5 border-b">
									<h4 className="text-sm font-semibold flex items-center gap-2">
										<div className="h-2 w-2 rounded-full bg-primary"></div>
										Customer & Delivery Information
									</h4>
								</div>
								<div className="p-4 grid grid-cols-2 gap-4 text-sm">
									<div className="space-y-1">
										<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer Name</p>
										<p className="font-semibold">{selectedOrder.customerName}</p>
									</div>
									<div className="space-y-1">
										<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</p>
										<p className="font-mono font-medium">{selectedOrder.customerPhone}</p>
									</div>
									<div className="col-span-2 space-y-1">
										<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Delivery Address</p>
										<p className="font-medium leading-relaxed">{selectedOrder.address}</p>
									</div>
									<div className="space-y-1">
										<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">City</p>
										<p className="font-medium">{selectedOrder.cityName}</p>
									</div>
									<div className="space-y-1">
										<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">District</p>
										<p className="font-medium">{selectedOrder.districtName}</p>
									</div>
									{selectedOrder.specialNotes && (
										<div className="col-span-2 space-y-1 pt-2 border-t">
											<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Special Notes</p>
											<p className="text-sm italic bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border-l-2 border-yellow-400">{selectedOrder.specialNotes}</p>
										</div>
									)}
								</div>
							</div>

							{/* Order Items */}
							<div className="border rounded-lg overflow-hidden">
								<div className="bg-muted/50 px-4 py-2.5 border-b">
									<h4 className="text-sm font-semibold flex items-center gap-2">
										<div className="h-2 w-2 rounded-full bg-primary"></div>
										Order Items
										<Badge variant="secondary" className="ml-auto">
											{selectedOrder.orderItems?.length || 0} {selectedOrder.orderItems?.length === 1 ? 'item' : 'items'}
										</Badge>
									</h4>
								</div>
								<div className="divide-y">
									{selectedOrder.orderItems?.map((item, index) => (
										<div key={index} className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
											<div className="flex items-start gap-3 flex-1">
												<div className="mt-1 p-2 bg-primary/10 rounded">
													<Package className="h-4 w-4 text-primary" />
												</div>
												<div className="flex-1 min-w-0">
													<p className="font-semibold truncate">{item.productName}</p>
													<p className="text-xs text-muted-foreground font-mono">SKU: {item.sku}</p>
													<div className="flex items-center gap-2 mt-1.5">
														<Badge variant="outline" className="text-xs">
															Qty: {item.quantity}
														</Badge>
														<span className="text-xs text-muted-foreground">
															× LKR {Number(item.unitPrice).toFixed(2)}
														</span>
													</div>
												</div>
											</div>
											<div className="text-right ml-4">
												<p className="font-bold text-base">LKR {Number(item.totalPrice).toFixed(2)}</p>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Order Summary */}
							<div className="border rounded-lg overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30">
								<div className="bg-primary/10 px-4 py-2.5 border-b border-primary/20">
									<h4 className="text-sm font-bold flex items-center gap-2 text-primary">
										<DollarSign className="h-4 w-4" />
										Order Summary
									</h4>
								</div>
								<div className="p-4 space-y-3">
									<div className="flex justify-between items-center text-sm pb-2 border-b border-dashed">
										<span className="text-muted-foreground font-medium">Order Number</span>
										<span className="font-mono font-bold text-base">{selectedOrder.orderNumber}</span>
									</div>
									<div className="space-y-2.5 text-sm">
										<div className="flex justify-between items-center">
											<span className="text-muted-foreground">Subtotal</span>
											<span className="font-medium">LKR {Number(selectedOrder.subtotal).toFixed(2)}</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-muted-foreground">Shipping Fee</span>
											<span className="font-medium">LKR {Number(selectedOrder.shippingAmount).toFixed(2)}</span>
										</div>
										{Number(selectedOrder.discountAmount) > 0 && (
											<div className="flex justify-between items-center text-green-600 dark:text-green-400">
												<span className="font-medium">Discount</span>
												<span className="font-semibold">- LKR {Number(selectedOrder.discountAmount).toFixed(2)}</span>
											</div>
										)}
									</div>
									<div className="flex justify-between items-center text-lg font-bold pt-3 border-t-2 border-primary/20">
										<span>Total Amount</span>
										<span className="text-primary">LKR {Number(selectedOrder.totalAmount).toFixed(2)}</span>
									</div>
									<div className="flex justify-between items-center pt-2 pb-2 border-t border-dashed">
										<span className="text-muted-foreground text-sm">Payment Method</span>
										<Badge variant={selectedOrder.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? "destructive" : "secondary"} className="font-medium">
											{selectedOrder.paymentMethod.replace(/_/g, ' ')}
										</Badge>
									</div>
									{selectedOrder.paymentMethod === PaymentMethod.CASH_ON_DELIVERY && (
										<div className="flex justify-between items-center pt-3 border-t-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 -mx-4 -mb-4 px-4 py-3">
											<div className="flex items-center gap-2">
												<CreditCard className="h-5 w-5 text-orange-600" />
												<span className="font-semibold text-orange-900 dark:text-orange-100">COD Amount to Collect</span>
											</div>
											<span className="text-xl font-bold text-orange-600 dark:text-orange-400">LKR {Number(selectedOrder.totalAmount).toFixed(2)}</span>
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					{/* Fixed Footer */}
					<div className="border-t bg-background px-6 py-4 mt-auto flex-shrink-0">
						<div className="flex justify-end items-center gap-3">
							<Button
								variant="outline"
								onClick={() => {
									setIsAttachWaybillOpen(false);
									setWaybillId('');
									setSelectedOrder(null);
								}}
								disabled={isLoading}
								className="flex-1 sm:flex-none sm:min-w-[100px]"
							>
								<X className="mr-2 h-4 w-4" />
								Cancel
							</Button>
							<Button
								onClick={handleAttachWaybill}
								disabled={isLoading || !waybillId.trim()}
								className="flex-1 sm:flex-none sm:min-w-[200px] bg-primary hover:bg-primary/90"
								size="lg"
							>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Sending to Koombiyo...
									</>
								) : (
									<>
										<Truck className="mr-2 h-5 w-5" />
										Send to Delivery
									</>
								)}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Cancel Order Confirmation Dialog */}
			<AlertDialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel Order?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to cancel this order? This action cannot be undone and will update the order status to cancelled.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isLoading}>
							No, Keep Order
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleCancelOrder}
							disabled={isLoading}
							className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Cancelling...
								</>
							) : (
								'Yes, Cancel Order'
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}