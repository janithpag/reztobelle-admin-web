'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Truck, Search, RotateCcw, AlertCircle, CheckCircle, Navigation } from 'lucide-react';
import {
	getDistricts,
	getCities,
	getWaybills,
	createDeliveryOrder,
	createPickupRequest,
	trackOrders,
	type District,
	type City,
	type DeliveryOrder,
	type PickupRequest,
} from '@/lib/koombiyo-server';

export function DeliveryManagement() {
	const [districts, setDistricts] = useState<District[]>([]);
	const [cities, setCities] = useState<City[]>([]);
	const [selectedDistrict, setSelectedDistrict] = useState('');
	const [waybills, setWaybills] = useState<string[]>([]);
	const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
	const [trackingResults, setTrackingResults] = useState<any[]>([]);
	const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
	const [isPickupRequestOpen, setIsPickupRequestOpen] = useState(false);
	const [isTrackingOpen, setIsTrackingOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(5);

	// Sample data - In real app, fetch from server actions
	useEffect(() => {
		// Mock delivery orders
		setDeliveryOrders([
			{
				orderWaybillid: '12345688',
				orderNo: 'ORD-001',
				receiverName: 'Amara Silva',
				receiverStreet: '123 Galle Road, Colombo 03',
				receiverDistrict: '1',
				receiverCity: '1',
				receiverPhone: '0771234567',
				description: 'Rose Gold Press-On Nails x2, Diamond Stud Earrings x1',
				spclNote: 'Handle with care',
				getCod: '599',
				status: 'In Transit',
				created_at: '2024-01-15',
			},
			{
				orderWaybillid: '12345689',
				orderNo: 'ORD-002',
				receiverName: 'Nisha Perera',
				receiverStreet: '456 Kandy Road, Kandy',
				receiverDistrict: '2',
				receiverCity: '2',
				receiverPhone: '0779876543',
				description: 'Vintage Gold Rings x1',
				spclNote: 'Call before delivery',
				getCod: '199',
				status: 'Delivered',
				created_at: '2024-01-14',
			},
		]);
	}, []);

	const totalPages = Math.ceil(deliveryOrders.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedOrders = deliveryOrders.slice(startIndex, endIndex);

	const loadInitialData = async () => {
		try {
			const [districtsRes, waybillsRes] = await Promise.all([getDistricts(), getWaybills('5')]);

			if (districtsRes.success && districtsRes.data) {
				setDistricts(districtsRes.data);
			}

			if (waybillsRes.success && waybillsRes.data) {
				setWaybills(waybillsRes.data);
			}
		} catch (error) {
			console.error('Failed to load initial data:', error);
		}
	};

	useEffect(() => {
		if (selectedDistrict) {
			getCities(selectedDistrict).then((citiesRes) => {
				if (citiesRes.success && citiesRes.data) {
					setCities(citiesRes.data);
				}
			});
		}
	}, [selectedDistrict]);

	const handleCreateOrder = async (formData: FormData) => {
		try {
			const orderData: DeliveryOrder = {
				orderWaybillid: formData.get('waybillId') as string,
				orderNo: formData.get('orderNo') as string,
				receiverName: formData.get('receiverName') as string,
				receiverStreet: formData.get('receiverStreet') as string,
				receiverDistrict: formData.get('receiverDistrict') as string,
				receiverCity: formData.get('receiverCity') as string,
				receiverPhone: formData.get('receiverPhone') as string,
				description: formData.get('description') as string,
				spclNote: formData.get('spclNote') as string,
				getCod: formData.get('getCod') as string,
			};

			const result = await createDeliveryOrder(orderData);
			if (result.success) {
				setIsCreateOrderOpen(false);
				// Refresh orders list
			}
		} catch (error) {
			console.error('Failed to create order:', error);
		}
	};

	const handlePickupRequest = async (formData: FormData) => {
		try {
			const pickupData: PickupRequest = {
				vehicleType: formData.get('vehicleType') as 'Bike' | 'Three wheel' | 'Lorry',
				pickup_remark: formData.get('pickup_remark') as string,
				pickup_address: formData.get('pickup_address') as string,
				latitude: formData.get('latitude') as string,
				longitude: formData.get('longitude') as string,
				phone: formData.get('phone') as string,
				qty: formData.get('qty') as string,
			};

			const result = await createPickupRequest(pickupData);
			if (result.success) {
				setIsPickupRequestOpen(false);
			}
		} catch (error) {
			console.error('Failed to create pickup request:', error);
		}
	};

	const handleTrackOrder = async (waybillId: string) => {
		try {
			const result = await trackOrders(waybillId);
			if (result.success && result.data) {
				setTrackingResults(result.data);
			}
		} catch (error) {
			console.error('Failed to track order:', error);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status?.toLowerCase()) {
			case 'delivered':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
			case 'in transit':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
			case 'picked up':
				return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
			case 'pending':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
		}
	};

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold text-balance">Delivery Management</h1>
					<p className="text-sm sm:text-base text-muted-foreground">Manage deliveries with Koombiyo Delivery Service</p>
				</div>
				<div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
					<Button onClick={loadInitialData} className="w-full sm:w-auto">
						<RotateCcw className="mr-2 h-4 w-4" />
						Refresh Data
					</Button>
					<Dialog open={isPickupRequestOpen} onOpenChange={setIsPickupRequestOpen}>
						<DialogTrigger asChild>
							<Button variant="outline" className="w-full sm:w-auto bg-transparent">
								<Truck className="mr-2 h-4 w-4" />
								Request Pickup
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4">
							<DialogHeader>
								<DialogTitle className="text-base sm:text-lg">Request Pickup</DialogTitle>
								<DialogDescription className="text-sm">Schedule a pickup with Koombiyo delivery</DialogDescription>
							</DialogHeader>
							<form action={handlePickupRequest} className="space-y-4">
								<div>
									<Label htmlFor="vehicleType" className="text-sm">
										Vehicle Type
									</Label>
									<Select name="vehicleType" required>
										<SelectTrigger>
											<SelectValue placeholder="Select vehicle" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Bike">Bike</SelectItem>
											<SelectItem value="Three wheel">Three Wheel</SelectItem>
											<SelectItem value="Lorry">Lorry</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label htmlFor="pickup_address" className="text-sm">
										Pickup Address
									</Label>
									<Textarea name="pickup_address" placeholder="Complete pickup address" required className="text-sm" />
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="latitude" className="text-sm">
											Latitude
										</Label>
										<Input name="latitude" placeholder="6.901608599999999" required className="text-sm" />
									</div>
									<div>
										<Label htmlFor="longitude" className="text-sm">
											Longitude
										</Label>
										<Input name="longitude" placeholder="80.0087746" required className="text-sm" />
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="phone" className="text-sm">
											Contact Phone
										</Label>
										<Input name="phone" placeholder="0771234567" required className="text-sm" />
									</div>
									<div>
										<Label htmlFor="qty" className="text-sm">
											Quantity
										</Label>
										<Input name="qty" type="number" placeholder="Number of packages" required className="text-sm" />
									</div>
								</div>

								<div>
									<Label htmlFor="pickup_remark" className="text-sm">
										Remarks
									</Label>
									<Textarea name="pickup_remark" placeholder="Any special instructions" className="text-sm" />
								</div>

								<div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
									<Button
										type="button"
										variant="outline"
										onClick={() => setIsPickupRequestOpen(false)}
										className="w-full sm:w-auto"
									>
										Cancel
									</Button>
									<Button type="submit" className="w-full sm:w-auto">
										Request Pickup
									</Button>
								</div>
							</form>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-medium">Active Deliveries</CardTitle>
						<Package className="h-3 w-3 text-muted-foreground" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg sm:text-xl font-bold">
							{deliveryOrders.filter((o) => o.status !== 'Delivered').length}
						</div>
						<p className="text-xs text-muted-foreground">In progress</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-medium">Delivered Today</CardTitle>
						<CheckCircle className="h-3 w-3 text-muted-foreground" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg sm:text-xl font-bold text-green-600">
							{deliveryOrders.filter((o) => o.status === 'Delivered').length}
						</div>
						<p className="text-xs text-muted-foreground">Successfully completed</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-medium">COD Collections</CardTitle>
						<Navigation className="h-3 w-3 text-muted-foreground" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-sm sm:text-lg lg:text-xl font-bold">
							LKR {deliveryOrders.reduce((sum, order) => sum + Number.parseInt(order.getCod), 0).toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">Total collections</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-medium">Available Waybills</CardTitle>
						<AlertCircle className="h-3 w-3 text-muted-foreground" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg sm:text-xl font-bold">{waybills.length}</div>
						<p className="text-xs text-muted-foreground">Ready to use</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Content */}
			<Tabs defaultValue="orders" className="space-y-4">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="orders" className="text-xs sm:text-sm">
						Delivery Orders
					</TabsTrigger>
					<TabsTrigger value="tracking" className="text-xs sm:text-sm">
						Track Orders
					</TabsTrigger>
					<TabsTrigger value="returns" className="text-xs sm:text-sm">
						Returns
					</TabsTrigger>
				</TabsList>

				<TabsContent value="orders" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-base sm:text-lg">Delivery Orders</CardTitle>
							<CardDescription className="text-sm">All orders sent through Koombiyo delivery</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="text-xs sm:text-sm">Waybill ID</TableHead>
											<TableHead className="text-xs sm:text-sm">Order No</TableHead>
											<TableHead className="text-xs sm:text-sm">Receiver</TableHead>
											<TableHead className="text-xs sm:text-sm hidden md:table-cell">Phone</TableHead>
											<TableHead className="text-xs sm:text-sm">COD Amount</TableHead>
											<TableHead className="text-xs sm:text-sm">Status</TableHead>
											<TableHead className="text-xs sm:text-sm hidden sm:table-cell">Date</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{paginatedOrders.map((order) => (
											<TableRow key={order.orderWaybillid}>
												<TableCell className="font-mono text-xs sm:text-sm">{order.orderWaybillid}</TableCell>
												<TableCell className="font-medium text-xs sm:text-sm">{order.orderNo}</TableCell>
												<TableCell className="text-xs sm:text-sm">
													<div>
														<div className="font-medium">{order.receiverName}</div>
														<div className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[200px]">
															{order.receiverStreet}
														</div>
														<div className="text-xs text-muted-foreground md:hidden">{order.receiverPhone}</div>
													</div>
												</TableCell>
												<TableCell className="text-xs sm:text-sm hidden md:table-cell">{order.receiverPhone}</TableCell>
												<TableCell className="font-medium text-xs sm:text-sm">
													LKR {Number.parseInt(order.getCod).toLocaleString()}
												</TableCell>
												<TableCell>
													<Badge className={`${getStatusColor(order.status || 'pending')} text-xs`}>
														{order.status || 'Pending'}
													</Badge>
												</TableCell>
												<TableCell className="text-xs sm:text-sm hidden sm:table-cell">{order.created_at}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							{totalPages > 1 && (
								<div className="flex items-center justify-between space-x-2 py-4">
									<div className="text-sm text-muted-foreground">
										Showing {startIndex + 1} to {Math.min(endIndex, deliveryOrders.length)} of {deliveryOrders.length}{' '}
										orders
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
				</TabsContent>

				<TabsContent value="tracking" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-base sm:text-lg">Track Orders</CardTitle>
							<CardDescription className="text-sm">Track delivery status using waybill ID</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
								<Select onValueChange={handleTrackOrder}>
									<SelectTrigger className="w-full sm:w-[200px]">
										<SelectValue placeholder="Select waybill ID" />
									</SelectTrigger>
									<SelectContent>
										{deliveryOrders.map((order) => (
											<SelectItem key={order.orderWaybillid} value={order.orderWaybillid}>
												{order.orderWaybillid}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button variant="outline" className="w-full sm:w-auto bg-transparent">
									<Search className="mr-2 h-4 w-4" />
									Track
								</Button>
							</div>

							{trackingResults.length > 0 && (
								<div className="space-y-3">
									<h4 className="font-medium text-sm sm:text-base">Tracking History</h4>
									{trackingResults.map((track, index) => (
										<div key={index} className="flex items-center space-x-3 sm:space-x-4 p-3 border rounded-lg">
											<div className="flex-shrink-0">
												<div className="w-3 h-3 bg-primary rounded-full"></div>
											</div>
											<div className="flex-1 min-w-0">
												<div className="font-medium text-sm sm:text-base">{track.status}</div>
												<div className="text-xs sm:text-sm text-muted-foreground truncate">{track.location}</div>
											</div>
											<div className="text-xs sm:text-sm text-muted-foreground">{track.timestamp}</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="returns" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-base sm:text-lg">Return Management</CardTitle>
							<CardDescription className="text-sm">Handle return orders and items</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-center py-8">
								<RotateCcw className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
								<h3 className="mt-4 text-base sm:text-lg font-medium">No Returns</h3>
								<p className="text-sm text-muted-foreground">No return orders to display at the moment.</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
