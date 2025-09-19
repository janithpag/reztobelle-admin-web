'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
} from 'recharts';
import { Download, TrendingUp, DollarSign, Package, Users, Calendar } from 'lucide-react';

// Sample data for charts
const salesData = [
	{ month: 'Jan', sales: 45000, orders: 156 },
	{ month: 'Feb', sales: 52000, orders: 178 },
	{ month: 'Mar', sales: 48000, orders: 165 },
	{ month: 'Apr', sales: 61000, orders: 203 },
	{ month: 'May', sales: 55000, orders: 189 },
	{ month: 'Jun', sales: 67000, orders: 234 },
];

const categoryData = [
	{ name: 'Press-On Nails', value: 45, color: '#E91E63' },
	{ name: 'Earrings', value: 35, color: '#FFC107' },
	{ name: 'Rings', value: 20, color: '#9C27B0' },
];

const topProducts = [
	{ name: 'Rose Gold Press-On Nails', sales: 156, revenue: 23400 },
	{ name: 'Diamond Stud Earrings', sales: 134, revenue: 40066 },
	{ name: 'Vintage Gold Rings', sales: 98, revenue: 19502 },
	{ name: 'Pearl Drop Earrings', sales: 87, revenue: 15573 },
	{ name: 'French Tip Nails', sales: 76, revenue: 9120 },
];

export function ReportsManagement() {
	const [selectedPeriod, setSelectedPeriod] = useState('last_30_days');

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-balance">Reports & Analytics</h1>
					<p className="text-muted-foreground">Track performance and generate insights</p>
				</div>
				<div className="flex items-center space-x-4">
					<Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
						<SelectTrigger className="w-[180px]">
							<Calendar className="mr-2 h-4 w-4" />
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="last_7_days">Last 7 Days</SelectItem>
							<SelectItem value="last_30_days">Last 30 Days</SelectItem>
							<SelectItem value="last_3_months">Last 3 Months</SelectItem>
							<SelectItem value="last_year">Last Year</SelectItem>
						</SelectContent>
					</Select>
					<Button variant="outline">
						<Download className="mr-2 h-4 w-4" />
						Export Report
					</Button>
				</div>
			</div>

			{/* Key Metrics */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-medium">Total Revenue</CardTitle>
						<DollarSign className="h-3 w-3 text-muted-foreground" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg font-bold">LKR 3,28,000</div>
						<p className="text-xs text-muted-foreground">
							<span className="text-green-600">+12.5%</span> from last month
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-medium">Total Orders</CardTitle>
						<Package className="h-3 w-3 text-muted-foreground" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg font-bold">1,125</div>
						<p className="text-xs text-muted-foreground">
							<span className="text-green-600">+8.2%</span> from last month
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-medium">New Customers</CardTitle>
						<Users className="h-3 w-3 text-muted-foreground" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg font-bold">89</div>
						<p className="text-xs text-muted-foreground">
							<span className="text-green-600">+15.3%</span> from last month
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
						<CardTitle className="text-xs font-medium">Avg Order Value</CardTitle>
						<TrendingUp className="h-3 w-3 text-muted-foreground" />
					</CardHeader>
					<CardContent className="pt-1">
						<div className="text-lg font-bold">LKR 291</div>
						<p className="text-xs text-muted-foreground">
							<span className="text-green-600">+3.8%</span> from last month
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Charts Section */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Sales Trend */}
				<Card>
					<CardHeader>
						<CardTitle>Sales Trend</CardTitle>
						<CardDescription>Monthly sales performance over time</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={salesData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" />
								<YAxis />
								<Tooltip
									formatter={(value, name) => [
										name === 'sales' ? `LKR ${value.toLocaleString()}` : value,
										name === 'sales' ? 'Sales' : 'Orders',
									]}
								/>
								<Line type="monotone" dataKey="sales" stroke="#E91E63" strokeWidth={2} />
							</LineChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* Category Distribution */}
				<Card>
					<CardHeader>
						<CardTitle>Sales by Category</CardTitle>
						<CardDescription>Revenue distribution across product categories</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={categoryData}
									cx="50%"
									cy="50%"
									outerRadius={80}
									dataKey="value"
									label={({ name, value }) => `${name}: ${value}%`}
								>
									{categoryData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} />
									))}
								</Pie>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>

			{/* Monthly Revenue Chart */}
			<Card>
				<CardHeader>
					<CardTitle>Monthly Revenue</CardTitle>
					<CardDescription>Revenue and order count comparison</CardDescription>
				</CardHeader>
				<CardContent>
					<ResponsiveContainer width="100%" height={400}>
						<BarChart data={salesData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="month" />
							<YAxis />
							<Tooltip
								formatter={(value, name) => [
									name === 'sales' ? `LKR ${value.toLocaleString()}` : value,
									name === 'sales' ? 'Revenue' : 'Orders',
								]}
							/>
							<Bar dataKey="sales" fill="#E91E63" />
							<Bar dataKey="orders" fill="#FFC107" />
						</BarChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>

			{/* Top Products Table */}
			<Card>
				<CardHeader>
					<CardTitle>Top Performing Products</CardTitle>
					<CardDescription>Best selling products by units and revenue</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Product Name</TableHead>
								<TableHead>Units Sold</TableHead>
								<TableHead>Revenue</TableHead>
								<TableHead>Performance</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{topProducts.map((product, index) => (
								<TableRow key={product.name}>
									<TableCell className="font-medium">{product.name}</TableCell>
									<TableCell>{product.sales}</TableCell>
									<TableCell>LKR {product.revenue.toLocaleString()}</TableCell>
									<TableCell>
										<Badge variant={index < 2 ? 'default' : 'secondary'}>
											{index < 2 ? 'Excellent' : index < 4 ? 'Good' : 'Average'}
										</Badge>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
