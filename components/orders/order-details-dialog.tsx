"use client"

import { useState } from "react"
import { Order } from "@/lib/order-store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { Package, User, MapPin, CreditCard, Calendar, Truck } from "lucide-react"
import { OrderStatusDialog } from "./order-status-dialog"

interface OrderDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onStatusUpdate: (orderId: string, status: string, notes?: string, trackingNumber?: string) => Promise<void>
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

export function OrderDetailsDialog({ open, onOpenChange, order, onStatusUpdate }: OrderDetailsDialogProps) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)

  if (!order) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription className="font-mono text-sm mt-1">
                  {order.orderNumber}
                </DialogDescription>
              </div>
              <Badge 
                variant="outline" 
                className={`text-sm ${statusColors[order.status]}`}
              >
                {order.status}
              </Badge>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)] px-6">
            <div className="space-y-6 pb-6">
              {/* Customer Information */}
              {order.user && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <User className="w-4 h-4" />
                    Customer Information
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Name:</span>
                      <span className="text-sm font-medium">{order.user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span className="text-sm font-medium">{order.user.email}</span>
                    </div>
                    {order.user.phone && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Phone:</span>
                        <span className="text-sm font-medium">{order.user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Shipping Address */}
              {order.shippingAddress && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="w-4 h-4" />
                    Shipping Address
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    {order.shippingAddress.label && (
                      <p className="text-sm font-medium mb-2">{order.shippingAddress.label}</p>
                    )}
                    <p className="text-sm">{order.shippingAddress.line1}</p>
                    {order.shippingAddress.line2 && (
                      <p className="text-sm">{order.shippingAddress.line2}</p>
                    )}
                    <p className="text-sm">
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                    </p>
                    <p className="text-sm">{order.shippingAddress.country}</p>
                  </div>
                </div>
              )}

              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Package className="w-4 h-4" />
                    Order Items ({order.items.length})
                  </div>
                  <div className="space-y-3">
                    {order.items.map((item, index) => {
                      const isProductDeleted = !item.product || !item.product._id;
                      return (
                        <div key={index} className="flex gap-4 bg-muted/50 rounded-lg p-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                            {item.product?.images?.[0] ? (
                              <Image
                                src={item.product.images[0].url}
                                alt={item.product.images[0].altText || item.title}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {item.title}
                              {isProductDeleted && (
                                <span className="ml-2 text-xs text-red-500">(Deleted)</span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">SKU: {item.product?.sku || "N/A"}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Payment Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CreditCard className="w-4 h-4" />
                  Payment Information
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal:</span>
                    <span className="text-sm font-medium">${order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discount && order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-sm">Product Discount:</span>
                      <span className="text-sm font-medium">-${order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {order.coupon && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-sm">Coupon ({order.coupon.code}):</span>
                      <span className="text-sm font-medium">-${order.coupon.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {order.shippingCharges && order.shippingCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Shipping:</span>
                      <span className="text-sm font-medium">${order.shippingCharges.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">Total:</span>
                    <span className="text-sm font-bold">${order.total.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Payment Method:</span>
                    <span className="text-sm font-medium capitalize">{order.payment.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Payment Status:</span>
                    <Badge variant="outline" className="text-xs">
                      {order.payment.status}
                    </Badge>
                  </div>
                  {order.payment.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Paid At:</span>
                      <span className="text-sm font-medium">
                        {new Date(order.payment.paidAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Information */}
              {order.shipping && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Truck className="w-4 h-4" />
                    Shipping Information
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    {order.shipping.trackingNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Tracking Number:</span>
                        <span className="text-sm font-mono font-medium">{order.shipping.trackingNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Shipped At:</span>
                      <span className="text-sm font-medium">
                        {new Date(order.shipping.shippedAt).toLocaleString()}
                      </span>
                    </div>
                    {order.shipping.notes && (
                      <div>
                        <span className="text-sm text-muted-foreground">Notes:</span>
                        <p className="text-sm mt-1">{order.shipping.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Timeline */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Calendar className="w-4 h-4" />
                  Order Timeline
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created:</span>
                    <span className="text-sm font-medium">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {order.confirmedAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Confirmed:</span>
                      <span className="text-sm font-medium">
                        {new Date(order.confirmedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {order.delivery?.deliveredAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Delivered:</span>
                      <span className="text-sm font-medium">
                        {new Date(order.delivery.deliveredAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setStatusDialogOpen(true)}
                  className="flex-1 rounded-lg cursor-pointer"
                >
                  Update Status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 rounded-lg cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <OrderStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        order={order}
        onSubmit={onStatusUpdate}
      />
    </>
  )
}
