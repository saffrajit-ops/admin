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
import { ArrowLeft, Save, Upload } from "lucide-react"
import { toast } from "sonner"

export default function EditLuxuryPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string>("")
  
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    buttonText: "",
    buttonLink: "",
    isActive: true,
  })

  useEffect(() => {
    if (accessToken) {
      fetchLuxuryShowcase()
    }
  }, [accessToken])

  const fetchLuxuryShowcase = async () => {
    try {
      setIsLoading(true)
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"
      
      const res = await fetch(`${API_URL}/luxury-showcase/admin`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.data) {
          setFormData({
            title: data.data.title,
            subtitle: data.data.subtitle,
            description: data.data.description,
            buttonText: data.data.buttonText,
            buttonLink: data.data.buttonLink,
            isActive: data.data.isActive,
          })
          setVideoPreview(data.data.video.url)
        }
      }
    } catch (error) {
      console.error("Failed to fetch luxury showcase:", error)
      toast.error("Error", {
        description: "Failed to load luxury showcase",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Error", {
          description: "Video file must be less than 50MB",
        })
        return
      }
      setVideoFile(file)
      setVideoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSaving(true)
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"
      
      const formDataToSend = new FormData()
      formDataToSend.append("title", formData.title)
      formDataToSend.append("subtitle", formData.subtitle)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("buttonText", formData.buttonText)
      formDataToSend.append("buttonLink", formData.buttonLink)
      formDataToSend.append("isActive", String(formData.isActive))
      
      if (videoFile) {
        formDataToSend.append("video", videoFile)
      }

      const res = await fetch(`${API_URL}/luxury-showcase/admin`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formDataToSend,
      })

      if (res.ok) {
        toast.success("Success", {
          description: "Luxury showcase updated successfully",
        })
        // Stay on the same page after successful update
      } else {
        const error = await res.json()
        toast.error("Error", {
          description: error.message || "Failed to update luxury showcase",
        })
      }
    } catch (error) {
      console.error("Failed to update luxury showcase:", error)
      toast.error("Error", {
        description: "Failed to update luxury showcase",
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
    <>
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/sections")}
            className="mb-4 gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sections
          </Button>
          
          <h1 className="text-3xl font-bold tracking-tight">Edit Luxury Showcase</h1>
          <p className="text-muted-foreground mt-1">
            Update the luxury showcase section on the homepage
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="The Perfect Gift"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="LUXURY GIFT SETS"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Curated collections featuring 24K Gold & Caviar treatments..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buttonText">Button Text</Label>
                  <Input
                    id="buttonText"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    placeholder="EXPLORE GIFT SETS"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buttonLink">Button Link</Label>
                  <Input
                    id="buttonLink"
                    value={formData.buttonLink}
                    onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                    placeholder="/gifts"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video">Background Video</Label>
                <div className="space-y-4">
                  {videoPreview && (
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        src={videoPreview}
                        className="w-full h-full object-cover"
                        controls
                        muted
                        loop
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <Input
                      id="video"
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("video")?.click()}
                      className="gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      {videoFile ? "Change Video" : "Upload New Video"}
                    </Button>
                    {videoFile && (
                      <span className="text-sm text-muted-foreground">
                        {videoFile.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Max file size: 50MB. Recommended: MP4 format, 1920x1080 resolution
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    className="cursor-pointer"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Active
                  </Label>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/sections")}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-2 cursor-pointer">
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
    </>
  )
}
