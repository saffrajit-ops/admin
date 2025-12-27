import { create } from "zustand"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://canagold-backend.onrender.com/api"

interface TaxonomyRef {
  _id: string
  name: string
  slug: string
  type: string
}

export interface Product {
  _id: string
  title: string
  slug: string
  packageVariants?: Array<{
    _id?: string
    weight: {
      value: number
      unit: string
    }
    sku: string
    price: number
    discount: {
      value: number
      type: 'percentage' | 'fixed'
    }
    stock: number
    isActive: boolean
    isDefault: boolean
  }>
  shipping?: {
    charges: number
    freeShippingThreshold: number
    freeShippingMinQuantity: number
  }
  cashOnDelivery?: {
    enabled: boolean
  }
  returnPolicy?: {
    returnable: boolean
    returnWindowDays: number
  }
  isActive: boolean
  isFeatured: boolean
  shortDescription: string
  description?: string
  images?: Array<{ url: string; altText: string }>
  videos?: Array<{ url: string; title?: string; thumbnail?: string; duration?: number }>
  // Backend uses these field names (can be IDs or populated objects)
  category?: string | TaxonomyRef
  subcategory?: string | TaxonomyRef
  categories?: (string | TaxonomyRef)[]
  subcategories?: (string | TaxonomyRef)[]
  // Frontend compatibility (deprecated, use above)
  concern?: (string | TaxonomyRef)[]
  collection?: string | (string | TaxonomyRef)[]
  createdAt: string
  updatedAt?: string
}

export interface BulkUploadResult {
  success: Array<{
    row: number
    productId: string
    title: string
    slug: string
    price: number
    stock: number
  }>
  failed: Array<{
    row: number
    title: string
    error: string
  }>
  total: number
}

interface ProductState {
  products: Product[]
  totalProducts: number
  totalPages: number
  isLoading: boolean
  error: string | null
  fetchProducts: (token: string, page?: number, limit?: number, filters?: { search?: string, status?: string, featured?: string }) => Promise<void>
  fetchProductById: (id: string, token: string) => Promise<Product | null>
  addProduct: (data: FormData, token: string) => Promise<void>
  updateProduct: (id: string, data: FormData, token: string) => Promise<void>
  deleteProduct: (id: string, token: string) => Promise<void>
  toggleProductStatus: (id: string, isActive: boolean, token: string) => Promise<void>
  toggleProductFeatured: (id: string, isFeatured: boolean, token: string) => Promise<void>
  bulkUploadProducts: (file: File, token: string, onProgress?: (progress: number) => void) => Promise<BulkUploadResult>
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  totalProducts: 0,
  totalPages: 0,
  isLoading: false,
  error: null,

  fetchProducts: async (token: string, page = 1, limit = 20, filters: { search?: string, status?: string, featured?: string } = {}) => {
    set({ isLoading: true, error: null })
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort: '-createdAt'
      });

      if (filters.search) queryParams.append('q', filters.search);
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.featured && filters.featured !== 'all') queryParams.append('featured', filters.featured === 'true' ? 'true' : 'false');

      const response = await fetch(`${API_BASE}/admin/products?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch products")
      }
      const data = await response.json()
      set({
        products: data.data?.products || [],
        totalProducts: data.data?.pagination?.totalProducts || 0,
        totalPages: data.data?.pagination?.totalPages || 0,
        isLoading: false
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch products"
      set({ error: errorMessage, isLoading: false })
    }
  },

  fetchProductById: async (id: string, token: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/admin/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch product")
      }

      const data = await response.json()
      set({ isLoading: false })
      return data.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch product"
      set({ error: errorMessage, isLoading: false })
      return null
    }
  },

  addProduct: async (data: FormData, token: string) => {
    set({ isLoading: true, error: null })
    try {
      console.log("Creating product with token:", token ? "Present" : "Missing")
      console.log("API URL:", `${API_BASE}/admin/products`)

      const response = await fetch(`${API_BASE}/admin/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - let browser set it with boundary for multipart/form-data
        },
        body: data,
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      let result
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
      } else {
        const text = await response.text()
        console.error("Non-JSON response:", text)
        throw new Error("Server returned non-JSON response")
      }

      console.log("Response data:", result)

      if (!response.ok) {
        const errorMsg = result.error || result.message || `Server error: ${response.status}`
        throw new Error(errorMsg)
      }

      if (!result.success) {
        const errorMsg = result.error || result.message || "Failed to add product"
        throw new Error(errorMsg)
      }

      set((state) => ({
        products: [result.data, ...state.products],
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add product"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  updateProduct: async (id: string, data: FormData, token: string) => {
    set({ isLoading: true, error: null })
    try {
      console.log("Updating product:", id)
      console.log("API URL:", `${API_BASE}/admin/products/${id}`)

      const response = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - let browser set it with boundary for multipart/form-data
        },
        body: data,
      })

      console.log("Update response status:", response.status)
      console.log("Update response headers:", Object.fromEntries(response.headers.entries()))

      let result
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
      } else {
        const text = await response.text()
        console.error("Non-JSON response:", text)
        throw new Error("Server returned non-JSON response")
      }

      console.log("Update response data:", result)

      if (!response.ok) {
        const errorMsg = result.error || result.message || `Server error: ${response.status}`
        throw new Error(errorMsg)
      }

      if (!result.success) {
        const errorMsg = result.error || result.message || "Failed to update product"
        throw new Error(errorMsg)
      }

      set((state) => ({
        products: state.products.map((p) => (p._id === id ? result.data : p)),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update product"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  deleteProduct: async (id: string, token: string) => {
    set({ isLoading: true, error: null })
    try {
      console.log("Deleting product:", id)

      const response = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Delete response status:", response.status)

      const result = await response.json()
      console.log("Delete response data:", result)

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete product")
      }

      set((state) => ({
        products: state.products.filter((p) => p._id !== id),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete product"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  toggleProductStatus: async (id: string, isActive: boolean, token: string) => {
    try {
      const formData = new FormData()
      formData.append("isActive", isActive.toString())

      const response = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update product status")
      }

      // Update the product in the local state
      set((state) => ({
        products: state.products.map((p) =>
          p._id === id ? { ...p, isActive } : p
        ),
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update product status"
      set({ error: errorMessage })
      throw error
    }
  },

  toggleProductFeatured: async (id: string, isFeatured: boolean, token: string) => {
    try {
      const formData = new FormData()
      formData.append("isFeatured", isFeatured.toString())

      const response = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update featured status")
      }

      // Update the product in the local state
      set((state) => ({
        products: state.products.map((p) =>
          p._id === id ? { ...p, isFeatured } : p
        ),
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update featured status"
      set({ error: errorMessage })
      throw error
    }
  },

  bulkUploadProducts: async (file: File, token: string, onProgress?: (progress: number) => void) => {
    set({ isLoading: true, error: null })
    try {
      const formData = new FormData()
      formData.append("file", file)

      const xhr = new XMLHttpRequest()

      return new Promise<BulkUploadResult>((resolve, reject) => {
        // Track upload progress
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = Math.round((e.loaded / e.total) * 100)
            onProgress(progress)
          }
        })

        xhr.addEventListener("load", () => {
          set({ isLoading: false })

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText)
              if (result.success) {
                resolve(result.data)
              } else {
                reject(new Error(result.message || "Failed to upload products"))
              }
            } catch (error) {
              reject(new Error("Invalid response from server"))
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText)
              reject(new Error(error.message || `Upload failed with status ${xhr.status}`))
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }
        })

        xhr.addEventListener("error", () => {
          set({ isLoading: false })
          reject(new Error("Network error occurred during upload"))
        })

        xhr.addEventListener("abort", () => {
          set({ isLoading: false })
          reject(new Error("Upload cancelled"))
        })

        xhr.open("POST", `${API_BASE}/admin/products/bulk-upload`)
        xhr.setRequestHeader("Authorization", `Bearer ${token}`)
        xhr.send(formData)
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload products"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
}))
