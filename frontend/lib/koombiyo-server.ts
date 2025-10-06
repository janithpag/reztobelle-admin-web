/**
 * Koombiyo API Client - Frontend Integration
 * 
 * This module provides client-side functions to interact with Koombiyo delivery service
 * through the backend API. All requests go through the backend to keep the API key secure.
 * These requests WILL show in the browser's Network tab.
 */

import { apiClient } from './api';

// API Response type
interface KoombiyoApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// Data types
export interface District {
	id: number;
	name: string;
}

export interface City {
	id: number;
	name: string;
	district_id: number;
}

export interface Waybill {
	id: string;
	waybill_number: string;
	available: boolean;
}

export interface DeliveryOrder {
	orderWaybillid: string;
	orderNo: string;
	receiverName: string;
	receiverStreet: string;
	receiverDistrict: string;
	receiverCity: string;
	receiverPhone: string;
	description: string;
	spclNote: string;
	getCod: string;
}

export interface PickupRequest {
	vehicleType: 'Bike' | 'Three wheel' | 'Lorry';
	pickupAddress: string;
	latitude: string;
	longitude: string;
	phone: string;
	quantity: number;
	remarks?: string;
}

export interface TrackingInfo {
	waybillid: string;
	status: string;
	timestamp: string;
	location?: string;
	remarks?: string;
}

/**
 * Get list of available districts from Koombiyo
 */
export async function getDistricts(): Promise<KoombiyoApiResponse<District[]>> {
	try {
		const response = await apiClient.get('/koombiyo/districts');
		return {
			success: true,
			data: response.data.districts
		};
	} catch (error: any) {
		console.error('Failed to fetch districts:', error);
		return {
			success: false,
			error: error.response?.data?.message || error.message || 'Failed to fetch districts'
		};
	}
}

/**
 * Get cities for a specific district
 */
export async function getCities(districtId: string | number): Promise<KoombiyoApiResponse<City[]>> {
	try {
		const response = await apiClient.get(`/koombiyo/cities/${districtId}`);
		return {
			success: true,
			data: response.data.cities
		};
	} catch (error: any) {
		console.error('Failed to fetch cities:', error);
		return {
			success: false,
			error: error.response?.data?.message || error.message || 'Failed to fetch cities'
		};
	}
}

/**
 * Get available waybills from Koombiyo
 */
export async function getWaybills(limit: string | number = 50): Promise<KoombiyoApiResponse<Waybill[]>> {
	try {
		const response = await apiClient.get(`/koombiyo/waybills/available?limit=${limit}`);
		return {
			success: true,
			data: response.data.waybills
		};
	} catch (error: any) {
		console.error('Failed to fetch waybills:', error);
		return {
			success: false,
			error: error.response?.data?.message || error.message || 'Failed to fetch waybills'
		};
	}
}

/**
 * Validate district and city combination
 */
export async function validateLocation(districtId: number, cityId: number): Promise<KoombiyoApiResponse<boolean>> {
	try {
		const response = await apiClient.post('/koombiyo/validate-location', {
			districtId,
			cityId
		});
		return {
			success: true,
			data: response.data.isValid
		};
	} catch (error: any) {
		console.error('Failed to validate location:', error);
		return {
			success: false,
			error: error.response?.data?.message || error.message || 'Failed to validate location'
		};
	}
}

/**
 * Send an order to Koombiyo delivery service
 */
export async function sendOrderToKoombiyo(orderId: number): Promise<KoombiyoApiResponse> {
	try {
		const response = await apiClient.post(`/koombiyo/orders/${orderId}/send`);
		return {
			success: true,
			data: response.data,
			message: response.data.message
		};
	} catch (error: any) {
		console.error('Failed to send order to Koombiyo:', error);
		return {
			success: false,
			error: error.response?.data?.message || error.message || 'Failed to send order to Koombiyo'
		};
	}
}

/**
 * Track an order by order ID
 */
export async function trackOrder(orderId: number): Promise<KoombiyoApiResponse<TrackingInfo>> {
	try {
		const response = await apiClient.get(`/koombiyo/orders/${orderId}/track`);
		return {
			success: true,
			data: response.data.tracking
		};
	} catch (error: any) {
		console.error('Failed to track order:', error);
		return {
			success: false,
			error: error.response?.data?.message || error.message || 'Failed to track order'
		};
	}
}

/**
 * Get order delivery history
 */
export async function getOrderHistory(orderId: number): Promise<KoombiyoApiResponse<{
	koombiyoHistory: TrackingInfo[];
	localLogs: any[];
	orderNumber: string;
	waybillId: string;
}>> {
	try {
		const response = await apiClient.get(`/koombiyo/orders/${orderId}/history`);
		return {
			success: true,
			data: response.data
		};
	} catch (error: any) {
		console.error('Failed to get order history:', error);
		return {
			success: false,
			error: error.response?.data?.message || error.message || 'Failed to get order history'
		};
	}
}

/**
 * Request a pickup from Koombiyo
 */
export async function createPickupRequest(pickup: PickupRequest): Promise<KoombiyoApiResponse> {
	try {
		const response = await apiClient.post('/koombiyo/pickup/request', pickup);
		return {
			success: true,
			data: response.data.data,
			message: response.data.message
		};
	} catch (error: any) {
		console.error('Failed to request pickup:', error);
		return {
			success: false,
			error: error.response?.data?.message || error.message || 'Failed to request pickup'
		};
	}
}

/**
 * Get return notes from Koombiyo
 */
export async function getReturnNotes(): Promise<KoombiyoApiResponse> {
	try {
		const response = await apiClient.get('/koombiyo/returns');
		return {
			success: true,
			data: response.data.returns,
			message: response.data.message
		};
	} catch (error: any) {
		console.error('Failed to get return notes:', error);
		return {
			success: false,
			error: error.response?.data?.message || error.message || 'Failed to get return notes'
		};
	}
}

/**
 * Get return items by note ID
 */
export async function getReturnItems(noteId: string): Promise<KoombiyoApiResponse> {
	try {
		const response = await apiClient.get(`/koombiyo/returns/${noteId}/items`);
		return {
			success: true,
			data: response.data.items,
			message: response.data.message
		};
	} catch (error: any) {
		console.error('Failed to get return items:', error);
		return {
			success: false,
			error: error.response?.data?.message || error.message || 'Failed to get return items'
		};
	}
}

/**
 * Mark a return as received
 */
export async function receiveReturn(waybillId: string): Promise<KoombiyoApiResponse> {
	try {
		const response = await apiClient.post(`/koombiyo/returns/${waybillId}/receive`);
		return {
			success: true,
			data: response.data,
			message: response.data.message
		};
	} catch (error: any) {
		console.error('Failed to receive return:', error);
		return {
			success: false,
			error: error.response?.data?.message || error.message || 'Failed to receive return'
		};
	}
}

// Legacy function for backward compatibility - maps to getWaybills
export async function trackOrders(
	waybillId?: string,
	offset: string = '1',
	limit: string = '10'
): Promise<KoombiyoApiResponse<TrackingInfo[]>> {
	// This was used for listing orders, but now we use the backend endpoints
	console.warn('trackOrders is deprecated. Use trackOrder or getOrderHistory instead.');
	return {
		success: false,
		error: 'This function is deprecated. Use trackOrder or getOrderHistory instead.'
	};
}

// Legacy function - not needed anymore as order creation happens through backend
export async function createDeliveryOrder(order: DeliveryOrder): Promise<KoombiyoApiResponse> {
	console.warn('createDeliveryOrder is deprecated. Use sendOrderToKoombiyo with an order ID instead.');
	return {
		success: false,
		error: 'This function is deprecated. Use sendOrderToKoombiyo instead.'
	};
}

// Export types
export type { KoombiyoApiResponse };
