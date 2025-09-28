'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

interface LoginFormData {
	email: string;
	password: string;
}

export function LoginForm() {
	const [formData, setFormData] = useState<LoginFormData>({
		email: '',
		password: '',
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const { login } = useAuth();

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		// Clear error when user starts typing
		if (error) setError('');
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');

		try {
			await login(formData.email, formData.password);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred during login');
		} finally {
			setIsLoading(false);
		}
	};

	const isFormValid = formData.email && formData.password;

	return (
		<div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div className="flex justify-end">
					<ThemeToggle compact />
				</div>
				<div className="text-center">
					<div className="flex justify-center mb-6" />
					<h2 className="text-3xl font-bold text-foreground">ReztoBelle Admin</h2>
					<p className="mt-2 text-sm text-muted-foreground">Sign in to your account to continue</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Sign In</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							{error && (
								<Alert variant="destructive">
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							<div className="space-y-2">
								<Label htmlFor="email">Email Address</Label>
								<Input
									id="email"
									name="email"
									type="email"
									value={formData.email}
									onChange={handleInputChange}
									placeholder="Enter your email"
									required
									disabled={isLoading}
									className="w-full"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<div className="relative">
									<Input
										id="password"
										name="password"
										type={showPassword ? 'text' : 'password'}
										value={formData.password}
										onChange={handleInputChange}
										placeholder="Enter your password"
										required
										disabled={isLoading}
										className="w-full pr-10"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute inset-y-0 right-0 pr-3 flex items-center"
										disabled={isLoading}
									>
										{showPassword ? (
											<EyeOff className="h-4 w-4 text-muted-foreground" />
										) : (
											<Eye className="h-4 w-4 text-muted-foreground" />
										)}
									</button>
								</div>
							</div>

							<Button type="submit" className="w-full" disabled={!isFormValid || isLoading}>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Signing in...
									</>
								) : (
									'Sign In'
								)}
							</Button>
						</form>

						<div className="text-center mt-4 text-sm text-muted-foreground">
							Don&apos;t have an account?{' '}
							<Link href="/signup" className="text-primary hover:underline font-medium">
								Sign up here
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
