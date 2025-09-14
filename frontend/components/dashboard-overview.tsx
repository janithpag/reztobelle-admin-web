"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { DollarSign, ShoppingCart, AlertTriangle, Clock, TrendingUp, Package, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

// Sample data for demonstration
const salesData = [
  { date: "Jan 1", sales: 45000 },
  { date: "Jan 5", sales: 52000 },
  { date: "Jan 10", sales: 48000 },
  { date: "Jan 15", sales: 61000 },
  { date: "Jan 20", sales: 55000 },
  { date: "Jan 25", sales: 67000 },
  { date: "Jan 30", sales: 73000 },
]

const topProducts = [
  {
    id: 1,
    name: "Rose Gold Press-On Nails",
    sales: 156,
    revenue: 23400,
    image: "/rose-gold-press-on-nails.jpg",
  },
  {
    id: 2,
    name: "Diamond Stud Earrings",
    sales: 134,
    revenue: 20100,
    image: "/diamond-stud-earrings.jpg",
  },
  {
    id: 3,
    name: "Vintage Gold Rings",
    sales: 98,
    revenue: 14700,
    image: "/vintage-gold-rings.jpg",
  },
  {
    id: 4,
    name: "Pearl Drop Earrings",
    sales: 87,
    revenue: 13050,
    image: "/pearl-drop-earrings.png",
  },
]

const recentOrders = [
  {
    id: "#ORD-001",
    customer: "Sarah Johnson",
    product: "Rose Gold Press-On Nails",
    amount: 150,
    status: "completed",
    date: "2 hours ago",
  },
  {
    id: "#ORD-002",
    customer: "Emily Chen",
    product: "Diamond Stud Earrings",
    amount: 299,
    status: "processing",
    date: "4 hours ago",
  },
  {
    id: "#ORD-003",
    customer: "Maria Garcia",
    product: "Vintage Gold Rings",
    amount: 199,
    status: "shipped",
    date: "6 hours ago",
  },
  {
    id: "#ORD-004",
    customer: "Jessica Wong",
    product: "Pearl Drop Earrings",
    amount: 179,
    status: "pending",
    date: "8 hours ago",
  },
  {
    id: "#ORD-005",
    customer: "Amanda Smith",
    product: "Rose Gold Press-On Nails",
    amount: 150,
    status: "completed",
    date: "1 day ago",
  },
]

const lowStockItems = [
  { name: "Emerald Cut Rings", stock: 3, threshold: 10 },
  { name: "Silver Hoop Earrings", stock: 5, threshold: 15 },
  { name: "French Tip Nails", stock: 2, threshold: 8 },
]

export function DashboardOverview() {
  const totalSales = 245000
  const totalExpenses = 335500 // Sum of all expenses from expenses data
  const netProfit = totalSales - totalExpenses
  const profitMargin = ((netProfit / totalSales) * 100).toFixed(1)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-sidebar-foreground text-balance">Dashboard</h1>
          <p className="text-sm sm:text-base text-sidebar-foreground/70 font-medium">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-muted/50 text-sidebar-foreground font-medium text-xs sm:text-sm">
            Last updated: 2 min ago
          </Badge>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="hover:shadow-lg transition-shadow border-sidebar-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-semibold text-sidebar-foreground">Total Sales</CardTitle>
            <DollarSign className="h-3 w-3 text-sidebar-foreground/70" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-lg sm:text-xl font-bold text-sidebar-foreground">LKR 2,45,000</div>
            <div className="flex items-center text-xs text-sidebar-foreground/70 font-medium">
              <TrendingUp className="mr-1 h-2 w-2 text-green-500" />
              +12.5% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-sidebar-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-semibold text-sidebar-foreground">Total Expenses</CardTitle>
            <TrendingUp className="h-3 w-3 text-red-500" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-lg sm:text-xl font-bold text-red-600">LKR 3,35,500</div>
            <div className="flex items-center text-xs text-sidebar-foreground/70 font-medium">
              <TrendingUp className="mr-1 h-2 w-2 text-red-500" />
              Monthly expenses
            </div>
          </CardContent>
        </Card>

        <Card
          className={`hover:shadow-lg transition-shadow ${netProfit >= 0 ? "border-green-200 dark:border-green-800" : "border-red-200 dark:border-red-800"}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-semibold text-sidebar-foreground">Net Profit/Loss</CardTitle>
            <TrendingUp className={`h-3 w-3 ${netProfit >= 0 ? "text-green-500" : "text-red-500"}`} />
          </CardHeader>
          <CardContent className="pt-1">
            <div className={`text-lg sm:text-xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              LKR {Math.abs(netProfit).toLocaleString()}
            </div>
            <div
              className={`flex items-center text-xs font-medium ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              <TrendingUp className={`mr-1 h-2 w-2 ${netProfit >= 0 ? "text-green-500" : "text-red-500"}`} />
              {netProfit >= 0 ? "Profit" : "Loss"} ({profitMargin}% margin)
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-sidebar-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-semibold text-sidebar-foreground">Total Orders</CardTitle>
            <ShoppingCart className="h-3 w-3 text-sidebar-foreground/70" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-lg sm:text-xl font-bold text-sidebar-foreground">1,234</div>
            <div className="flex items-center text-xs text-sidebar-foreground/70 font-medium">
              <TrendingUp className="mr-1 h-2 w-2 text-green-500" />
              +8.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-sidebar-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-semibold text-sidebar-foreground">Low Stock Items</CardTitle>
            <AlertTriangle className="h-3 w-3 text-orange-500" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-lg sm:text-xl font-bold text-orange-600">3</div>
            <div className="flex items-center text-xs text-sidebar-foreground/70 font-medium">
              <AlertTriangle className="mr-1 h-2 w-2" />
              Requires immediate attention
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-semibold text-sidebar-foreground">Pending Orders</CardTitle>
            <Clock className="h-3 w-3 text-red-500" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-lg sm:text-xl font-bold text-red-600">23</div>
            <div className="flex items-center text-xs text-sidebar-foreground/70 font-medium">
              <Clock className="mr-1 h-2 w-2" />
              Awaiting processing
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables Row */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Sales Chart */}
        <Card className="border-sidebar-border">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-sidebar-foreground font-semibold">Sales Overview</CardTitle>
            <CardDescription className="text-sm text-sidebar-foreground/70 font-medium">
              Last 30 days sales performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ fill: "var(--primary)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card className="border-sidebar-border">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-sidebar-foreground font-semibold">
              Top Selling Products
            </CardTitle>
            <CardDescription className="text-sm text-sidebar-foreground/70 font-medium">
              Best performers this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-sidebar-foreground truncate">{product.name}</p>
                    <p className="text-xs text-sidebar-foreground/70 font-medium">{product.sales} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-sidebar-foreground">
                      LKR {product.revenue.toLocaleString()}
                    </p>
                    <Badge variant="secondary" className="text-xs bg-muted/50 text-sidebar-foreground">
                      #{index + 1}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders and Low Stock */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-3">
        {/* Recent Orders */}
        <Card className="xl:col-span-2 border-sidebar-border">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <CardTitle className="text-base sm:text-lg text-sidebar-foreground font-semibold">
                Recent Orders
              </CardTitle>
              <CardDescription className="text-sm text-sidebar-foreground/70 font-medium">
                Latest customer orders
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-sidebar-border text-sidebar-foreground hover:bg-muted/50 bg-transparent w-full sm:w-auto"
            >
              <Eye className="mr-2 h-4 w-4" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-sidebar-border">
                    <TableHead className="text-sidebar-foreground font-semibold text-xs sm:text-sm">Order ID</TableHead>
                    <TableHead className="text-sidebar-foreground font-semibold text-xs sm:text-sm">Customer</TableHead>
                    <TableHead className="text-sidebar-foreground font-semibold text-xs sm:text-sm hidden sm:table-cell">
                      Product
                    </TableHead>
                    <TableHead className="text-sidebar-foreground font-semibold text-xs sm:text-sm">Amount</TableHead>
                    <TableHead className="text-sidebar-foreground font-semibold text-xs sm:text-sm">Status</TableHead>
                    <TableHead className="text-sidebar-foreground font-semibold text-xs sm:text-sm hidden md:table-cell">
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} className="border-sidebar-border">
                      <TableCell className="font-semibold text-sidebar-foreground text-xs sm:text-sm">
                        {order.id}
                      </TableCell>
                      <TableCell className="text-sidebar-foreground font-medium text-xs sm:text-sm">
                        {order.customer}
                      </TableCell>
                      <TableCell className="max-w-[150px] sm:max-w-[200px] truncate text-sidebar-foreground font-medium text-xs sm:text-sm hidden sm:table-cell">
                        {order.product}
                      </TableCell>
                      <TableCell className="text-sidebar-foreground font-semibold text-xs sm:text-sm">
                        LKR {order.amount}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.status === "completed"
                              ? "default"
                              : order.status === "processing"
                                ? "secondary"
                                : order.status === "shipped"
                                  ? "outline"
                                  : "secondary"
                          }
                          className={cn(
                            "text-xs font-medium",
                            order.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : order.status === "processing"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : order.status === "shipped"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
                          )}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sidebar-foreground/70 font-medium text-xs sm:text-sm hidden md:table-cell">
                        {order.date}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600 font-semibold text-base sm:text-lg">
              <AlertTriangle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Low Stock Alert
            </CardTitle>
            <CardDescription className="text-sm text-sidebar-foreground/70 font-medium">
              Items requiring restocking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {lowStockItems.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-sidebar-foreground">{item.name}</span>
                    <Badge variant="destructive" className="text-xs font-medium">
                      {item.stock} left
                    </Badge>
                  </div>
                  <Progress value={(item.stock / item.threshold) * 100} className="h-2" />
                  <p className="text-xs text-sidebar-foreground/70 font-medium">Threshold: {item.threshold} units</p>
                </div>
              ))}
              <Button
                className="w-full mt-4 bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-muted/50"
                variant="outline"
              >
                <Package className="mr-2 h-4 w-4" />
                Restock Items
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
