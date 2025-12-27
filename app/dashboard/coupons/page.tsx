"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useCouponStore, Coupon } from "@/lib/coupon-store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CouponTable } from "@/components/coupons/coupon-table"
import { CouponFilters } from "@/components/coupons/coupon-filters"
import { CouponPagination } from "@/components/coupons/coupon-pagination"
import { Plus } from "lucide-react"
import { toast } from "sonner"

const ITEMS_PER_PAGE = 20

export default function CouponsPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { coupons, isLoading, fetchCoupons, deleteCoupon } = useCouponStore()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    if (accessToken) {
      fetchCoupons(accessToken)
    }
  }, [accessToken, fetchCoupons])

  const filteredCoupons = useMemo(() => {
    return coupons
      .filter((coupon) => {
        const matchesSearch =
          search === "" ||
          coupon.code.toLowerCase().includes(search.toLowerCase())

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && coupon.isActive) ||
          (statusFilter === "inactive" && !coupon.isActive)

        const matchesType =
          typeFilter === "all" || coupon.type === typeFilter

        return matchesSearch && matchesStatus && matchesType
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA
      })
  }, [coupons, search, statusFilter, typeFilter])

  // Pagination calculations
  const totalPages = Math.ceil(filteredCoupons.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedCoupons = filteredCoupons.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, typeFilter])

  const handleClearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setTypeFilter("all")
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleEdit = (coupon: Coupon) => {
    setIsNavigating(true)
    router.push(`/dashboard/coupons/${coupon._id}/edit`)
  }

  const handleDelete = async (id: string) => {
    if (!accessToken) return

    toast.warning("Delete Coupon", {
      description: "Are you sure you want to delete this coupon? This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deleteCoupon(id, accessToken)
            toast.success("Success", {
              description: "Coupon deleted successfully",
            })
          } catch (error) {
            toast.error("Error", {
              description: error instanceof Error ? error.message : "Failed to delete coupon",
            })
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {
          toast.info("Cancelled", {
            description: "Coupon deletion cancelled",
          })
        },
      },
    })
  }

  const handleAddCoupon = () => {
    setIsNavigating(true)
    router.push("/dashboard/coupons/add")
  }

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    if (!accessToken) return

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const res = await fetch(`${API_URL}/coupons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isActive }),
      })

      if (res.ok) {
        toast.success("Success", {
          description: `Coupon ${isActive ? 'activated' : 'deactivated'} successfully`,
        })
        fetchCoupons(accessToken)
      } else {
        toast.error("Error", {
          description: "Failed to update coupon status",
        })
      }
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to update coupon status",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-medium">Loading...</p>
          </div>
        </div>
      )}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
            <p className="text-muted-foreground mt-1">
              Manage your discount codes ({filteredCoupons.length} {filteredCoupons.length === 1 ? "coupon" : "coupons"})
            </p>
          </div>
          <Button
            onClick={handleAddCoupon}
            disabled={isNavigating}
            className="rounded-lg gap-2 cursor-pointer"
          >
            {isNavigating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Coupon
              </>
            )}
          </Button>
        </div>

        <Card className="p-6 mb-6">
          <CouponFilters
            search={search}
            onSearchChange={setSearch}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            type={typeFilter}
            onTypeChange={setTypeFilter}
            onClear={handleClearFilters}
          />
        </Card>

        <div className="space-y-4">
          <CouponTable
            coupons={paginatedCoupons}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            isLoading={isLoading}
          />

          {!isLoading && filteredCoupons.length > 0 && (
            <Card className="p-4">
              <CouponPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredCoupons.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
