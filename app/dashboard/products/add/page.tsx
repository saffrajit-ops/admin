"use client"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useProductStore } from "@/lib/product-store"
import { ProductForm } from "@/components/products/product-form"
import { toast } from "sonner"

export default function AddProductPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { addProduct, isLoading } = useProductStore()

  const handleSubmit = async (formData: FormData) => {
    if (!accessToken) {
      toast.error("Authentication required", {
        description: "Please log in to add products",
      })
      return
    }

    try {
      await addProduct(formData, accessToken)
      toast.success("Success", {
        description: "Product created successfully",
      })
      router.push("/dashboard/products")
    } catch (error) {
      // Re-throw error so form component can handle it with toast
      throw error
    }
  }

  const handleCancel = () => {
    router.push("/dashboard/products")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
