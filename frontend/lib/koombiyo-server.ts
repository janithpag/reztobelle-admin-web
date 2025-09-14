"use server"

// Server-side Koombiyo API integration - keeps API key secure
const KOOMBIYO_BASE_URL = "https://application.koombiyodelivery.lk/api"

interface KoombiyoApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

interface District {
  id: string
  name: string
}

interface City {
  id: string
  name: string
  district_id: string
}

interface DeliveryOrder {
  orderWaybillid: string
  orderNo: string
  receiverName: string
  receiverStreet: string
  receiverDistrict: string
  receiverCity: string
  receiverPhone: string
  description: string
  spclNote: string
  getCod: string
}

interface PickupRequest {
  vehicleType: "Bike" | "Three wheel" | "Lorry"
  pickup_remark: string
  pickup_address: string
  latitude: string
  longitude: string
  phone: string
  qty: string
}

interface TrackingInfo {
  waybillid: string
  status: string
  timestamp: string
  location: string
}

const getApiKey = () => {
	const apiKey = process.env.KOOMBIYO_API_KEY
	if (!apiKey) {
		throw new Error("KOOMBIYO_API_KEY environment variable is not set")
	}
	return apiKey
}

async function makeKoombiyoRequest<T>(endpoint: string, data: Record<string, string>): Promise<KoombiyoApiResponse<T>> {
	try {
		const formData = new URLSearchParams()
		formData.append("apikey", getApiKey())

		Object.entries(data).forEach(([key, value]) => {
			formData.append(key, value)
		})

		const response = await fetch(`${KOOMBIYO_BASE_URL}${endpoint}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: formData,
		})

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const result = await response.json()
		return { success: true, data: result }
	} catch (error) {
		console.error("Koombiyo API Error:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		}
	}
}

// Server Actions for Koombiyo API

export async function getWaybills(limit = "10"): Promise<KoombiyoApiResponse<string[]>> {
	return makeKoombiyoRequest("/Waybils/users", { limit })
}

export async function getDistricts(): Promise<KoombiyoApiResponse<District[]>> {
	return makeKoombiyoRequest("/Districts/users", {})
}

export async function getCities(districtId: string): Promise<KoombiyoApiResponse<City[]>> {
	return makeKoombiyoRequest("/Cities/users", { district_id: districtId })
}

export async function createDeliveryOrder(order: DeliveryOrder): Promise<KoombiyoApiResponse> {
	return makeKoombiyoRequest("/Addorders/users", order)
}

export async function createPickupRequest(pickup: PickupRequest): Promise<KoombiyoApiResponse> {
	return makeKoombiyoRequest("/Pickups/users", pickup)
}

export async function trackOrders(
	waybillId?: string,
	offset = "1",
	limit = "10",
): Promise<KoombiyoApiResponse<TrackingInfo[]>> {
	const data: Record<string, string> = { offset, limit }
	if (waybillId) {
		data.waybillid = waybillId
	}
	return makeKoombiyoRequest("/Allorders/users", data)
}

export async function getOrderHistory(waybillId: string): Promise<KoombiyoApiResponse<TrackingInfo[]>> {
	return makeKoombiyoRequest("/Orderhistory/users", { waybillid: waybillId })
}

export async function receiveReturn(waybillId: string): Promise<KoombiyoApiResponse> {
	return makeKoombiyoRequest("/Returnreceive/users", { orderWaybillid: waybillId })
}

export async function getReturnNotes(): Promise<KoombiyoApiResponse> {
	return makeKoombiyoRequest("/Returnnotes/users", {})
}

export async function getReturnItems(noteId: string): Promise<KoombiyoApiResponse> {
	return makeKoombiyoRequest("/Returnitems/users", { noteid: noteId })
}

// Export types for use in components
export type { District, City, DeliveryOrder, PickupRequest, TrackingInfo, KoombiyoApiResponse }
