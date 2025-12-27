"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useProductStore, Product } from "@/lib/product-store"
import { ProductForm } from "@/components/products/product-form"
import { toast } from "sonner"

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { fetchProductById, updateProduct, isLoading } = useProductStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProduct = async () => {
      if (!accessToken) {
        toast.error("Error", {
          description: "Authentication required",
        })
        router.push("/dashboard/products")
        return
      }

      try {
        const productData = await fetchProductById(params.id as string, accessToken)
        if (productData) {
          console.log("=== EDIT PAGE: Product Data ===")
          console.log("Full product:", productData)
          console.log("category:", productData.category)
          console.log("subcategory:", (productData as any).subcategory)
          console.log("concerns:", (productData as any).concerns)
          console.log("collections:", (productData as any).collections)
          console.log("categories (frontend):", productData.categories)
          console.log("concern (frontend):", productData.concern)
          console.log("collection (frontend):", productData.collection)
          setProduct(productData)
        } else {
          throw new Error("Product not found")
        }
      } catch (error) {
        toast.error("Error", {
          description: error instanceof Error ? error.message : "Failed to load product",
        })
        router.push("/dashboard/products")
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [params.id, accessToken, fetchProductById, router])

  const handleSubmit = async (formData: FormData) => {
    if (!accessToken || !product) {
      toast.error("Authentication required", {
        description: "Please log in to update products",
      })
      return
    }

    try {
      await updateProduct(product._id, formData, accessToken)
      toast.success("Success", {
        description: "Product updated successfully",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductForm
          product={product}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
