"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Product } from "@/lib/product-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Save, ArrowLeft, Upload, X, Plus } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { sanitizeHtml } from "@/lib/html-utils"
import { useAuthStore } from "@/lib/auth-store"

// Taxonomy interfaces
interface TaxonomyOption {
  _id: string
  name: string
  slug: string
  subcategories?: TaxonomyOption[]
}

interface TaxonomiesData {
  categories: TaxonomyOption[]
}

interface PackageVariant {
  _id?: string
  weight: {
    value: number
    unit: string
  }
  sku: string
  price: number
  discount: {
    value: number
    type: 'percentage' | 'fixed'
  }
  stock: number
  isActive: boolean
  isDefault: boolean
}

interface ProductFormData {
  title: string
  shortDescription: string

  description: string
  usage: string
  categories: string[]
  subcategories: string[]
  isActive: boolean
  isFeatured: boolean
  codEnabled: boolean
  returnable: boolean
  returnWindowDays: string
  shippingCharges: string
  freeShippingThreshold: string
  freeShippingMinQuantity: string
  // New Fields
  subtitle: string
  origin: string
  grade: string
  certification: string
  storage: string
  characteristics: {
    color: string
    aroma: string
    taste: string
    crocin: string
    texture: string
    fulvicAcid: string
  }
}

interface ImagePreview {
  file?: File
  preview: string
  altText: string
  url?: string
}

interface ProductFormProps {
  product?: Product | null
  onSubmit: (formData: FormData) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const { accessToken } = useAuthStore()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
  } = useForm<ProductFormData>({
    defaultValues: {
      title: "",
      shortDescription: "",

      description: "",
      usage: "",
      categories: [],
      subcategories: [],
      isActive: true,
      isFeatured: false,
      codEnabled: false,
      returnable: true,
      returnWindowDays: "7",
      shippingCharges: "0",
      freeShippingThreshold: "0",
      freeShippingMinQuantity: "1",
      subtitle: "",
      origin: "",
      grade: "",
      certification: "",
      storage: "",
      characteristics: {
        color: "",
        aroma: "",
        taste: "",
        crocin: "",
        texture: "",
        fulvicAcid: ""
      }
    },
  })

  const [images, setImages] = useState<ImagePreview[]>([])
  const [videos, setVideos] = useState<Array<{ file?: File; preview: string; url?: string; title?: string }>>([])
  const [shortDescriptionContent, setShortDescriptionContent] = useState("")
  const [descriptionContent, setDescriptionContent] = useState("")
  const [usageContent, setUsageContent] = useState("")
  const [taxonomies, setTaxonomies] = useState<TaxonomiesData>({
    categories: []
  })
  const [loadingTaxonomies, setLoadingTaxonomies] = useState(true)
  const [packageVariants, setPackageVariants] = useState<PackageVariant[]>([])
  const [benefits, setBenefits] = useState<string[]>([])
  const [newBenefit, setNewBenefit] = useState("")

  const isActive = watch("isActive")
  const isFeatured = watch("isFeatured")
  const categories = watch("categories")
  const subcategories = watch("subcategories")
  const codEnabled = watch("codEnabled")
  const returnable = watch("returnable")
  const shippingCharges = watch("shippingCharges")
  const freeShippingThreshold = watch("freeShippingThreshold")

  useEffect(() => {
    if (product) {
      setValue("title", product.title)
      setValue("shortDescription", product.shortDescription)
      setValue("description", product.description || "")
      setValue("usage", (product as any).usage || "")

      // Handle categories - extract IDs from populated objects or use as-is
      const categoriesData = product.categories || (product as any).category ? [(product as any).category] : []
      const categoryIds = Array.isArray(categoriesData)
        ? categoriesData.map((c: any) => c && typeof c === 'object' && c._id ? c._id : c).filter(Boolean)
        : []
      setValue("categories", categoryIds)

      // Handle subcategories - extract IDs from populated objects or use as-is
      const subcategoriesData = product.subcategories || (product as any).subcategory ? [(product as any).subcategory] : []
      const subcategoryIds = Array.isArray(subcategoriesData)
        ? subcategoriesData.map((c: any) => c && typeof c === 'object' && c._id ? c._id : c).filter(Boolean)
        : []
      setValue("subcategories", subcategoryIds)

      setValue("isActive", product.isActive)
      setValue("isFeatured", product.isFeatured)
      setValue("codEnabled", product.cashOnDelivery?.enabled || false)
      setValue("returnable", product.returnPolicy?.returnable !== false)
      setValue("returnWindowDays", product.returnPolicy?.returnWindowDays?.toString() || "7")

      // Load shipping data
      setValue("shippingCharges", (product as any).shipping?.charges?.toString() || "0")
      setValue("freeShippingThreshold", (product as any).shipping?.freeShippingThreshold?.toString() || "0")
      setValue("freeShippingMinQuantity", (product as any).shipping?.freeShippingMinQuantity?.toString() || "1")

      // Set rich text editor content - decode HTML entities
      // Set rich text editor content - decode HTML entities
      setShortDescriptionContent(sanitizeHtml(product.shortDescription || ""))
      setDescriptionContent(sanitizeHtml(product.description || ""))
      setUsageContent(sanitizeHtml((product as any).usage || ""))

      // Load existing images
      if (product.images && product.images.length > 0) {
        const existingImages = product.images.map((img) => ({
          url: img.url,
          preview: img.url,
          altText: img.altText || "",
        }))
        setImages(existingImages)
      }

      // Load existing videos
      if (product.videos && product.videos.length > 0) {
        const existingVideos = product.videos.map((vid: any) => ({
          url: vid.url,
          preview: vid.url,
          title: vid.title || "",
        }))
        setVideos(existingVideos)
      }

      // Load existing package variants
      if ((product as any).packageVariants && (product as any).packageVariants.length > 0) {
        setPackageVariants((product as any).packageVariants)
      }

      // Load new fields
      setValue("subtitle", (product as any).subtitle || "")
      setValue("origin", (product as any).origin || "")
      setValue("grade", (product as any).grade || "")
      setValue("certification", (product as any).certification || "")
      setValue("storage", (product as any).storage || "")

      if ((product as any).characteristics) {
        setValue("characteristics.color", (product as any).characteristics.color || "")
        setValue("characteristics.aroma", (product as any).characteristics.aroma || "")
        setValue("characteristics.taste", (product as any).characteristics.taste || "")
        setValue("characteristics.crocin", (product as any).characteristics.crocin || "")
        setValue("characteristics.texture", (product as any).characteristics.texture || "")
        setValue("characteristics.fulvicAcid", (product as any).characteristics.fulvicAcid || "")
      }

      if ((product as any).benefits && Array.isArray((product as any).benefits)) {
        setBenefits((product as any).benefits)
      }
    }
  }, [product, setValue])

  // Fetch taxonomies on component mount
  useEffect(() => {
    const fetchTaxonomies = async () => {
      if (!accessToken) {
        setLoadingTaxonomies(false)
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/for-products`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })
        const data = await response.json()

        if (data.success) {
          setTaxonomies(data.data)
        }
      } catch (error) {
        console.error('Error fetching taxonomies:', error)
        toast.error('Failed to load categories')
      } finally {
        setLoadingTaxonomies(false)
      }
    }

    fetchTaxonomies()
  }, [accessToken])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check if adding new images would exceed the limit
    const totalImages = images.length + files.length
    if (totalImages > 5) {
      toast.error("Image Limit Exceeded", {
        description: `You can only upload a maximum of 5 images. You currently have ${images.length} image(s).`,
      })
      // Reset the file input
      e.target.value = ""
      return
    }

    const newImages: ImagePreview[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      altText: "",
    }))

    setImages((prev) => [...prev, ...newImages])
    // Reset the file input
    e.target.value = ""
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev]
      const removed = newImages.splice(index, 1)[0]
      // Revoke object URL if it's a new upload
      if (removed.file && removed.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return newImages
    })
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check if adding new videos would exceed the limit
    const totalVideos = videos.length + files.length
    if (totalVideos > 2) {
      toast.error("Video Limit Exceeded", {
        description: `You can only upload a maximum of 2 videos. You currently have ${videos.length} video(s).`,
      })
      e.target.value = ""
      return
    }

    const newVideos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      title: file.name,
    }))

    setVideos((prev) => [...prev, ...newVideos])
    e.target.value = ""
  }

  const removeVideo = (index: number) => {
    setVideos((prev) => {
      const newVideos = [...prev]
      const removed = newVideos.splice(index, 1)[0]
      if (removed.file && removed.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return newVideos
    })
  }

  const addPackageVariant = () => {
    const title = watch("title") || "PRODUCT"
    const baseSku = title.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6)
    const newVariant: PackageVariant = {
      weight: {
        value: (packageVariants.length + 1) * 100,
        unit: 'g'
      },
      sku: `${baseSku}-${packageVariants.length + 1}`,
      price: 0,
      discount: {
        value: 0,
        type: 'percentage'
      },
      stock: 0,
      isActive: true,
      isDefault: packageVariants.length === 0
    }
    setPackageVariants([...packageVariants, newVariant])
  }

  const updatePackageVariant = (index: number, field: string, value: any) => {
    const updatedVariants = [...packageVariants]

    if (field.includes('.')) {
      const [parentField, childField] = field.split('.')
      const currentVariant = updatedVariants[index]
      const parentValue = currentVariant[parentField as keyof PackageVariant] as any
      updatedVariants[index] = {
        ...currentVariant,
        [parentField]: {
          ...parentValue,
          [childField]: value
        }
      }
    } else {
      updatedVariants[index] = { ...updatedVariants[index], [field]: value }
    }

    // Ensure only one default variant
    if (field === 'isDefault' && value === true) {
      updatedVariants.forEach((variant, i) => {
        if (i !== index) variant.isDefault = false
      })
    }

    setPackageVariants(updatedVariants)
  }

  const removePackageVariant = (index: number) => {
    const updatedVariants = packageVariants.filter((_, i) => i !== index)

    // If we removed the default variant, make the first one default
    if (updatedVariants.length > 0 && !updatedVariants.some(v => v.isDefault)) {
      updatedVariants[0].isDefault = true
    }

    setPackageVariants(updatedVariants)
  }

  const onFormSubmit = async (data: ProductFormData) => {
    // Validate at least one category is required
    if (!data.categories || data.categories.length === 0) {
      toast.error("Validation Error", {
        description: "At least one category is required",
      })
      setError("categories", { message: "At least one category is required" })
      return
    }

    // Validate at least one image is required
    if (images.length === 0) {
      toast.error("Validation Error", {
        description: "At least one product image is required",
      })
      return
    }

    // Validate at least one package variant is required
    if (packageVariants.length === 0) {
      toast.error("Validation Error", {
        description: "At least one package variant is required",
      })
      return
    }

    // Validate package variants
    const variantErrors: string[] = []

    // Check for duplicate SKUs
    const skus = packageVariants.map(v => v.sku.toUpperCase())
    const duplicateSkus = skus.filter((sku, index) => skus.indexOf(sku) !== index)
    if (duplicateSkus.length > 0) {
      variantErrors.push(`Duplicate SKUs found: ${duplicateSkus.join(', ')}`)
    }

    // Check for at least one default variant
    const defaultVariants = packageVariants.filter(v => v.isDefault)
    if (defaultVariants.length === 0) {
      variantErrors.push("At least one variant must be marked as default")
    }

    // Check for valid weights and prices
    packageVariants.forEach((variant, index) => {
      if (!variant.sku.trim()) {
        variantErrors.push(`Variant ${index + 1}: SKU is required`)
      }
      if (variant.weight.value <= 0) {
        variantErrors.push(`Variant ${index + 1}: Weight must be greater than 0`)
      }
      if (variant.price <= 0) {
        variantErrors.push(`Variant ${index + 1}: Price must be greater than 0`)
      }
    })

    if (variantErrors.length > 0) {
      toast.error("Package Variants Validation Error", {
        description: variantErrors[0], // Show first error
      })
      return
    }

    const formData = new FormData()

    // Required fields
    formData.append("type", "single")
    formData.append("title", data.title.trim())
    formData.append("shortDescription", data.shortDescription.trim())
    formData.append("isActive", data.isActive ? "true" : "false")
    formData.append("isFeatured", data.isFeatured ? "true" : "false")

    // Optional fields
    if (data.description && data.description.trim()) {
      formData.append("description", data.description.trim())
    }
    if (data.usage && data.usage.trim()) {
      formData.append("usage", data.usage.trim())
    }

    // Auto-generate slug from title
    const slug = data.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    formData.append("slug", slug)

    // Add taxonomy fields
    if (data.categories && data.categories.length > 0) {
      formData.append("categories", JSON.stringify(data.categories))
    }
    if (data.subcategories && data.subcategories.length > 0) {
      formData.append("subcategories", JSON.stringify(data.subcategories))
    }

    // Add COD and return policy fields
    formData.append("cashOnDelivery[enabled]", data.codEnabled ? "true" : "false")
    formData.append("returnPolicy[returnable]", data.returnable ? "true" : "false")
    formData.append("returnPolicy[returnWindowDays]", data.returnWindowDays || "7")

    // Add shipping fields
    formData.append("shipping[charges]", data.shippingCharges || "0")
    formData.append("shipping[freeShippingThreshold]", data.freeShippingThreshold || "0")
    formData.append("shipping[freeShippingMinQuantity]", data.freeShippingMinQuantity || "1")

    // Add package variants (required)
    formData.append("packageVariants", JSON.stringify(packageVariants))

    // Add new images only (files, not URLs)
    const newImages = images.filter((img) => img.file)
    newImages.forEach((image) => {
      formData.append("images", image.file!)
    })

    // Add new videos only (files, not URLs)
    const newVideos = videos.filter((vid) => vid.file)
    newVideos.forEach((video) => {
      formData.append("videos", video.file!)
    })

    // Append new text fields
    formData.append("subtitle", data.subtitle || "")
    formData.append("origin", data.origin || "")
    formData.append("grade", data.grade || "")
    formData.append("certification", data.certification || "")
    formData.append("storage", data.storage || "")

    // Append characteristics
    if (data.characteristics) {
      formData.append("characteristics[color]", data.characteristics.color || "")
      formData.append("characteristics[aroma]", data.characteristics.aroma || "")
      formData.append("characteristics[taste]", data.characteristics.taste || "")
      formData.append("characteristics[crocin]", data.characteristics.crocin || "")
      formData.append("characteristics[texture]", data.characteristics.texture || "")
      formData.append("characteristics[fulvicAcid]", data.characteristics.fulvicAcid || "")
    }

    // Append benefits
    benefits.forEach((benefit, index) => {
      formData.append(`benefits[${index}]`, benefit)
    })

    try {
      await onSubmit(formData)
      // Success toast will be shown by parent component
    } catch (error: any) {
      const errorMessage = error.message || "Failed to save product"

      if (errorMessage.toLowerCase().includes("slug")) {
        toast.error("Duplicate Product", {
          description: "A product with this name already exists. Please use a different title.",
        })
        setError("title", { message: "Product name already exists" })
      } else {
        toast.error("Error", {
          description: errorMessage,
        })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} className="gap-2 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("isActive", checked)}
              className="cursor-pointer"
            />
            <Label htmlFor="active" className="cursor-pointer">Active</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="featured"
              checked={isFeatured}
              onCheckedChange={(checked) => setValue("isFeatured", checked)}
              className="cursor-pointer"
            />
            <Label htmlFor="featured" className="cursor-pointer">Featured</Label>
          </div>
          <Button type="submit" disabled={isLoading} className="gap-2 cursor-pointer">
            <Save className="w-4 h-4" />
            {isLoading ? "Saving..." : product ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>

            <div className="space-y-2">
              <Label htmlFor="title">
                Product Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                {...register("title", { required: "Title is required" })}
                placeholder="e.g., Premium Face Cream"
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>


            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                {...register("subtitle")}
                placeholder="e.g., Premium Grade A Saffron"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">
                Short Description <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor
                content={shortDescriptionContent}
                onChange={(content) => {
                  setShortDescriptionContent(content)
                  setValue("shortDescription", content)
                }}
                placeholder="Brief product description with formatting..."
              />
              {errors.shortDescription && (
                <p className="text-xs text-destructive">
                  {errors.shortDescription.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Use the toolbar to format text, add colors, and create lists
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description</Label>
              <RichTextEditor
                content={descriptionContent}
                onChange={(content) => {
                  setDescriptionContent(content)
                  setValue("description", content)
                }}
                placeholder="Detailed product information, features, and benefits..."
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                Add detailed product information with rich formatting
              </p>
            </div>
          </Card>

          {/* Product Details & Specifications */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Product Details & Specs</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin</Label>
                <Input id="origin" {...register("origin")} placeholder="e.g. Kashmir, Iran" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Input id="grade" {...register("grade")} placeholder="e.g. Super Negin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certification">Certification</Label>
                <Input id="certification" {...register("certification")} placeholder="e.g. Lab Tested" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage">Storage Info</Label>
                <Input id="storage" {...register("storage")} placeholder="e.g. Cool dry place" />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label>Product Characteristics</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Color</Label>
                  <Input {...register("characteristics.color")} placeholder="Deep Red" className="h-8" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Aroma</Label>
                  <Input {...register("characteristics.aroma")} placeholder="Floral" className="h-8" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Taste</Label>
                  <Input {...register("characteristics.taste")} placeholder="Bitter-sweet" className="h-8" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Crocin Level</Label>
                  <Input {...register("characteristics.crocin")} placeholder=">200" className="h-8" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Texture</Label>
                  <Input {...register("characteristics.texture")} placeholder="Resin" className="h-8" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Fulvic Acid</Label>
                  <Input {...register("characteristics.fulvicAcid")} placeholder=">60%" className="h-8" />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label>Benefits</Label>
              <div className="flex gap-2">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Add a benefit..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (newBenefit.trim()) {
                        setBenefits([...benefits, newBenefit.trim()])
                        setNewBenefit("")
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (newBenefit.trim()) {
                      setBenefits([...benefits, newBenefit.trim()])
                      setNewBenefit("")
                    }
                  }}
                  variant="secondary"
                >
                  Add
                </Button>
              </div>
              <div className="pl-2 space-y-1">
                {benefits.map((b, i) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                    <span>{b}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => setBenefits(benefits.filter((_, idx) => idx !== i))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Package Variants - This is now the main pricing section */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Package Variants & Pricing</h2>
                <p className="text-sm text-muted-foreground">Different package sizes with individual pricing (e.g., 50gm, 100gm, 1kg)</p>
              </div>
            </div>

            <div className="space-y-4">
              {packageVariants.map((variant, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">Package {index + 1}</h4>
                      {variant.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePackageVariant(index)}
                      className="text-destructive hover:text-destructive cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Weight/Size and Unit */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Weight/Size</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.weight.value}
                        onChange={(e) => updatePackageVariant(index, 'weight.value', parseFloat(e.target.value) || 0)}
                        placeholder="50"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Unit</Label>
                      <Select
                        value={variant.weight.unit}
                        onValueChange={(value) => updatePackageVariant(index, 'weight.unit', value)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mg">mg</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="ml">ml</SelectItem>
                          <SelectItem value="l">l</SelectItem>
                          <SelectItem value="oz">oz</SelectItem>
                          <SelectItem value="lb">lb</SelectItem>
                          <SelectItem value="pieces">pieces</SelectItem>
                          <SelectItem value="units">units</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* SKU and Stock */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">SKU</Label>
                      <Input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => updatePackageVariant(index, 'sku', e.target.value.toUpperCase())}
                        placeholder="e.g., PROD-50G"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Stock</Label>
                      <Input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(e) => updatePackageVariant(index, 'stock', parseInt(e.target.value) || 0)}
                        placeholder="100"
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Price */}
                  <div className="space-y-1">
                    <Label className="text-xs">Price</Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.price}
                        onChange={(e) => updatePackageVariant(index, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="text-sm pl-6"
                      />
                    </div>
                  </div>

                  {/* Discount Type and Value */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Discount Type</Label>
                      <Select
                        value={variant.discount.type}
                        onValueChange={(value) => updatePackageVariant(index, 'discount.type', value)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Discount Value</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.discount.value}
                        onChange={(e) => updatePackageVariant(index, 'discount.value', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Default checkbox */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`default-${index}`}
                      checked={variant.isDefault}
                      onChange={(e) => updatePackageVariant(index, 'isDefault', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor={`default-${index}`} className="text-xs">Set as Default Package</Label>
                  </div>

                  {/* Preview */}
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{variant.weight.value}{variant.weight.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SKU:</span>
                      <span>{variant.sku}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Final Price:</span>
                      <span>
                        ₹{(() => {
                          let finalPrice = variant.price;
                          if (variant.discount.value > 0) {
                            if (variant.discount.type === 'percentage') {
                              finalPrice = variant.price * (1 - variant.discount.value / 100);
                            } else {
                              finalPrice = Math.max(0, variant.price - variant.discount.value);
                            }
                          }
                          return finalPrice.toFixed(2);
                        })()}
                      </span>
                    </div>
                    {variant.discount.value > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>
                          {variant.discount.type === 'percentage'
                            ? `${variant.discount.value}% off`
                            : `${variant.discount.value} off`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addPackageVariant}
                className="w-full cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Package Variant
              </Button>

              {packageVariants.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Package Variants Preview</h4>
                  <div className="space-y-1 text-xs">
                    {packageVariants.map((variant, index) => {
                      let finalPrice = variant.price;
                      if (variant.discount.value > 0) {
                        if (variant.discount.type === 'percentage') {
                          finalPrice = variant.price * (1 - variant.discount.value / 100);
                        } else {
                          finalPrice = Math.max(0, variant.price - variant.discount.value);
                        }
                      }
                      return (
                        <div key={index} className="flex justify-between text-blue-800">
                          <span>
                            {variant.weight.value}{variant.weight.unit} ({variant.sku}):
                          </span>
                          <span className="font-medium">
                            ₹{finalPrice.toFixed(2)}
                            {variant.discount.value > 0 && (
                              <span className="text-green-600 ml-1">
                                ({variant.discount.type === 'percentage'
                                  ? `${variant.discount.value}% off`
                                  : `${variant.discount.value} off`
                                })
                              </span>
                            )}
                            {variant.isDefault && <span className="text-blue-600 ml-1">(Default)</span>}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Product Images */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Product Images <span className="text-destructive">*</span>
              </h2>
              {images.length === 0 && (
                <p className="text-xs text-destructive">At least one image required</p>
              )}
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={image.preview}
                        alt={`Product image ${index + 1}`}
                        width={200}
                        height={200}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className={`border-2 border-dashed rounded-lg p-6 text-center ${images.length === 0 ? "border-destructive" : images.length >= 5 ? "border-muted bg-muted/50" : ""}`}>
              <Upload className={`w-8 h-8 mx-auto mb-2 ${images.length === 0 ? "text-destructive" : images.length >= 5 ? "text-muted-foreground/50" : "text-muted-foreground"}`} />
              <Label htmlFor="images" className={images.length >= 5 ? "cursor-not-allowed" : "cursor-pointer"}>
                <span className={`text-sm ${images.length === 0 ? "text-destructive" : images.length >= 5 ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
                  {images.length >= 5 ? "Maximum 5 images reached" : "Click to upload or drag and drop"}
                </span>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={images.length >= 5}
                />
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                PNG, JPG, GIF up to 10MB ({images.length}/5 images)
              </p>
            </div>
          </Card>

          {/* Product Videos */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Product Videos</h2>
              <p className="text-xs text-muted-foreground">Optional (Max 2)</p>
            </div>

            {videos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map((video, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <video
                        src={video.preview}
                        controls
                        className="object-cover w-full h-full"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => removeVideo(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{video.title}</p>
                  </div>
                ))}
              </div>
            )}

            <div className={`border-2 border-dashed rounded-lg p-6 text-center ${videos.length >= 2 ? "border-muted bg-muted/50" : ""}`}>
              <Upload className={`w-8 h-8 mx-auto mb-2 ${videos.length >= 2 ? "text-muted-foreground/50" : "text-muted-foreground"}`} />
              <Label htmlFor="videos" className={videos.length >= 2 ? "cursor-not-allowed" : "cursor-pointer"}>
                <span className={`text-sm ${videos.length >= 2 ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
                  {videos.length >= 2 ? "Maximum 2 videos reached" : "Click to upload product videos"}
                </span>
                <Input
                  id="videos"
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoChange}
                  className="hidden"
                  disabled={videos.length >= 2}
                />
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                MP4, MOV, AVI, WebM up to 50MB ({videos.length}/2 videos)
              </p>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Categories */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Categories</h2>

            <div className="space-y-2">
              <Label>
                Categories (Multiple) <span className="text-destructive">*</span>
              </Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                {loadingTaxonomies ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : taxonomies.categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No categories available</p>
                ) : (
                  taxonomies.categories.map((category) => (
                    <div key={category._id} className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`category-${category._id}`}
                          checked={categories.includes(category._id)}
                          onChange={(e) => {
                            const newCategories = e.target.checked
                              ? [...categories, category._id]
                              : categories.filter(id => id !== category._id)
                            setValue("categories", newCategories)

                            // When unchecking parent category, also uncheck all its subcategories
                            if (!e.target.checked && category.subcategories && category.subcategories.length > 0) {
                              const subcategoryIds = category.subcategories.map(sub => sub._id)
                              const newSubcategories = subcategories.filter(id => !subcategoryIds.includes(id))
                              setValue("subcategories", newSubcategories)
                            }
                          }}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor={`category-${category._id}`} className="text-sm cursor-pointer font-medium">
                          {category.name}
                        </label>
                      </div>
                      {/* Subcategories */}
                      {category.subcategories && category.subcategories.length > 0 && (
                        <div className="ml-6 space-y-1">
                          {category.subcategories.map((sub) => (
                            <div key={sub._id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`subcategory-${sub._id}`}
                                checked={subcategories.includes(sub._id)}
                                onChange={(e) => {
                                  const newSubcategories = e.target.checked
                                    ? [...subcategories, sub._id]
                                    : subcategories.filter(id => id !== sub._id)
                                  setValue("subcategories", newSubcategories)

                                  // Auto-select parent category when subcategory is selected
                                  if (e.target.checked && !categories.includes(category._id)) {
                                    setValue("categories", [...categories, category._id])
                                  }
                                  // Auto-deselect parent category when all its subcategories are deselected
                                  if (!e.target.checked) {
                                    const remainingSubcats = newSubcategories.filter(subId =>
                                      category.subcategories?.some(s => s._id === subId)
                                    )
                                    if (remainingSubcats.length === 0 && categories.includes(category._id)) {
                                      setValue("categories", categories.filter(id => id !== category._id))
                                    }
                                  }
                                }}
                                className="w-4 h-4 cursor-pointer"
                              />
                              <label htmlFor={`subcategory-${sub._id}`} className="text-sm cursor-pointer text-muted-foreground">
                                └─ {sub.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              {errors.categories && (
                <p className="text-xs text-destructive">{errors.categories.message}</p>
              )}
            </div>
          </Card>

          {/* Payment & Returns */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Payment & Returns</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="codEnabled" className="cursor-pointer font-medium">
                    Cash on Delivery (COD)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow customers to pay cash when product is delivered
                  </p>
                </div>
                <Switch
                  id="codEnabled"
                  checked={codEnabled}
                  onCheckedChange={(checked) => setValue("codEnabled", checked)}
                  className="cursor-pointer"
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="returnable" className="cursor-pointer font-medium">
                      Returnable Product
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Allow customers to return this product after delivery
                    </p>
                  </div>
                  <Switch
                    id="returnable"
                    checked={returnable}
                    onCheckedChange={(checked) => setValue("returnable", checked)}
                    className="cursor-pointer"
                  />
                </div>

                {returnable && (
                  <div className="space-y-2 pl-4">
                    <Label htmlFor="returnWindowDays">Return Window (Days)</Label>
                    <Input
                      id="returnWindowDays"
                      type="number"
                      min="1"
                      max="90"
                      {...register("returnWindowDays", {
                        min: { value: 1, message: "Minimum 1 day" },
                        max: { value: 90, message: "Maximum 90 days" },
                      })}
                      placeholder="7"
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === ".") {
                          e.preventDefault()
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of days after delivery when customer can request a return (1-90 days)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Shipping */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Shipping</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shippingCharges">Shipping Charges</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                  <Input
                    id="shippingCharges"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("shippingCharges")}
                    placeholder="0.00"
                    className="pl-6"
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "E") {
                        e.preventDefault()
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Standard shipping cost for this product. Set to 0 for free shipping.
                </p>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="text-sm font-semibold">Free Shipping Conditions</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="freeShippingThreshold">Free Shipping Threshold</Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                      <Input
                        id="freeShippingThreshold"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register("freeShippingThreshold")}
                        placeholder="0.00"
                        className="pl-6"
                        onKeyDown={(e) => {
                          if (e.key === "-" || e.key === "e" || e.key === "E") {
                            e.preventDefault()
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum order value for free shipping. Set to 0 to disable.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="freeShippingMinQuantity">Free Shipping Min Quantity</Label>
                    <Input
                      id="freeShippingMinQuantity"
                      type="number"
                      min="1"
                      {...register("freeShippingMinQuantity")}
                      placeholder="1"
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === ".") {
                          e.preventDefault()
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum quantity for free shipping eligibility.
                    </p>
                  </div>
                </div>

                {(parseFloat(shippingCharges || "0") > 0 || parseFloat(freeShippingThreshold || "0") > 0) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Shipping Summary</h4>
                    <div className="space-y-1 text-xs text-blue-800">
                      <div className="flex justify-between">
                        <span>Standard Shipping:</span>
                        <span className="font-medium">₹{parseFloat(shippingCharges || "0").toFixed(2)}</span>
                      </div>
                      {parseFloat(freeShippingThreshold || "0") > 0 && (
                        <div className="flex justify-between">
                          <span>Free Shipping Above:</span>
                          <span className="font-medium">₹{parseFloat(freeShippingThreshold || "0").toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Min Quantity for Free Shipping:</span>
                        <span className="font-medium">{parseInt(watch("freeShippingMinQuantity") || "1")} items</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  )
}