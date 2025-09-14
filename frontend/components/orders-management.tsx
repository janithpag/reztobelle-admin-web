"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
	ChevronDown,
	Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
	getWaybills,
	getDistricts,
	getCities,
	createDeliveryOrder,
	type District,
	type City,
	type DeliveryOrder,
} from "@/lib/koombiyo-server"
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	PaginationEllipsis,
} from "@/components/ui/pagination"

// Sample products data for selection
const availableProducts = [
	{ id: "PROD-001", name: "Rose Gold Press-On Nails", sku: "RGN-001", price: 150, category: "Nails" },
	{ id: "PROD-002", name: "Diamond Stud Earrings", sku: "DSE-002", price: 299, category: "Earrings" },
	{ id: "PROD-003", name: "Vintage Gold Rings", sku: "VGR-003", price: 199, category: "Rings" },
	{ id: "PROD-004", name: "Pearl Drop Earrings", sku: "PDE-004", price: 179, category: "Earrings" },
	{ id: "PROD-005", name: "French Tip Nails", sku: "FTN-005", price: 120, category: "Nails" },
	{ id: "PROD-006", name: "Silver Hoop Earrings", sku: "SHE-006", price: 89, category: "Earrings" },
	{ id: "PROD-007", name: "Crystal Pendant Necklace", sku: "CPN-007", price: 249, category: "Necklaces" },
	{ id: "PROD-008", name: "Matte Black Nails", sku: "MBN-008", price: 135, category: "Nails" },
	{ id: "PROD-009", name: "Gold Chain Bracelet", sku: "GCB-009", price: 189, category: "Bracelets" },
	{ id: "PROD-010", name: "Emerald Stud Earrings", sku: "ESE-010", price: 329, category: "Earrings" },
]

// Sample orders data
const orders = [
	{
		id: "ORD-001",
		customer: "Amara Silva",
		email: "amara@email.com",
		items: [
			{ name: "Rose Gold Press-On Nails", quantity: 2, price: 150 },
			{ name: "Diamond Stud Earrings", quantity: 1, price: 299 },
		],
		total: 599,
		status: "delivered",
		date: "2024-01-15",
		address: "123 Galle Road, Colombo 03",
	},
	{
		id: "ORD-002",
		customer: "Nisha Perera",
		email: "nisha@email.com",
		items: [{ name: "Vintage Gold Rings", quantity: 1, price: 199 }],
		total: 199,
		status: "shipped",
		date: "2024-01-14",
		address: "456 Kandy Road, Kandy",
	},
	{
		id: "ORD-003",
		customer: "Kavya Fernando",
		email: "kavya@email.com",
		items: [
			{ name: "Pearl Drop Earrings", quantity: 2, price: 179 },
			{ name: "French Tip Nails", quantity: 1, price: 120 },
		],
		total: 478,
		status: "processing",
		date: "2024-01-13",
		address: "789 Negombo Road, Negombo",
	},
	{
		id: "ORD-004",
		customer: "Shalini Rajapaksa",
		email: "shalini@email.com",
		items: [{ name: "Silver Hoop Earrings", quantity: 3, price: 89 }],
		total: 267,
		status: "pending",
		date: "2024-01-12",
		address: "321 Matara Road, Galle",
	},
]

export function OrdersManagement() {
	const [searchTerm, setSearchTerm] = useState("")
	const [selectedStatus, setSelectedStatus] = useState("all")
	const [selectedOrder, setSelectedOrder] = useState<(typeof orders)[0] | null>(null)
	const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false)
	const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)
	const [districts, setDistricts] = useState<District[]>([])
	const [cities, setCities] = useState<City[]>([])
	const [availableWaybills, setAvailableWaybills] = useState<string[]>([])
	const [isLoadingDistricts, setIsLoadingDistricts] = useState(false)
	const [isLoadingCities, setIsLoadingCities] = useState(false)
	const [isLoadingWaybills, setIsLoadingWaybills] = useState(false)
	const [isCreatingOrder, setIsCreatingOrder] = useState(false)
	const [productSearchStates, setProductSearchStates] = useState<{ [key: number]: { open: boolean; search: string } }>(
		{},
	)

	const [newOrder, setNewOrder] = useState({
		customerName: "",
		customerEmail: "",
		customerPhone: "",
		receiverName: "",
		receiverPhone: "",
		receiverStreet: "",
		receiverDistrict: "",
		receiverCity: "",
		items: [{ productId: "", quantity: 1, price: 0 }],
		codAmount: "",
		description: "",
		specialNote: "",
		waybillId: "",
	})

	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage] = useState(5)

	useEffect(() => {
		loadDistricts()
		loadWaybills()
	}, [])

	const loadDistricts = async () => {
		setIsLoadingDistricts(true)
		try {
			const response = await getDistricts()
			if (response.success && response.data) {
				setDistricts(response.data)
			}
		} catch (error) {
			console.error("Failed to load districts:", error)
		} finally {
			setIsLoadingDistricts(false)
		}
	}

	const loadCities = async (districtId: string) => {
		if (!districtId) return
		setIsLoadingCities(true)
		try {
			const response = await getCities(districtId)
			if (response.success && response.data) {
				setCities(response.data)
			}
		} catch (error) {
			console.error("Failed to load cities:", error)
		} finally {
			setIsLoadingCities(false)
		}
	}

	const loadWaybills = async () => {
		setIsLoadingWaybills(true)
		try {
			const response = await getWaybills("20")
			if (response.success && response.data) {
				setAvailableWaybills(Array.isArray(response.data) ? response.data : [])
			} else {
				setAvailableWaybills([])
			}
		} catch (error) {
			console.error("Failed to load waybills:", error)
			setAvailableWaybills([])
		} finally {
			setIsLoadingWaybills(false)
		}
	}

	const handleDistrictChange = (districtId: string) => {
		setNewOrder({ ...newOrder, receiverDistrict: districtId, receiverCity: "" })
		setCities([])
		loadCities(districtId)
	}

	const addOrderItem = () => {
		const newIndex = newOrder.items.length
		setNewOrder({
			...newOrder,
			items: [...newOrder.items, { productId: "", quantity: 1, price: 0 }],
		})
		setProductSearchStates((prev) => ({
			...prev,
			[newIndex]: { open: false, search: "" },
		}))
	}

	const removeOrderItem = (index: number) => {
		const items = newOrder.items.filter((_, i) => i !== index)
		setNewOrder({ ...newOrder, items })
		setProductSearchStates((prev) => {
			const newState = { ...prev }
			delete newState[index]
			return newState
		})
	}

	const updateOrderItem = (index: number, field: string, value: any) => {
		const items = [...newOrder.items]

		if (field === "productId") {
			const selectedProduct = availableProducts.find((p) => p.id === value)
			items[index] = {
				...items[index],
				productId: value,
				price: selectedProduct ? selectedProduct.price : 0,
			}
		} else {
			items[index] = { ...items[index], [field]: value }
		}

		setNewOrder({ ...newOrder, items })
	}

	const calculateTotal = () => {
		return newOrder.items.reduce((sum, item) => {
			const product = availableProducts.find((p) => p.id === item.productId)
			const price = product ? product.price : item.price
			return sum + item.quantity * price
		}, 0)
	}

	const handleCreateOrder = async () => {
		if (!newOrder.waybillId || !newOrder.receiverDistrict || !newOrder.receiverCity) {
			alert("Please fill in all required fields including waybill ID, district, and city")
			return
		}

		const hasEmptyItems = newOrder.items.some((item) => !item.productId)
		if (hasEmptyItems) {
			alert("Please select products for all order items")
			return
		}

		setIsCreatingOrder(true)
		try {
			const itemDescriptions = newOrder.items
				.map((item) => {
					const product = availableProducts.find((p) => p.id === item.productId)
					return `${product?.name} (Qty: ${item.quantity})`
				})
				.join(", ")

			const deliveryOrder: DeliveryOrder = {
				orderWaybillid: newOrder.waybillId,
				orderNo: `ORD-${Date.now()}`,
				receiverName: newOrder.receiverName,
				receiverStreet: newOrder.receiverStreet,
				receiverDistrict: newOrder.receiverDistrict,
				receiverCity: newOrder.receiverCity,
				receiverPhone: newOrder.receiverPhone,
				description: newOrder.description || itemDescriptions,
				spclNote: newOrder.specialNote,
				getCod: newOrder.codAmount,
			}

			const response = await createDeliveryOrder(deliveryOrder)
			if (response.success) {
				alert("Order created successfully!")
				setIsCreateOrderOpen(false)
				setNewOrder({
					customerName: "",
					customerEmail: "",
					customerPhone: "",
					receiverName: "",
					receiverPhone: "",
					receiverStreet: "",
					receiverDistrict: "",
					receiverCity: "",
					items: [{ productId: "", quantity: 1, price: 0 }],
					codAmount: "",
					description: "",
					specialNote: "",
					waybillId: "",
				})
				loadWaybills()
			} else {
				alert(`Failed to create order: ${response.error}`)
			}
		} catch (error) {
			console.error("Error creating order:", error)
			alert("Failed to create order. Please try again.")
		} finally {
			setIsCreatingOrder(false)
		}
	}

	const filteredOrders = orders.filter((order) => {
		const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesStatus = selectedStatus === "all" || order.status === selectedStatus
		return matchesSearch && matchesStatus
	})

	const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
	const startIndex = (currentPage - 1) * itemsPerPage
	const endIndex = startIndex + itemsPerPage
	const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

	useEffect(() => {
		setCurrentPage(1)
	}, [searchTerm, selectedStatus])

	const statuses = ["all", "pending", "processing", "shipped", "delivered"]

	const getStatusColor = (status: string) => {
		switch (status) {
		case "pending":
			return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
		case "processing":
			return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
		case "shipped":
			return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
		case "delivered":
			return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
		default:
			return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
		}
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
		case "pending":
			return <Clock className="h-4 w-4" />
		case "processing":
			return <Package className="h-4 w-4" />
		case "shipped":
			return <Truck className="h-4 w-4" />
		case "delivered":
			return <CheckCircle className="h-4 w-4" />
		default:
			return <AlertCircle className="h-4 w-4" />
		}
	}

	const handleCreateDeliveryOrder = (order: (typeof orders)[0]) => {
		setSelectedOrder(order)
		setIsDeliveryDialogOpen(true)
	}

	const updateProductSearchState = (index: number, field: "open" | "search", value: boolean | string) => {
		setProductSearchStates((prev) => ({
			...prev,
			[index]: {
				...prev[index],
				[field]: value,
			},
		}))
	}

	const getFilteredProducts = (searchTerm: string) => {
		if (!searchTerm) return availableProducts
		return availableProducts.filter(
			(product) =>
				product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()),
		)
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold text-balance">Orders</h1>
					<p className="text-sm sm:text-base text-muted-foreground">Track and manage customer orders</p>
				</div>
				<Button onClick={() => setIsCreateOrderOpen(true)} className="flex items-center gap-2 w-full sm:w-auto">
					<Plus className="h-4 w-4" />
          Create Order
				</Button>
			</div>

			<div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Orders</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-xl sm:text-2xl font-bold">{orders.length}</div>
						<p className="text-xs text-muted-foreground">This month</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-xl sm:text-2xl font-bold text-yellow-600">
							{orders.filter((o) => o.status === "pending").length}
						</div>
						<p className="text-xs text-muted-foreground">Awaiting processing</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Revenue</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-xl sm:text-2xl font-bold">
              LKR {orders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">From all orders</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Delivered</CardTitle>
						<CheckCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-xl sm:text-2xl font-bold text-green-600">
							{orders.filter((o) => o.status === "delivered").length}
						</div>
						<p className="text-xs text-muted-foreground">Successfully completed</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base sm:text-lg">Order Management</CardTitle>
					<CardDescription className="text-sm">View and manage all customer orders</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
						<div className="relative flex-1 max-w-full sm:max-w-sm">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search orders..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Select value={selectedStatus} onValueChange={setSelectedStatus}>
							<SelectTrigger className="w-full sm:w-[180px]">
								<Filter className="mr-2 h-4 w-4" />
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{statuses.map((status) => (
									<SelectItem key={status} value={status}>
										{status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="text-xs sm:text-sm">Order ID</TableHead>
									<TableHead className="text-xs sm:text-sm">Customer</TableHead>
									<TableHead className="text-xs sm:text-sm hidden md:table-cell">Items</TableHead>
									<TableHead className="text-xs sm:text-sm">Total</TableHead>
									<TableHead className="text-xs sm:text-sm hidden sm:table-cell">Date</TableHead>
									<TableHead className="text-xs sm:text-sm">Status</TableHead>
									<TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedOrders.map((order) => (
									<TableRow key={order.id}>
										<TableCell className="font-medium text-xs sm:text-sm">{order.id}</TableCell>
										<TableCell className="text-xs sm:text-sm">
											<div>
												<div className="font-medium">{order.customer}</div>
												<div className="text-xs text-muted-foreground hidden sm:block">{order.email}</div>
											</div>
										</TableCell>
										<TableCell className="text-xs sm:text-sm hidden md:table-cell">
											<div className="text-sm">
												{order.items.length} item{order.items.length > 1 ? "s" : ""}
											</div>
										</TableCell>
										<TableCell className="font-medium text-xs sm:text-sm">LKR {order.total}</TableCell>
										<TableCell className="text-xs sm:text-sm hidden sm:table-cell">
											{new Date(order.date).toLocaleDateString()}
										</TableCell>
										<TableCell>
											<Badge className={cn("text-xs", getStatusColor(order.status))}>
												<div className="flex items-center space-x-1">
													{getStatusIcon(order.status)}
													<span className="hidden sm:inline">
														{order.status.charAt(0).toUpperCase() + order.status.slice(1)}
													</span>
												</div>
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" className="h-8 w-8 p-0">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>Actions</DropdownMenuLabel>
													<DropdownMenuItem onClick={() => setSelectedOrder(order)}>
														<Eye className="mr-2 h-4 w-4" />
                            View Details
													</DropdownMenuItem>
													<DropdownMenuItem onClick={() => handleCreateDeliveryOrder(order)}>
														<Truck className="mr-2 h-4 w-4" />
                            Create Delivery
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem>Update Status</DropdownMenuItem>
													<DropdownMenuItem>Send Email</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{totalPages > 1 && (
						<div className="flex items-center justify-between space-x-2 py-4">
							<div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}{" "}
                orders
							</div>
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
											className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
											)
										} else if (page === currentPage - 2 || page === currentPage + 2) {
											return (
												<PaginationItem key={page}>
													<PaginationEllipsis />
												</PaginationItem>
											)
										}
										return null
									})}

									<PaginationItem>
										<PaginationNext
											onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
											className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
				<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4">
					<DialogHeader>
						<DialogTitle className="text-base sm:text-lg">Order Details - {selectedOrder?.id}</DialogTitle>
						<DialogDescription className="text-sm">Complete order information and items</DialogDescription>
					</DialogHeader>
					{selectedOrder && (
						<div className="space-y-4">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<h4 className="font-medium text-sm sm:text-base">Customer Information</h4>
									<p className="text-sm text-muted-foreground">{selectedOrder.customer}</p>
									<p className="text-sm text-muted-foreground">{selectedOrder.email}</p>
								</div>
								<div>
									<h4 className="font-medium text-sm sm:text-base">Delivery Address</h4>
									<p className="text-sm text-muted-foreground">{selectedOrder.address}</p>
								</div>
							</div>

							<div>
								<h4 className="font-medium mb-2 text-sm sm:text-base">Order Items</h4>
								<div className="space-y-2">
									{selectedOrder.items.map((item, index) => (
										<div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
											<div>
												<p className="font-medium text-sm">{item.name}</p>
												<p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
											</div>
											<p className="font-medium text-sm">LKR {item.price * item.quantity}</p>
										</div>
									))}
								</div>
							</div>

							<div className="flex justify-between items-center pt-4 border-t">
								<span className="font-medium text-sm sm:text-base">Total Amount:</span>
								<span className="text-lg sm:text-xl font-bold">LKR {selectedOrder.total}</span>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			<Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
				<DialogContent className="sm:max-w-[500px] mx-4">
					<DialogHeader>
						<DialogTitle className="text-base sm:text-lg">Create Delivery Order</DialogTitle>
						<DialogDescription className="text-sm">Send this order to Koombiyo delivery service</DialogDescription>
					</DialogHeader>
					{selectedOrder && (
						<div className="space-y-4">
							<div className="p-4 bg-muted rounded-lg">
								<h4 className="font-medium text-sm sm:text-base">Order Summary</h4>
								<p className="text-sm text-muted-foreground">Order ID: {selectedOrder.id}</p>
								<p className="text-sm text-muted-foreground">Customer: {selectedOrder.customer}</p>
								<p className="text-sm text-muted-foreground">Total: LKR {selectedOrder.total}</p>
							</div>
							<div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
								<Button variant="outline" onClick={() => setIsDeliveryDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
								</Button>
								<Button
									onClick={() => {
										console.log("[v0] Creating delivery for order:", selectedOrder.id)
										setIsDeliveryDialogOpen(false)
									}}
									className="w-full sm:w-auto"
								>
                  Create Delivery
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			<Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
				<DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto mx-4">
					<DialogHeader>
						<DialogTitle className="text-base sm:text-lg">Create New Order</DialogTitle>
						<DialogDescription className="text-sm">
              Create a new order with automatic waybill assignment and delivery integration
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 sm:space-y-6">
						<div className="space-y-4">
							<h3 className="text-base sm:text-lg font-semibold">Customer Information</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="customerName" className="text-sm">
                    Customer Name *
									</Label>
									<Input
										id="customerName"
										value={newOrder.customerName}
										onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
										placeholder="Enter customer name"
										className="text-sm"
									/>
								</div>
								<div>
									<Label htmlFor="customerEmail" className="text-sm">
                    Customer Email
									</Label>
									<Input
										id="customerEmail"
										type="email"
										value={newOrder.customerEmail}
										onChange={(e) => setNewOrder({ ...newOrder, customerEmail: e.target.value })}
										placeholder="customer@email.com"
										className="text-sm"
									/>
								</div>
								<div>
									<Label htmlFor="customerPhone" className="text-sm">
                    Customer Phone
									</Label>
									<Input
										id="customerPhone"
										value={newOrder.customerPhone}
										onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
										placeholder="+94 77 123 4567"
										className="text-sm"
									/>
								</div>
							</div>
						</div>

						<div className="space-y-4">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
								<h3 className="text-base sm:text-lg font-semibold">Delivery Information</h3>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addOrderItem}
									className="w-full sm:w-auto bg-transparent"
								>
									<Plus className="h-4 w-4 mr-2" />
                  Add Item
								</Button>
							</div>
							<div className="space-y-3">
								{newOrder.items.map((item, index) => {
									const selectedProduct = availableProducts.find((p) => p.id === item.productId)
									const searchState = productSearchStates[index] || { open: false, search: "" }
									const filteredProducts = getFilteredProducts(searchState.search)

									return (
										<div key={index} className="grid grid-cols-1 gap-3 p-3 border rounded-lg">
											<div>
												<Label className="text-sm">Select Product *</Label>
												<Popover
													open={searchState.open}
													onOpenChange={(open) => updateProductSearchState(index, "open", open)}
												>
													<PopoverTrigger asChild>
														<Button
															variant="outline"
															role="combobox"
															aria-expanded={searchState.open}
															className="w-full justify-between bg-transparent text-sm"
														>
															{selectedProduct ? selectedProduct.name : "Choose a product..."}
															<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
														</Button>
													</PopoverTrigger>
													<PopoverContent className="w-full p-0" align="start">
														<Command>
															<CommandInput
																placeholder="Search products..."
																value={searchState.search}
																onValueChange={(search) => updateProductSearchState(index, "search", search)}
															/>
															<CommandList>
																<CommandEmpty>No products found.</CommandEmpty>
																<CommandGroup>
																	{filteredProducts.map((product) => (
																		<CommandItem
																			key={product.id}
																			value={product.id}
																			onSelect={() => {
																				updateOrderItem(index, "productId", product.id)
																				updateProductSearchState(index, "open", false)
																				updateProductSearchState(index, "search", "")
																			}}
																		>
																			<Check
																				className={cn(
																					"mr-2 h-4 w-4",
																					selectedProduct?.id === product.id ? "opacity-100" : "opacity-0",
																				)}
																			/>
																			<div className="flex flex-col">
																				<span className="font-medium text-sm">{product.name}</span>
																				<span className="text-xs text-muted-foreground">
                                          SKU: {product.sku} • {product.category} • LKR {product.price}
																				</span>
																			</div>
																		</CommandItem>
																	))}
																</CommandGroup>
															</CommandList>
														</Command>
													</PopoverContent>
												</Popover>
												{selectedProduct && (
													<p className="text-xs text-muted-foreground mt-1">
                            Category: {selectedProduct.category} | Price: LKR {selectedProduct.price}
													</p>
												)}
											</div>
											<div className="grid grid-cols-2 gap-3">
												<div>
													<Label className="text-sm">Quantity</Label>
													<Input
														type="number"
														min="1"
														value={item.quantity}
														onChange={(e) => updateOrderItem(index, "quantity", Number.parseInt(e.target.value) || 1)}
														className="text-sm"
													/>
												</div>
												<div>
													<Label className="text-sm">Unit Price (LKR)</Label>
													<Input
														type="number"
														min="0"
														step="0.01"
														value={selectedProduct ? selectedProduct.price : item.price}
														onChange={(e) => updateOrderItem(index, "price", Number.parseFloat(e.target.value) || 0)}
														disabled={!!selectedProduct}
														className={cn("text-sm", selectedProduct ? "bg-muted" : "")}
													/>
													{selectedProduct && (
														<p className="text-xs text-muted-foreground mt-1">Auto-filled from product</p>
													)}
												</div>
											</div>
											{newOrder.items.length > 1 && (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => removeOrderItem(index)}
													className="w-full sm:w-auto"
												>
                          Remove Item
												</Button>
											)}
											<div className="pt-2 border-t border-muted">
												<div className="flex justify-between items-center text-sm">
													<span className="text-muted-foreground">Item Total:</span>
													<span className="font-medium">
                            LKR {((selectedProduct ? selectedProduct.price : item.price) * item.quantity).toFixed(2)}
													</span>
												</div>
											</div>
										</div>
									)
								})}
							</div>
							<div className="bg-muted/50 p-4 rounded-lg space-y-2">
								<div className="flex justify-between items-center text-sm">
									<span className="text-muted-foreground">Items ({newOrder.items.length}):</span>
									<span>{newOrder.items.filter((item) => item.productId).length} selected</span>
								</div>
								<div className="flex justify-between items-center text-base sm:text-lg font-semibold border-t pt-2">
									<span>Products Total:</span>
									<span className="text-primary">LKR {calculateTotal().toFixed(2)}</span>
								</div>
							</div>
						</div>

						<div className="space-y-4">
							<h3 className="text-base sm:text-lg font-semibold">Additional Information</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="codAmount" className="text-sm">
                    COD Amount (LKR)
									</Label>
									<Input
										id="codAmount"
										type="number"
										min="0"
										step="0.01"
										value={newOrder.codAmount}
										onChange={(e) => setNewOrder({ ...newOrder, codAmount: e.target.value })}
										placeholder="0.00"
										className="text-sm"
									/>
								</div>
							</div>
							<div>
								<Label htmlFor="description" className="text-sm">
                  Order Description
								</Label>
								<Textarea
									id="description"
									value={newOrder.description}
									onChange={(e) => setNewOrder({ ...newOrder, description: e.target.value })}
									placeholder="Describe the order items..."
									rows={3}
									className="text-sm"
								/>
							</div>
							<div>
								<Label htmlFor="specialNote" className="text-sm">
                  Special Notes
								</Label>
								<Textarea
									id="specialNote"
									value={newOrder.specialNote}
									onChange={(e) => setNewOrder({ ...newOrder, specialNote: e.target.value })}
									placeholder="Any special delivery instructions..."
									rows={2}
									className="text-sm"
								/>
							</div>
						</div>

						<div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
							<Button variant="outline" onClick={() => setIsCreateOrderOpen(false)} className="w-full sm:w-auto">
                Cancel
							</Button>
							<Button onClick={handleCreateOrder} disabled={isCreatingOrder} className="w-full sm:w-auto">
								{isCreatingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Order
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
