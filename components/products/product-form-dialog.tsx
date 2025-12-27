"use client"

import { useEffect } from "react"
import { useProductForm } from "@/hooks/use-product-form"
import { Product } from "@/lib/product-store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProductFormField } from "./product-form-field"
import { ProductTextareaField } from "./product-textarea-field"
import { ProductCheckboxField } from "./product-checkbox-field"
import { ProductSelectField } from "./product-select-field"
import { ImageUpload } from "./image-upload"
import { Save } from "lucide-react"

// Dropdown options
const CONCERN_OPTIONS = [
  { value: "Lines and Wrinkles", label: "Lines and Wrinkles" },
  { value: "Hydration and Glow", label: "Hydration and Glow" },
  { value: "Puffiness and Pigmentation", label: "Puffiness and Pigmentation" },
  { value: "Dark Skin (Whitening)", label: "Dark Skin (Whitening)" },
]

const CATEGORIES_OPTIONS = [
  { value: "Anti Aging", label: "Anti Aging" },
  { value: "Eye Care", label: "Eye Care" },
  { value: "Body Care", label: "Body Care" },
  { value: "Instant Face Lift", label: "Instant Face Lift" },
  { value: "Neck", label: "Neck" },
  { value: "Masks", label: "Masks" },
]

const COLLECTION_OPTIONS = [
  { value: "Prestige Line", label: "Prestige Line" },
]

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSubmit: (formData: FormData) => Promise<void>
  isLoading: boolean
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSubmit,
  isLoading,
}: ProductFormDialogProps) {
  const { formData, images, updateField, setImages, buildFormData, resetForm } = useProductForm()

  useEffect(() => {
    if (product && open) {
      updateField("title", product.title)
      updateField("sku", product.sku)
      updateField("brand", product.brand)
      updateField("price", product.price.toString())
      updateField("compareAtPrice", product.compareAtPrice?.toString() || "")
      updateField("stock", product.stock.toString())
      updateField("shortDescription", product.shortDescription)
      updateField("description", product.description || "")
      updateField("concern", product.concern?.[0] || "")
      updateField("categories", product.categories?.[0] || "")
      updateField("collection", product.collection || "")
      updateField("isActive", product.isActive)
      updateField("isFeatured", product.isFeatured)

      // Load existing images
      if (product.images && product.images.length > 0) {
        const existingImages = product.images.map(img => ({
          url: img.url,
          preview: img.url,
          altText: img.altText || "",
        }))
        setImages(existingImages)
      }
    } else if (!open) {
      resetForm()
    }
  }, [product, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const form = buildFormData()
      await onSubmit(form)
      // Only reset and close if successful
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error("Form submission error:", error)
      // Error is already handled in the parent component with toast
      // Don't close the dialog so user can fix the issue
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{product ? "Edit Product" : "Create Product"}</DialogTitle>
          <DialogDescription>
            {product ? "Update product information" : "Add a new product to your catalog"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] px-6">
          <form onSubmit={handleSubmit} className="space-y-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProductFormField
                label="Product Title"
                name="title"
                value={formData.title}
                onChange={(value) => updateField("title", value)}
                placeholder="e.g., Premium Face Cream"
                required
              />
              <ProductFormField
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={(value) => updateField("sku", value)}
                placeholder="e.g., PFC-001"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProductFormField
                label="Brand"
                name="brand"
                value={formData.brand}
                onChange={(value) => updateField("brand", value)}
                placeholder="e.g., CanaGold"
                required
              />
              <ProductFormField
                label="Stock Quantity"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={(value) => updateField("stock", value)}
                placeholder="100"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProductFormField
                label="Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={(value) => updateField("price", value)}
                placeholder="99.99"
                prefix="₹"
                required
              />
              <div className="space-y-1">
                <ProductFormField
                  label="Compare at Price (Optional)"
                  name="compareAtPrice"
                  type="number"
                  value={formData.compareAtPrice}
                  onChange={(value) => updateField("compareAtPrice", value)}
                  placeholder="Leave empty if no comparison price"
                  prefix="₹"
                />
                <p className="text-xs text-muted-foreground">
                  Original price before discount. Must be greater than regular price. Leave empty to remove.
                </p>
              </div>
            </div>

            <ProductFormField
              label="Short Description"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={(value) => updateField("shortDescription", value)}
              placeholder="Brief product description (max 500 characters)"
              required
            />

            <ProductTextareaField
              label="Full Description"
              name="description"
              value={formData.description}
              onChange={(value) => updateField("description", value)}
              placeholder="Detailed product information, features, and benefits..."
              rows={6}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ProductSelectField
                label="Concern"
                name="concern"
                value={formData.concern}
                onChange={(value) => updateField("concern", value)}
                options={CONCERN_OPTIONS}
                placeholder="Select concern"
                required
              />
              <ProductSelectField
                label="Category"
                name="categories"
                value={formData.categories}
                onChange={(value) => updateField("categories", value)}
                options={CATEGORIES_OPTIONS}
                placeholder="Select category"
                required
              />
              <ProductSelectField
                label="Collection"
                name="collection"
                value={formData.collection}
                onChange={(value) => updateField("collection", value)}
                options={COLLECTION_OPTIONS}
                placeholder="Select collection"
                required
              />
            </div>

            <ImageUpload images={images} onChange={setImages} maxImages={5} />

            <div className="flex gap-6">
              <ProductCheckboxField
                label="Active"
                name="isActive"
                checked={formData.isActive}
                onChange={(checked) => updateField("isActive", checked)}
                description="Product is visible and available"
              />
              <ProductCheckboxField
                label="Featured"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={(checked) => updateField("isFeatured", checked)}
                description="Display in featured section"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 rounded-lg"
              >
                {isLoading ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {product ? "Update Product" : "Create Product"}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
