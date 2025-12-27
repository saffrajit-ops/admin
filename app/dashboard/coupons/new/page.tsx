"use client"

import type React from "react"

import { useState } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { useCouponStore } from "@/lib/coupon-store"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function NewCouponPage() {
  const { accessToken } = useAuthStore()
  const { addCoupon, isLoading } = useCouponStore()
  const router = useRouter()

  const [formData, setFormData] = useState({
    code: "",
    type: "percent" as "flat" | "percent",
    value: "",
    minSubtotal: "",
    usageLimit: "",
    endsAt: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return

    // Validate required fields
    if (!formData.endsAt) {
      toast.error("Validation Error", {
        description: "Expiration date is required",
      })
      return
    }

    const couponData: any = {
      code: formData.code.toUpperCase(),
      type: formData.type,
      value: Number.parseFloat(formData.value),
      endsAt: new Date(formData.endsAt).toISOString(),
      isActive: true,
    }

    // Only add optional fields if they have values
    if (formData.minSubtotal) {
      couponData.minSubtotal = Number.parseFloat(formData.minSubtotal)
    }
    if (formData.usageLimit) {
      couponData.usageLimit = Number.parseInt(formData.usageLimit)
    }

    try {
      await addCoupon(couponData, accessToken)
      toast.success("Success", {
        description: "Coupon created successfully",
      })
      router.push("/dashboard/coupons")
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to create coupon",
      })
      console.error("Failed to create coupon:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/coupons">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft size={18} />
            Back
          </Button>
        </Link>
        <h2 className="text-3xl font-bold">Create Coupon</h2>
      </div>

      <Card className="border-2 rounded-2xl max-w-2xl">
        <CardHeader>
          <CardTitle>Coupon Details</CardTitle>
          <CardDescription>Create a new discount coupon code</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Coupon Code *</label>
                <Input
                  placeholder="SAVE20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  className="rounded-lg font-mono text-lg tracking-widest"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as "flat" | "percent" })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Amount ($)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Discount Value {formData.type === "percent" ? "(%)" : "($)"} *
                </label>
                <Input
                  type="number"
                  placeholder={formData.type === "percent" ? "20" : "50"}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Subtotal ($)</label>
                <Input
                  type="number"
                  placeholder="50.00"
                  value={formData.minSubtotal}
                  onChange={(e) => setFormData({ ...formData, minSubtotal: e.target.value })}
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Usage Limit</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Expiration Date *</label>
                <Input
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                  className="rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading} className="rounded-lg flex-1">
                {isLoading ? "Creating..." : "Create Coupon"}
              </Button>
              <Link href="/dashboard/coupons" className="flex-1">
                <Button variant="outline" className="w-full rounded-lg bg-transparent">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
