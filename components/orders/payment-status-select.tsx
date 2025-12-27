"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface PaymentStatusSelectProps {
  currentStatus: string
  orderId: string
  paymentMethod?: string
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>
}

export function PaymentStatusSelect({
  currentStatus,
  orderId,
  paymentMethod,
  onStatusChange,
}: PaymentStatusSelectProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return

    // Prevent changing from completed
    if (currentStatus === "completed") {
      toast.error("Cannot change payment status", {
        description: "Payment is already completed and cannot be modified",
      })
      return
    }

    setIsUpdating(true)
    try {
      await onStatusChange(orderId, newStatus)
      toast.success("Payment status updated", {
        description: `Payment status changed to ${newStatus}`,
      })
    } catch (error) {
      toast.error("Failed to update payment status", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-700 bg-green-50 border-green-200"
      case "pending":
        return "text-yellow-700 bg-yellow-50 border-yellow-200"
      case "failed":
        return "text-red-700 bg-red-50 border-red-200"
      default:
        return "text-gray-700 bg-gray-50 border-gray-200"
    }
  }

  // If payment is completed, show as badge (non-editable)
  if (currentStatus === "completed") {
    return (
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(currentStatus)}`}>
        {currentStatus.toUpperCase()}
      </div>
    )
  }

  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger className={`w-[130px] h-8 text-xs cursor-pointer ${getStatusColor(currentStatus)}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending" className="text-xs cursor-pointer">
          Pending
        </SelectItem>
        <SelectItem value="completed" className="text-xs cursor-pointer">
          Completed
        </SelectItem>
        <SelectItem value="failed" className="text-xs cursor-pointer">
          Failed
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
