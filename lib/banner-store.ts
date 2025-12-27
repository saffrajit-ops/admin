import { create } from "zustand"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://canagold-backend.onrender.com/api"

export interface Banner {
  _id: string
  title: string
  description?: string
  image: {
    url: string
    publicId?: string
  }
  type: "popup" | "footer" | "sidebar"
  link?: string
  linkText?: string
  pages: string[]
  categories?: string[]
  triggers?: {
    device?: {
      enabled: boolean
      types: string[]
    }
    behavior?: {
      enabled: boolean
      scrollPercentage?: number
      exitIntent?: boolean
      addToCart?: boolean
      searchKeywords?: string[]
    }
    userType?: {
      enabled: boolean
      types: string[]
    }
    inventory?: {
      enabled: boolean
      outOfStock?: boolean
      codAvailable?: boolean
      specificCategories?: string[]
    }
  }
  startDate: string
  endDate?: string
  isActive: boolean
  clickCount: number
  viewCount: number
  createdAt: string
  updatedAt: string
}

interface BannerState {
  banners: Banner[]
  isLoading: boolean
  error: string | null
  fetchBanners: (token: string, page?: number, type?: string) => Promise<void>
  createBanner: (data: Partial<Banner>, token: string) => Promise<void>
  updateBanner: (id: string, data: Partial<Banner>, token: string) => Promise<void>
  deleteBanner: (id: string, token: string) => Promise<void>
  toggleBannerStatus: (id: string, isActive: boolean, token: string) => Promise<void>
}

export const useBannerStore = create<BannerState>((set) => ({
  banners: [],
  isLoading: false,
  error: null,

  fetchBanners: async (token: string, page = 1, type?: string) => {
    set({ isLoading: true, error: null })
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "50" })
      if (type) params.append("type", type)

      const response = await fetch(`${API_BASE}/banners?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch banners")

      const data = await response.json()
      set({ banners: data.data, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  createBanner: async (bannerData: Partial<Banner>, token: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/banners`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bannerData),
      })

      if (!response.ok) throw new Error("Failed to create banner")

      const data = await response.json()
      set((state) => ({
        banners: [data.data, ...state.banners],
        isLoading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  updateBanner: async (id: string, bannerData: Partial<Banner>, token: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/banners/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bannerData),
      })

      if (!response.ok) throw new Error("Failed to update banner")

      const data = await response.json()
      set((state) => ({
        banners: state.banners.map((b) => (b._id === id ? data.data : b)),
        isLoading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  deleteBanner: async (id: string, token: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/banners/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to delete banner")

      set((state) => ({
        banners: state.banners.filter((b) => b._id !== id),
        isLoading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  toggleBannerStatus: async (id: string, isActive: boolean, token: string) => {
    try {
      const response = await fetch(`${API_BASE}/banners/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
      })

      if (!response.ok) throw new Error("Failed to toggle banner status")

      const data = await response.json()
      set((state) => ({
        banners: state.banners.map((b) => (b._id === id ? data.data : b)),
      }))
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },
}))
