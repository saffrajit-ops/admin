import { create } from "zustand"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://canagold-backend.onrender.com/api"

export interface OrderItem {
  product: {
    _id: string
    title: string
    sku: string
    price: number
    images?: Array<{ url: string; altText: string }>
  } | null
  title: string
  price: number
  quantity: number
  subtotal: number
}

export interface Order {
  _id: string
  orderNumber: string
  user?: {
    _id: string
    name: string
    email: string
    phone?: string
  }
  items: OrderItem[]
  currency: string
  subtotal: number
  total: number
  discount?: number
  shippingCharges?: number
  coupon?: {
    code: string
    type: "flat" | "percent"
    value: number
    discount: number
  }
  payment: {
    method: string
    sessionId?: string
    paymentIntentId?: string
    status: "pending" | "completed" | "failed"
    paidAt?: string
    failedAt?: string
    failureReason?: string
  }
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "returned" | "refunded" | "failed"
  confirmedAt?: string
  processing?: {
    startedAt: string
    notes?: string
  }
  shipping?: {
    shippedAt: string
    trackingNumber?: string
    notes?: string
  }
  delivery?: {
    deliveredAt: string
    notes?: string
  }
  cancellation?: {
    reason: string
    cancelledAt: string
    cancelledBy: string
  }
  return?: {
    status: "requested" | "approved" | "rejected" | "completed"
    reason: string
    requestedAt: string
    approvedAt?: string
    rejectedAt?: string
    refundAmount?: number
    notes?: string
  }
  refunds?: Array<{
    amount: number
    reason: string
    method: string
    processedAt: string
    status: "pending" | "completed" | "failed"
  }>
  shippingAddress?: {
    label?: string
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
    country: string
  }
  createdAt: string
  updatedAt: string
}

interface OrderStats {
  period: string
  stats: {
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    pendingOrders: number
    confirmedOrders: number
    processingOrders: number
    shippedOrders: number
    deliveredOrders: number
    cancelledOrders: number
    failedOrders: number
  }
}

interface OrderState {
  orders: Order[]
  stats: OrderStats | null
  isLoading: boolean
  error: string | null
  fetchOrders: (token: string, page?: number, limit?: number, status?: string) => Promise<void>
  fetchOrderById: (id: string, token: string) => Promise<Order | null>
  fetchOrderStats: (token: string, period?: string) => Promise<void>
  updateOrderStatus: (id: string, status: string, notes?: string, trackingNumber?: string, token?: string) => Promise<void>
  handleReturnRequest: (id: string, action: "approve" | "reject", notes?: string, refundAmount?: number, token?: string) => Promise<void>
  processRefund: (id: string, amount: number, reason: string, method?: string, token?: string) => Promise<void>
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchOrders: async (token: string, page = 1, limit = 100, status?: string) => {
    set({ isLoading: true, error: null })
    try {
      let url = `${API_BASE}/orders/admin/orders?page=${page}&limit=${limit}&sort=-createdAt`
      if (status) url += `&status=${status}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch orders")
      }
      const data = await response.json()
      set({ orders: data.data || [], isLoading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch orders"
      set({ error: errorMessage, isLoading: false })
    }
  },

  fetchOrderById: async (id: string, token: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/orders/admin/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch order")
      }
      const data = await response.json()
      set({ isLoading: false })
      return data.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch order"
      set({ error: errorMessage, isLoading: false })
      return null
    }
  },

  fetchOrderStats: async (token: string, period = "30d") => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/orders/admin/stats?period=${period}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch order stats")
      }
      const data = await response.json()
      set({ stats: data.data, isLoading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch order stats"
      set({ error: errorMessage, isLoading: false })
    }
  },

  updateOrderStatus: async (id: string, status: string, notes?: string, trackingNumber?: string, token?: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/orders/admin/orders/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, notes, trackingNumber }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update order status")
      }
      const data = await response.json()

      set((state) => ({
        orders: state.orders.map((o) => (o._id === id ? data.data : o)),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update order status"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  handleReturnRequest: async (id: string, action: "approve" | "reject", notes?: string, refundAmount?: number, token?: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/orders/admin/orders/${id}/return`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, notes, refundAmount }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to handle return request")
      }
      const data = await response.json()

      set((state) => ({
        orders: state.orders.map((o) => (o._id === id ? data.data : o)),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to handle return request"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  processRefund: async (id: string, amount: number, reason: string, method = "stripe", token?: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/orders/admin/orders/${id}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, reason, method }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to process refund")
      }
      const data = await response.json()

      set((state) => ({
        orders: state.orders.map((o) => (o._id === id ? data.data : o)),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process refund"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
}))
