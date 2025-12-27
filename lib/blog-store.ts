import { create } from "zustand"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://canagold-backend.onrender.com/api"

interface TaxonomyRef {
  _id: string
  name: string
  slug: string
  type: string
}

export interface BlogPost {
  _id: string
  title: string
  slug: string
  excerpt?: string
  body: string
  author: string
  // Backend uses these field names (can be IDs or populated objects)
  category?: string | TaxonomyRef
  subcategory?: string | TaxonomyRef
  categories?: (string | TaxonomyRef)[]
  subcategories?: (string | TaxonomyRef)[]
  tags?: string[]
  coverImage?: {
    url: string
    publicId?: string
    alt?: string
  }
  isPublished: boolean
  publishedAt?: string
  viewCount?: number
  commentCount?: number
  readingTime?: number
  meta?: {
    title?: string
    description?: string
    keywords?: string[]
    canonicalUrl?: string
  }
  createdAt: string
  updatedAt: string
}

export interface BulkUploadResult {
  success: Array<{
    row: number
    postId: string
    title: string
    slug: string
    category?: string
    isPublished: boolean
  }>
  failed: Array<{
    row: number
    title: string
    error: string
  }>
  total: number
}

interface BlogState {
  posts: BlogPost[]
  isLoading: boolean
  error: string | null
  fetchPosts: (token: string, page?: number) => Promise<void>
  fetchPostById: (id: string, token: string) => Promise<BlogPost | null>
  addPost: (data: FormData, token: string) => Promise<void>
  updatePost: (id: string, data: FormData, token: string) => Promise<void>
  togglePublishStatus: (id: string, isPublished: boolean, token: string) => Promise<void>
  deletePost: (id: string, token: string) => Promise<void>
  uploadImage: (file: File) => Promise<string>
  bulkUploadPosts: (file: File, token: string, onProgress?: (progress: number) => void) => Promise<BulkUploadResult>
}

export const useBlogStore = create<BlogState>((set) => ({
  posts: [],
  isLoading: false,
  error: null,

  fetchPosts: async (token: string, page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/admin/blog?page=${page}&limit=10000&sort=-createdAt`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch blog posts")
      const data = await response.json()
      set({ posts: data.data?.blogPosts || [], isLoading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch blog posts"
      set({ error: errorMessage, isLoading: false })
    }
  },

  fetchPostById: async (id: string, token: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/admin/blog/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch blog post")
      }

      const data = await response.json()
      set({ isLoading: false })
      return data.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch blog post"
      set({ error: errorMessage, isLoading: false })
      return null
    }
  },

  addPost: async (data: FormData, token: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/admin/blog`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to add blog post")
      }

      set((state) => ({
        posts: [result.data, ...state.posts],
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add blog post"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  updatePost: async (id: string, data: FormData, token: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/admin/blog/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to update blog post")
      }

      set((state) => ({
        posts: state.posts.map((p) => (p._id === id ? result.data : p)),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update blog post"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  togglePublishStatus: async (id: string, isPublished: boolean, token: string) => {
    try {
      const response = await fetch(`${API_BASE}/admin/blog/${id}/publish`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublished }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to update publish status")
      }

      set((state) => ({
        posts: state.posts.map((p) => (p._id === id ? { ...p, isPublished } : p)),
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update publish status"
      set({ error: errorMessage })
      throw error
    }
  },

  deletePost: async (id: string, token: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/admin/blog/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete blog post")
      }

      set((state) => ({
        posts: state.posts.filter((p) => p._id !== id),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete blog post"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  uploadImage: async (file: File) => {
    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Image upload failed")
      }

      const data = await response.json()
      return data.data.url
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image"
      throw new Error(errorMessage)
    }
  },

  bulkUploadPosts: async (file: File, token: string, onProgress?: (progress: number) => void) => {
    set({ isLoading: true, error: null })
    
    try {
      const formData = new FormData()
      formData.append("file", file)

      // Create XMLHttpRequest for progress tracking
      return new Promise<BulkUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // Track upload progress
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable && onProgress) {
            const percentComplete = Math.round((e.loaded / e.total) * 100)
            onProgress(percentComplete)
          }
        })

        // Handle completion
        xhr.addEventListener("load", () => {
          set({ isLoading: false })
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              if (response.success) {
                resolve(response.data)
              } else {
                reject(new Error(response.message || "Bulk upload failed"))
              }
            } catch (error) {
              reject(new Error("Failed to parse response"))
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText)
              reject(new Error(errorResponse.message || "Bulk upload failed"))
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }
        })

        // Handle errors
        xhr.addEventListener("error", () => {
          set({ isLoading: false })
          reject(new Error("Network error during upload"))
        })

        xhr.addEventListener("abort", () => {
          set({ isLoading: false })
          reject(new Error("Upload cancelled"))
        })

        // Send request
        xhr.open("POST", `${API_BASE}/admin/blog/bulk-upload`)
        xhr.setRequestHeader("Authorization", `Bearer ${token}`)
        xhr.send(formData)
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload blog posts"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
}))
