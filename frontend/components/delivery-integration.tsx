"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Truck, Package, AlertCircle, CheckCircle, Clock } from "lucide-react"
import {
	createDeliveryOrder,
	getDistricts,
	getCities,
	getWaybills,
	type DeliveryOrder,
	type District,
	type City,
} from "@/lib/koombiyo-server"

interface DeliveryIntegrationProps {
	order: {
		id: string
		customer: string
		email: string
		total: number
		address: string
		phone?: string
		items: Array<{ name: string; quantity: number; price: number }>
	}
	onClose: () => void
}

export function DeliveryIntegration({ order, onClose }: DeliveryIntegrationProps) {
	const [isLoading, setIsLoading] = useState(false)
	const [districts, setDistricts] = useState<District[]>([])
	const [cities, setCities] = useState<City[]>([])
	const [waybills, setWaybills] = useState<string[]>([])
	const [selectedDistrict, setSelectedDistrict] = useState("")
	const [deliveryStatus, setDeliveryStatus] = useState<"idle" | "success" | "error">("idle")

	const loadInitialData = async () => {
		setIsLoading(true)
		try {
			const [districtsRes, waybillsRes] = await Promise.all([getDistricts(), getWaybills("5")])

			if (districtsRes.success && districtsRes.data) {
				setDistricts(districtsRes.data)
			}

			if (waybillsRes.success && waybillsRes.data) {
				setWaybills(waybillsRes.data)
			}
		} catch (error) {
			console.error("Failed to load initial data:", error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleDistrictChange = async (districtId: string) => {
		setSelectedDistrict(districtId)
		if (districtId) {
			const citiesRes = await getCities(districtId)
			if (citiesRes.success && citiesRes.data) {
				setCities(citiesRes.data)
			}
		}
	}

	const handleCreateDelivery = async (formData: FormData) => {
		setIsLoading(true)
		try {
			const deliveryOrder: DeliveryOrder = {
				orderWaybillid: formData.get("waybillId") as string,
				orderNo: order.id,
				receiverName: (formData.get("receiverName") as string) || order.customer,
				receiverStreet: (formData.get("receiverStreet") as string) || order.address,
				receiverDistrict: formData.get("receiverDistrict") as string,
				receiverCity: formData.get("receiverCity") as string,
				receiverPhone: (formData.get("receiverPhone") as string) || order.phone || "",
				description: order.items.map((item) => `${item.name} x${item.quantity}`).join(", "),
				spclNote: (formData.get("spclNote") as string) || "",
				getCod: order.total.toString(),
			}

			const result = await createDeliveryOrder(deliveryOrder)

			if (result.success) {
				setDeliveryStatus("success")
				setTimeout(() => {
					onClose()
				}, 2000)
			} else {
				setDeliveryStatus("error")
			}
		} catch (error) {
			console.error("Failed to create delivery:", error)
			setDeliveryStatus("error")
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="space-y-6">
			{deliveryStatus === "success" && (
				<div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg">
					<CheckCircle className="h-5 w-5 text-green-600" />
					<span className="text-green-800">Delivery order created successfully!</span>
				</div>
			)}

			{deliveryStatus === "error" && (
				<div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
					<AlertCircle className="h-5 w-5 text-red-600" />
					<span className="text-red-800">Failed to create delivery order. Please try again.</span>
				</div>
			)}

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Truck className="h-5 w-5" />
						<span>Create Koombiyo Delivery</span>
					</CardTitle>
					<CardDescription>Send order {order.id} for delivery</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={handleCreateDelivery} className="space-y-4">
						{/* Order Summary */}
						<div className="p-4 bg-muted rounded-lg">
							<h4 className="font-medium mb-2">Order Summary</h4>
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<span className="text-muted-foreground">Order ID:</span>
									<span className="ml-2 font-medium">{order.id}</span>
								</div>
								<div>
									<span className="text-muted-foreground">Customer:</span>
									<span className="ml-2 font-medium">{order.customer}</span>
								</div>
								<div>
									<span className="text-muted-foreground">Total Amount:</span>
									<span className="ml-2 font-medium">LKR {order.total.toLocaleString()}</span>
								</div>
								<div>
									<span className="text-muted-foreground">Items:</span>
									<span className="ml-2 font-medium">{order.items.length} items</span>
								</div>
							</div>
						</div>

						{/* Load Data Button */}
						{districts.length === 0 && (
							<Button type="button" onClick={loadInitialData} disabled={isLoading}>
								{isLoading ? "Loading..." : "Load Delivery Options"}
							</Button>
						)}

						{/* Delivery Details */}
						{districts.length > 0 && (
							<>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="waybillId">Waybill ID *</Label>
										<Select name="waybillId" required>
											<SelectTrigger>
												<SelectValue placeholder="Select waybill" />
											</SelectTrigger>
											<SelectContent>
												{waybills.map((waybill) => (
													<SelectItem key={waybill} value={waybill}>
														{waybill}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label htmlFor="receiverPhone">Phone Number *</Label>
										<Input name="receiverPhone" defaultValue={order.phone || ""} placeholder="0771234567" required />
									</div>
								</div>

								<div>
									<Label htmlFor="receiverName">Receiver Name *</Label>
									<Input name="receiverName" defaultValue={order.customer} placeholder="Customer name" required />
								</div>

								<div>
									<Label htmlFor="receiverStreet">Delivery Address *</Label>
									<Textarea
										name="receiverStreet"
										defaultValue={order.address}
										placeholder="Complete delivery address"
										required
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="receiverDistrict">District *</Label>
										<Select name="receiverDistrict" onValueChange={handleDistrictChange} required>
											<SelectTrigger>
												<SelectValue placeholder="Select district" />
											</SelectTrigger>
											<SelectContent>
												{districts.map((district) => (
													<SelectItem key={district.id} value={district.id}>
														{district.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label htmlFor="receiverCity">City *</Label>
										<Select name="receiverCity" required>
											<SelectTrigger>
												<SelectValue placeholder="Select city" />
											</SelectTrigger>
											<SelectContent>
												{cities.map((city) => (
													<SelectItem key={city.id} value={city.id}>
														{city.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								<div>
									<Label htmlFor="spclNote">Special Instructions</Label>
									<Textarea name="spclNote" placeholder="Any special delivery instructions..." />
								</div>

								<div className="flex justify-end space-x-2 pt-4">
									<Button type="button" variant="outline" onClick={onClose}>
										Cancel
									</Button>
									<Button type="submit" disabled={isLoading}>
										{isLoading ? (
											<>
												<Clock className="mr-2 h-4 w-4 animate-spin" />
												Creating...
											</>
										) : (
											<>
												<Package className="mr-2 h-4 w-4" />
												Create Delivery
											</>
										)}
									</Button>
								</div>
							</>
						)}
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
