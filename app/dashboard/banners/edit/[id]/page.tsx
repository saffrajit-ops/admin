"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useBannerStore } from "@/lib/banner-store"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { ImageCropper } from "@/components/ImageCropper"

export default function EditBannerPage() {
  const router = useRouter()
  const params = useParams()
  const bannerId = params.id as string
  const { accessToken } = useAuthStore()
  const { updateBanner } = useBannerStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const [occupiedPages, setOccupiedPages] = useState<string[]>([])
  const [showCropper, setShowCropper] = useState(false)
  const [tempImageFile, setTempImageFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: {
      url: "",
      publicId: "",
    },
    type: "sidebar" as "popup" | "footer" | "sidebar",
    link: "",
    linkText: "Shop Now",
    pages: [] as string[],
    startDate: "",
    endDate: "",
    isActive: true,
    triggers: {
      device: {
        enabled: false,
        types: [] as string[]
      },
      behavior: {
        enabled: false,
        scrollPercentage: undefined as number | undefined,
        exitIntent: false,
        addToCart: false,
        searchKeywords: [] as string[]
      },
      userType: {
        enabled: false,
        types: [] as string[]
      },
      inventory: {
        enabled: false,
        outOfStock: false,
        codAvailable: false,
        specificCategories: [] as string[]
      }
    }
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Get required dimensions based on banner type
  const getRequiredDimensions = () => {
    switch (formData.type) {
      case 'popup':
        return { width: 800, height: 600 }
      case 'footer':
        return { width: 1200, height: 200 }
      case 'sidebar':
        return { width: 600, height: 300 }
      default:
        return { width: 600, height: 300 }
    }
  }

  // Fetch occupied pages when banner type changes (excluding current banner)
  const fetchOccupiedPages = async (type: string) => {
    if (type === 'popup' || !accessToken) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://canagold-backend.onrender.com/api"}/banners/occupied-pages?type=${type}&excludeBannerId=${bannerId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      const data = await response.json()
      if (data.success) {
        setOccupiedPages(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch occupied pages:', error)
    }
  }

  // Fetch banner data
  useEffect(() => {
    const fetchBanner = async () => {
      if (!accessToken || !bannerId) return

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://canagold-backend.onrender.com/api"}/banners/${bannerId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!response.ok) throw new Error("Failed to fetch banner")

        const data = await response.json()
        const banner = data.data

        setFormData({
          title: banner.title,
          description: banner.description || "",
          image: banner.image,
          type: banner.type,
          link: banner.link || "",
          linkText: banner.linkText || "Shop Now",
          pages: banner.pages || [],
          startDate: banner.startDate ? new Date(banner.startDate).toISOString().slice(0, 16) : "",
          endDate: banner.endDate ? new Date(banner.endDate).toISOString().slice(0, 16) : "",
          isActive: banner.isActive,
          triggers: banner.triggers || {
            device: { enabled: false, types: [] },
            behavior: { enabled: false, scrollPercentage: undefined, exitIntent: false, addToCart: false, searchKeywords: [] },
            userType: { enabled: false, types: [] },
            inventory: { enabled: false, outOfStock: false, codAvailable: false, specificCategories: [] }
          }
        })
        setImagePreview(banner.image.url)

        // Get dimensions of existing image
        const img = new window.Image()
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height })
        }
        img.src = banner.image.url

        // Fetch occupied pages for this banner type
        fetchOccupiedPages(banner.type)

        setIsLoading(false)
      } catch (error) {
        toast.error("Failed to load banner")
        router.push("/dashboard/banners")
      }
    }

    fetchBanner()
  }, [accessToken, bannerId, router])

  // Handle type change
  const handleTypeChange = (newType: string) => {
    setFormData({ ...formData, type: newType as any, pages: [] })
    fetchOccupiedPages(newType)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Store temp file and open cropper
    setTempImageFile(file)
    setShowCropper(true)
  }

  const handleCropComplete = (croppedFile: File) => {
    setSelectedFile(croppedFile)

    // Create preview and get dimensions
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setImagePreview(result)

      // Get image dimensions
      const img = new window.Image()
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height })
      }
      img.src = result
    }
    reader.readAsDataURL(croppedFile)

    toast.success('Image cropped successfully!')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title) {
      toast.error("Please enter a title")
      return
    }

    if (formData.type !== 'popup' && formData.pages.length === 0) {
      toast.error("Please select at least one page")
      return
    }

    if (!accessToken) {
      toast.error("You must be logged in")
      return
    }

    setIsSubmitting(true)

    try {
      let imageData = formData.image

      // Upload new image if a file is selected
      if (selectedFile) {
        const uploadFormData = new FormData()
        uploadFormData.append("image", selectedFile)

        const uploadResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://canagold-backend.onrender.com/api"}/upload/image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: uploadFormData,
          }
        )

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image")
        }

        const uploadData = await uploadResponse.json()

        if (!uploadData.success) {
          throw new Error(uploadData.message || "Failed to upload image")
        }

        imageData = {
          url: uploadData.data.url,
          publicId: uploadData.data.publicId,
        }
      }

      // Update banner with new or existing image
      // Keep pages as is (can be empty or have values for popup)
      const bannerPayload = {
        ...formData,
        image: imageData,
        pages: formData.pages
      }

      await updateBanner(bannerId, bannerPayload, accessToken)
      toast.success("Banner updated successfully")
      router.push("/dashboard/banners")
    } catch (error: any) {
      toast.error(error.message || "Failed to update banner")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  const requiredDimensions = getRequiredDimensions()

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Image Cropper Modal */}
      {showCropper && tempImageFile && (
        <ImageCropper
          isOpen={showCropper}
          onClose={() => {
            setShowCropper(false)
            setTempImageFile(null)
          }}
          imageFile={tempImageFile}
          requiredWidth={requiredDimensions.width}
          requiredHeight={requiredDimensions.height}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Banner</h1>
          <p className="text-muted-foreground">Update banner details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update the banner details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Summer Sale 2025"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Up to 50% off on all products"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  Banner Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popup">Popup Banner (On Load)</SelectItem>
                    <SelectItem value="footer">Footer Banner</SelectItem>
                    <SelectItem value="sidebar">Right Sidebar Banner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Banner Image</CardTitle>
              <CardDescription>Update the banner image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Size Instructions */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 text-blue-900">Required Image Sizes (Exact):</h4>
                <ul className="text-xs space-y-1 text-blue-800">
                  <li><strong>Popup Banner:</strong> 800 x 600 pixels (4:3 ratio) - Centered modal overlay</li>
                  <li><strong>Footer Banner:</strong> 1200 x 200 pixels (6:1 ratio) - Full width banner</li>
                  <li><strong>Sidebar Banner:</strong> 600 x 300 pixels (2:1 ratio) - Horizontal side banner</li>
                </ul>
                <p className="text-xs text-green-700 mt-2 font-semibold">
                  ✂️ Auto-Crop: Upload any image and crop it to exact dimensions!
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  💡 Tip: Images automatically scale to fit any screen size while maintaining aspect ratio
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="cursor-pointer"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to keep current image. New image will be uploaded on submit.
                </p>
              </div>

              {imagePreview && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Preview</Label>
                    {imageDimensions && (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                        {imageDimensions.width} x {imageDimensions.height} pixels
                      </span>
                    )}
                  </div>
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                    <Image src={imagePreview} alt="Preview" fill className="object-contain bg-gray-50" />
                  </div>
                  {imageDimensions && (
                    <div className="text-xs text-muted-foreground">
                      {formData.type === 'popup' && (
                        imageDimensions.width === 800 && imageDimensions.height === 600
                          ? <span className="text-green-600">✓ Perfect size for popup banner!</span>
                          : <span className="text-amber-600">⚠ Recommended: 800 x 600 pixels</span>
                      )}
                      {formData.type === 'footer' && (
                        imageDimensions.width === 1200 && imageDimensions.height === 200
                          ? <span className="text-green-600">✓ Perfect size for footer banner!</span>
                          : <span className="text-amber-600">⚠ Recommended: 1200 x 200 pixels</span>
                      )}
                      {formData.type === 'sidebar' && (
                        imageDimensions.width === 300 && imageDimensions.height === 600
                          ? <span className="text-green-600">✓ Perfect size for sidebar banner!</span>
                          : <span className="text-amber-600">⚠ Recommended: 300 x 600 pixels</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Link Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Link Settings</CardTitle>
              <CardDescription>Configure the banner link</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link">Link URL</Label>
                <Input
                  id="link"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="/products?sale=true"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkText">Link Text</Label>
                <Input
                  id="linkText"
                  value={formData.linkText}
                  onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                  placeholder="Shop Now"
                />
              </div>
            </CardContent>
          </Card>

          {/* Page Targeting - Now available for all banner types */}
          {(
            <Card>
              <CardHeader>
                <CardTitle>Page Targeting <span className="text-destructive">*</span></CardTitle>
                <CardDescription>
                  {formData.type === 'popup'
                    ? 'Select pages where this popup should appear (leave empty for global)'
                    : 'Select pages where this banner should appear (required)'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Select Pages
                    {formData.type !== 'popup' && <span className="text-destructive">*</span>}
                    {formData.type === 'popup' && <span className="text-muted-foreground text-xs ml-2">(Optional - leave empty for all pages)</span>}
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "home", label: "Home Page" },
                      { value: "skincare", label: "Skincare Page" },
                      { value: "gifts", label: "Gifts Page" },
                      { value: "product-detail", label: "Product Detail Page" },
                      { value: "checkout", label: "Checkout Page" },
                      { value: "profile", label: "Profile Pages" },
                      { value: "about", label: "About Page" },
                      { value: "cana-gold-story", label: "Cana Gold Story" },
                      { value: "our-ingredients", label: "Our Ingredients" },
                      { value: "contact", label: "Contact Page" },
                      { value: "blog", label: "Blog Pages" },
                      { value: "faq", label: "FAQ Page" },
                      { value: "shipping", label: "Shipping Page" },
                      { value: "privacy", label: "Privacy Policy" },
                      { value: "terms", label: "Terms of Service" },
                      { value: "login", label: "Login Page" },
                      { value: "register", label: "Register Page" },
                      { value: "order-confirmation", label: "Order Confirmation" },
                    ].map((page) => {
                      const isOccupied = occupiedPages.includes(page.value)
                      return (
                        <div key={page.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={page.value}
                            checked={formData.pages.includes(page.value)}
                            disabled={isOccupied}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  pages: [...formData.pages, page.value],
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  pages: formData.pages.filter((p) => p !== page.value),
                                })
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <label
                            htmlFor={page.value}
                            className={`text-sm font-medium leading-none ${isOccupied ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {page.label} {isOccupied && <span className="text-xs text-red-500">(Already used)</span>}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                  {formData.pages.length === 0 && formData.type !== 'popup' && (
                    <p className="text-xs text-destructive">Please select at least one page</p>
                  )}
                  {formData.pages.length === 0 && formData.type === 'popup' && (
                    <p className="text-xs text-blue-600">No pages selected - popup will show on all pages</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Advanced Triggers */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Triggers (Optional)</CardTitle>
              <CardDescription>Configure when and where to show this banner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Device Trigger */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Device-Based Trigger</Label>
                    <p className="text-sm text-muted-foreground">
                      Show banner only on specific devices
                    </p>
                  </div>
                  <Switch
                    checked={formData.triggers.device.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        triggers: {
                          ...formData.triggers,
                          device: { ...formData.triggers.device, enabled: checked }
                        }
                      })
                    }
                  />
                </div>
                {formData.triggers.device.enabled && (
                  <div className="pl-4 space-y-2">
                    <Label>Select Devices</Label>
                    <div className="flex gap-4">
                      {['mobile', 'tablet', 'desktop'].map((device) => (
                        <div key={device} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`device-${device}`}
                            checked={formData.triggers.device.types.includes(device)}
                            onChange={(e) => {
                              const types = e.target.checked
                                ? [...formData.triggers.device.types, device]
                                : formData.triggers.device.types.filter(t => t !== device)
                              setFormData({
                                ...formData,
                                triggers: {
                                  ...formData.triggers,
                                  device: { ...formData.triggers.device, types }
                                }
                              })
                            }}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <label htmlFor={`device-${device}`} className="text-sm capitalize">
                            {device}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Type Trigger */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>User Type Trigger</Label>
                    <p className="text-sm text-muted-foreground">
                      Show banner based on user status
                    </p>
                  </div>
                  <Switch
                    checked={formData.triggers.userType.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        triggers: {
                          ...formData.triggers,
                          userType: { ...formData.triggers.userType, enabled: checked }
                        }
                      })
                    }
                  />
                </div>
                {formData.triggers.userType.enabled && (
                  <div className="pl-4 space-y-2">
                    <Label>Select User Types</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'guest', label: 'Guest Users' },
                        { value: 'logged-in', label: 'Logged In Users' },
                        { value: 'new-user', label: 'New Users (< 7 days)' },
                        { value: 'returning-user', label: 'Returning Users' },
                        { value: 'premium', label: 'Premium Users' }
                      ].map((userType) => (
                        <div key={userType.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`usertype-${userType.value}`}
                            checked={formData.triggers.userType.types.includes(userType.value)}
                            onChange={(e) => {
                              const types = e.target.checked
                                ? [...formData.triggers.userType.types, userType.value]
                                : formData.triggers.userType.types.filter(t => t !== userType.value)
                              setFormData({
                                ...formData,
                                triggers: {
                                  ...formData.triggers,
                                  userType: { ...formData.triggers.userType, types }
                                }
                              })
                            }}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <label htmlFor={`usertype-${userType.value}`} className="text-sm">
                            {userType.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Behavior Trigger */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Behavior Trigger</Label>
                    <p className="text-sm text-muted-foreground">
                      Show banner based on user actions
                    </p>
                  </div>
                  <Switch
                    checked={formData.triggers.behavior.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        triggers: {
                          ...formData.triggers,
                          behavior: { ...formData.triggers.behavior, enabled: checked }
                        }
                      })
                    }
                  />
                </div>
                {formData.triggers.behavior.enabled && (
                  <div className="pl-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="scrollPercentage">Scroll Percentage (0-100)</Label>
                      <Input
                        id="scrollPercentage"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.triggers.behavior.scrollPercentage || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            triggers: {
                              ...formData.triggers,
                              behavior: {
                                ...formData.triggers.behavior,
                                scrollPercentage: e.target.value ? parseInt(e.target.value) : undefined
                              }
                            }
                          })
                        }
                        placeholder="e.g., 50 (show after 50% scroll)"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="exitIntent"
                        checked={formData.triggers.behavior.exitIntent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            triggers: {
                              ...formData.triggers,
                              behavior: {
                                ...formData.triggers.behavior,
                                exitIntent: e.target.checked
                              }
                            }
                          })
                        }
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <label htmlFor="exitIntent" className="text-sm">
                        Exit Intent (show when user tries to leave)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="addToCart"
                        checked={formData.triggers.behavior.addToCart}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            triggers: {
                              ...formData.triggers,
                              behavior: {
                                ...formData.triggers.behavior,
                                addToCart: e.target.checked
                              }
                            }
                          })
                        }
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <label htmlFor="addToCart" className="text-sm">
                        Add to Cart (show when item added to cart)
                      </label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="searchKeywords">Search Keywords (comma-separated)</Label>
                      <Input
                        id="searchKeywords"
                        value={formData.triggers.behavior.searchKeywords.join(', ')}
                        onChange={(e) => {
                          const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k)
                          setFormData({
                            ...formData,
                            triggers: {
                              ...formData.triggers,
                              behavior: {
                                ...formData.triggers.behavior,
                                searchKeywords: keywords
                              }
                            }
                          })
                        }}
                        placeholder="e.g., sale, discount, offer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Inventory Trigger */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Inventory/Product Trigger</Label>
                    <p className="text-sm text-muted-foreground">
                      Show banner based on product availability
                    </p>
                  </div>
                  <Switch
                    checked={formData.triggers.inventory.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        triggers: {
                          ...formData.triggers,
                          inventory: { ...formData.triggers.inventory, enabled: checked }
                        }
                      })
                    }
                  />
                </div>
                {formData.triggers.inventory.enabled && (
                  <div className="pl-4 space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="outOfStock"
                        checked={formData.triggers.inventory.outOfStock}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            triggers: {
                              ...formData.triggers,
                              inventory: {
                                ...formData.triggers.inventory,
                                outOfStock: e.target.checked
                              }
                            }
                          })
                        }
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <label htmlFor="outOfStock" className="text-sm">
                        Show if product is out of stock
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="codAvailable"
                        checked={formData.triggers.inventory.codAvailable}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            triggers: {
                              ...formData.triggers,
                              inventory: {
                                ...formData.triggers.inventory,
                                codAvailable: e.target.checked
                              }
                            }
                          })
                        }
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <label htmlFor="codAvailable" className="text-sm">
                        Show if COD is available
                      </label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specificCategories">Specific Category IDs (comma-separated)</Label>
                      <Input
                        id="specificCategories"
                        value={formData.triggers.inventory.specificCategories.join(', ')}
                        onChange={(e) => {
                          const categories = e.target.value.split(',').map(c => c.trim()).filter(c => c)
                          setFormData({
                            ...formData,
                            triggers: {
                              ...formData.triggers,
                              inventory: {
                                ...formData.triggers.inventory,
                                specificCategories: categories
                              }
                            }
                          })
                        }}
                        placeholder="e.g., 507f1f77bcf86cd799439011"
                      />
                      <p className="text-xs text-muted-foreground">
                        Show banner only for products in these categories
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>Set when the banner should be displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable this banner
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Banner"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
