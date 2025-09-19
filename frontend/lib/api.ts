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

// Request interceptor to add auth token
apiClient.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('authToken');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			// Token is invalid, clear auth data
			localStorage.removeItem('authToken');
			localStorage.removeItem('user');
			window.location.href = '/login';
		}
		return Promise.reject(error);
	}
);

export default apiClient;
