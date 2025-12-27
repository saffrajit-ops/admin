"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useCouponStore, Coupon } from "@/lib/coupon-store"
import { CouponForm } from "@/components/coupons/coupon-form"
import { toast } from "sonner"

export default function EditCouponPage() {
  const params = useParams()
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { coupons, fetchCoupons, updateCoupon, isLoading } = useCouponStore()
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCoupon = async () => {
      if (!accessToken) {
        toast.error("Error", {
          description: "Authentication required",
        })
        router.push("/dashboard/coupons")
        return
      }

      try {
        // Fetch coupons if not already loaded
        if (coupons.length === 0) {
          await fetchCoupons(accessToken)
        }
        
        // Find the coupon
        const foundCoupon = coupons.find(c => c._id === params.id)
        if (foundCoupon) {
          setCoupon(foundCoupon)
        } else {
          throw new Error("Coupon not found")
        }
      } catch (error) {
        toast.error("Error", {
          description: error instanceof Error ? error.message : "Failed to load coupon",
        })
        router.push("/dashboard/coupons")
      } finally {
        setLoading(false)
      }
    }

    loadCoupon()
  }, [params.id, accessToken, coupons, fetchCoupons, router])

  const handleSubmit = async (data: any) => {
    if (!accessToken || !coupon) {
      toast.error("Authentication required", {
        description: "Please log in to update coupons",
      })
      return
    }

    try {
      await updateCoupon(coupon._id, data, accessToken)
      toast.success("Success", {
        description: "Coupon updated successfully",
      })
      router.push("/dashboard/coupons")
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to update coupon",
      })
      throw error
    }
  }

  const handleCancel = () => {
    router.push("/dashboard/coupons")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading coupon...</p>
      </div>
    )
  }

  if (!coupon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Coupon not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CouponForm
          coupon={coupon}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
