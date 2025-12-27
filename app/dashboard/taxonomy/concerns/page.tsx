"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Search, Image as ImageIcon, Package } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { useAuthStore } from "@/lib/auth-store"

interface Concern {
    _id: string
    name: string
    slug: string
    type: string
    position: number
    isActive: boolean
    description?: string
    image?: {
        url: string
        publicId: string
        alt: string
    }
    createdAt: string
    updatedAt: string
}

export default function ConcernsPage() {
    const { accessToken } = useAuthStore()
    const [concerns, setConcerns] = useState<Concern[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [showModal, setShowModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showProductsModal, setShowProductsModal] = useState(false)
    const [viewingConcern, setViewingConcern] = useState<Concern | null>(null)
    const [editingConcern, setEditingConcern] = useState<Concern | null>(null)
    const [selectedConcern, setSelectedConcern] = useState<Concern | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        description: ""
    })
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>("")
    const [submitting, setSubmitting] = useState(false)
    const [products, setProducts] = useState<any[]>([])
    const [selectedProducts, setSelectedProducts] = useState<string[]>([])
    const [productSearch, setProductSearch] = useState("")
    const [loadingProducts, setLoadingProducts] = useState(false)
    const [deletingConcern, setDeletingConcern] = useState<Concern | null>(null)
    const [showClearConfirm, setShowClearConfirm] = useState(false)

    useEffect(() => {
        if (accessToken) {
            fetchConcerns()
        }
    }, [accessToken])

    const fetchConcerns = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/type/concern?includeInactive=true`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })

            const data = await response.json()
            if (data.success) {
                setConcerns(data.data)
            }
        } catch (error) {
            console.error("Error fetching concerns:", error)
            toast.error("Failed to fetch concerns")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const formDataToSend = new FormData()
            formDataToSend.append("name", formData.name)
            formDataToSend.append("type", "concern")

            if (formData.description) {
                formDataToSend.append("description", formData.description)
            }

            if (imageFile) {
                formDataToSend.append("image", imageFile)
            }

            const url = editingConcern
                ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/${editingConcern._id}`
                : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies`

            const response = await fetch(url, {
                method: editingConcern ? "PUT" : "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                body: formDataToSend
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.success) {
                toast.success(editingConcern ? "Concern updated successfully" : "Concern created successfully")
                setShowModal(false)
                resetForm()
                fetchConcerns()
            } else {
                toast.error(data.message || "Failed to save concern")
            }
        } catch (error) {
            console.error("Error saving concern:", error)
            const errorMessage = error instanceof Error ? error.message : "Failed to save concern"
            toast.error(errorMessage)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteClick = (concern: Concern) => {
        setDeletingConcern(concern)
    }

    const confirmDelete = async () => {
        if (!deletingConcern) return

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/${deletingConcern._id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })

            const data = await response.json()

            if (data.success) {
                toast.success("Concern deleted successfully")
                setDeletingConcern(null)
                fetchConcerns()
            } else {
                toast.error(data.message || "Failed to delete concern")
            }
        } catch (error) {
            console.error("Error deleting concern:", error)
            toast.error("Failed to delete concern")
        }
    }

    const handleView = (concern: Concern) => {
        setViewingConcern(concern)
        setShowDetailModal(true)
    }

    const handleEdit = (concern: Concern) => {
        setEditingConcern(concern)
        setFormData({
            name: concern.name,
            description: concern.description || ""
        })
        setImagePreview(concern.image?.url || "")
        setShowModal(true)
    }

    const handleAddProducts = async (concern: Concern) => {
        setSelectedConcern(concern)
        setSelectedProducts([])
        setShowProductsModal(true)
        await fetchProducts(concern._id)
    }

    const fetchProducts = async (concernId: string) => {
        setLoadingProducts(true)
        try {
            const productsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products?limit=200`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })
            const productsData = await productsResponse.json()

            if (productsData.success) {
                const allProducts = productsData.data.products || []

                // Mark products already in this concern
                const productsWithStatus = allProducts.map((product: any) => ({
                    ...product,
                    isInTaxonomy: product.concerns?.some((c: any) => {
                        const cId = typeof c === 'object' ? c._id : c
                        return cId?.toString() === concernId
                    })
                }))

                setProducts(productsWithStatus)

                // Pre-select products already in this concern
                const existingProductIds = productsWithStatus
                    .filter((p: any) => p.isInTaxonomy)
                    .map((p: any) => p._id)

                setSelectedProducts(existingProductIds)
            }
        } catch (error) {
            console.error("Error fetching products:", error)
            toast.error("Failed to fetch products")
        } finally {
            setLoadingProducts(false)
        }
    }

    const handleToggleStatus = async (concern: Concern, e: React.MouseEvent) => {
        e.stopPropagation()

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/${concern._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    isActive: !concern.isActive
                })
            })

            const data = await response.json()

            if (data.success) {
                toast.success(`Concern ${!concern.isActive ? 'activated' : 'deactivated'}`)
                fetchConcerns()
            } else {
                toast.error(data.message || "Failed to update status")
            }
        } catch (error) {
            console.error("Error updating status:", error)
            toast.error("Failed to update status")
        }
    }

    const toggleProductSelection = (productId: string) => {
        setSelectedProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        )
    }

    const handleSubmitProducts = async () => {
        if (!selectedConcern || selectedProducts.length === 0) {
            toast.error("Please select at least one product")
            return
        }

        setSubmitting(true)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/${selectedConcern._id}/products`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify({ productIds: selectedProducts })
            })

            const result = await response.json()

            if (result.success) {
                toast.success(`Successfully updated products`)
                setShowProductsModal(false)
                setSelectedProducts([])
            } else {
                toast.error(result.message || "Failed to add products")
            }
        } catch (error) {
            console.error("Error adding products:", error)
            toast.error("Failed to add products")
        } finally {
            setSubmitting(false)
        }
    }

    const handleClearAllProducts = async () => {
        if (!selectedConcern) return

        setSubmitting(true)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/${selectedConcern._id}/products/clear-all`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })

            const result = await response.json()

            if (result.success) {
                toast.success(`Successfully removed ${result.data.modifiedCount} product(s) from ${selectedConcern.name}`)
                setShowClearConfirm(false)
                setShowProductsModal(false)
                setSelectedProducts([])
                fetchConcerns()
            } else {
                toast.error(result.message || "Failed to clear products")
            }
        } catch (error) {
            console.error("Error clearing products:", error)
            toast.error("Failed to clear products")
        } finally {
            setSubmitting(false)
        }
    }

    const resetForm = () => {
        setFormData({
            name: "",
            description: ""
        })
        setImageFile(null)
        setImagePreview("")
        setEditingConcern(null)
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const filteredConcerns = concerns.filter(con =>
        con.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        con.slug.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Concerns</h1>
                    <p className="text-muted-foreground mt-1">Manage skin concerns</p>
                </div>
                <button
                    onClick={() => {
                        resetForm()
                        setShowModal(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                    <Plus size={20} />
                    Add Concern
                </button>
            </div>

            <div className="bg-card rounded-lg border p-4">
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <input
                            type="text"
                            placeholder="Search concerns..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                                    <th className="px-4 py-3 text-left font-semibold">Slug</th>
                                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredConcerns.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                                            No concerns found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredConcerns.map(concern => (
                                        <tr key={concern._id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => handleView(concern)}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {concern.image?.url ? (
                                                        <Image
                                                            src={concern.image.url}
                                                            alt={concern.name}
                                                            width={40}
                                                            height={40}
                                                            className="rounded object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                                            <ImageIcon size={20} className="text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <span className="font-medium">{concern.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{concern.slug}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={(e) => handleToggleStatus(concern, e)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${concern.isActive ? 'bg-green-600' : 'bg-gray-300'}`}
                                                    title={concern.isActive ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${concern.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                                                    />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleAddProducts(concern)
                                                        }}
                                                        className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                                                        title="Add Products"
                                                    >
                                                        <Package size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleEdit(concern)
                                                        }}
                                                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteClick(concern)
                                                        }}
                                                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>


            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-2xl font-bold">
                                {editingConcern ? "Edit Concern" : "Add Concern"}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                    placeholder="Enter concern name"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Slug will be auto-generated from the name
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    rows={3}
                                    placeholder="Enter concern description"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Image (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                {imagePreview && (
                                    <div className="mt-2">
                                        <Image src={imagePreview} alt="Preview" width={100} height={100} className="rounded object-cover" />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {submitting ? "Saving..." : editingConcern ? "Update" : "Create"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false)
                                        resetForm()
                                    }}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail View Modal */}
            {showDetailModal && viewingConcern && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
                    <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b flex items-center justify-between">
                            <h2 className="text-2xl font-bold">Concern Details</h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {viewingConcern.image?.url && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Image</label>
                                    <Image
                                        src={viewingConcern.image.url}
                                        alt={viewingConcern.name}
                                        width={200}
                                        height={200}
                                        className="rounded-lg object-cover border"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
                                    <p className="text-lg font-semibold">{viewingConcern.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Slug</label>
                                    <p className="text-lg font-mono">{viewingConcern.slug}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Type</label>
                                    <p className="text-lg capitalize">{viewingConcern.type}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${viewingConcern.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {viewingConcern.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            {viewingConcern.description && (
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                                    <p className="text-base">{viewingConcern.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Created At</label>
                                    <p className="text-sm">{new Date(viewingConcern.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Updated At</label>
                                    <p className="text-sm">{new Date(viewingConcern.updatedAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false)
                                        handleEdit(viewingConcern)
                                    }}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Products Modal */}
            {showProductsModal && selectedConcern && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-2xl font-bold">Manage Products for {selectedConcern.name}</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Products can have multiple concerns. Products with ✓ are already in this concern.
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {selectedProducts.length > 0 && (
                                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                                    {selectedProducts.length} product(s) selected
                                </div>
                            )}

                            <div className="border rounded-lg max-h-96 overflow-y-auto">
                                {loadingProducts ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : products.length === 0 ? (
                                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                                        No products found.
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {products
                                            .filter((product: any) =>
                                                product.title.toLowerCase().includes(productSearch.toLowerCase()) ||
                                                product.slug.toLowerCase().includes(productSearch.toLowerCase()) ||
                                                (product.sku && product.sku.toLowerCase().includes(productSearch.toLowerCase()))
                                            )
                                            .map((product: any) => (
                                                <div
                                                    key={product._id}
                                                    className={`p-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3 ${product.isInTaxonomy ? 'bg-green-50' : ''}`}
                                                    onClick={() => toggleProductSelection(product._id)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProducts.includes(product._id)}
                                                        onChange={() => { }}
                                                        className="w-4 h-4"
                                                    />
                                                    {product.images?.[0]?.url ? (
                                                        <Image
                                                            src={product.images[0].url}
                                                            alt={product.title}
                                                            width={48}
                                                            height={48}
                                                            className="rounded object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                                            <ImageIcon size={24} className="text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium">{product.title}</p>
                                                            {product.isInTaxonomy && (
                                                                <span className="text-green-600 text-xs font-semibold">✓ Already Added</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{product.sku || product.slug}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold">${product.price}</p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 pt-4 border-t mt-4">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleSubmitProducts}
                                        disabled={submitting || selectedProducts.length === 0}
                                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                    >
                                        {submitting ? "Saving..." : `Save ${selectedProducts.length} Product(s)`}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowProductsModal(false)
                                            setSelectedProducts([])
                                            setProductSearch("")
                                        }}
                                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                <div className="pt-2 border-t">
                                    <button
                                        onClick={() => setShowClearConfirm(true)}
                                        disabled={submitting}
                                        className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                                    >
                                        <Trash2 size={18} />
                                        Clear All Products from {selectedConcern?.name}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingConcern && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
                        <p className="text-muted-foreground mb-6">
                            Are you sure you want to delete <span className="font-semibold text-foreground">"{deletingConcern.name}"</span>?
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setDeletingConcern(null)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear All Products Confirmation Modal */}
            {showClearConfirm && selectedConcern && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
                    <div className="bg-card rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4 text-red-600">Clear All Products?</h2>
                        <p className="text-muted-foreground mb-6">
                            Are you sure you want to remove <span className="font-semibold text-foreground">ALL products</span> from{" "}
                            <span className="font-semibold text-foreground">"{selectedConcern.name}"</span>?
                            <span className="block mt-2 text-amber-600">
                                This will unassign all products from this concern. This action cannot be undone.
                            </span>
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleClearAllProducts}
                                disabled={submitting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {submitting ? "Clearing..." : "Yes, Clear All"}
                            </button>
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                disabled={submitting}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


