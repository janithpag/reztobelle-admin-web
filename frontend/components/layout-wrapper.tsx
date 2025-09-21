'use client';

import { usePathname } from 'next/navigation';
import { AdminLayout } from '@/components/admin-layout';
import { useAuth } from '@/contexts/auth-context';

interface LayoutWrapperProps {
	children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
	const pathname = usePathname();
	const { isAuthenticated, isLoading } = useAuth();

	// Don't show admin layout on login page or when not authenticated
	const showAdminLayout = isAuthenticated && pathname !== '/login';

	if (isLoading) {
		return <div className="min-h-screen bg-background flex items-center justify-center">
			<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>;
	}

	if (showAdminLayout) {
		return <AdminLayout>{children}</AdminLayout>;
	}

	return <>{children}</>;
}