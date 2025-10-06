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
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getDistricts, getCities, type District, type City } from '@/lib/koombiyo-server';

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
		});
	};

	// Load data functions
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
	}, [loadProducts, loadDistricts]);

	useEffect(() => {
		loadOrders();
	}, [loadOrders]);

	// Order actions
	const handleUpdateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
		try {
			setIsLoading(true);
			await ordersAPI.updateOrderStatus(orderId, newStatus);
			toast.success('Order status updated successfully');
			await loadOrders();
		} catch (error: any) {
			console.error('Failed to update order status:', error);
			toast.error(error.response?.data?.error || 'Failed to update order status');
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdatePaymentStatus = async (orderId: number, paymentStatus: PaymentStatus) => {
		try {
			setIsLoading(true);
			await ordersAPI.updatePaymentStatus(orderId, paymentStatus);
			toast.success('Payment status updated successfully');
			await loadOrders();
		} catch (error: any) {
			console.error('Failed to update payment status:', error);
			toast.error(error.response?.data?.error || 'Failed to update payment status');
		} finally {
			setIsLoading(false);
		}
	};

	const handleSendToDelivery = async (orderId: number) => {
		try {
			setIsLoading(true);
			await deliveriesAPI.sendToKoombiyo(orderId);
			toast.success('Order sent to delivery service successfully');
			await loadOrders();
		} catch (error: any) {
			console.error('Failed to send to delivery:', error);
			toast.error(error.response?.data?.error || 'Failed to send to delivery service');
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancelOrder = async (orderId: number) => {
		if (confirm('Are you sure you want to cancel this order?')) {
			try {
				setIsLoading(true);
				await ordersAPI.cancelOrder(orderId, 'Cancelled by admin');
				toast.success('Order cancelled successfully');
				await loadOrders();
			} catch (error: any) {
				console.error('Failed to cancel order:', error);
				toast.error(error.response?.data?.error || 'Failed to cancel order');
			} finally {
				setIsLoading(false);
			}
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
			};

			await ordersAPI.createOrder(orderData);
			toast.success('Order created successfully');
			setIsAddOrderOpen(false);
			resetForm();
			await loadOrders();
		} catch (error: any) {
			console.error('Failed to create order:', error);
			toast.error(error.response?.data?.error || 'Failed to create order');
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
										onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
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
										onChange={(e) => setOrderForm({...orderForm, customerEmail: e.target.value})}
										placeholder="customer@email.com"
										className="w-full"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="customerPhone" className="text-sm font-medium">Phone *</Label>
									<Input
										id="customerPhone"
										value={orderForm.customerPhone}
										onChange={(e) => setOrderForm({...orderForm, customerPhone: e.target.value})}
										placeholder="+94 XX XXX XXXX"
										className="w-full"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="paymentMethod" className="text-sm font-medium">Payment Method *</Label>
									<Select
										value={orderForm.paymentMethod}
										onValueChange={(value) => setOrderForm({...orderForm, paymentMethod: value as PaymentMethod})}
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
									onChange={(e) => setOrderForm({...orderForm, address: e.target.value})}
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
										onChange={(e) => setOrderForm({...orderForm, shippingAmount: e.target.value})}
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
										onChange={(e) => setOrderForm({...orderForm, discountAmount: e.target.value})}
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
									onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
									placeholder="General notes about the order"
									className="w-full min-h-[60px] resize-none"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="specialNotes" className="text-sm font-medium">Special Instructions</Label>
								<Textarea
									id="specialNotes"
									value={orderForm.specialNotes}
									onChange={(e) => setOrderForm({...orderForm, specialNotes: e.target.value})}
									placeholder="Special delivery or handling instructions"
									className="w-full min-h-[60px] resize-none"
								/>
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
																				setOrderForm({...orderForm, items: newItems});
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
										
										const itemTotal = Number(product.price) * item.quantity;													return (
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
																		setOrderForm({...orderForm, items: newItems});
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
																		setOrderForm({...orderForm, items: newItems});
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

			{/* Stats Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
				<Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 dark:shadow-lg dark:shadow-blue-900/20 py-4 gap-0">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-xs font-medium text-blue-900 dark:text-blue-200">Total Orders</CardTitle>
						<div className="h-8 w-8 rounded-full bg-blue-500 dark:bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
							<Package className="h-4 w-4 text-white" />
						</div>
					</CardHeader>
					<CardContent className="pt-2 pb-4">
						<div className="text-2xl font-bold text-blue-900 dark:text-blue-50">{totalOrders}</div>
						<p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
							All time orders
						</p>
					</CardContent>
				</Card>
				<Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/40 dark:shadow-lg dark:shadow-amber-900/20 py-4 gap-0">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-xs font-medium text-amber-900 dark:text-amber-200">Pending Orders</CardTitle>
						<div className="h-8 w-8 rounded-full bg-amber-500 dark:bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
							<Clock className="h-4 w-4 text-white" />
						</div>
					</CardHeader>
					<CardContent className="pt-2 pb-4">
						<div className="text-2xl font-bold text-amber-900 dark:text-amber-50">{pendingOrders}</div>
						<p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
							Awaiting processing
						</p>
					</CardContent>
				</Card>
				<Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/40 dark:shadow-lg dark:shadow-green-900/20 py-4 gap-0">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-xs font-medium text-green-900 dark:text-green-200">Delivered</CardTitle>
						<div className="h-8 w-8 rounded-full bg-green-500 dark:bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
							<CheckCircle className="h-4 w-4 text-white" />
						</div>
					</CardHeader>
					<CardContent className="pt-2 pb-4">
						<div className="text-2xl font-bold text-green-900 dark:text-green-50">{deliveredOrders}</div>
						<p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
							Successfully delivered
						</p>
					</CardContent>
				</Card>
				<Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-800/40 dark:shadow-lg dark:shadow-purple-900/20 py-4 gap-0">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-xs font-medium text-purple-900 dark:text-purple-200">Revenue</CardTitle>
						<div className="h-8 w-8 rounded-full bg-purple-500 dark:bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
							<DollarSign className="h-4 w-4 text-white" />
						</div>
					</CardHeader>
					<CardContent className="pt-2 pb-4">
						<div className="text-2xl font-bold text-purple-900 dark:text-purple-50">LKR {totalRevenue.toFixed(2)}</div>
						<p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
							From delivered orders
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Search and Filters */}
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
										<TableHead className="w-[140px]">Delivery</TableHead>
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
												{order.deliveryStatus ? (
													<Badge className={cn("text-[10px] px-1.5 py-0", deliveryStatusColors[order.deliveryStatus] || 'bg-gray-100 text-gray-800')}>
														{order.deliveryStatus.replace(/_/g, ' ')}
													</Badge>
												) : (
													<span className="text-xs text-muted-foreground">-</span>
												)}
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
									{selectedOrder.deliveryStatus && (
										<div>
											<p className="text-xs text-muted-foreground mb-1">Delivery Status</p>
											<Badge className={cn("text-xs", deliveryStatusColors[selectedOrder.deliveryStatus])}>
												{selectedOrder.deliveryStatus.replace(/_/g, ' ')}
											</Badge>
										</div>
									)}
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
										{selectedOrder.koombiyoOrderId && (
											<div>
												<p className="text-xs text-muted-foreground">Koombiyo Order ID</p>
												<p className="text-sm font-mono">{selectedOrder.koombiyoOrderId}</p>
											</div>
										)}
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
		</div>
	);
}