"use client"

import { useEffect, useState, useMemo } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { useOrderStore, Order } from "@/lib/order-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Package, Eye, Search, Truck, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { ExpandableOrderCard } from "@/components/orders/expandable-order-card"
import { useNotifications } from "@/hooks/useNotifications"
import { NotificationDot } from "@/components/notifications/notification-badge"

const ITEMS_PER_PAGE = 10

export default function OrdersPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { orders, isLoading, fetchOrders, updateOrderStatus } = useOrderStore()
  const { newOrders } = useNotifications()

  // Separate search for each tab
  const [searchAll, setSearchAll] = useState("")
  const [searchConfirmed, setSearchConfirmed] = useState("")
  const [searchProcessing, setSearchProcessing] = useState("")
  const [searchShipped, setSearchShipped] = useState("")
  const [searchDelivered, setSearchDelivered] = useState("")

  const [currentTab, setCurrentTab] = useState("all")

  // Separate pagination for each tab
  const [pageAll, setPageAll] = useState(1)
  const [pageConfirmed, setPageConfirmed] = useState(1)
  const [pageProcessing, setPageProcessing] = useState(1)
  const [pageShipped, setPageShipped] = useState(1)
  const [pageDelivered, setPageDelivered] = useState(1)

  useEffect(() => {
    if (accessToken) {
      fetchOrders(accessToken)
    }
  }, [accessToken, fetchOrders])

  // Filter orders: exclude cancelled, returned, refunded, failed, and approved returns
  const activeOrders = useMemo(() => {
    return orders.filter((order) => {
      // Exclude cancelled, returned, refunded, failed
      const excludedStatuses = ['cancelled', 'returned', 'refunded', 'failed']
      if (excludedStatuses.includes(order.status)) {
        return false
      }

      // Exclude orders with approved return requests
      if (order.return?.status === 'approved') {
        return false
      }

      return true
    })
  }, [orders])

  // Calculate stats
  const stats = useMemo(() => {
    const confirmed = activeOrders.filter(o => o.status === 'confirmed').length
    const processing = activeOrders.filter(o => o.status === 'processing').length
    const shipped = activeOrders.filter(o => o.status === 'shipped').length
    const delivered = activeOrders.filter(o => o.status === 'delivered').length

    return {
      total: activeOrders.length,
      confirmed,
      processing,
      shipped,
      delivered
    }
  }, [activeOrders])

  // Filter orders based on tab and search
  const getFilteredOrders = (tab: string, searchQuery: string) => {
    let filtered = activeOrders

    // Filter by tab
    if (tab === 'confirmed') {
      filtered = filtered.filter(order => order.status === 'confirmed')
    } else if (tab === 'processing') {
      filtered = filtered.filter(order => order.status === 'processing')
    } else if (tab === 'shipped') {
      filtered = filtered.filter(order => order.status === 'shipped')
    } else if (tab === 'delivered') {
      filtered = filtered.filter(order => order.status === 'delivered')
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.user?.name?.toLowerCase().includes(query) ||
        order.user?.email?.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  // Get filtered orders for each tab
  const allOrders = useMemo(() => getFilteredOrders('all', searchAll), [activeOrders, searchAll])
  const confirmedOrders = useMemo(() => getFilteredOrders('confirmed', searchConfirmed), [activeOrders, searchConfirmed])
  const processingOrders = useMemo(() => getFilteredOrders('processing', searchProcessing), [activeOrders, searchProcessing])
  const shippedOrders = useMemo(() => getFilteredOrders('shipped', searchShipped), [activeOrders, searchShipped])
  const deliveredOrders = useMemo(() => getFilteredOrders('delivered', searchDelivered), [activeOrders, searchDelivered])

  // Pagination for each tab
  const getPaginatedOrders = (filteredOrders: Order[], page: number) => {
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
    const paginatedOrders = filteredOrders.slice(
      (page - 1) * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE
    )
    return { paginatedOrders, totalPages }
  }

  const handleQuickStatusChange = async (orderId: string, newStatus: string) => {
    if (!accessToken) return

    // For COD orders, check payment status before allowing delivery
    const order = activeOrders.find(o => o._id === orderId)
    if (order && newStatus === 'delivered' && order.payment.method === 'cod' && order.payment.status !== 'completed') {
      toast.error('Cannot deliver COD order', {
        description: 'Please confirm payment first before marking as delivered',
      })
      return
    }

    toast.warning("Update Order Status", {
      description: `Are you sure you want to change the status to ${newStatus}?`,
      action: {
        label: "Confirm",
        onClick: async () => {
          try {
            await updateOrderStatus(orderId, newStatus, undefined, undefined, accessToken)
            toast.success("Success", {
              description: "Order status updated successfully",
            })
            fetchOrders(accessToken)
          } catch (error) {
            toast.error("Error", {
              description: error instanceof Error ? error.message : "Failed to update order status",
            })
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => { },
      },
    })
  }

  const handleQuickPaymentStatusChange = async (orderId: string, newStatus: string) => {
    if (!accessToken) return

    toast.warning("Update Payment Status", {
      description: `Are you sure you want to change the payment status to ${newStatus}?`,
      action: {
        label: "Confirm",
        onClick: async () => {
          try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
            const response = await fetch(`${API_URL}/orders/admin/orders/${orderId}/payment-status`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ status: newStatus }),
            })

            if (!response.ok) {
              throw new Error('Failed to update payment status')
            }

            await fetchOrders(accessToken)
            toast.success("Success", {
              description: "Payment status updated successfully",
            })
          } catch (error) {
            toast.error("Error", {
              description: error instanceof Error ? error.message : "Failed to update payment status",
            })
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => { },
      },
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      processing: "bg-purple-500",
      shipped: "bg-indigo-500",
      delivered: "bg-green-500",
    }
    return colors[status] || "bg-gray-500"
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      completed: "bg-green-500",
      failed: "bg-red-500",
    }
    return colors[status] || "bg-gray-500"
  }

  const renderOrderCard = (order: Order) => {
    const isCOD = order.payment.method === 'cod'
    const isShipped = order.status === 'shipped'
    const paymentNotConfirmed = order.payment.status !== 'completed'
    const cannotDeliver = isCOD && isShipped && paymentNotConfirmed

    return (
      <ExpandableOrderCard
        key={order._id}
        orderNumber={order.orderNumber}
        date={order.createdAt}
        customer={{
          name: order.user?.name || 'N/A',
          email: order.user?.email || 'N/A'
        }}
        status={
          <Badge className={`${getStatusColor(order.status)} text-white`}>
            {order.status.toUpperCase()}
          </Badge>
        }
        paymentStatus={
          <>
            <Badge className={`${getPaymentStatusColor(order.payment.status)} text-white`}>
              {order.payment.status.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="capitalize ml-2">
              {order.payment.method}
            </Badge>
          </>
        }
        total={order.total}
        actions={
          <>
            <div className="flex gap-2">
              {/* Status Actions */}
              {order.status === 'confirmed' && (
                <Button
                  size="sm"
                  onClick={() => handleQuickStatusChange(order._id, 'processing')}
                  className="cursor-pointer"
                >
                  Start Processing
                </Button>
              )}
              {order.status === 'processing' && (
                <Button
                  size="sm"
                  onClick={() => handleQuickStatusChange(order._id, 'shipped')}
                  className="cursor-pointer"
                >
                  Mark as Shipped
                </Button>
              )}
              {order.status === 'shipped' && (
                <>
                  {isCOD && paymentNotConfirmed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickPaymentStatusChange(order._id, 'completed')}
                      className="cursor-pointer"
                    >
                      Confirm Payment
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleQuickStatusChange(order._id, 'delivered')}
                    disabled={cannotDeliver}
                    className="cursor-pointer"
                  >
                    Mark as Delivered
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/orders/${order._id}`)}
              className="gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              View Details
            </Button>
          </>
        }
      >
        {/* Order Items */}
        <div>
          <p className="text-sm font-medium mb-2">Order Items:</p>
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 shrink-0">
                  {item.product?.images?.[0] ? (
                    <Image
                      src={item.product.images[0].url}
                      alt={item.title}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground">
                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                  </p>
                </div>
                <p className="font-medium">${item.subtotal.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Info */}
        {order.shipping?.trackingNumber && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Tracking Number</p>
            <p className="text-sm font-mono text-blue-700">{order.shipping.trackingNumber}</p>
          </div>
        )}

        {/* COD Payment Warning */}
        {cannotDeliver && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-medium text-yellow-900">⚠️ COD Payment Required</p>
            <p className="text-xs text-yellow-700">
              Please confirm payment before marking as delivered
            </p>
          </div>
        )}

        {/* Order Total */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          {order.discount && order.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-green-600">-${order.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold pt-2 border-t">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      </ExpandableOrderCard>
    )
  }

  const renderTabContent = (
    filteredOrders: Order[],
    page: number,
    setPage: (page: number) => void,
    searchValue: string,
    setSearchValue: (value: string) => void
  ) => {
    const { paginatedOrders, totalPages } = getPaginatedOrders(filteredOrders, page)

    return (
      <div className="space-y-4">
        {/* Search for this tab */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number, customer name, or email..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
        </Card>

        {paginatedOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-sm text-muted-foreground">
                {searchValue ? 'Try adjusting your search' : 'No orders in this category'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4">
              {paginatedOrders.map(renderOrderCard)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                    {Math.min(page * ITEMS_PER_PAGE, filteredOrders.length)} of{' '}
                    {filteredOrders.length} orders
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="cursor-pointer"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (page <= 3) {
                          pageNum = i + 1
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = page - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="cursor-pointer"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders Management</h1>
          <p className="text-muted-foreground">Manage and track customer orders</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {activeOrders.length} {activeOrders.length === 1 ? 'Order' : 'Orders'}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Active orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">Being prepared</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
            <Truck className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shipped}</div>
            <p className="text-xs text-muted-foreground">In transit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="cursor-pointer">
            All ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="cursor-pointer">
            <span className="flex items-center gap-2">
              Confirmed ({stats.confirmed})
              <NotificationDot show={newOrders > 0} />
            </span>
          </TabsTrigger>
          <TabsTrigger value="processing" className="cursor-pointer">
            Processing ({stats.processing})
          </TabsTrigger>
          <TabsTrigger value="shipped" className="cursor-pointer">
            Shipped ({stats.shipped})
          </TabsTrigger>
          <TabsTrigger value="delivered" className="cursor-pointer">
            Delivered ({stats.delivered})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderTabContent(allOrders, pageAll, setPageAll, searchAll, setSearchAll)}
        </TabsContent>

        <TabsContent value="confirmed">
          {renderTabContent(confirmedOrders, pageConfirmed, setPageConfirmed, searchConfirmed, setSearchConfirmed)}
        </TabsContent>

        <TabsContent value="processing">
          {renderTabContent(processingOrders, pageProcessing, setPageProcessing, searchProcessing, setSearchProcessing)}
        </TabsContent>

        <TabsContent value="shipped">
          {renderTabContent(shippedOrders, pageShipped, setPageShipped, searchShipped, setSearchShipped)}
        </TabsContent>

        <TabsContent value="delivered">
          {renderTabContent(deliveredOrders, pageDelivered, setPageDelivered, searchDelivered, setSearchDelivered)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
