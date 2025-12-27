"use client"

import { Coupon } from "@/lib/coupon-store"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Edit, Trash2, Tag } from "lucide-react"

interface CouponTableProps {
  coupons: Coupon[]
  onEdit: (coupon: Coupon) => void
  onDelete: (id: string) => void
  onToggleStatus?: (id: string, isActive: boolean) => void
  isLoading?: boolean
}

export function CouponTable({ coupons, onEdit, onDelete, onToggleStatus, isLoading }: CouponTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Min Subtotal</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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

  if (coupons.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No coupons found</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Code</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Min Subtotal</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((coupon) => (
            <TableRow
              key={coupon._id}
            >
              <TableCell>
                <div className="font-mono font-semibold">{coupon.code}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs capitalize">
                  {coupon.type}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-semibold">
                  {coupon.type === "percent" ? `${coupon.value}%` : `$${coupon.value}`}
                </span>
              </TableCell>
              <TableCell>
                {coupon.minSubtotal ? (
                  <span className="text-sm">${coupon.minSubtotal}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {coupon.usageLimit ? (
                  <span className="text-sm">
                    {coupon.usedCount || 0} / {coupon.usageLimit}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Unlimited</span>
                )}
              </TableCell>
              <TableCell>
                {coupon.endsAt ? (
                  <span className="text-sm">
                    {new Date(coupon.endsAt).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Never</span>
                )}
              </TableCell>
              <TableCell>
                {onToggleStatus ? (
                  <Switch
                    checked={coupon.isActive}
                    onCheckedChange={(checked) => onToggleStatus(coupon._id, checked)}
                    className="cursor-pointer"
                  />
                ) : (
                  coupon.isActive ? (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Inactive
                    </Badge>
                  )
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(coupon)
                    }}
                    className="h-8 w-8 cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(coupon._id)
                    }}
                    className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
