import axios from 'axios';
import {
	Product,
	Category,
	Order,
	OrderItem,
	PaymentTransaction,
	Inventory,
	StockMovement,
	Expense,
	User,
	ActivityLog,
	DeliveryLog,
	CreateProductForm,
	UpdateProductForm,
	CreateCategoryForm,
	UpdateCategoryForm,
	CreateOrderForm,
	UploadedImage,
} from '@/types';

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

// Categories API
export const categoriesAPI = {
	// Get all categories
	getCategories: async (): Promise<{ categories: Category[] }> => {
		const response = await apiClient.get('/categories');
		return response.data;
	},

	// Get category by ID
	getCategory: async (id: number): Promise<{ category: Category }> => {
		const response = await apiClient.get(`/categories/${id}`);
		return response.data;
	},

	// Create new category
	createCategory: async (categoryData: CreateCategoryForm): Promise<{ category: Category }> => {
		const response = await apiClient.post('/categories', categoryData);
		return response.data;
	},

	// Update category
	updateCategory: async (id: number, categoryData: Partial<CreateCategoryForm>): Promise<{ category: Category }> => {
		const response = await apiClient.put(`/categories/${id}`, categoryData);
		return response.data;
	},

	// Delete category
	deleteCategory: async (id: number): Promise<void> => {
		const response = await apiClient.delete(`/categories/${id}`);
		return response.data;
	},
};

// Product-related API functions
export const productsAPI = {
	// Get all products with filters
	getProducts: async (params?: {
		categoryId?: number;
		isActive?: boolean;
		isFeatured?: boolean;
		search?: string;
		page?: number;
		limit?: number;
	}): Promise<{ products: Product[] }> => {
		const response = await apiClient.get('/products', { params });
		return response.data;
	},

	// Get product by ID
	getProduct: async (id: number): Promise<{ product: Product }> => {
		const response = await apiClient.get(`/products/${id}`);
		return response.data;
	},

	// Create new product
	createProduct: async (productData: CreateProductForm): Promise<{ product: Product }> => {
		// Transform the data to match backend expectations
		const backendData = {
			name: productData.name,
			description: productData.description,
			shortDescription: productData.shortDescription,
			sku: productData.sku,
			price: productData.price,
			costPrice: productData.costPrice,
			categoryId: productData.categoryId,
			brand: productData.brand,
			color: productData.color,
			material: productData.material,
			size: productData.size,
			weight: productData.weight,
			dimensions: productData.dimensions,
			metaTitle: productData.metaTitle,
			metaDescription: productData.metaDescription,
			isActive: productData.isActive ?? true,
			isFeatured: productData.isFeatured ?? false,
			images: productData.images || [],
			initialStock: productData.initialStock || 0
		}
		
		const response = await apiClient.post('/products', backendData)
		return response.data
	},

	// Update product
	updateProduct: async (id: number, productData: UpdateProductForm): Promise<{ product: Product }> => {
		// Transform the data to match backend expectations, excluding initialStock
		const backendData: any = {}
		
		if (productData.name !== undefined) backendData.name = productData.name
		if (productData.description !== undefined) backendData.description = productData.description
		if (productData.shortDescription !== undefined) backendData.shortDescription = productData.shortDescription
		if (productData.sku !== undefined) backendData.sku = productData.sku
		if (productData.price !== undefined) backendData.price = productData.price
		if (productData.costPrice !== undefined) backendData.costPrice = productData.costPrice
		if (productData.categoryId !== undefined) backendData.categoryId = productData.categoryId
		if (productData.brand !== undefined) backendData.brand = productData.brand
		if (productData.color !== undefined) backendData.color = productData.color
		if (productData.material !== undefined) backendData.material = productData.material
		if (productData.size !== undefined) backendData.size = productData.size
		if (productData.weight !== undefined) backendData.weight = productData.weight
		if (productData.dimensions !== undefined) backendData.dimensions = productData.dimensions
		if (productData.metaTitle !== undefined) backendData.metaTitle = productData.metaTitle
		if (productData.metaDescription !== undefined) backendData.metaDescription = productData.metaDescription
		if (productData.isActive !== undefined) backendData.isActive = productData.isActive
		if (productData.isFeatured !== undefined) backendData.isFeatured = productData.isFeatured
		if (productData.images !== undefined) backendData.images = productData.images

		const response = await apiClient.put(`/products/${id}`, backendData)
		return response.data
	},

	// Delete product
	deleteProduct: async (id: number): Promise<void> => {
		const response = await apiClient.delete(`/products/${id}`);
		return response.data;
	},

	// Get product images
	getProductImages: async (productId: number) => {
		const response = await apiClient.get(`/products/${productId}/images`);
		return response.data;
	},

	// Add product images
	addProductImages: async (productId: number, images: UploadedImage[]) => {
		const response = await apiClient.post(`/products/${productId}/images`, { images });
		return response.data;
	},

	// Update product image
	updateProductImage: async (productId: number, imageId: number, data: {
		altText?: string;
		isPrimary?: boolean;
		sortOrder?: number;
	}) => {
		const response = await apiClient.put(`/products/${productId}/images/${imageId}`, data);
		return response.data;
	},

	// Delete product image
	deleteProductImage: async (productId: number, imageId: number) => {
		const response = await apiClient.delete(`/products/${productId}/images/${imageId}`);
		return response.data;
	},
};

// Orders API
export const ordersAPI = {
	// Get all orders
	getOrders: async (params?: {
		status?: string;
		paymentStatus?: string;
		deliveryStatus?: string;
		page?: number;
		limit?: number;
		dateFrom?: string;
		dateTo?: string;
	}): Promise<{ orders: Order[] }> => {
		const response = await apiClient.get('/orders', { params });
		return response.data;
	},

	// Get order by ID
	getOrder: async (id: number): Promise<{ order: Order }> => {
		const response = await apiClient.get(`/orders/${id}`);
		return response.data;
	},

	// Create new order
	createOrder: async (orderData: CreateOrderForm): Promise<{ order: Order }> => {
		const response = await apiClient.post('/orders', orderData);
		return response.data;
	},

	// Update order
	updateOrder: async (id: number, orderData: Partial<Order>): Promise<{ order: Order }> => {
		const response = await apiClient.put(`/orders/${id}`, orderData);
		return response.data;
	},

	// Update order status
	updateOrderStatus: async (id: number, status: string): Promise<{ order: Order }> => {
		const response = await apiClient.patch(`/orders/${id}/status`, { status });
		return response.data;
	},

	// Update payment status
	updatePaymentStatus: async (id: number, paymentStatus: string): Promise<{ order: Order }> => {
		const response = await apiClient.patch(`/orders/${id}/payment-status`, { paymentStatus });
		return response.data;
	},

	// Cancel order
	cancelOrder: async (id: number, reason?: string): Promise<{ order: Order }> => {
		const response = await apiClient.patch(`/orders/${id}/cancel`, { reason });
		return response.data;
	},
};

// Inventory API
export const inventoryAPI = {
	// Get all inventory
	getInventory: async (params?: {
		lowStock?: boolean;
		page?: number;
		limit?: number;
	}): Promise<{ inventory: (Inventory & { product: Product & { category: { name: string } } })[] }> => {
		const response = await apiClient.get('/inventory', { params });
		return response.data;
	},

	// Get inventory by product ID
	getProductInventory: async (productId: number): Promise<{ inventory: Inventory }> => {
		const response = await apiClient.get(`/inventory/product/${productId}`);
		return response.data;
	},

	// Adjust stock levels
	adjustStock: async (productId: number, data: {
		quantity: number;
		movementType: 'IN' | 'OUT' | 'ADJUSTMENT';
		referenceType: 'PURCHASE' | 'SALE' | 'RETURN' | 'DAMAGE' | 'ADJUSTMENT';
		referenceId?: number;
		notes?: string;
		unitCost?: number;
	}): Promise<{ previousQuantity: number; newQuantity: number }> => {
		const response = await apiClient.put(`/inventory/${productId}/adjust`, data);
		return response.data;
	},

	// Update inventory settings
	updateInventory: async (productId: number, data: {
		reorderLevel?: number;
		maxStockLevel?: number;
	}): Promise<{ inventory: Inventory }> => {
		const response = await apiClient.put(`/inventory/product/${productId}`, data);
		return response.data;
	},

	// Get stock movements
	getStockMovements: async (productId?: number, params?: {
		page?: number;
		limit?: number;
		dateFrom?: string;
		dateTo?: string;
	}): Promise<{ movements: StockMovement[] }> => {
		const url = productId ? `/inventory/product/${productId}/movements` : '/inventory/movements';
		const response = await apiClient.get(url, { params });
		return response.data;
	},

	// Get low stock items
	getLowStockItems: async (): Promise<{ lowStockItems: (Inventory & { product: Product })[] }> => {
		const response = await apiClient.get('/inventory/low-stock');
		return response.data;
	},

	// Get inventory summary
	getInventorySummary: async (): Promise<{
		totalProducts: number;
		lowStockCount: number;
		outOfStockCount: number;
		totalValue: number;
	}> => {
		const response = await apiClient.get('/inventory/summary');
		return response.data;
	},
};

// Payments API
export const paymentsAPI = {
	// Get payment transactions
	getPaymentTransactions: async (params?: {
		orderId?: number;
		status?: string;
		paymentMethod?: string;
		page?: number;
		limit?: number;
	}): Promise<{ transactions: PaymentTransaction[] }> => {
		const response = await apiClient.get('/payments', { params });
		return response.data;
	},

	// Create payment transaction
	createPaymentTransaction: async (data: {
		orderId: number;
		paymentMethod: string;
		amount: number;
		bankDetails?: string;
		depositSlipUrl?: string;
		notes?: string;
	}): Promise<{ transaction: PaymentTransaction }> => {
		const response = await apiClient.post('/payments', data);
		return response.data;
	},

	// Verify payment transaction
	verifyPaymentTransaction: async (id: number, notes?: string): Promise<{ transaction: PaymentTransaction }> => {
		const response = await apiClient.patch(`/payments/${id}/verify`, { notes });
		return response.data;
	},

	// Reject payment transaction
	rejectPaymentTransaction: async (id: number, notes?: string): Promise<{ transaction: PaymentTransaction }> => {
		const response = await apiClient.patch(`/payments/${id}/reject`, { notes });
		return response.data;
	},
};

// Expenses API
export const expensesAPI = {
	// Get all expenses
	getExpenses: async (params?: {
		category?: string;
		dateFrom?: string;
		dateTo?: string;
		page?: number;
		limit?: number;
	}): Promise<{ expenses: Expense[] }> => {
		const response = await apiClient.get('/expenses', { params });
		return response.data;
	},

	// Get expense by ID
	getExpense: async (id: number): Promise<{ expense: Expense }> => {
		const response = await apiClient.get(`/expenses/${id}`);
		return response.data;
	},

	// Create expense
	createExpense: async (data: {
		category: string;
		description: string;
		amount: number;
		expenseDate: string;
		supplierName?: string;
		referenceNumber?: string;
		subcategory?: string;
		receiptUrl?: string;
		isRecurring?: boolean;
		recurringFrequency?: string;
	}): Promise<{ expense: Expense }> => {
		const response = await apiClient.post('/expenses', data);
		return response.data;
	},

	// Update expense
	updateExpense: async (id: number, data: Partial<Expense>): Promise<{ expense: Expense }> => {
		const response = await apiClient.put(`/expenses/${id}`, data);
		return response.data;
	},

	// Delete expense
	deleteExpense: async (id: number): Promise<void> => {
		const response = await apiClient.delete(`/expenses/${id}`);
		return response.data;
	},
};

// Deliveries API (Koombiyo integration)
export const deliveriesAPI = {
	// Get delivery logs
	getDeliveryLogs: async (orderId?: number): Promise<{ deliveryLogs: DeliveryLog[] }> => {
		const url = orderId ? `/deliveries/logs?orderId=${orderId}` : '/deliveries/logs';
		const response = await apiClient.get(url);
		return response.data;
	},

	// Send order to Koombiyo
	sendToKoombiyo: async (orderId: number): Promise<{ order: Order, deliveryLog: DeliveryLog }> => {
		const response = await apiClient.post(`/deliveries/send/${orderId}`);
		return response.data;
	},

	// Get delivery status
	getDeliveryStatus: async (orderId: number): Promise<{ status: any }> => {
		const response = await apiClient.get(`/deliveries/status/${orderId}`);
		return response.data;
	},

	// Update delivery status manually
	updateDeliveryStatus: async (orderId: number, status: string, notes?: string): Promise<{ deliveryLog: DeliveryLog }> => {
		const response = await apiClient.post(`/deliveries/update-status`, {
			orderId,
			status,
			notes
		});
		return response.data;
	},
};

// Reports API
export const reportsAPI = {
	// Get dashboard overview
	getDashboardOverview: async (): Promise<{
		totalProducts: number;
		totalOrders: number;
		totalRevenue: number;
		lowStockProducts: number;
		pendingOrders: number;
		recentOrders: Order[];
	}> => {
		const response = await apiClient.get('/reports/overview');
		return response.data;
	},

	// Get sales report
	getSalesReport: async (params: {
		dateFrom: string;
		dateTo: string;
		groupBy?: 'day' | 'week' | 'month';
	}) => {
		const response = await apiClient.get('/reports/sales', { params });
		return response.data;
	},

	// Get inventory report
	getInventoryReport: async () => {
		const response = await apiClient.get('/reports/inventory');
		return response.data;
	},

	// Get expense report
	getExpenseReport: async (params: {
		dateFrom: string;
		dateTo: string;
		category?: string;
	}) => {
		const response = await apiClient.get('/reports/expenses', { params });
		return response.data;
	},
};

// Users API
export const usersAPI = {
	// Get all users
	getUsers: async (): Promise<{ users: User[] }> => {
		const response = await apiClient.get('/users');
		return response.data;
	},

	// Get user by ID
	getUser: async (id: number): Promise<{ user: User }> => {
		const response = await apiClient.get(`/users/${id}`);
		return response.data;
	},

	// Create user
	createUser: async (data: {
		email: string;
		firstName: string;
		lastName: string;
		role: string;
		password: string;
	}): Promise<{ user: User }> => {
		const response = await apiClient.post('/users', data);
		return response.data;
	},

	// Update user
	updateUser: async (id: number, data: Partial<User>): Promise<{ user: User }> => {
		const response = await apiClient.put(`/users/${id}`, data);
		return response.data;
	},

	// Deactivate user
	deactivateUser: async (id: number): Promise<{ user: User }> => {
		const response = await apiClient.patch(`/users/${id}/deactivate`);
		return response.data;
	},

	// Get activity logs
	getActivityLogs: async (params?: {
		userId?: number;
		entityType?: string;
		page?: number;
		limit?: number;
	}): Promise<{ logs: ActivityLog[] }> => {
		const response = await apiClient.get('/users/activity-logs', { params });
		return response.data;
	},
};

// Authentication API
export const authAPI = {
	// Login
	login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
		const response = await apiClient.post('/auth/login', { email, password });
		return response.data;
	},

	// Refresh token
	refreshToken: async (): Promise<{ user: User; token: string }> => {
		const response = await apiClient.post('/auth/refresh');
		return response.data;
	},

	// Logout
	logout: async (): Promise<void> => {
		const response = await apiClient.post('/auth/logout');
		return response.data;
	},

	// Get current user profile
	getProfile: async (): Promise<{ user: User }> => {
		const response = await apiClient.get('/auth/profile');
		return response.data;
	},

	// Update profile
	updateProfile: async (data: {
		firstName?: string;
		lastName?: string;
		email?: string;
	}): Promise<{ user: User }> => {
		const response = await apiClient.put('/auth/profile', data);
		return response.data;
	},

	// Change password
	changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
		const response = await apiClient.post('/auth/change-password', {
			currentPassword,
			newPassword
		});
		return response.data;
	},
};

export default apiClient;