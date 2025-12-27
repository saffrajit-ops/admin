"use client"

import { Banner } from "@/lib/banner-store"
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
import { Edit, Trash2, Image as ImageIcon, Eye, MousePointerClick } from "lucide-react"
import Image from "next/image"

interface BannerTableProps {
  banners: Banner[]
  onEdit: (banner: Banner) => void
  onDelete: (id: string) => void
  onPreview?: (id: string) => void
  onToggleStatus?: (id: string, isActive: boolean) => void
  isLoading?: boolean
}

export function BannerTable({ banners, onEdit, onDelete, onPreview, onToggleStatus, isLoading }: BannerTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead className="w-[200px]">Title & Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Page Targeting</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={9}>
                  <div className="h-16 bg-muted animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (banners.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No banners found</p>
      </div>
    )
  }

  const getBannerTypeColor = (type: string) => {
    switch (type) {
      case "hero":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "promotional":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "sidebar":
        return "bg-green-100 text-green-800 border-green-200"
      case "footer":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "popup":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Image</TableHead>
            <TableHead className="w-[200px]">Title & Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Page Targeting</TableHead>
            <TableHead>Triggers</TableHead>
            <TableHead>Stats</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {banners.map((banner) => (
            <TableRow
              key={banner._id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onPreview && onPreview(banner._id)}
            >
              <TableCell>
                <div className="relative w-16 h-16 rounded overflow-hidden bg-muted">
                  <Image
                    src={banner.image.url}
                    alt={banner.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </TableCell>
              <TableCell className="max-w-[200px]">
                <div>
                  <div className="font-semibold truncate" title={banner.title}>
                    {banner.title}
                  </div>
                  {banner.description && (
                    <div className="text-xs text-muted-foreground line-clamp-2" title={banner.description}>
                      {banner.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs capitalize ${getBannerTypeColor(banner.type)}`}>
                  {banner.type}
                </Badge>
              </TableCell>
              <TableCell>
                {banner.pages && banner.pages.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {banner.pages.slice(0, 2).map((page) => (
                      <Badge key={page} variant="secondary" className="text-xs capitalize">
                        {page.replace('-', ' ')}
                      </Badge>
                    ))}
                    {banner.pages.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{banner.pages.length - 2}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    {banner.type === 'popup' ? 'Global (All Pages)' : 'No pages'}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {banner.triggers ? (
                  <div className="flex flex-wrap gap-1">
                    {banner.triggers.device?.enabled && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        📱 Device
                      </Badge>
                    )}
                    {banner.triggers.userType?.enabled && (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                        👤 User
                      </Badge>
                    )}
                    {banner.triggers.behavior?.enabled && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        🎯 Behavior
                      </Badge>
                    )}
                    {banner.triggers.inventory?.enabled && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                        📦 Inventory
                      </Badge>
                    )}
                    {!banner.triggers.device?.enabled &&
                      !banner.triggers.userType?.enabled &&
                      !banner.triggers.behavior?.enabled &&
                      !banner.triggers.inventory?.enabled && (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{banner.viewCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MousePointerClick className="w-3 h-3" />
                    <span>{banner.clickCount}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <div>Start: {new Date(banner.startDate).toLocaleDateString()}</div>
                  {banner.endDate && (
                    <div>End: {new Date(banner.endDate).toLocaleDateString()}</div>
                  )}
                </div>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                {onToggleStatus ? (
                  <Switch
                    checked={banner.isActive}
                    onCheckedChange={(checked) => onToggleStatus(banner._id, checked)}
                    className="cursor-pointer"
                  />
                ) : (
                  banner.isActive ? (
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
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(banner)}
                    className="h-8 w-8 cursor-pointer"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(banner._id)}
                    className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer"
                    title="Delete"
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
