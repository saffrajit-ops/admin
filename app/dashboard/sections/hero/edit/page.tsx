"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageUploadPreview } from "@/components/hero-image-preview"

interface Slide {
  _id?: string
  title: string
  subtitle: string
  description: string
  buttonText: string
  buttonLink: string
  image?: {
    url: string
    publicId: string
  }
  isActive: boolean
}

export default function EditHeroPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [slides, setSlides] = useState<Slide[]>([])
  const [imageFiles, setImageFiles] = useState<{ [key: number]: File }>({})
  const [imagePreviews, setImagePreviews] = useState<{ [key: number]: string }>({})

  const [activeTab, setActiveTab] = useState("slide-0")

  useEffect(() => {
    if (accessToken) {
      fetchHeroSection()
    }
  }, [accessToken])

  const fetchHeroSection = async () => {
    try {
      setIsLoading(true)
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

      const res = await fetch(`${API_URL}/hero-section/admin`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.data && data.data.slides) {
          setSlides(data.data.slides)

          // Set initial previews
          const iPreviews: { [key: number]: string } = {}

          data.data.slides.forEach((slide: Slide, index: number) => {
            if (slide.image?.url) {
              iPreviews[index] = slide.image.url
            }
          })
          setImagePreviews(iPreviews)
        } else {
          setSlides([])
        }
      }
    } catch (error) {
      console.error("Failed to fetch hero section:", error)
      toast.error("Error", {
        description: "Failed to load hero section",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSlideChange = (index: number, field: keyof Slide, value: any) => {
    const newSlides = [...slides]
    newSlides[index] = { ...newSlides[index], [field]: value }
    setSlides(newSlides)
  }

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Error", {
          description: "Image file must be less than 5MB",
        })
        return
      }

      setImageFiles(prev => ({ ...prev, [index]: file }))
      setImagePreviews(prev => ({ ...prev, [index]: URL.createObjectURL(file) }))
    }
  }

  const addSlide = () => {
    const newSlide: Slide = {
      title: "",
      subtitle: "",
      description: "",
      buttonText: "DISCOVER COLLECTION",
      buttonLink: "/skincare",
      isActive: true
    }
    setSlides([...slides, newSlide])
    setActiveTab(`slide-${slides.length}`)
  }

  const removeSlide = (index: number) => {
    const newSlides = slides.filter((_, i) => i !== index)
    setSlides(newSlides)

    // Helper to reindex states
    const reindex = <T extends unknown>(state: { [key: number]: T }) => {
      const newState: { [key: number]: T } = {}
      let shiftOffset = 0
      slides.forEach((_, i) => {
        if (i === index) {
          shiftOffset = 1
          return
        }
        if (state[i]) newState[i - shiftOffset] = state[i]
      })
      return newState
    }

    setImageFiles(reindex(imageFiles))
    setImagePreviews(reindex(imagePreviews))

    setActiveTab(`slide-${Math.max(0, index - 1)}`)
  }

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === slides.length - 1) return

    const newSlides = [...slides]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

      // Swap slides
      ;[newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]]
    setSlides(newSlides)

    // Helper to swap state items
    const swap = <T extends unknown>(state: { [key: number]: T }) => {
      const newState = { ...state }
      const temp = newState[index]
      newState[index] = newState[targetIndex]
      newState[targetIndex] = temp
      if (!newState[index]) delete newState[index]
      if (!newState[targetIndex]) delete newState[targetIndex]
      return newState
    }

    setImageFiles(swap(imageFiles))
    setImagePreviews(swap(imagePreviews))

    setActiveTab(`slide-${targetIndex}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSaving(true)
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

      const formDataToSend = new FormData()

      const slidesToSend = slides.map(s => ({
        ...s,
      }))

      formDataToSend.append("slides", JSON.stringify(slidesToSend))

      // Append files
      Object.keys(imageFiles).forEach(index => {
        formDataToSend.append(`image_${index}`, imageFiles[parseInt(index)])
      })

      const res = await fetch(`${API_URL}/hero-section/admin`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formDataToSend,
      })

      if (res.ok) {
        toast.success("Success", {
          description: "Hero section updated successfully",
        })
        // Stay on the same page after successful update
      } else {
        const error = await res.json()
        toast.error("Error", {
          description: error.message || "Failed to update hero section",
        })
      }
    } catch (error) {
      console.error("Failed to update hero section:", error)
      toast.error("Error", {
        description: "Failed to update hero section",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/sections")}
          className="mb-4 gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sections
        </Button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Hero Section</h1>
            <p className="text-muted-foreground mt-1">
              Manage slides for the hero carousel on the homepage
            </p>
          </div>
          <Button onClick={addSlide} className="gap-2" type="button">
            <Plus className="w-4 h-4" /> Add Slide
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex-wrap h-auto justify-start mb-4">
            {slides.map((_, index) => (
              <TabsTrigger key={index} value={`slide-${index}`} className="flex-1 min-w-[100px]">
                Slide {index + 1}
              </TabsTrigger>
            ))}
          </TabsList>

          {slides.map((slide, index) => (
            <TabsContent key={index} value={`slide-${index}`}>
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Slide {index + 1} Details</h3>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" type="button" onClick={() => moveSlide(index, 'up')} disabled={index === 0}>
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="outline" type="button" onClick={() => moveSlide(index, 'down')} disabled={index === slides.length - 1}>
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" type="button" onClick={() => removeSlide(index)} disabled={slides.length === 1}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Slide Image</Label>
                      <div className="flex justify-center">
                        <ImageUploadPreview
                          imageUrl={imagePreviews[index]}
                          alt={`Slide ${index + 1} preview`}
                          onRemove={imagePreviews[index] ? () => {
                            setImagePreviews(prev => {
                              const newPreviews = { ...prev }
                              delete newPreviews[index]
                              return newPreviews
                            })
                            setImageFiles(prev => {
                              const newFiles = { ...prev }
                              delete newFiles[index]
                              return newFiles
                            })
                          } : undefined}
                          onClick={() => document.getElementById(`image-input-${index}`)?.click()}
                          isUploading={false}
                        />
                      </div>

                      <Input
                        id={`image-input-${index}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageChange(index, e)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={slide.title}
                        onChange={(e) => handleSlideChange(index, "title", e.target.value)}
                        placeholder="Luxury Redefined"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtitle</Label>
                      <Input
                        value={slide.subtitle}
                        onChange={(e) => handleSlideChange(index, "subtitle", e.target.value)}
                        placeholder="WHERE NATURE MEETS SCIENCE"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={slide.description}
                        onChange={(e) => handleSlideChange(index, "description", e.target.value)}
                        placeholder="Experience the power..."
                        rows={3}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Button Text</Label>
                        <Input
                          value={slide.buttonText}
                          onChange={(e) => handleSlideChange(index, "buttonText", e.target.value)}
                          placeholder="DISCOVER COLLECTION"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Button Link</Label>
                        <Input
                          value={slide.buttonLink}
                          onChange={(e) => handleSlideChange(index, "buttonLink", e.target.value)}
                          placeholder="/skincare"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Switch
                        checked={slide.isActive}
                        onCheckedChange={(checked) => handleSlideChange(index, "isActive", checked)}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/sections")}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
