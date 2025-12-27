"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Coupon } from "@/lib/coupon-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Save, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface CouponFormData {
  code: string
  type: "flat" | "percent"
  value: number
  minSubtotal?: number
  usageLimit?: number
  endsAt: string
  isActive: boolean
}

interface CouponFormProps {
  coupon?: Coupon | null
  onSubmit: (data: Partial<Coupon>) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function CouponForm({ coupon, onSubmit, onCancel, isLoading }: CouponFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
  } = useForm<CouponFormData>({
    defaultValues: {
      code: "",
      type: "percent",
      value: 0,
      minSubtotal: undefined,
      usageLimit: undefined,
      endsAt: "",
      isActive: true,
    },
  })

  const type = watch("type")
  const isActive = watch("isActive")
  const value = watch("value")

  useEffect(() => {
    if (coupon) {
      setValue("code", coupon.code)
      setValue("type", coupon.type)
      setValue("value", coupon.value)
      setValue("minSubtotal", coupon.minSubtotal)
      setValue("usageLimit", coupon.usageLimit)
      setValue("endsAt", coupon.endsAt ? new Date(coupon.endsAt).toISOString().slice(0, 16) : "")
      setValue("isActive", coupon.isActive)
    }
  }, [coupon, setValue])

  const onFormSubmit = async (data: CouponFormData) => {
    // Validate percentage value
    if (data.type === "percent" && data.value > 100) {
      setError("value", {
        message: "Percentage discount cannot exceed 100%"
      })
      toast.error("Validation Error", {
        description: "Percentage discount cannot exceed 100%",
      })
      return
    }

    // Validate expiry date is not in the past
    const expiryDate = new Date(data.endsAt)
    const now = new Date()
    if (expiryDate < now) {
      setError("endsAt", {
        message: "Expiry date cannot be in the past"
      })
      toast.error("Validation Error", {
        description: "Expiry date cannot be in the past",
      })
      return
    }

    const submitData: any = {
      code: data.code.toUpperCase().trim(),
      type: data.type,
      value: data.value,
      endsAt: new Date(data.endsAt).toISOString(),
      isActive: data.isActive,
    }

    if (data.minSubtotal) submitData.minSubtotal = data.minSubtotal
    if (data.usageLimit) submitData.usageLimit = data.usageLimit

    await onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("isActive", checked)}
              className="cursor-pointer"
            />
            <Label htmlFor="active">Active</Label>
          </div>
          <Button type="submit" disabled={isLoading} className="gap-2 cursor-pointer">
            <Save className="w-4 h-4" />
            {isLoading ? "Saving..." : coupon ? "Update Coupon" : "Create Coupon"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Coupon Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Coupon Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  {...register("code", {
                    required: "Coupon code is required",
                    minLength: { value: 3, message: "Code must be at least 3 characters" },
                    maxLength: { value: 20, message: "Code must not exceed 20 characters" }
                  })}
                  placeholder="SUMMER2024"
                  className="font-mono uppercase"
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase()
                    register("code").onChange(e)
                  }}
                />
                {errors.code && (
                  <p className="text-xs text-destructive">{errors.code.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Unique code customers will use (3-20 characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  Discount Type <span className="text-destructive">*</span>
                </Label>
                <Select value={type} onValueChange={(value: "flat" | "percent") => setValue("type", value)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value="percent">Percentage (%) </SelectItem>
                    <SelectItem className="cursor-pointer" value="flat">Flat Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">
                Discount Value <span className="text-destructive">*</span>
              </Label>
              <Input
                id="value"
                type="number"
                step={type === "percent" ? "1" : "0.01"}
                min="0"
                max={type === "percent" ? "100" : undefined}
                {...register("value", {
                  required: "Discount value is required",
                  min: { value: 0, message: "Value must be positive" },
                  max: type === "percent" ? { value: 100, message: "Percentage cannot exceed 100%" } : undefined,
                  valueAsNumber: true
                })}
                placeholder={type === "percent" ? "10" : "5.00"}
              />
              {errors.value && (
                <p className="text-xs text-destructive">{errors.value.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {type === "percent" ? "Percentage discount (0-100)" : "Dollar amount discount"}
              </p>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Restrictions</h2>

            <div className="space-y-2">
              <Label htmlFor="minSubtotal">Minimum Subtotal</Label>
              <Input
                id="minSubtotal"
                type="number"
                step="0.01"
                min="0"
                {...register("minSubtotal", {
                  min: { value: 0, message: "Must be positive" },
                  valueAsNumber: true
                })}
                placeholder="0.00"
              />
              {errors.minSubtotal && (
                <p className="text-xs text-destructive">{errors.minSubtotal.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimum order amount required
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usageLimit">Usage Limit</Label>
              <Input
                id="usageLimit"
                type="number"
                min="1"
                {...register("usageLimit", {
                  min: { value: 1, message: "Must be at least 1" },
                  valueAsNumber: true
                })}
                placeholder="Unlimited"
              />
              {errors.usageLimit && (
                <p className="text-xs text-destructive">{errors.usageLimit.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Maximum number of times this coupon can be used
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endsAt">
                Expiration Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endsAt"
                type="datetime-local"
                {...register("endsAt", {
                  required: "Expiration date is required"
                })}
                min={new Date().toISOString().slice(0, 16)}
              />
              {errors.endsAt && (
                <p className="text-xs text-destructive">{errors.endsAt.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Cannot be a past date
              </p>
            </div>
          </Card>
        </div>
      </div>
    </form>
  )
}
