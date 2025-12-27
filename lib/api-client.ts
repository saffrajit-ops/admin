const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://canagold-backend.onrender.com/api"

// Function to handle logout - will be set by auth store
let logoutHandler: (() => void) | null = null

export const setLogoutHandler = (handler: () => void) => {
  logoutHandler = handler
}

export const apiClient = {
  async request<T>(endpoint: string, options: RequestInit & { token?: string } = {}): Promise<T> {
    const { token, ...fetchOptions } = options
    const headers: Record<string, string> = {
      ...(fetchOptions.headers as Record<string, string> || {}),
    }

    // Only set Content-Type if body is not FormData
    if (!(fetchOptions.body instanceof FormData)) {
      headers["Content-Type"] = "application/json"
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      // If unauthorized (401) or forbidden (403), auto-logout
      if ((response.status === 401 || response.status === 403) && token) {
        console.warn("Authentication failed - logging out")
        if (logoutHandler) {
          logoutHandler()
        }
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
      throw new Error(data.message || `API Error: ${response.status}`)
    }

    return data
  },
}
