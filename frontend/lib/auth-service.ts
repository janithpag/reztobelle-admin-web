import { apiClient } from '@/lib/api';
import { FrontendUser } from '@/types';

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface LoginResponse {
	user: FrontendUser;
	token: string;
}

export interface UserResponse {
	user: FrontendUser;
}

/**
 * Login user with email and password
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
	try {
		const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
		return response.data;
	} catch (error: any) {
		if (error.response?.data?.error) {
			throw new Error(error.response.data.error);
		}
		throw new Error('Login failed. Please try again.');
	}
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
	try {
		await apiClient.post('/auth/logout');
	} catch (error: any) {
		// We don't throw here because logout should always succeed locally
		console.error('Logout error:', error);
	}
};

/**
 * Get current user information
 */
export const getCurrentUser = async (): Promise<UserResponse> => {
	try {
		const response = await apiClient.get<UserResponse>('/auth/me');
		return response.data;
	} catch (error: any) {
		if (error.response?.data?.error) {
			throw new Error(error.response.data.error);
		}
		throw new Error('Failed to fetch user data');
	}
};

// Create an auth service object for those who prefer object notation
export const authService = {
	login,
	logout,
	getCurrentUser,
};

export default authService;

/**
 * Note: Token refresh is handled automatically through the backend JWT expiration.
 * The backend returns a 24-hour JWT token that should be renewed by re-logging in when expired.
 */
