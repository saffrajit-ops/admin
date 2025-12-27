"use client"

import { Order } from "@/lib/order-store"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrderStatusSelect } from "./order-status-select"
import { PaymentStatusSelect } from "./payment-status-select"

interface OrderTableProps {
  orders: Order[]
  onOrderClick: (order: Order) => void
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>
  onPaymentStatusChange: (orderId: string, newStatus: string) => Promise<void>
  isLoading?: boolean
}

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  completed: "bg-green-500/10 text-green-700 border-green-500/20",
  failed: "bg-red-500/10 text-red-700 border-red-500/20",
}

export function OrderTable({ orders, onOrderClick, onStatusChange, onPaymentStatusChange, isLoading }: OrderTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={8}>
                  <div className="h-12 bg-muted animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No orders found</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order._id} className="cursor-pointer hover:bg-muted/50" onClick={() => onOrderClick(order)}>
              <TableCell>
                <div className="font-mono text-sm font-medium text-primary hover:underline">{order.orderNumber}</div>
              </TableCell>
              <TableCell>
                <div className="min-w-0">
                  <p className="font-medium truncate">{order.user?.name || "N/A"}</p>
                  <p className="text-sm text-muted-foreground truncate">{order.user?.email || "N/A"}</p>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">{order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}</span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold">${order.total.toFixed(2)}</span>
                  {order.coupon && (
                    <span className="text-xs text-green-600">
                      -{order.coupon.code}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <PaymentStatusSelect
                  currentStatus={order.payment.status}
                  orderId={order._id}
                  paymentMethod={order.payment.method}
                  onStatusChange={onPaymentStatusChange}
                />
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <OrderStatusSelect
                  currentStatus={order.status}
                  orderId={order._id}
                  onStatusChange={onStatusChange}
                />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
