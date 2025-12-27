import { useState } from "react"

export interface ProductFormData {
  title: string
  sku: string
  brand: string
  price: string
  compareAtPrice: string
  stock: string
  shortDescription: string
  description: string
  concern: string
  categories: string
  collection: string
  isActive: boolean
  isFeatured: boolean
}

export interface ImagePreview {
  file?: File
  preview: string
  altText: string
  url?: string
}

export function useProductForm() {
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    sku: "",
    brand: "",
    price: "",
    compareAtPrice: "",
    stock: "",
    shortDescription: "",
    description: "",
    concern: "",
    categories: "",
    collection: "",
    isActive: true,
    isFeatured: false,
  })

  const [images, setImages] = useState<ImagePreview[]>([])

  const updateField = (field: keyof ProductFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const buildFormData = (): FormData => {
    // Validate required fields
    if (!formData.title.trim()) {
      throw new Error("Product title is required")
    }
    if (!formData.sku.trim()) {
      throw new Error("SKU is required")
    }
    if (!formData.brand.trim()) {
      throw new Error("Brand is required")
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      throw new Error("Valid price is required")
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      throw new Error("Valid stock quantity is required")
    }
    if (!formData.shortDescription.trim()) {
      throw new Error("Short description is required")
    }

    // Validate compareAtPrice if provided
    const price = parseFloat(formData.price)
    const compareAtPriceStr = formData.compareAtPrice?.toString().trim()
    const compareAtPrice = compareAtPriceStr ? parseFloat(compareAtPriceStr) : 0
    
    if (compareAtPrice > 0 && compareAtPrice <= price) {
      throw new Error(`Compare at price ($${compareAtPrice}) must be greater than regular price ($${price})`)
    }

    const form = new FormData()
    
    // Required fields
    form.append("type", "single")
    form.append("title", formData.title.trim())
    form.append("sku", formData.sku.trim())
    form.append("brand", formData.brand.trim())
    form.append("price", price.toString())
    form.append("stock", formData.stock)
    form.append("shortDescription", formData.shortDescription.trim())
    form.append("isActive", formData.isActive ? "true" : "false")
    form.append("isFeatured", formData.isFeatured ? "true" : "false")
    
    // Optional fields - only add compareAtPrice if it's valid and greater than price
    if (compareAtPrice > price) {
      form.append("compareAtPrice", compareAtPrice.toString())
      console.log(`✓ Compare at price: $${compareAtPrice} > $${price}`)
    } else if (compareAtPriceStr && compareAtPrice > 0) {
      console.warn(`✗ Skipping invalid compareAtPrice: $${compareAtPrice} <= $${price}`)
    }
    
    if (formData.description && formData.description.trim()) {
      form.append("description", formData.description.trim())
    }
    
    // Auto-generate slug from title
    const slug = formData.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    form.append("slug", slug)

    // Add new fields
    if (formData.concern && formData.concern.trim()) {
      form.append("concern", formData.concern.trim())
    }
    if (formData.categories && formData.categories.trim()) {
      form.append("categories", formData.categories.trim())
    }
    if (formData.collection && formData.collection.trim()) {
      form.append("collection", formData.collection.trim())
    }

    // Add new images only (files, not URLs)
    const newImages = images.filter(img => img.file)
    newImages.forEach((image) => {
      form.append("images", image.file!)
    })

    // Debug: Log FormData contents
    console.log("=== FormData Contents ===")
    console.log(`Price: $${price}`)
    console.log(`Compare At Price: $${compareAtPrice > 0 ? compareAtPrice : 'Not set'}`)
    console.log(`Validation: ${compareAtPrice > price ? '✓ Valid' : compareAtPrice > 0 ? '✗ Invalid' : 'N/A'}`)
    console.log("All fields:")
    for (const [key, value] of form.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`)
      } else {
        console.log(`  ${key}: ${value}`)
      }
    }
    console.log("=========================")

    return form
  }

  const resetForm = () => {
    setFormData({
      title: "",
      sku: "",
      brand: "",
      price: "",
      compareAtPrice: "",
      stock: "",
      shortDescription: "",
      description: "",
      concern: "",
      categories: "",
      collection: "",
      isActive: true,
      isFeatured: false,
    })
    images.forEach((img) => {
      if (img.preview && !img.url) {
        URL.revokeObjectURL(img.preview)
      }
    })
    setImages([])
  }

  return {
    formData,
    images,
    updateField,
    setImages,
    buildFormData,
    resetForm,
  }
}
