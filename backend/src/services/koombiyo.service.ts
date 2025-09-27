import { PrismaClient } from '@prisma/client'
import axios from 'axios'

interface KoombiyoApiResponse<T = any> {
	success: boolean
	data?: T
	message?: string
}

interface District {
	id: number
	name: string
}

interface City {
	id: number
	name: string
	district_id: number
}

interface Waybill {
	id: string
	waybill_number: string
	available: boolean
}

interface OrderData {
	waybillId: string
	orderNo: string
	receiverName: string
	receiverStreet: string
	receiverDistrict: number
	receiverCity: number
	receiverPhone: string
	description: string
	specialNotes?: string
	codAmount: number
}

interface TrackingData {
	waybillid: string
	status: string
	location?: string
	timestamp: string
	remarks?: string
}

class KoombiyoService {
	private apiKey: string
	private baseUrl: string = 'https://application.koombiyodelivery.lk/api'

	constructor() {
		this.apiKey = process.env.KOOMBIYO_API_KEY || ''
		if (!this.apiKey) {
			throw new Error('KOOMBIYO_API_KEY environment variable is required')
		}
	}

	private async makeRequest<T>(endpoint: string, data: Record<string, string> = {}): Promise<KoombiyoApiResponse<T>> {
		try {
			const formData = new URLSearchParams()
			formData.append('apikey', this.apiKey)

			Object.entries(data).forEach(([key, value]) => {
				formData.append(key, value)
			})

			const response = await axios.post(`${this.baseUrl}${endpoint}`, formData, {
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				timeout: 30000
			})

			return response.data
		} catch (error: any) {
			console.error('Koombiyo API Error:', error.message)
			throw new Error(`Koombiyo API Error: ${error.message}`)
		}
	}

	// Get districts in real-time
	async getDistricts(): Promise<KoombiyoApiResponse<District[]>> {
		const response = await this.makeRequest<District[]>('/Districts/users')
		if (response.success && response.data) {
			return {
				success: true,
				data: response.data.map((district: any) => ({
					id: parseInt(district.id),
					name: district.name
				}))
			}
		}
		return { success: false, message: 'No districts found' }
	}

	// Get cities in real-time
	async getCities(districtId: number): Promise<KoombiyoApiResponse<City[]>> {
		const response = await this.makeRequest<City[]>('/Cities/users', {
			district_id: districtId.toString()
		})

		if (response.success && response.data) {
			return {
				success: true,
				data: response.data.map((city: any) => ({
					id: parseInt(city.id),
					name: city.name,
					district_id: parseInt(city.district_id)
				}))
			}
		}
		return { success: false, message: 'No cities found for this district' }
	}

	// Get available waybills in real-time
	async getAvailableWaybills(limit: number = 50): Promise<KoombiyoApiResponse<Waybill[]>> {
		const response = await this.makeRequest<any[]>('/Waybils/users', {
			limit: limit.toString()
		})

		if (response.success && response.data) {
			return {
				success: true,
				data: response.data.map((waybill: any) => ({
					id: waybill.id,
					waybill_number: waybill.waybill_number || waybill.id,
					available: true
				}))
			}
		}
		return { success: false, message: 'No waybills available' }
	}

	// Validate district and city combination
	async validateDistrictCity(districtId: number, cityId: number): Promise<{ valid: boolean, message?: string }> {
		try {
			const citiesResult = await this.getCities(districtId)

			if (!citiesResult.success || !citiesResult.data) {
				return { valid: false, message: 'Invalid district ID' }
			}

			const cityExists = citiesResult.data.some(city => city.id === cityId)
			if (!cityExists) {
				return { valid: false, message: 'Invalid city ID for the selected district' }
			}

			return { valid: true }
		} catch (error: any) {
			return { valid: false, message: `Validation failed: ${error.message}` }
		}
	}

	// Add order to Koombiyo
	async addOrder(orderData: OrderData): Promise<KoombiyoApiResponse<any>> {
		const koombiyoData = {
			orderWaybillid: orderData.waybillId,
			orderNo: orderData.orderNo,
			receiverName: orderData.receiverName,
			receiverStreet: orderData.receiverStreet,
			receiverDistrict: orderData.receiverDistrict.toString(),
			receiverCity: orderData.receiverCity.toString(),
			receiverPhone: orderData.receiverPhone,
			description: orderData.description,
			spclNote: orderData.specialNotes || '',
			getCod: orderData.codAmount.toString()
		}

		const response = await this.makeRequest('/Addorders/users', koombiyoData)

		if (response.success) {
			return {
				success: true,
				data: response.data,
				message: 'Order successfully sent to Koombiyo'
			}
		}

		throw new Error(response.message || 'Failed to add order to Koombiyo')
	}

	// Track order in real-time
	async trackOrder(waybillId: string): Promise<KoombiyoApiResponse<TrackingData>> {
		const response = await this.makeRequest<any[]>('/Allorders/users', {
			waybillid: waybillId,
			offset: '1',
			limit: '1'
		})

		if (response.success && response.data && response.data.length > 0) {
			const orderData = response.data[0]
			return {
				success: true,
				data: {
					waybillid: orderData.waybillid || waybillId,
					status: orderData.status || 'Unknown',
					location: orderData.location,
					timestamp: orderData.updated_at || new Date().toISOString(),
					remarks: orderData.remarks
				}
			}
		}

		return { success: false, message: 'Order not found in Koombiyo system' }
	}

	// Get order history
	async getOrderHistory(waybillId: string): Promise<KoombiyoApiResponse<any[]>> {
		const response = await this.makeRequest<any[]>('/Orderhistory/users', {
			waybillid: waybillId
		})

		if (response.success && response.data) {
			return { success: true, data: response.data }
		}

		return { success: false, message: 'No history found for this order' }
	}

	// Request pickup
	async requestPickup(pickupData: {
		vehicleType: 'Bike' | 'Three wheel' | 'Lorry'
		pickupAddress: string
		latitude: string
		longitude: string
		phone: string
		quantity: number
		remarks?: string
	}): Promise<KoombiyoApiResponse<any>> {
		const koombiyoData = {
			vehicleType: pickupData.vehicleType,
			pickup_address: pickupData.pickupAddress,
			latitude: pickupData.latitude,
			longitude: pickupData.longitude,
			phone: pickupData.phone,
			qty: pickupData.quantity.toString(),
			pickup_remark: pickupData.remarks || ''
		}

		const response = await this.makeRequest('/Pickups/users', koombiyoData)

		if (response.success) {
			return {
				success: true,
				data: response.data,
				message: 'Pickup request sent successfully'
			}
		}

		throw new Error(response.message || 'Failed to request pickup')
	}

	// Get return notes
	async getReturnNotes(): Promise<KoombiyoApiResponse<any[]>> {
		const response = await this.makeRequest<any[]>('/Returnnotes/users')

		if (response.success && response.data) {
			return { success: true, data: response.data }
		}

		return { success: false, message: 'No return notes found' }
	}

	// Get return items by note ID
	async getReturnItems(noteId: string): Promise<KoombiyoApiResponse<any[]>> {
		const response = await this.makeRequest<any[]>('/Returnitems/users', {
			noteid: noteId
		})

		if (response.success && response.data) {
			return { success: true, data: response.data }
		}

		return { success: false, message: 'No return items found for this note' }
	}

	// Mark return as received
	async receiveReturn(waybillId: string): Promise<KoombiyoApiResponse<any>> {
		const response = await this.makeRequest('/Returnreceive/users', {
			orderWaybillid: waybillId
		})

		if (response.success) {
			return {
				success: true,
				data: response.data,
				message: 'Return marked as received'
			}
		}

		throw new Error(response.message || 'Failed to mark return as received')
	}

	// Log delivery actions for audit trail
	async logDeliveryAction(
		prisma: PrismaClient,
		orderId: number,
		action: string,
		status?: string,
		message?: string,
		response?: any,
		userId?: number
	): Promise<void> {
		try {
			await prisma.deliveryLog.create({
				data: {
					orderId,
					action: action as any,
					status,
					message,
					response: response ? JSON.parse(JSON.stringify(response)) : null,
					createdBy: userId
				}
			})
		} catch (error) {
			console.error('Failed to log delivery action:', error)
		}
	}
}

export default KoombiyoService