"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Edit, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface HeroSection {
  _id: string
  title: string
  subtitle: string
  description: string
  buttonText: string
  buttonLink: string
  video: {
    url: string
    publicId: string
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function ViewHeroPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const [heroSection, setHeroSection] = useState<HeroSection | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
        setHeroSection(data.data)
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

  if (!heroSection) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/sections")}
            className="mb-4 gap-2 "
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sections
          </Button>
          
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No hero section data available</p>
            <Button onClick={() => router.push("/dashboard/sections/hero/edit")}>
              Create Hero Section
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
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
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Hero Section</h1>
              <p className="text-muted-foreground mt-1">
                View hero section details
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/sections/hero/edit")}
              className="gap-2 cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-black">
              <video
                src={heroSection.video.url}
                className="w-full h-full object-cover"
                controls
                muted
                loop
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Title</h3>
                <p className="text-lg font-semibold">{heroSection.title}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Subtitle</h3>
                <p className="text-lg">{heroSection.subtitle}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-base">{heroSection.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Button Text</h3>
                  <p className="text-base">{heroSection.buttonText}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Button Link</h3>
                  <a
                    href={heroSection.buttonLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {heroSection.buttonLink}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      heroSection.isActive 
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}>
                      {heroSection.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="text-right">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Last Updated</h3>
                    <p className="text-sm">
                      {new Date(heroSection.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
