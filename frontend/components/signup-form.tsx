'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { register } from '@/lib/auth-service';
import Link from 'next/link';

interface SignUpFormData {
	email: string;
	password: string;
	confirmPassword: string;
	firstName: string;
	lastName: string;
}

export function SignUpForm() {
	const [formData, setFormData] = useState<SignUpFormData>({
		email: '',
		password: '',
		confirmPassword: '',
		firstName: '',
		lastName: '',
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		// Clear error when user starts typing
		if (error) setError('');
	};

	const validateForm = () => {
		if (!formData.firstName.trim() || !formData.lastName.trim()) {
			setError('First name and last name are required');
			return false;
		}
		if (!formData.email.includes('@')) {
			setError('Please enter a valid email address');
			return false;
		}
		if (formData.password.length < 6) {
			setError('Password must be at least 6 characters long');
			return false;
		}
		if (formData.password !== formData.confirmPassword) {
			setError('Passwords do not match');
			return false;
		}
		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!validateForm()) {
			return;
		}

		setIsLoading(true);
		setError('');

		try {
			const response = await register({
				email: formData.email,
				password: formData.password,
				firstName: formData.firstName,
				lastName: formData.lastName,
			});

			setSuccess(true);
			setSuccessMessage(response.message);
			
			// Reset form
			setFormData({
				email: '',
				password: '',
				confirmPassword: '',
				firstName: '',
				lastName: '',
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred during registration');
		} finally {
			setIsLoading(false);
		}
	};

	if (success) {
		return (
			<div className="space-y-4">
				<div className="absolute top-4 right-4">
					<ThemeToggle />
				</div>
				<Card className="w-full max-w-md mx-auto">
					<CardHeader className="text-center">
						<div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
							<CheckCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
						</div>
						<CardTitle className="text-2xl font-bold">Registration Successful!</CardTitle>
						<CardDescription>
							Your account has been created successfully.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Alert>
							<AlertDescription className="text-sm">
								{successMessage}
							</AlertDescription>
						</Alert>
						<div className="text-center">
							<Link href="/login">
								<Button className="w-full">
									Go to Login Page
								</Button>
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="absolute top-4 right-4">
				<ThemeToggle />
			</div>
			<Card className="w-full max-w-md mx-auto">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">Create Account</CardTitle>
					<CardDescription>
						Sign up to get started with ReztoBelle Admin
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="firstName">First Name</Label>
								<Input
									id="firstName"
									name="firstName"
									type="text"
									value={formData.firstName}
									onChange={handleInputChange}
									required
									disabled={isLoading}
									placeholder="Enter your first name"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="lastName">Last Name</Label>
								<Input
									id="lastName"
									name="lastName"
									type="text"
									value={formData.lastName}
									onChange={handleInputChange}
									required
									disabled={isLoading}
									placeholder="Enter your last name"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								value={formData.email}
								onChange={handleInputChange}
								required
								disabled={isLoading}
								placeholder="Enter your email address"
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
									required
									disabled={isLoading}
									placeholder="Create a password"
									className="pr-10"
								/>
								<button
									type="button"
									className="absolute inset-y-0 right-0 flex items-center pr-3"
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4 text-gray-400" />
									) : (
										<Eye className="h-4 w-4 text-gray-400" />
									)}
								</button>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm Password</Label>
							<div className="relative">
								<Input
									id="confirmPassword"
									name="confirmPassword"
									type={showConfirmPassword ? 'text' : 'password'}
									value={formData.confirmPassword}
									onChange={handleInputChange}
									required
									disabled={isLoading}
									placeholder="Confirm your password"
									className="pr-10"
								/>
								<button
									type="button"
									className="absolute inset-y-0 right-0 flex items-center pr-3"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								>
									{showConfirmPassword ? (
										<EyeOff className="h-4 w-4 text-gray-400" />
									) : (
										<Eye className="h-4 w-4 text-gray-400" />
									)}
								</button>
							</div>
						</div>

						{error && (
							<Alert>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating Account...
								</>
							) : (
								'Create Account'
							)}
						</Button>
					</form>

					<div className="text-center mt-4 text-sm text-muted-foreground">
						Already have an account?{' '}
						<Link href="/login" className="text-primary hover:underline font-medium">
							Sign in here
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}