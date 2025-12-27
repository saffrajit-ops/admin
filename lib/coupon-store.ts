import { create } from "zustand"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://canagold-backend.onrender.com/api"

export interface Coupon {
  _id: string
  code: string
  type: "flat" | "percent"
  value: number
  minSubtotal?: number
  endsAt?: string
  usageLimit?: number
  usedCount?: number  // Changed from usageCount to match database field
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface CouponState {
  coupons: Coupon[]
  isLoading: boolean
  error: string | null
  fetchCoupons: (token: string, page?: number) => Promise<void>
  addCoupon: (data: Coupon, token: string) => Promise<void>
  updateCoupon: (id: string, data: Partial<Coupon>, token: string) => Promise<void>
  deleteCoupon: (id: string, token: string) => Promise<void>
}

export const useCouponStore = create<CouponState>((set) => ({
  coupons: [],
  isLoading: false,
  error: null,

  fetchCoupons: async (token: string, page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/admin/coupons?page=${page}&limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch coupons")
      const data = await response.json()
      set({ coupons: data.data?.coupons || data.data || [], isLoading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch coupons"
      set({ error: errorMessage, isLoading: false })
    }
  },

  addCoupon: async (data: Coupon, token: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/admin/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to add coupon")
      const result = await response.json()
      set((state) => ({
        coupons: [result.data, ...state.coupons],
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add coupon"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  updateCoupon: async (id: string, data: Partial<Coupon>, token: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/admin/coupons/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to update coupon")
      const result = await response.json()
      set((state) => ({
        coupons: state.coupons.map((c) => (c._id === id ? result.data : c)),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update coupon"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  deleteCoupon: async (id: string, token: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/admin/coupons/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to delete coupon")
      set((state) => ({
        coupons: state.coupons.filter((c) => c._id !== id),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete coupon"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
}))
