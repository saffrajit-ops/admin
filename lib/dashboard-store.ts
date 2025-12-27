import { create } from "zustand"
import { apiClient } from "./api-client"

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  adminUsers: number
  inactiveUsers: number
}

interface RecentUser {
  _id: string
  name: string
  email: string
  createdAt: string
}

interface DashboardState {
  stats: DashboardStats | null
  recentUsers: RecentUser[]
  isLoading: boolean
  error: string | null
  fetchDashboardStats: (token: string) => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  recentUsers: [],
  isLoading: false,
  error: null,

  fetchDashboardStats: async (token: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.request<{
        success: boolean
        data: {
          stats: DashboardStats
          recentUsers: RecentUser[]
        }
      }>("/admin/dashboard", {
        token,
      })

      set({
        stats: response.data.stats,
        recentUsers: response.data.recentUsers,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch dashboard stats"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
}))
