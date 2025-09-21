import axios from 'axios';

// API Base URL configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance with default configuration
export const apiClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Create a separate instance for file uploads
export const uploadApiClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 30000, // Longer timeout for uploads
	headers: {
		'Content-Type': 'multipart/form-data',
	},
});

// Request interceptor to add auth token
const addAuthToken = (config: any) => {
	const token = localStorage.getItem('authToken');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
};

apiClient.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
uploadApiClient.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));

// Response interceptor for error handling
const handleAuthError = (error: any) => {
	if (error.response?.status === 401) {
		// Only redirect on 401 if this is not a login request
		const isLoginRequest = error.config?.url?.includes('/auth/login');
		
		if (!isLoginRequest) {
			// Token is invalid, clear auth data and redirect
			localStorage.removeItem('authToken');
			localStorage.removeItem('user');
			window.location.href = '/login';
		}
	}
	return Promise.reject(error);
};

apiClient.interceptors.response.use((response) => response, handleAuthError);
uploadApiClient.interceptors.response.use((response) => response, handleAuthError);

// Upload-related API functions
export const uploadAPI = {
	// Upload single image
	uploadImage: async (file: File, onProgress?: (progress: number) => void) => {
		const formData = new FormData();
		formData.append('file', file);

		const response = await uploadApiClient.post('/uploads/upload', formData, {
			onUploadProgress: (progressEvent) => {
				if (progressEvent.total && onProgress) {
					const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
					onProgress(progress);
				}
			},
		});

		return response.data;
	},

	// Upload multiple images
	uploadMultipleImages: async (files: File[], onProgress?: (progress: number) => void) => {
		const formData = new FormData();
		files.forEach((file) => {
			formData.append('files', file);
		});

		const response = await uploadApiClient.post('/uploads/upload-multiple', formData, {
			onUploadProgress: (progressEvent) => {
				if (progressEvent.total && onProgress) {
					const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
					onProgress(progress);
				}
			},
		});

		return response.data;
	},

	// Delete image
	deleteImage: async (publicId: string) => {
		const encodedPublicId = encodeURIComponent(publicId);
		const response = await apiClient.delete(`/uploads/delete/${encodedPublicId}`);
		return response.data;
	},

	// Get image transformations
	getImageTransformations: async (publicId: string) => {
		const encodedPublicId = encodeURIComponent(publicId);
		const response = await apiClient.get(`/uploads/transformations/${encodedPublicId}`);
		return response.data;
	},
};

// Product-related API functions
export const productsAPI = {
	// Get all products
	getProducts: async () => {
		const response = await apiClient.get('/products');
		return response.data;
	},

	// Get product by ID
	getProduct: async (id: string) => {
		const response = await apiClient.get(`/products/${id}`);
		return response.data;
	},

	// Create new product
	createProduct: async (productData: {
		name: string;
		description?: string;
		price: number;
		sku: string;
		category: string;
		stock?: number;
		images?: string[];
		isActive?: boolean;
	}) => {
		const response = await apiClient.post('/products', productData);
		return response.data;
	},

	// Update product
	updateProduct: async (id: string, productData: {
		name?: string;
		description?: string;
		price?: number;
		sku?: string;
		category?: string;
		stock?: number;
		images?: string[];
		isActive?: boolean;
	}) => {
		const response = await apiClient.put(`/products/${id}`, productData);
		return response.data;
	},

	// Delete product
	deleteProduct: async (id: string) => {
		const response = await apiClient.delete(`/products/${id}`);
		return response.data;
	},
};

export default apiClient;
