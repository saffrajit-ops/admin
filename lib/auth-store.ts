import { create } from "zustand"
import { persist } from "zustand/middleware"
import { apiClient, setLogoutHandler } from "./api-client"

interface AuthUser {
  _id: string
  email: string
  name: string
  role: string
  phone?: string
  profileImage?: {
    url: string
    publicId: string
  }
  isActive: boolean
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: AuthUser | null) => void
  checkAuth: () => Promise<void>
  updateProfile: (data: { name: string; phone?: string }) => Promise<AuthUser>
  uploadProfileImage: (file: File) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

// Helper function to decode JWT and check expiration
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expirationTime = payload.exp * 1000 // Convert to milliseconds
    return Date.now() >= expirationTime
  } catch (error) {
    console.error('Error decoding token:', error)
    return true // Treat invalid tokens as expired
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.request<{
            success: boolean
            message: string
            data: {
              user: AuthUser
              token: string
            }
          }>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          })

          // Check if user is admin
          if (response.data.user.role !== "admin") {
            set({ error: "Access denied. Admin privileges required.", isLoading: false })
            throw new Error("Access denied. Admin privileges required.")
          }

          set({
            user: response.data.user,
            accessToken: response.data.token,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Login failed"
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      logout: async () => {
        const { accessToken } = get()
        try {
          if (accessToken) {
            await apiClient.request("/auth/logout", {
              method: "POST",
              token: accessToken,
            })
          }
        } catch (error) {
          console.error("Logout error:", error)
        } finally {
          set({ user: null, accessToken: null, error: null })
          // Redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
      },

      setUser: (user) => {
        set({ user })
      },

      checkAuth: async () => {
        const { accessToken, logout } = get()
        
        // Check if token exists
        if (!accessToken) {
          console.warn("No access token found")
          return
        }

        // Check if token is expired
        if (isTokenExpired(accessToken)) {
          console.warn("Token expired, logging out")
          await logout()
          return
        }

        try {
          const response = await apiClient.request<{
            success: boolean
            data: { user: AuthUser }
          }>("/auth/me", {
            token: accessToken,
          })

          if (response.data.user.role !== "admin") {
            console.warn("User is not an admin, logging out")
            await logout()
            return
          }

          set({ user: response.data.user })
        } catch (error) {
          console.error("Auth check failed, logging out")
          await logout()
        }
      },

      updateProfile: async (data: { name: string; phone?: string }) => {
        const { accessToken } = get()
        if (!accessToken) throw new Error("Not authenticated")

        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.request<{
            success: boolean
            message: string
            data: { user: AuthUser }
          }>("/users/profile", {
            method: "PUT",
            body: JSON.stringify(data),
            token: accessToken,
          })

          set({
            user: response.data.user,
            isLoading: false,
            error: null,
          })

          return response.data.user
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Profile update failed"
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      uploadProfileImage: async (file: File) => {
        const { accessToken } = get()
        if (!accessToken) throw new Error("Not authenticated")

        set({ isLoading: true, error: null })
        try {
          const formData = new FormData()
          formData.append("image", file)

          const response = await apiClient.request<{
            success: boolean
            message: string
            data: { profileImage: { url: string; publicId: string } }
          }>("/users/profile/image", {
            method: "POST",
            body: formData,
            token: accessToken,
          })

          // Update user with new profile image
          const currentUser = get().user
          if (currentUser) {
            set({
              user: { ...currentUser, profileImage: response.data.profileImage },
              isLoading: false,
              error: null,
            })
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Image upload failed"
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        const { accessToken } = get()
        if (!accessToken) throw new Error("Not authenticated")

        set({ isLoading: true, error: null })
        try {
          await apiClient.request<{
            success: boolean
            message: string
          }>("/users/profile/change-password", {
            method: "PUT",
            body: JSON.stringify({ currentPassword, newPassword }),
            token: accessToken,
          })

          set({ isLoading: false, error: null })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Password change failed"
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },
    }),
    {
      name: "auth-store",
    },
  ),
)

// Register logout handler with API client
if (typeof window !== 'undefined') {
  setLogoutHandler(() => {
    useAuthStore.getState().logout()
  })
}
