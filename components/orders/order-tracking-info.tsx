"use client"

import { Order } from "@/lib/order-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, Package, MapPin, Calendar, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"

interface OrderTrackingInfoProps {
  order: Order
}

export function OrderTrackingInfo({ order }: OrderTrackingInfoProps) {
  const [copied, setCopied] = useState(false)

  const copyTrackingNumber = () => {
    if (order.shipping?.trackingNumber) {
      navigator.clipboard.writeText(order.shipping.trackingNumber)
      setCopied(true)
      toast.success("Tracking number copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getStatusProgress = () => {
    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
    const currentIndex = statuses.indexOf(order.status)
    return ((currentIndex + 1) / statuses.length) * 100
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      processing: "bg-purple-500",
      shipped: "bg-indigo-500",
      delivered: "bg-green-500",
      cancelled: "bg-red-500",
      returned: "bg-orange-500",
      refunded: "bg-gray-500",
      failed: "bg-red-600",
    }
    return colors[status] || "bg-gray-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Tracking & Shipping Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Status */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Order Status</span>
            <Badge className={`${getStatusColor(order.status)} text-white`}>
              {order.status.toUpperCase()}
            </Badge>
          </div>
          
          {/* Progress Bar */}
          {!['cancelled', 'returned', 'refunded', 'failed'].includes(order.status) && (
            <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-primary transition-all duration-500"
                style={{ width: `${getStatusProgress()}%` }}
              />
            </div>
          )}
        </div>

        {/* Tracking Number */}
        {order.shipping?.trackingNumber && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Tracking Number</p>
                <p className="font-mono font-semibold text-lg">{order.shipping.trackingNumber}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyTrackingNumber}
                className="gap-2 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Shipping Details */}
        <div className="grid gap-4">
          {order.shipping?.shippedAt && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Shipped</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.shipping.shippedAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {order.shipping.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{order.shipping.notes}</p>
                )}
              </div>
            </div>
          )}

          {order.delivery?.deliveredAt && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Delivered</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.delivery.deliveredAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {order.delivery.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{order.delivery.notes}</p>
                )}
              </div>
            </div>
          )}

          {order.processing?.startedAt && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Processing</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.processing.startedAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {order.processing.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{order.processing.notes}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="pt-4 border-t">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Shipping Address</p>
                {order.shippingAddress.label && (
                  <p className="text-sm font-medium">{order.shippingAddress.label}</p>
                )}
                <p className="text-sm text-muted-foreground">{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && (
                  <p className="text-sm text-muted-foreground">{order.shippingAddress.line2}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                </p>
                <p className="text-sm text-muted-foreground">{order.shippingAddress.country}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Dates */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Order Placed</span>
            <span className="font-medium">
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          {order.confirmedAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Confirmed</span>
              <span className="font-medium">
                {new Date(order.confirmedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
          {order.updatedAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-medium">
                {new Date(order.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
