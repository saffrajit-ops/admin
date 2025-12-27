"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useBlogStore, BlogPost } from "@/lib/blog-store"
import { BlogFormPage } from "@/components/blog/blog-form-page"
import { toast } from "sonner"

export default function EditBlogPageRoute() {
  const params = useParams()
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { fetchPostById, updatePost, isLoading } = useBlogStore()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPost = async () => {
      if (!accessToken) {
        toast.error("Error", {
          description: "Authentication required",
        })
        router.push("/dashboard/blog")
        return
      }

      try {
        const postData = await fetchPostById(params.id as string, accessToken)
        if (postData) {
          setPost(postData)
        } else {
          throw new Error("Blog post not found")
        }
      } catch (error) {
        toast.error("Error", {
          description: error instanceof Error ? error.message : "Failed to load blog post",
        })
        router.push("/dashboard/blog")
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [params.id, accessToken, fetchPostById, router])

  const handleSubmit = async (formData: FormData) => {
    if (!accessToken || !post) {
      toast.error("Authentication required", {
        description: "Please log in to update blog posts",
      })
      return
    }

    try {
      await updatePost(post._id, formData, accessToken)
      toast.success("Success", {
        description: "Blog post updated successfully",
      })
      router.push("/dashboard/blog")
    } catch (error) {
      // Re-throw error so form component can handle it with toast
      throw error
    }
  }

  const handleCancel = () => {
    router.push("/dashboard/blog")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Loading blog post...</p>
      </div>
    )
  }

  if (!post) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BlogFormPage
          post={post}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
