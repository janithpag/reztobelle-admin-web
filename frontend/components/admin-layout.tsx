'use client';

import type React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from '@/components/ui/sidebar';
import {
	Bell,
	Search,
	Home,
	Package,
	Warehouse,
	ShoppingCart,
	Users,
	Truck,
	BarChart3,
	Settings,
	User,
	LogOut,
	Receipt,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from 'next-themes';

interface AdminLayoutProps {
	children: React.ReactNode;
}

const navigation = [
	{ name: 'Dashboard', href: '/', icon: Home },
	{ name: 'Products', href: '/products', icon: Package },
	{ name: 'Inventory', href: '/inventory', icon: Warehouse },
	{ name: 'Orders', href: '/orders', icon: ShoppingCart },
	{ name: 'Customers', href: '/customers', icon: Users },
	{ name: 'Deliveries', href: '/delivery', icon: Truck },
	{ name: 'Expenses', href: '/expenses', icon: Receipt },
	{ name: 'Reports', href: '/reports', icon: BarChart3 },
	{ name: 'Settings', href: '/settings', icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
	const pathname = usePathname();
	const { user, logout } = useAuth();
	const { theme, setTheme } = useTheme();

	const handleLogout = () => {
		logout();
	};

	if (!user) {
		return null; // This component should only render when authenticated
	}

	return (
		<SidebarProvider defaultOpen={true}>
			<div className="min-h-screen bg-background flex w-full">
				<Sidebar
					collapsible="icon"
					className="border-r border-sidebar-border shadow-lg fixed left-0 top-0 h-screen z-40"
				>
					<SidebarHeader className="border-b border-sidebar-border bg-sidebar text-sidebar-foreground p-3 sm:p-4">
						<div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center">
							<div className="group-data-[collapsible=icon]:hidden min-w-0 flex-1">
								<span className="text-sidebar-foreground font-bold text-base sm:text-lg truncate block">
									ReztoBelle
								</span>
								<p className="text-sidebar-foreground/70 text-xs font-medium truncate">Admin Dashboard</p>
							</div>
						</div>
					</SidebarHeader>

					<SidebarContent className="bg-sidebar text-sidebar-foreground p-2 sm:p-3 group-data-[collapsible=icon]:p-2">
						<SidebarGroup>
							<SidebarGroupContent>
								<SidebarMenu className="space-y-1">
									{navigation.map((item) => {
										const Icon = item.icon;
										const isActive = pathname === item.href;
										return (
											<SidebarMenuItem key={item.name}>
												<SidebarMenuButton
													asChild
													isActive={isActive}
													tooltip={item.name}
													className={cn(
														'rounded-md transition-all duration-200 w-full group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 sm:group-data-[collapsible=icon]:w-10 sm:group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0'
													)}
												>
													<Link
														href={item.href}
														className="flex items-center justify-start group-data-[collapsible=icon]:justify-center space-x-2 sm:space-x-3 group-data-[collapsible=icon]:space-x-0 px-2 sm:px-3 py-2 sm:py-2.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0 w-full group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 sm:group-data-[collapsible=icon]:w-10 sm:group-data-[collapsible=icon]:h-10"
													>
														<Icon className={cn('h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-200 flex-shrink-0')} />
														<span className="font-medium text-sm sm:text-base group-data-[collapsible=icon]:hidden min-w-0 truncate">
															{item.name}
														</span>
													</Link>
												</SidebarMenuButton>
											</SidebarMenuItem>
										);
									})}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>

					<SidebarFooter className="border-t border-sidebar-border bg-sidebar text-sidebar-foreground p-2 sm:p-4 group-data-[collapsible=icon]:p-2">
						{/* User details removed */}
					</SidebarFooter>
					<SidebarRail />
				</Sidebar>

				<SidebarInset className="flex-1">
					<header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-sidebar-border shadow-sm">
						<div className="flex h-14 sm:h-16 lg:h-[73px] items-center justify-between px-3 sm:px-4 lg:px-6">
							<div className="flex items-center space-x-2 sm:space-x-4 flex-1">
								<SidebarTrigger className="hover:bg-muted/50 rounded-md transition-colors" />

								<div className="relative hidden sm:block w-full max-w-xs lg:max-w-sm">
									<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										placeholder="Search products, orders..."
										className="pl-10 bg-muted/50 border-muted-foreground/20 focus:border-primary/50 transition-colors shadow-sm text-sm"
									/>
								</div>
							</div>

							<div className="flex items-center space-x-2 sm:space-x-4">
								<Button variant="ghost" size="sm" className="sm:hidden hover:bg-muted/50 rounded-lg transition-colors">
									<Search className="h-4 w-4" />
								</Button>

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
											<Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-primary/20 shadow-md hover:ring-primary/40 transition-all">
												<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs sm:text-sm">
													{user.name?.trim().charAt(0).toUpperCase()}
												</AvatarFallback>
											</Avatar>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-56" align="end" forceMount>
										<DropdownMenuLabel className="font-normal">
											<div className="flex flex-col space-y-1">
												<p className="text-sm font-medium leading-none">{user.name}</p>
												<p className="text-xs leading-none text-muted-foreground">{user.email}</p>
											</div>
										</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuItem>
											<User className="mr-2 h-4 w-4" />
											<span>Profile</span>
										</DropdownMenuItem>
										<DropdownMenuItem>
											<Settings className="mr-2 h-4 w-4" />
											<span>Settings</span>
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuLabel>Theme</DropdownMenuLabel>
										<DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v)}>
											<DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
											<DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
											<DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
										</DropdownMenuRadioGroup>
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={handleLogout}>
											<LogOut className="mr-2 h-4 w-4" />
											<span>Log out</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</header>

					<main className="p-3 sm:p-4 lg:p-6">{children}</main>
				</SidebarInset>
			</div>
		</SidebarProvider>
	);
}
