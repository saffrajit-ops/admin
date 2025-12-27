"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Eye, Edit, Video } from "lucide-react"
import { toast } from "sonner"

interface Section {
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

export default function SectionsPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const [heroSection, setHeroSection] = useState<Section | null>(null)
  const [luxuryShowcase, setLuxuryShowcase] = useState<Section | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    if (accessToken) {
      fetchSections()
    }
  }, [accessToken])

  const fetchSections = async () => {
    try {
      setIsLoading(true)
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

      // Fetch Hero Section
      const heroRes = await fetch(`${API_URL}/hero-section/admin`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (heroRes.ok) {
        const heroData = await heroRes.json()
        setHeroSection(heroData.data)
      }

      // Fetch Luxury Showcase
      const luxuryRes = await fetch(`${API_URL}/luxury-showcase/admin`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (luxuryRes.ok) {
        const luxuryData = await luxuryRes.json()
        setLuxuryShowcase(luxuryData.data)
      }
    } catch (error) {
      console.error("Failed to fetch sections:", error)
      toast.error("Error", {
        description: "Failed to load sections",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = (type: "hero" | "luxury") => {
    setIsNavigating(true)
    router.push(`/dashboard/sections/${type}/view`)
  }

  const handleEdit = (type: "hero" | "luxury") => {
    setIsNavigating(true)
    router.push(`/dashboard/sections/${type}/edit`)
  }

  const SectionCard = ({ 
    section, 
    type, 
    title 
  }: { 
    section: Section | null
    type: "hero" | "luxury"
    title: string 
  }) => (
    <Card className="overflow-hidden">
      <div className="relative h-64 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
        {section?.video?.url && (
          <video
            src={section.video.url}
            className="w-full h-full object-cover"
            muted
            loop
            autoPlay
            playsInline
          />
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white p-6">
            <Video className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">{title}</h3>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        {section ? (
          <>
            <div>
              <h4 className="font-semibold text-lg mb-2">{section.title}</h4>
              <p className="text-sm text-muted-foreground mb-1">{section.subtitle}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">{section.description}</p>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  section.isActive 
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}>
                  {section.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(type)}
                  className="gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleEdit(type)}
                  className="gap-2 cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No section data available</p>
            <Button
              onClick={() => handleEdit(type)}
              className="gap-2 cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              Create Section
            </Button>
          </div>
        )}
      </div>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading sections...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-medium">Loading...</p>
          </div>
        </div>
      )}

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Homepage Sections</h1>
          <p className="text-muted-foreground mt-1">
            Manage hero section and luxury showcase content
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard
            section={heroSection}
            type="hero"
            title="Hero Section"
          />
          
          <SectionCard
            section={luxuryShowcase}
            type="luxury"
            title="Luxury Showcase"
          />
        </div>
      </div>
    </div>
  )
}
