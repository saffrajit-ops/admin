"use client"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useCouponStore } from "@/lib/coupon-store"
import { CouponForm } from "@/components/coupons/coupon-form"
import { toast } from "sonner"

export default function AddCouponPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { addCoupon, isLoading } = useCouponStore()

  const handleSubmit = async (data: any) => {
    if (!accessToken) {
      toast.error("Authentication required", {
        description: "Please log in to add coupons",
      })
      return
    }

    try {
      await addCoupon(data, accessToken)
      toast.success("Success", {
        description: "Coupon created successfully",
      })
      router.push("/dashboard/coupons")
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to create coupon",
      })
      throw error
    }
  }

  const handleCancel = () => {
    router.push("/dashboard/coupons")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CouponForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
