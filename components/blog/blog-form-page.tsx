"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useBlogStore, BlogPost } from "@/lib/blog-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Save, ArrowLeft, Upload, X, Eye } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { RichTextEditor } from "./rich-text-editor"
import { BlogPreviewDialog } from "./blog-preview-dialog"
import { useAuthStore } from "@/lib/auth-store"

// Taxonomy interfaces
interface TaxonomyOption {
  _id: string
  name: string
  slug: string
  subcategories?: TaxonomyOption[]
}

interface BlogFormData {
  title: string
  excerpt: string
  body: string
  author: string
  categories: string[]
  subcategories: string[]
  tags: string
  isPublished: boolean
}

interface BlogFormPageProps {
  post?: BlogPost | null
  onSubmit: (formData: FormData) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function BlogFormPage({ post, onSubmit, onCancel, isLoading }: BlogFormPageProps) {
  const { uploadImage } = useBlogStore()
  const { accessToken } = useAuthStore()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
  } = useForm<BlogFormData>({
    defaultValues: {
      title: "",
      excerpt: "",
      body: "",
      author: "",
      categories: [],
      subcategories: [],
      tags: "",
      isPublished: false,
    },
  })

  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string>("")
  const [bodyContent, setBodyContent] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [blogCategories, setBlogCategories] = useState<TaxonomyOption[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const isPublished = watch("isPublished")

  const title = watch("title")
  const excerpt = watch("excerpt")
  const author = watch("author")
  const categories = watch("categories")
  const subcategories = watch("subcategories")
  const tags = watch("tags")

  // Fetch blog categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      if (!accessToken) {
        setLoadingCategories(false)
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/for-blogs`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })
        const data = await response.json()

        if (data.success) {
          setBlogCategories(data.data.categories || [])
        }
      } catch (error) {
        console.error('Error fetching blog categories:', error)
        toast.error('Failed to load categories')
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [accessToken])

  useEffect(() => {
    if (post) {
      setValue("title", post.title)
      setValue("excerpt", post.excerpt || "")
      setValue("body", post.body)
      setBodyContent(post.body)
      setValue("author", post.author)

      // Handle categories - extract IDs from populated objects or use as-is
      const categoriesData = post.categories || []
      const categoryIds = Array.isArray(categoriesData)
        ? categoriesData.map((c: any) => typeof c === 'object' && c._id ? c._id : c).filter(Boolean)
        : []
      setValue("categories", categoryIds)

      // Handle subcategories - extract IDs from populated objects or use as-is
      const subcategoriesData = post.subcategories || []
      const subcategoryIds = Array.isArray(subcategoriesData)
        ? subcategoriesData.map((c: any) => typeof c === 'object' && c._id ? c._id : c).filter(Boolean)
        : []
      setValue("subcategories", subcategoryIds)

      setValue("tags", post.tags?.join(", ") || "")
      setValue("isPublished", post.isPublished)
      if (post.coverImage?.url) {
        setCoverImagePreview(post.coverImage.url)
      }
    }
  }, [post, setValue])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File Too Large", {
          description: "Cover image must be less than 10MB",
        })
        e.target.value = ""
        return
      }

      setCoverImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setCoverImage(null)
    setCoverImagePreview("")
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      return await uploadImage(file)
    } catch (error) {
      console.error("Image upload error:", error)
      throw error
    }
  }

  const onFormSubmit = async (data: BlogFormData) => {
    // Validate required fields
    if (!data.title.trim()) {
      toast.error("Validation Error", {
        description: "Title is required",
      })
      setError("title", { message: "Title is required" })
      return
    }

    if (!bodyContent.trim()) {
      toast.error("Validation Error", {
        description: "Content is required",
      })
      return
    }

    if (!data.author.trim()) {
      toast.error("Validation Error", {
        description: "Author is required",
      })
      setError("author", { message: "Author is required" })
      return
    }

    if (!data.categories || data.categories.length === 0) {
      toast.error("Validation Error", {
        description: "At least one category is required",
      })
      setError("categories", { message: "At least one category is required" })
      return
    }

    if (!data.tags.trim()) {
      toast.error("Validation Error", {
        description: "Tags are required",
      })
      setError("tags", { message: "Tags are required" })
      return
    }

    if (!post && !coverImage) {
      toast.error("Validation Error", {
        description: "Cover image is required",
      })
      return
    }

    const formData = new FormData()
    formData.append("title", data.title.trim())
    formData.append("excerpt", data.excerpt.trim())
    formData.append("body", bodyContent)
    formData.append("author", data.author.trim())
    
    // Send categories and subcategories as JSON arrays
    if (data.categories && data.categories.length > 0) {
      formData.append("categories", JSON.stringify(data.categories))
    }
    if (data.subcategories && data.subcategories.length > 0) {
      formData.append("subcategories", JSON.stringify(data.subcategories))
    }
    
    formData.append("tags", data.tags.trim())
    formData.append("isPublished", data.isPublished ? "true" : "false")
    if (coverImage) {
      formData.append("image", coverImage)
    }

    try {
      await onSubmit(formData)
    } catch (error: any) {
      const errorMessage = error.message || "Failed to save blog post"
      console.log("=== FORM ERROR HANDLER ===")
      console.log("Form caught error:", errorMessage)

      if (errorMessage.toLowerCase().includes("slug")) {
        toast.error("Duplicate Post", {
          description: "A blog post with this title already exists. Please use a different title.",
        })
        setError("title", { message: "Post title already exists" })
      } else {
        toast.error("Error", {
          description: errorMessage,
        })
      }
      console.log("=== END ERROR HANDLER ===")
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onCancel} className="gap-2 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Button>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreviewOpen(true)}
            className="gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <div className="flex items-center gap-2">
            <Switch
              id="published"
              checked={isPublished}
              onCheckedChange={(checked) => setValue("isPublished", checked)}
              className="cursor-pointer"
            />
            <Label htmlFor="published" className="cursor-pointer">Publish</Label>
          </div>
          <Button type="submit" disabled={isLoading} className="gap-2 cursor-pointer">
            <Save className="w-4 h-4" />
            {isLoading ? "Saving..." : post ? "Update Post" : "Create Post"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Post Content</h2>

            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                {...register("title", { required: "Title is required" })}
                placeholder="Enter post title"
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Slug will be auto-generated from the title
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                {...register("excerpt")}
                placeholder="Brief description of the post"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">
                Content <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor
                content={bodyContent}
                onChange={setBodyContent}
                onImageUpload={handleImageUpload}
              />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Post Details</h2>

            <div className="space-y-2">
              <Label htmlFor="author">
                Author <span className="text-destructive">*</span>
              </Label>
              <Input
                id="author"
                {...register("author", { required: "Author is required" })}
                placeholder="Author name"
              />
              {errors.author && (
                <p className="text-xs text-destructive">{errors.author.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Categories & Subcategories <span className="text-destructive">*</span>
              </Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                {loadingCategories ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : blogCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No categories available</p>
                ) : (
                  blogCategories.map((category) => (
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
                            
                            // Cascade uncheck subcategories when parent unchecked
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

            <div className="space-y-2">
              <Label htmlFor="tags">
                Tags <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tags"
                {...register("tags", { required: "Tags are required" })}
                placeholder="tag1, tag2, tag3"
              />
              {errors.tags && (
                <p className="text-xs text-destructive">{errors.tags.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Separate tags with commas
              </p>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label>
                Cover Image <span className="text-destructive">*</span>
              </Label>
              {!post && !coverImagePreview && (
                <p className="text-xs text-destructive">Required</p>
              )}
            </div>
            {coverImagePreview && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted group">
                <Image
                  src={coverImagePreview}
                  alt="Cover preview"
                  fill
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={removeImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            <div className={`border-2 border-dashed rounded-lg p-6 text-center ${!coverImagePreview && !post ? "border-destructive" : ""}`}>
              <Upload className={`w-8 h-8 mx-auto mb-2 ${!coverImagePreview && !post ? "text-destructive" : "text-muted-foreground"}`} />
              <Label htmlFor="coverImage" className="cursor-pointer">
                <span className={`text-sm ${!coverImagePreview && !post ? "text-destructive" : "text-muted-foreground"}`}>
                  Click to upload cover image
                </span>
                <Input
                  id="coverImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                Recommended: 1200x630px {post && "(Leave empty to keep current image)"}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <BlogPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={title}
        excerpt={excerpt}
        body={bodyContent}
        author={author}
        categories={(() => {
          // Convert category IDs to names for preview
          if (!categories || categories.length === 0) return []

          return categories.map(catId => {
            for (const cat of blogCategories) {
              if (cat._id === catId) {
                return cat.name
              }
              if (cat.subcategories) {
                for (const sub of cat.subcategories) {
                  if (sub._id === catId) {
                    return sub.name
                  }
                }
              }
            }
            return catId // Fallback to ID if not found
          })
        })()}
        subcategories={(() => {
          // Convert subcategory IDs to names for preview
          if (!subcategories || subcategories.length === 0) return []

          return subcategories.map(subId => {
            for (const cat of blogCategories) {
              if (cat.subcategories) {
                for (const sub of cat.subcategories) {
                  if (sub._id === subId) {
                    return sub.name
                  }
                }
              }
            }
            return subId // Fallback to ID if not found
          })
        })()}
        tags={tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []}
        coverImagePreview={coverImagePreview}
      />
    </form>
  )
}
