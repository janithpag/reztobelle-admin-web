'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as authService from '@/lib/auth-service';

export interface User {
	id: string;
	email: string;
	name: string;
	role: string;
}

interface AuthContextType {
	user: User | null;
	token: string | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	logout: () => void;
	refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

interface AuthProviderProps {
	children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();
	const pathname = usePathname();

	const isAuthenticated = !!user && !!token;

	// Initialize auth state from localStorage
	useEffect(() => {
		const initializeAuth = () => {
			try {
				const storedToken = localStorage.getItem('authToken');
				const storedUser = localStorage.getItem('user');

				if (storedToken && storedUser) {
					setToken(storedToken);
					setUser(JSON.parse(storedUser));
				}
			} catch (error) {
				console.error('Error initializing auth:', error);
				// Clear invalid data
				localStorage.removeItem('authToken');
				localStorage.removeItem('user');
			} finally {
				setIsLoading(false);
			}
		};

		initializeAuth();
	}, []);

	// Redirect logic
	useEffect(() => {
		if (isLoading) return;

		const publicPaths = ['/login'];
		const isPublicPath = publicPaths.includes(pathname);

		if (!isAuthenticated && !isPublicPath) {
			router.push('/login');
		} else if (isAuthenticated && pathname === '/login') {
			router.push('/');
		}
	}, [isAuthenticated, pathname, router, isLoading]);

	const login = async (email: string, password: string): Promise<void> => {
		try {
			const { user: userData, token: userToken } = await authService.login({ email, password });

			// Store in localStorage
			localStorage.setItem('authToken', userToken);
			localStorage.setItem('user', JSON.stringify(userData));

			// Update state
			setToken(userToken);
			setUser(userData);

			router.push('/');
		} catch (error) {
			throw error;
		}
	};

	const logout = async () => {
		try {
			// Call backend logout endpoint if token exists
			if (token) {
				await authService.logout();
			}
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			// Clear local state regardless of backend response
			localStorage.removeItem('authToken');
			localStorage.removeItem('user');
			setToken(null);
			setUser(null);
			router.push('/login');
		}
	};

	const refreshUser = async (): Promise<void> => {
		if (!token) return;

		try {
			const { user: userData } = await authService.getCurrentUser();
			setUser(userData);
			localStorage.setItem('user', JSON.stringify(userData));
		} catch (error) {
			console.error('Error refreshing user:', error);
			logout();
		}
	};

	const value: AuthContextType = {
		user,
		token,
		isLoading,
		isAuthenticated,
		login,
		logout,
		refreshUser,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// HOC for protecting pages
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
	const AuthenticatedComponent = (props: P) => {
		const { isAuthenticated, isLoading } = useAuth();
		const router = useRouter();

		useEffect(() => {
			if (!isLoading && !isAuthenticated) {
				router.push('/login');
			}
		}, [isAuthenticated, isLoading, router]);

		if (isLoading) {
			return (
				<div className="min-h-screen flex items-center justify-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
				</div>
			);
		}

		if (!isAuthenticated) {
			return null;
		}

		return <Component {...props} />;
	};

	AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
	return AuthenticatedComponent;
};
