"use client"

import { Order } from "@/lib/order-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  Clock, 
  Package, 
  Truck, 
  XCircle, 
  RotateCcw,
  DollarSign,
  AlertCircle
} from "lucide-react"

interface OrderActivityTimelineProps {
  order: Order
}

export function OrderActivityTimeline({ order }: OrderActivityTimelineProps) {
  const activities = []

  // Order created
  activities.push({
    icon: Clock,
    title: "Order Placed",
    description: `Order #${order.orderNumber} was created`,
    timestamp: order.createdAt,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  })

  // Payment status
  if (order.payment.paidAt) {
    activities.push({
      icon: CheckCircle,
      title: "Payment Completed",
      description: `Payment via ${order.payment.method} was successful`,
      timestamp: order.payment.paidAt,
      color: "text-green-500",
      bgColor: "bg-green-50",
    })
  } else if (order.payment.failedAt) {
    activities.push({
      icon: XCircle,
      title: "Payment Failed",
      description: order.payment.failureReason || "Payment could not be processed",
      timestamp: order.payment.failedAt,
      color: "text-red-500",
      bgColor: "bg-red-50",
    })
  }

  // Order confirmed
  if (order.confirmedAt) {
    activities.push({
      icon: CheckCircle,
      title: "Order Confirmed",
      description: "Order has been confirmed and is being prepared",
      timestamp: order.confirmedAt,
      color: "text-green-500",
      bgColor: "bg-green-50",
    })
  }

  // Processing
  if (order.processing?.startedAt) {
    activities.push({
      icon: Package,
      title: "Processing Started",
      description: order.processing.notes || "Order is being processed",
      timestamp: order.processing.startedAt,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    })
  }

  // Shipped
  if (order.shipping?.shippedAt) {
    activities.push({
      icon: Truck,
      title: "Order Shipped",
      description: order.shipping.trackingNumber 
        ? `Tracking: ${order.shipping.trackingNumber}${order.shipping.notes ? ` - ${order.shipping.notes}` : ''}`
        : order.shipping.notes || "Order has been shipped",
      timestamp: order.shipping.shippedAt,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
    })
  }

  // Delivered
  if (order.delivery?.deliveredAt) {
    activities.push({
      icon: CheckCircle,
      title: "Order Delivered",
      description: order.delivery.notes || "Order has been successfully delivered",
      timestamp: order.delivery.deliveredAt,
      color: "text-green-500",
      bgColor: "bg-green-50",
    })
  }

  // Cancelled
  if (order.cancellation?.cancelledAt) {
    activities.push({
      icon: XCircle,
      title: "Order Cancelled",
      description: order.cancellation.reason || "Order was cancelled",
      timestamp: order.cancellation.cancelledAt,
      color: "text-red-500",
      bgColor: "bg-red-50",
    })
  }

  // Return request
  if (order.return?.requestedAt) {
    activities.push({
      icon: RotateCcw,
      title: "Return Requested",
      description: order.return.reason || "Customer requested a return",
      timestamp: order.return.requestedAt,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    })
  }

  // Return approved
  if (order.return?.approvedAt) {
    activities.push({
      icon: CheckCircle,
      title: "Return Approved",
      description: order.return.notes || "Return request has been approved",
      timestamp: order.return.approvedAt,
      color: "text-green-500",
      bgColor: "bg-green-50",
    })
  }

  // Return rejected
  if (order.return?.rejectedAt) {
    activities.push({
      icon: XCircle,
      title: "Return Rejected",
      description: order.return.notes || "Return request has been rejected",
      timestamp: order.return.rejectedAt,
      color: "text-red-500",
      bgColor: "bg-red-50",
    })
  }

  // Refunds
  if (order.refunds && order.refunds.length > 0) {
    order.refunds.forEach((refund, index) => {
      activities.push({
        icon: DollarSign,
        title: `Refund ${refund.status === 'completed' ? 'Processed' : refund.status === 'failed' ? 'Failed' : 'Initiated'}`,
        description: `$${refund.amount.toFixed(2)} - ${refund.reason}`,
        timestamp: refund.processedAt,
        color: refund.status === 'completed' ? "text-green-500" : refund.status === 'failed' ? "text-red-500" : "text-yellow-500",
        bgColor: refund.status === 'completed' ? "bg-green-50" : refund.status === 'failed' ? "bg-red-50" : "bg-yellow-50",
      })
    })
  }

  // Sort activities by timestamp (most recent first)
  activities.sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime()
    const dateB = new Date(b.timestamp).getTime()
    return dateB - dateA
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Activity & Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

          {activities.map((activity, index) => {
            const Icon = activity.icon
            return (
              <div key={index} className="relative flex gap-4">
                {/* Icon */}
                <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${activity.bgColor} shrink-0`}>
                  <Icon className={`w-5 h-5 ${activity.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{activity.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                    </div>
                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(activity.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>
              </div>
            )
          })}

          {activities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No activity recorded yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
