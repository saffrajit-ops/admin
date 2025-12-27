"use client"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useBlogStore } from "@/lib/blog-store"
import { BlogFormPage } from "@/components/blog/blog-form-page"
import { toast } from "sonner"

export default function AddBlogPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { addPost, isLoading } = useBlogStore()

  const handleSubmit = async (formData: FormData) => {
    if (!accessToken) {
      toast.error("Authentication required", {
        description: "Please log in to add blog posts",
      })
      return
    }

    try {
      await addPost(formData, accessToken)
      toast.success("Success", {
        description: "Blog post created successfully",
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BlogFormPage
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
