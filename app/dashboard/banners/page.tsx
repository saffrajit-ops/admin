"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useBannerStore } from "@/lib/banner-store"
import { useAuthStore } from "@/lib/auth-store"
import { BannerTable } from "@/components/banners/banner-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Image as ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function BannersPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { banners, isLoading, fetchBanners, deleteBanner, toggleBannerStatus } = useBannerStore()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; bannerId: string | null }>({
    open: false,
    bannerId: null,
  })
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    if (accessToken) {
      fetchBanners(accessToken, 1, typeFilter === "all" ? undefined : typeFilter)
    }
  }, [accessToken, typeFilter])

  const handleEdit = (banner: any) => {
    setIsNavigating(true)
    router.push(`/dashboard/banners/edit/${banner._id}`)
  }

  const handlePreview = (id: string) => {
    setIsNavigating(true)
    router.push(`/dashboard/banners/preview/${id}`)
  }

  const handleAddNew = () => {
    setIsNavigating(true)
    router.push("/dashboard/banners/new")
  }

  const handleDelete = async () => {
    if (!deleteDialog.bannerId || !accessToken) return

    try {
      await deleteBanner(deleteDialog.bannerId, accessToken)
      toast.success("Banner deleted successfully")
      setDeleteDialog({ open: false, bannerId: null })
    } catch (error) {
      toast.error("Failed to delete banner")
    }
  }

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    if (!accessToken) return

    try {
      await toggleBannerStatus(id, isActive, accessToken)
      toast.success(`Banner ${isActive ? "activated" : "deactivated"} successfully`)
    } catch (error) {
      toast.error("Failed to update banner status")
    }
  }

  const stats = {
    total: banners.length,
    active: banners.filter((b) => b.isActive).length,
    inactive: banners.filter((b) => !b.isActive).length,
    totalViews: banners.reduce((sum, b) => sum + b.viewCount, 0),
    totalClicks: banners.reduce((sum, b) => sum + b.clickCount, 0),
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banner Management</h1>
          <p className="text-muted-foreground">Manage your website banners and advertisements</p>
        </div>
        <Button onClick={handleAddNew} disabled={isNavigating} className="cursor-pointer">
          {isNavigating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add New Banner
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Banners</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalViews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalClicks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Banners</CardTitle>
          <CardDescription>Filter banners by type</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px] cursor-pointer">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">All Types</SelectItem>
              <SelectItem value="sidebar" className="cursor-pointer">Sidebar</SelectItem>
              <SelectItem value="footer" className="cursor-pointer">Footer</SelectItem>
              <SelectItem value="popup" className="cursor-pointer">Popup</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Banners Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Banners</CardTitle>
          <CardDescription>
            {typeFilter === "all" ? "Showing all banners" : `Showing ${typeFilter} banners`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BannerTable
            banners={banners}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteDialog({ open: true, bannerId: id })}
            onPreview={handlePreview}
            onToggleStatus={handleToggleStatus}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, bannerId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the banner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground cursor-pointer">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
