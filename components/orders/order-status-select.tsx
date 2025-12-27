"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface OrderStatusSelectProps {
  currentStatus: string
  orderId: string
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  processing: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  shipped: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
  delivered: "bg-green-500/10 text-green-700 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-700 border-red-500/20",
  returned: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  refunded: "bg-pink-500/10 text-pink-700 border-pink-500/20",
  failed: "bg-gray-500/10 text-gray-700 border-gray-500/20",
}

export function OrderStatusSelect({ currentStatus, orderId, onStatusChange }: OrderStatusSelectProps) {
  const [isChanging, setIsChanging] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return
    
    setIsChanging(true)
    try {
      await onStatusChange(orderId, newStatus)
    } catch (error) {
      console.error("Failed to change status:", error)
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange} disabled={isChanging}>
      <SelectTrigger className={`w-[140px] h-7 text-xs border cursor-pointer ${statusColors[currentStatus]}`}>
        <SelectValue>
          <span className="capitalize">{currentStatus}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="confirmed" className="cursor-pointer">Confirmed</SelectItem>
        <SelectItem value="processing" className="cursor-pointer">Processing</SelectItem>
        <SelectItem value="shipped" className="cursor-pointer">Shipped</SelectItem>
        <SelectItem value="delivered" className="cursor-pointer">Delivered</SelectItem>
      </SelectContent>
    </Select>
  )
}
