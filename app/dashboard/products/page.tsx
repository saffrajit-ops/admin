"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useProductStore, Product } from "@/lib/product-store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ProductTable } from "@/components/products/product-table"
import { ProductFilters } from "@/components/products/product-filters"
import { ProductPagination } from "@/components/products/product-pagination"
import { BulkUploadDialog } from "@/components/products/bulk-upload-dialog"
import { Plus, Upload, Download, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { exportProductsToExcel } from "@/lib/excel-export"
import { Checkbox } from "@/components/ui/checkbox"

const ITEMS_PER_PAGE = 20

export default function ProductsPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { products, totalPages, totalProducts, isLoading, fetchProducts, deleteProduct, toggleProductStatus, toggleProductFeatured } = useProductStore()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [featuredFilter, setFeaturedFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  // Fetch products when filters change
  useEffect(() => {
    if (accessToken) {
      // Debounce search slightly to avoid too many requests
      const timer = setTimeout(() => {
        fetchProducts(accessToken, currentPage, ITEMS_PER_PAGE, {
          search,
          status: statusFilter,
          featured: featuredFilter
        })
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [accessToken, fetchProducts, currentPage, search, statusFilter, featuredFilter])

  // No longer need client-side filtering
  const filteredProducts = products

  // Pagination is handled server-side now
  const paginatedProducts = products

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, featuredFilter])

  const handleClearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setFeaturedFilter("all")
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleView = (product: Product) => {
    setIsNavigating(true)
    router.push(`/dashboard/products/${product._id}`)
  }

  const handleEdit = (product: Product) => {
    setIsNavigating(true)
    router.push(`/dashboard/products/${product._id}/edit`)
  }

  const handleDelete = async (id: string) => {
    if (!accessToken) return

    // Show confirmation toast with action buttons
    toast.warning("Delete Product", {
      description: "Are you sure you want to delete this product? This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deleteProduct(id, accessToken)
            toast.success("Success", {
              description: "Product deleted successfully",
            })
          } catch (error) {
            toast.error("Error", {
              description: error instanceof Error ? error.message : "Failed to delete product",
            })
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {
          toast.info("Cancelled", {
            description: "Product deletion cancelled",
          })
        },
      },
    })
  }

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    if (!accessToken) return

    try {
      await toggleProductStatus(id, isActive, accessToken)
      toast.success("Success", {
        description: `Product ${isActive ? "activated" : "deactivated"} successfully`,
      })
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to update product status",
      })
    }
  }

  const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
    if (!accessToken) return

    try {
      await toggleProductFeatured(id, isFeatured, accessToken)
      toast.success("Success", {
        description: `Product ${isFeatured ? "marked as featured" : "unmarked as featured"} successfully`,
      })
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to update featured status",
      })
    }
  }

  const handleAddProduct = () => {
    setIsNavigating(true)
    router.push("/dashboard/products/add")
  }

  const handleBulkUploadSuccess = () => {
    if (accessToken) {
      fetchProducts(accessToken)
    }
  }

  const handleExportToExcel = () => {
    try {
      const fileName = exportProductsToExcel(filteredProducts, 'products_export')
      toast.success("Export Successful", {
        description: `Downloaded ${filteredProducts.length} products to ${fileName}`,
      })
    } catch (error) {
      toast.error("Export Failed", {
        description: error instanceof Error ? error.message : "Failed to export products",
      })
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredProducts.map(p => p._id))
      setSelectedIds(allIds)
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkDelete = async () => {
    if (!accessToken || selectedIds.size === 0) return

    toast.warning("Delete Products", {
      description: `Are you sure you want to delete ${selectedIds.size} product(s)? This action cannot be undone.`,
      action: {
        label: "Delete All",
        onClick: async () => {
          setIsDeleting(true)
          let successCount = 0
          let errorCount = 0

          for (const id of Array.from(selectedIds)) {
            try {
              await deleteProduct(id, accessToken)
              successCount++
            } catch (error) {
              errorCount++
              console.error(`Failed to delete product ${id}:`, error)
            }
          }

          setIsDeleting(false)
          setSelectedIds(new Set())

          if (successCount > 0) {
            toast.success("Success", {
              description: `${successCount} product(s) deleted successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
            })
          }

          if (errorCount > 0 && successCount === 0) {
            toast.error("Error", {
              description: `Failed to delete ${errorCount} product(s)`,
            })
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {
          toast.info("Cancelled", {
            description: "Bulk deletion cancelled",
          })
        },
      },
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground mt-1">
              Manage your product catalog ({filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"})
              {selectedIds.size > 0 && (
                <span className="ml-2 text-blue-600 font-medium">
                  • {selectedIds.size} selected
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                className="rounded-lg gap-2 cursor-pointer"
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Deleting..." : `Delete ${selectedIds.size}`}
              </Button>
            )}
            <Button
              onClick={handleExportToExcel}
              variant="outline"
              className="rounded-lg gap-2 cursor-pointer"
              disabled={filteredProducts.length === 0}
            >
              <Download className="w-4 h-4" />
              Export to Excel
            </Button>
            <Button
              onClick={() => setBulkUploadOpen(true)}
              variant="outline"
              className="rounded-lg gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Bulk Upload
            </Button>
            <Button
              onClick={handleAddProduct}
              className="rounded-lg gap-2 cursor-pointer"
              disabled={isNavigating}
            >
              {isNavigating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Product
                </>
              )}
            </Button>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <ProductFilters
            search={search}
            onSearchChange={setSearch}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            featured={featuredFilter}
            onFeaturedChange={setFeaturedFilter}
            onClear={handleClearFilters}
          />
        </Card>

        <div className="space-y-4">
          <ProductTable
            products={paginatedProducts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            onToggleStatus={handleToggleStatus}
            onToggleFeatured={handleToggleFeatured}
            isLoading={isLoading || isNavigating}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            allProductIds={filteredProducts.map(p => p._id)}
          />

          {!isLoading && (
            <Card className="p-4">
              <ProductPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalProducts}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
              />
            </Card>
          )}
        </div>

        {/* Bulk Upload Dialog */}
        <BulkUploadDialog
          open={bulkUploadOpen}
          onOpenChange={setBulkUploadOpen}
          onSuccess={handleBulkUploadSuccess}
        />
      </div>
    </div>
  )
}
