"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Search, Image as ImageIcon, FolderPlus, Package } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { useAuthStore } from "@/lib/auth-store"

interface Category {
    _id: string
    name: string
    slug: string
    type: string
    parentId?: string | null
    position: number
    isActive: boolean
    description?: string
    image?: {
        url: string
        publicId: string
        alt: string
    }
    children?: Category[]
    createdAt: string
    updatedAt: string
}

export default function CategoriesPage() {
    const { accessToken } = useAuthStore()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [showModal, setShowModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showSubcategoryModal, setShowSubcategoryModal] = useState(false)
    const [showProductsModal, setShowProductsModal] = useState(false)
    const [viewingCategory, setViewingCategory] = useState<Category | null>(null)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        description: ""
    })
    const [subcategoryForms, setSubcategoryForms] = useState([{ name: "", description: "" }])
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>("")
    const [submitting, setSubmitting] = useState(false)
    const [products, setProducts] = useState<any[]>([])
    const [selectedProducts, setSelectedProducts] = useState<string[]>([])
    const [productSearch, setProductSearch] = useState("")
    const [loadingProducts, setLoadingProducts] = useState(false)
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
    const [showClearConfirm, setShowClearConfirm] = useState(false)

    useEffect(() => {
        if (accessToken) {
            fetchCategories()
        }
    }, [accessToken])

    const fetchCategories = async () => {
        try {
            setLoading(true)
            // Fetch both categories and subcategories (including inactive)
            const [categoriesRes, subcategoriesRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/type/category?includeInactive=true`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/type/subcategory?includeInactive=true`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                })
            ])

            const [categoriesData, subcategoriesData] = await Promise.all([
                categoriesRes.json(),
                subcategoriesRes.json()
            ])

            if (categoriesData.success && subcategoriesData.success) {
                // Filter out Gift Set category (it's managed separately)
                const filteredCategories = categoriesData.data.filter((cat: Category) => 
                    cat.name.toLowerCase() !== 'gift set' && cat.name.toLowerCase() !== 'gift sets'
                );
                
                // Build hierarchy
                const categoriesWithChildren = filteredCategories.map((cat: Category) => ({
                    ...cat,
                    children: subcategoriesData.data.filter((sub: Category) => sub.parentId === cat._id)
                }))
                setCategories(categoriesWithChildren)
            }
        } catch (error) {
            console.error("Error fetching categories:", error)
            toast.error("Failed to fetch categories")
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

            // When creating new, always set as category. When editing, preserve the type
            if (editingCategory) {
                formDataToSend.append("type", editingCategory.type)
                if (editingCategory.parentId) {
                    formDataToSend.append("parentId", editingCategory.parentId)
                }
            } else {
                formDataToSend.append("type", "category")
            }

            if (formData.description) {
                formDataToSend.append("description", formData.description)
            }

            if (imageFile) {
                formDataToSend.append("image", imageFile)
            }

            const url = editingCategory
                ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/${editingCategory._id}`
                : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies`

            const response = await fetch(url, {
                method: editingCategory ? "PUT" : "POST",
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
                const itemType = editingCategory?.type === "subcategory" ? "Subcategory" : "Category"
                toast.success(editingCategory ? `${itemType} updated successfully` : "Category created successfully")
                setShowModal(false)
                resetForm()
                fetchCategories()
            } else {
                toast.error(data.message || "Failed to save")
            }
        } catch (error) {
            console.error("Error saving category:", error)
            const errorMessage = error instanceof Error ? error.message : "Failed to save category"
            toast.error(errorMessage)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteClick = (category: Category) => {
        setDeletingCategory(category)
    }

    const confirmDelete = async () => {
        if (!deletingCategory) return

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/${deletingCategory._id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })

            const data = await response.json()

            if (data.success) {
                toast.success(`${deletingCategory.type === 'category' ? 'Category' : 'Subcategory'} deleted successfully`)
                setDeletingCategory(null)
                fetchCategories()
            } else {
                toast.error(data.message || "Failed to delete")
            }
        } catch (error) {
            console.error("Error deleting:", error)
            toast.error("Failed to delete")
        }
    }

    const handleView = (category: Category) => {
        setViewingCategory(category)
        setShowDetailModal(true)
    }

    const handleEdit = (category: Category) => {
        setEditingCategory(category)
        setFormData({
            name: category.name,
            description: category.description || ""
        })
        setImagePreview(category.image?.url || "")
        setShowModal(true)
    }

    const handleAddSubcategories = (category: Category) => {
        setSelectedCategory(category)
        setSubcategoryForms([{ name: "", description: "" }])
        setShowSubcategoryModal(true)
    }

    const handleAddProducts = async (category: Category) => {
        setSelectedCategory(category)
        setSelectedProducts([])
        setShowProductsModal(true)
        await fetchProducts(category._id)
    }

    const fetchProducts = async (categoryId: string) => {
        setLoadingProducts(true)
        try {
            // Fetch available products (not assigned to other categories)
            const productsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/${categoryId}/available-products?limit=200`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })
            const productsData = await productsResponse.json()

            if (productsData.success) {
                setProducts(productsData.data.products || [])

                // Pre-select products that are already in this category/subcategory
                const existingProductIds = productsData.data.products
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

    const handleToggleStatus = async (category: Category, e: React.MouseEvent) => {
        e.stopPropagation()

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/${category._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    isActive: !category.isActive
                })
            })

            const data = await response.json()

            if (data.success) {
                toast.success(`Category ${!category.isActive ? 'activated' : 'deactivated'}`)
                fetchCategories()
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
        if (!selectedCategory || selectedProducts.length === 0) {
            toast.error("Please select at least one product")
            return
        }

        setSubmitting(true)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/${selectedCategory._id}/products`, {
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
        if (!selectedCategory) return

        setSubmitting(true)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/${selectedCategory._id}/products/clear-all`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })

            const result = await response.json()

            if (result.success) {
                toast.success(`Successfully removed ${result.data.modifiedCount} product(s) from ${selectedCategory.name}`)
                setShowClearConfirm(false)
                setShowProductsModal(false)
                setSelectedProducts([])
                fetchCategories()
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

    const addSubcategoryForm = () => {
        setSubcategoryForms([...subcategoryForms, { name: "", description: "" }])
    }

    const removeSubcategoryForm = (index: number) => {
        setSubcategoryForms(subcategoryForms.filter((_, i) => i !== index))
    }

    const updateSubcategoryForm = (index: number, field: string, value: string) => {
        const updated = [...subcategoryForms]
        updated[index] = { ...updated[index], [field]: value }
        setSubcategoryForms(updated)
    }

    const handleSubmitSubcategories = async () => {
        if (!selectedCategory) return

        setSubmitting(true)
        try {
            const validForms = subcategoryForms.filter(form => form.name.trim())

            if (validForms.length === 0) {
                toast.error("Please enter at least one subcategory name")
                return
            }

            const promises = validForms.map(form =>
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({
                        name: form.name,
                        description: form.description,
                        type: "subcategory",
                        parentId: selectedCategory._id
                    })
                })
            )

            const responses = await Promise.all(promises)
            const results = await Promise.all(responses.map(r => r.json()))

            const successCount = results.filter(r => r.success).length

            if (successCount > 0) {
                toast.success(`Successfully added ${successCount} subcategory(ies)`)
                setShowSubcategoryModal(false)
                setSubcategoryForms([{ name: "", description: "" }])
                fetchCategories()
            } else {
                toast.error("Failed to add subcategories")
            }
        } catch (error) {
            console.error("Error adding subcategories:", error)
            toast.error("Failed to add subcategories")
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
        setEditingCategory(null)
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

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const renderCategoryRow = (category: Category, level = 0): React.ReactElement[] => {
        return [
            <tr key={category._id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => handleView(category)}>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
                        {level > 0 && <span className="text-muted-foreground">└─</span>}
                        {category.image?.url ? (
                            <Image
                                src={category.image.url}
                                alt={category.name}
                                width={40}
                                height={40}
                                className="rounded object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <ImageIcon size={20} className="text-muted-foreground" />
                            </div>
                        )}
                        <span className="font-medium">{category.name}</span>
                    </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{category.slug}</td>
                <td className="px-4 py-3">
                    <button
                        onClick={(e) => handleToggleStatus(category, e)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${category.isActive ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                        title={category.isActive ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${category.isActive ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                        {category.type === "category" && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleAddSubcategories(category)
                                    }}
                                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                    title="Add Subcategories"
                                >
                                    <FolderPlus size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleAddProducts(category)
                                    }}
                                    className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                                    title="Add Products"
                                >
                                    <Package size={16} />
                                </button>
                            </>
                        )}
                        {category.type === "subcategory" && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleAddProducts(category)
                                }}
                                className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                                title="Add Products"
                            >
                                <Package size={16} />
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(category)
                            }}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Edit"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(category)
                            }}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </td>
            </tr>,
            ...(category.children?.flatMap(child => renderCategoryRow(child, level + 1)) || [])
        ]
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Product Categories</h1>
                    <p className="text-muted-foreground mt-1">Manage product categories and subcategories</p>
                </div>
                <button
                    onClick={() => {
                        resetForm()
                        setShowModal(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                    <Plus size={20} />
                    Add Category
                </button>
            </div>

            <div className="bg-card rounded-lg border p-4">
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <input
                            type="text"
                            placeholder="Search categories..."
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
                                {filteredCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                                            No categories found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCategories.map(category => renderCategoryRow(category))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-2xl font-bold">
                                {editingCategory
                                    ? `Edit ${editingCategory.type === "subcategory" ? "Subcategory" : "Category"}`
                                    : "Add Category"}
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
                                    placeholder={`Enter ${editingCategory?.type === "subcategory" ? "subcategory" : "category"} name`}
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
                                    placeholder="Enter category description"
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
                                    {submitting ? "Saving..." : editingCategory ? "Update" : "Create"}
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
            {showDetailModal && viewingCategory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
                    <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b flex items-center justify-between">
                            <h2 className="text-2xl font-bold">Taxonomy Details</h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Image */}
                            {viewingCategory.image?.url && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Image</label>
                                    <Image
                                        src={viewingCategory.image.url}
                                        alt={viewingCategory.name}
                                        width={200}
                                        height={200}
                                        className="rounded-lg object-cover border"
                                    />
                                </div>
                            )}

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
                                    <p className="text-lg font-semibold">{viewingCategory.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Slug</label>
                                    <p className="text-lg font-mono">{viewingCategory.slug}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Type</label>
                                    <p className="text-lg capitalize">{viewingCategory.type}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${viewingCategory.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {viewingCategory.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            {viewingCategory.description && (
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                                    <p className="text-base">{viewingCategory.description}</p>
                                </div>
                            )}

                            {/* Subcategories */}
                            {viewingCategory.children && viewingCategory.children.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Subcategories ({viewingCategory.children.length})</label>
                                    <div className="space-y-2">
                                        {viewingCategory.children.map((child) => (
                                            <div key={child._id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                                {child.image?.url ? (
                                                    <Image
                                                        src={child.image.url}
                                                        alt={child.name}
                                                        width={32}
                                                        height={32}
                                                        className="rounded object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                                                        <ImageIcon size={16} className="text-muted-foreground" />
                                                    </div>
                                                )}
                                                <span>{child.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Created At</label>
                                    <p className="text-sm">{new Date(viewingCategory.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Updated At</label>
                                    <p className="text-sm">{new Date(viewingCategory.updatedAt).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false)
                                        handleEdit(viewingCategory)
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

            {/* Add Subcategories Modal */}
            {showSubcategoryModal && selectedCategory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-2xl font-bold">Add Subcategories to {selectedCategory.name}</h2>
                            <p className="text-sm text-muted-foreground mt-1">Add one or multiple subcategories at once</p>
                        </div>

                        <div className="p-6 space-y-4">
                            {subcategoryForms.map((form, index) => (
                                <div key={index} className="p-4 border rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">Subcategory {index + 1}</h3>
                                        {subcategoryForms.length > 1 && (
                                            <button
                                                onClick={() => removeSubcategoryForm(index)}
                                                className="text-red-600 hover:text-red-700 text-sm"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Name *</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => updateSubcategoryForm(index, "name", e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="Enter subcategory name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                                        <textarea
                                            value={form.description}
                                            onChange={(e) => updateSubcategoryForm(index, "description", e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            rows={2}
                                            placeholder="Enter description"
                                        />
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={addSubcategoryForm}
                                className="w-full py-2 border-2 border-dashed rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={20} />
                                Add Another Subcategory
                            </button>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    onClick={handleSubmitSubcategories}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {submitting ? "Creating..." : "Create Subcategories"}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSubcategoryModal(false)
                                        setSubcategoryForms([{ name: "", description: "" }])
                                    }}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Products Modal */}
            {showProductsModal && selectedCategory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-2xl font-bold">Manage Products for {selectedCategory.name}</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Select products to add to this {selectedCategory.type}. Products can be in multiple categories. Products with ✓ are already in this {selectedCategory.type}.
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Search */}
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

                            {/* Selected Count */}
                            {selectedProducts.length > 0 && (
                                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                                    {selectedProducts.length} product(s) selected
                                </div>
                            )}

                            {/* Products List */}
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
                                        Clear All Products from {selectedCategory?.name}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingCategory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
                        <p className="text-muted-foreground mb-6">
                            Are you sure you want to delete <span className="font-semibold text-foreground">"{deletingCategory.name}"</span>?
                            {deletingCategory.children && deletingCategory.children.length > 0 && (
                                <span className="block mt-2 text-amber-600">
                                    This category has {deletingCategory.children.length} subcategory(ies).
                                </span>
                            )}
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setDeletingCategory(null)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear All Products Confirmation Modal */}
            {showClearConfirm && selectedCategory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
                    <div className="bg-card rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4 text-red-600">Clear All Products?</h2>
                        <p className="text-muted-foreground mb-6">
                            Are you sure you want to remove <span className="font-semibold text-foreground">ALL products</span> from{" "}
                            <span className="font-semibold text-foreground">"{selectedCategory.name}"</span>?
                            <span className="block mt-2 text-amber-600">
                                This will unassign all products from this {selectedCategory.type}. This action cannot be undone.
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
