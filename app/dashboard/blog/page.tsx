"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useBlogStore, BlogPost } from "@/lib/blog-store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BlogTable } from "@/components/blog/blog-table"
import { BlogFilters } from "@/components/blog/blog-filters"
import { BlogPreviewDialog } from "@/components/blog/blog-preview-dialog"
import { BlogPagination } from "@/components/blog/blog-pagination"
import { Plus, Download, Upload, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { exportBlogsToExcel } from "@/lib/excel-export"
import { BulkUploadDialog } from "@/components/blog/bulk-upload-dialog"

const ITEMS_PER_PAGE = 20

export default function BlogPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { posts, isLoading, fetchPosts, deletePost, togglePublishStatus } = useBlogStore()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [taxonomyNames, setTaxonomyNames] = useState<{
    [key: string]: string
  }>({})
  const [blogCategories, setBlogCategories] = useState<any[]>([])

  useEffect(() => {
    if (accessToken) {
      fetchPosts(accessToken)
      
      // Fetch blog categories for filter and name mapping
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/for-blogs`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const categories = data.data.categories || []
            setBlogCategories(categories)
            
            // Build name mapping
            const names: { [key: string]: string } = {}
            categories.forEach((cat: any) => {
              names[cat._id] = cat.name
              if (cat.subcategories) {
                cat.subcategories.forEach((sub: any) => {
                  names[sub._id] = `${cat.name} > ${sub.name}`
                })
              }
            })
            setTaxonomyNames(names)
          }
        })
        .catch(err => console.error('Error fetching blog categories:', err))
    }
  }, [accessToken, fetchPosts])

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        const matchesSearch =
          search === "" ||
          post.title.toLowerCase().includes(search.toLowerCase()) ||
          post.excerpt?.toLowerCase().includes(search.toLowerCase()) ||
          post.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "published" && post.isPublished) ||
          (statusFilter === "draft" && !post.isPublished)

        const matchesCategory =
          categoryFilter === "all" ||
          (post.category && typeof post.category === 'object' && (post.category as any)._id === categoryFilter) ||
          (post.category && typeof post.category === 'string' && post.category === categoryFilter) ||
          ((post as any).subcategory && typeof (post as any).subcategory === 'object' && ((post as any).subcategory as any)._id === categoryFilter) ||
          ((post as any).subcategory && typeof (post as any).subcategory === 'string' && (post as any).subcategory === categoryFilter)

        return matchesSearch && matchesStatus && matchesCategory
      })
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime()
        const dateB = new Date(b.updatedAt || b.createdAt).getTime()
        return dateB - dateA
      })
  }, [posts, search, statusFilter, categoryFilter])

  // Pagination calculations
  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, categoryFilter])

  const handleClearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setCategoryFilter("all")
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleView = (post: BlogPost) => {
    setIsNavigating(true)
    router.push(`/dashboard/blog/${post._id}/view`)
  }

  const handleEdit = (post: BlogPost) => {
    setIsNavigating(true)
    router.push(`/dashboard/blog/${post._id}/edit-page`)
  }

  const handleComments = (post: BlogPost) => {
    setIsNavigating(true)
    router.push(`/dashboard/blog/${post._id}/comments`)
  }

  const handlePreview = (post: BlogPost) => {
    // Navigate to view page instead of opening preview dialog
    setIsNavigating(true)
    router.push(`/dashboard/blog/${post._id}/view`)
  }

  const handleDelete = async (id: string) => {
    if (!accessToken) return

    // Show confirmation toast with action buttons
    toast.warning("Delete Blog Post", {
      description: "Are you sure you want to delete this blog post? This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deletePost(id, accessToken)
            toast.success("Success", {
              description: "Blog post deleted successfully",
            })
          } catch (error) {
            toast.error("Error", {
              description: error instanceof Error ? error.message : "Failed to delete blog post",
            })
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {
          toast.info("Cancelled", {
            description: "Blog post deletion cancelled",
          })
        },
      },
    })
  }

  const handleBulkDelete = async () => {
    if (!accessToken || selectedIds.size === 0) return

    toast.warning(`Delete ${selectedIds.size} Blog Posts`, {
      description: `Are you sure you want to delete ${selectedIds.size} blog post${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`,
      action: {
        label: "Delete All",
        onClick: async () => {
          setIsDeleting(true)
          let successCount = 0
          let errorCount = 0

          for (const id of selectedIds) {
            try {
              await deletePost(id, accessToken)
              successCount++
            } catch (error) {
              errorCount++
              console.error(`Failed to delete post ${id}:`, error)
            }
          }

          setIsDeleting(false)
          setSelectedIds(new Set())

          if (successCount > 0) {
            toast.success("Bulk Delete Complete", {
              description: `Successfully deleted ${successCount} blog post${successCount > 1 ? 's' : ''}${errorCount > 0 ? `. Failed to delete ${errorCount}.` : ''}`,
            })
          } else {
            toast.error("Bulk Delete Failed", {
              description: `Failed to delete all ${errorCount} blog post${errorCount > 1 ? 's' : ''}`,
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredPosts.map(post => post._id))
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

  const handleToggleStatus = async (id: string, isPublished: boolean) => {
    if (!accessToken) return

    try {
      await togglePublishStatus(id, isPublished, accessToken)
      toast.success("Status Updated", {
        description: `Blog post ${isPublished ? "published" : "unpublished"} successfully`,
      })
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to update status",
      })
    }
  }

  const handleAddPost = () => {
    setIsNavigating(true)
    router.push("/dashboard/blog/add")
  }

  const handleExportToExcel = () => {
    try {
      const fileName = exportBlogsToExcel(filteredPosts, 'blog_posts_export')
      toast.success("Export Successful", {
        description: `Downloaded ${filteredPosts.length} blog posts to ${fileName}`,
      })
    } catch (error) {
      toast.error("Export Failed", {
        description: error instanceof Error ? error.message : "Failed to export blog posts",
      })
    }
  }

  const handleBulkUploadSuccess = () => {
    if (accessToken) {
      fetchPosts(accessToken)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
            <p className="text-muted-foreground mt-1">
              Manage your blog content ({filteredPosts.length}{" "}
              {filteredPosts.length === 1 ? "post" : "posts"})
              {selectedIds.size > 0 && (
                <span className="text-primary"> • {selectedIds.size} selected</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                disabled={isDeleting}
                className="rounded-lg gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete {selectedIds.size}
              </Button>
            )}
            <Button
              onClick={handleExportToExcel}
              variant="outline"
              className="rounded-lg gap-2 cursor-pointer"
              disabled={filteredPosts.length === 0}
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
              onClick={handleAddPost}
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
                  New Post
                </>
              )}
            </Button>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <BlogFilters
            search={search}
            onSearchChange={setSearch}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            category={categoryFilter}
            onCategoryChange={setCategoryFilter}
            categories={blogCategories}
            onClear={handleClearFilters}
          />
        </Card>

        <div className="space-y-4">
          <BlogTable
            posts={paginatedPosts}
            onView={handleView}
            onEdit={handleEdit}
            onComments={handleComments}
            onDelete={handleDelete}
            onPreview={handlePreview}
            onToggleStatus={handleToggleStatus}
            isLoading={isLoading || isNavigating}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            allFilteredIds={filteredPosts.map(p => p._id)}
            taxonomyNames={taxonomyNames}
          />

          {!isLoading && (
            <Card className="p-4">
              <BlogPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredPosts.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
              />
            </Card>
          )}
        </div>

        <BlogPreviewDialog
          open={previewDialogOpen}
          onOpenChange={setPreviewDialogOpen}
          post={selectedPost}
        />

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
