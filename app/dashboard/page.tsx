"use client"

import { useEffect, useState, useMemo } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { useProductStore } from "@/lib/product-store"
import { useOrderStore } from "@/lib/order-store"
import { useBlogStore } from "@/lib/blog-store"
import { useCouponStore } from "@/lib/coupon-store"
import { useDashboardStore } from "@/lib/dashboard-store"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

export default function DashboardPage() {
  const { user, accessToken, checkAuth } = useAuthStore()
  const { products, fetchProducts } = useProductStore()
  const { orders, stats, fetchOrders, fetchOrderStats } = useOrderStore()
  const { posts, fetchPosts } = useBlogStore()
  const { coupons, fetchCoupons } = useCouponStore()
  const { stats: dashboardStats, recentUsers, fetchDashboardStats } = useDashboardStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (mounted && !user) {
      router.push("/login")
    }
  }, [mounted, user, router])

  useEffect(() => {
    const loadDashboardData = async () => {
      if (accessToken) {
        setLoading(true)
        try {
          await Promise.all([
            fetchProducts(accessToken),
            fetchOrders(accessToken),
            fetchOrderStats(accessToken, "30d"),
            fetchPosts(accessToken),
            fetchCoupons(accessToken),
            fetchDashboardStats(accessToken),
          ])
        } catch (error) {
          console.error("Error loading dashboard data:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    if (mounted && accessToken) {
      loadDashboardData()
    }
  }, [mounted, accessToken, fetchProducts, fetchOrders, fetchOrderStats, fetchPosts, fetchCoupons, fetchDashboardStats])

  // Helper function to calculate time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return "1 day ago"
    return `${diffDays} days ago`
  }

  // Calculate dynamic stats
  const totalProducts = products.length
  const outOfStockProducts = products.filter(p => p.stock === 0).length
  const totalSales = stats?.stats?.totalRevenue || 0
  const totalBlogPosts = posts.length
  const activeCoupons = coupons.filter(c => c.isActive).length

  // Generate chart data from last 5 months of orders
  const dashboardData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const last5Months = []
    const now = new Date()

    for (let i = 4; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = monthNames[date.getMonth()]

      // Calculate sales for this month
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate.getMonth() === date.getMonth() &&
          orderDate.getFullYear() === date.getFullYear()
      })

      const sales = monthOrders.reduce((sum, order) => sum + order.total, 0)
      const productCount = monthOrders.reduce((sum, order) => sum + order.items.length, 0)

      last5Months.push({
        month: monthName,
        sales: Math.round(sales),
        products: productCount
      })
    }

    return last5Months
  }, [orders])

  // Generate recent updates from actual data
  const recentUpdates = useMemo(() => {
    const updates: Array<{ id: string; title: string; time: string; type: string }> = []

    // Add recent product (only 1)
    const recentProducts = [...products]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 1)

    recentProducts.forEach(product => {
      const timeAgo = getTimeAgo(product.createdAt)
      updates.push({
        id: product._id,
        title: `Product: ${product.title}`,
        time: timeAgo,
        type: "product"
      })
    })

    // Add recent blog post
    const recentPosts = [...posts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 1)

    recentPosts.forEach(post => {
      const timeAgo = getTimeAgo(post.createdAt)
      updates.push({
        id: post._id,
        title: `Blog: ${post.title}`,
        time: timeAgo,
        type: "blog"
      })
    })

    // Add recent coupon
    const recentCoupons = [...coupons]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 1)

    recentCoupons.forEach(coupon => {
      const timeAgo = getTimeAgo(coupon.createdAt)
      updates.push({
        id: coupon._id,
        title: `Coupon: ${coupon.code}`,
        time: timeAgo,
        type: "coupon"
      })
    })

    // Add recent order
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 1)

    recentOrders.forEach(order => {
      const timeAgo = getTimeAgo(order.createdAt)
      updates.push({
        id: order._id,
        title: `Order #${order.orderNumber}`,
        time: timeAgo,
        type: "order"
      })
    })

    // Limit to 4 most recent updates
    return updates.slice(0, 4)
  }, [products, posts, coupons, orders, getTimeAgo])

  if (!mounted || !user) return null

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-48 mt-2" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="border-2 rounded-2xl">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="border-2 rounded-2xl">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Updates Skeleton */}
        <Card className="border-2 rounded-2xl">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Welcome back, {user?.name || user?.email}</h2>
        <p className="text-muted-foreground">Here's your dashboard overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalUsers.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.activeUsers || 0} active • {dashboardStats?.inactiveUsers || 0} inactive
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admin Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.adminUsers.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {((dashboardStats?.adminUsers || 0) / (dashboardStats?.totalUsers || 1) * 100).toFixed(1)}% of total users
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {products.filter(p => p.isActive).length} active • {outOfStockProducts} out of stock
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.stats?.totalOrders || 0} orders
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {orders.filter(o => o.status === 'pending').length} pending • {orders.filter(o => o.status === 'delivered').length} delivered
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blog Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBlogPosts}</div>
            <p className="text-xs text-muted-foreground">
              {posts.filter(p => p.isPublished).length} published • {posts.filter(p => !p.isPublished).length} drafts
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCoupons}</div>
            <p className="text-xs text-muted-foreground">
              {coupons.length} total • {coupons.filter(c => !c.isActive).length} inactive
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${orders.length > 0 ? (totalSales / orders.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per order average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 rounded-2xl">
          <CardHeader>
            <CardTitle>Sales & Products</CardTitle>
            <CardDescription>Monthly trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="hsl(var(--primary))" />
                <Bar dataKey="products" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Last 5 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Updates and Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 rounded-2xl">
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
            <CardDescription>Latest activity on your store</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUpdates.length > 0 ? (
                recentUpdates.map((update) => (
                  <div
                    key={update.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{update.title}</p>
                      <p className="text-sm text-muted-foreground">{update.time}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {update.type}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent updates</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl">
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {getTimeAgo(user.createdAt)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent users</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
