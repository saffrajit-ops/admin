"use client"

import { useState } from "react"
import { Product } from "@/lib/product-store"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Trash2, Package } from "lucide-react"
import Image from "next/image"

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onView?: (product: Product) => void
  onToggleStatus?: (id: string, isActive: boolean) => void
  onToggleFeatured?: (id: string, isFeatured: boolean) => void
  isLoading?: boolean
  selectedIds?: Set<string>
  onSelectAll?: (checked: boolean) => void
  onSelectOne?: (id: string, checked: boolean) => void
  allProductIds?: string[]
}

export function ProductTable({ products, onEdit, onDelete, onView, onToggleStatus, onToggleFeatured, isLoading, selectedIds, onSelectAll, onSelectOne, allProductIds }: ProductTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null)
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await onDelete(id)
    setDeletingId(null)
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!onToggleStatus) return
    setTogglingStatusId(id)
    try {
      await onToggleStatus(id, !currentStatus)
    } finally {
      setTogglingStatusId(null)
    }
  }

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    if (!onToggleFeatured) return
    setTogglingFeaturedId(id)
    try {
      await onToggleFeatured(id, !currentFeatured)
    } finally {
      setTogglingFeaturedId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>

              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={4}>
                  <div className="h-12 bg-muted animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No products found</p>
      </div>
    )
  }

  const isAllSelected = selectedIds && allProductIds && allProductIds.length > 0 && allProductIds.every(id => selectedIds.has(id))
  const isSomeSelected = selectedIds && selectedIds.size > 0 && !isAllSelected

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            {onSelectAll && (
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all"
                  className="cursor-pointer"
                />
              </TableHead>
            )}
            <TableHead className="w-[200px]">Product</TableHead>

            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product._id}
              className={onView ? "cursor-pointer hover:bg-muted/50" : ""}
              onClick={() => onView && onView(product)}
            >
              {onSelectOne && selectedIds && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(product._id)}
                    onCheckedChange={(checked) => onSelectOne(product._id, checked as boolean)}
                    aria-label={`Select ${product.title}`}
                    className="cursor-pointer"
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].altText || product.title}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{product.title}</p>
                    {/* <p className="text-sm text-muted-foreground truncate">
                      {product.shortDescription}
                    </p> */}
                  </div>
                </div>
              </TableCell>

              {/* <TableCell>
                {product.concern && product.concern.length > 0 ? (
                  <span className="text-sm">{product.concern[0]}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {product.categories && product.categories.length > 0 ? (
                  <span className="text-sm">{product.categories[0]}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell> */}

              <TableCell>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={product.isActive}
                      onCheckedChange={() => handleToggleStatus(product._id, product.isActive)}
                      disabled={togglingStatusId === product._id}
                      className="cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-xs text-muted-foreground">
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={product.isFeatured}
                      onCheckedChange={() => handleToggleFeatured(product._id, product.isFeatured)}
                      disabled={togglingFeaturedId === product._id}
                      className="cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-xs text-muted-foreground">
                      {product.isFeatured ? "Featured" : "Not Featured"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.cashOnDelivery?.enabled && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        COD
                      </Badge>
                    )}
                    {product.returnPolicy?.returnable !== false && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        Returnable
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(product)
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
                      handleDelete(product._id)
                    }}
                    disabled={deletingId === product._id}
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
