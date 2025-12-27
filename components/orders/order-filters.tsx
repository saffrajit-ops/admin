"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"

interface OrderFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  paymentStatus: string
  onPaymentStatusChange: (value: string) => void
  paymentMethod?: string
  onPaymentMethodChange?: (value: string) => void
  onClear: () => void
}

export function OrderFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  paymentStatus,
  onPaymentStatusChange,
  paymentMethod,
  onPaymentMethodChange,
  onClear,
}: OrderFiltersProps) {
  const hasFilters = search || status !== "all" || paymentStatus !== "all" || (paymentMethod && paymentMethod !== "all")

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by order number, customer name, or email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 rounded-lg"
        />
      </div>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px] rounded-lg cursor-pointer">
          <SelectValue placeholder="Order Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="cursor-pointer">All Status</SelectItem>
          <SelectItem value="confirmed" className="cursor-pointer">Confirmed</SelectItem>
          <SelectItem value="processing" className="cursor-pointer">Processing</SelectItem>
          <SelectItem value="shipped" className="cursor-pointer">Shipped</SelectItem>
          <SelectItem value="delivered" className="cursor-pointer">Delivered</SelectItem>
        </SelectContent>
      </Select>

      <Select value={paymentStatus} onValueChange={onPaymentStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px] rounded-lg cursor-pointer">
          <SelectValue placeholder="Payment Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="cursor-pointer">All Payments</SelectItem>
          <SelectItem value="pending" className="cursor-pointer">Pending</SelectItem>
          <SelectItem value="completed" className="cursor-pointer">Completed</SelectItem>
          <SelectItem value="failed" className="cursor-pointer">Failed</SelectItem>
        </SelectContent>
      </Select>

      {paymentMethod !== undefined && onPaymentMethodChange && (
        <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-lg cursor-pointer">
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">All Methods</SelectItem>
            <SelectItem value="cod" className="cursor-pointer">COD</SelectItem>
            <SelectItem value="prepaid" className="cursor-pointer">Prepaid</SelectItem>
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          onClick={onClear}
          className="rounded-lg gap-2 cursor-pointer"
        >
          <X className="w-4 h-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
