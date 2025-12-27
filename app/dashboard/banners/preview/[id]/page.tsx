"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Eye, Monitor, Smartphone, Tablet } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { Banner } from "@/lib/banner-store"

export default function BannerPreviewPage() {
  const router = useRouter()
  const params = useParams()
  const bannerId = params.id as string
  const { accessToken } = useAuthStore()
  const [banner, setBanner] = useState<Banner | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop")

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
        setBanner(data.data)
        setIsLoading(false)
      } catch (error) {
        toast.error("Failed to load banner")
        router.push("/dashboard/banners")
      }
    }

    fetchBanner()
  }, [accessToken, bannerId, router])

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!banner) return null

  const getContainerWidth = () => {
    switch (viewMode) {
      case "mobile":
        return "max-w-[375px]"
      case "tablet":
        return "max-w-[768px]"
      default:
        return "max-w-full"
    }
  }

  const getBannerDimensions = () => {
    switch (banner.type) {
      case "sidebar":
        return "w-[600px] max-w-full"
      case "footer":
        return "w-full"
      case "popup":
        return "w-full"
      default:
        return "w-full"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Banner Preview</h1>
            <p className="text-muted-foreground">See how your banner looks on the website</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "desktop" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("desktop")}
            className="cursor-pointer"
          >
            <Monitor className="w-4 h-4 mr-2" />
            Desktop
          </Button>
          <Button
            variant={viewMode === "tablet" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("tablet")}
            className="cursor-pointer"
          >
            <Tablet className="w-4 h-4 mr-2" />
            Tablet
          </Button>
          <Button
            variant={viewMode === "mobile" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("mobile")}
            className="cursor-pointer"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Mobile
          </Button>
        </div>
      </div>

      {/* Banner Info */}
      <Card>
        <CardHeader>
          <CardTitle>Banner Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Title</p>
              <p className="font-medium">{banner.title}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{banner.type}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium">{banner.isActive ? "Active" : "Inactive"}</p>
            </div>
            <div className="col-span-2 md:col-span-3">
              <p className="text-muted-foreground mb-2">Page Targeting</p>
              {banner.type === 'popup' ? (
                <p className="font-medium italic">Global (All Pages)</p>
              ) : banner.pages && banner.pages.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {banner.pages.map((page) => (
                    <span key={page} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {page.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-medium text-muted-foreground">No pages selected</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>
            This is how the banner will appear on your website ({viewMode} view)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-lg flex justify-center">
            <div className={`${getContainerWidth()} w-full transition-all duration-300`}>
              {/* Sidebar Banner */}
              {banner.type === "sidebar" && (
                <div className="bg-white rounded-lg shadow-lg p-3 max-w-[600px]">
                  <div className={`relative ${getBannerDimensions()} aspect-[2/1] rounded-lg overflow-hidden group cursor-pointer border-2 border-gray-200`}>
                    <Image
                      src={banner.image.url}
                      alt={banner.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <h4 className="font-bold mb-2 text-gray-900">{banner.title}</h4>
                    {banner.description && (
                      <p className="text-xs mb-3 line-clamp-2 text-gray-600">{banner.description}</p>
                    )}
                    {banner.linkText && (
                      <span className="inline-block bg-black text-white px-4 py-2 rounded-lg font-semibold text-xs">
                        {banner.linkText}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Footer Banner */}
              {banner.type === "footer" && (
                <div className="bg-white rounded-lg shadow-lg p-3">
                  <div className="relative w-full aspect-[6/1] min-h-[120px] max-h-[250px] rounded-lg overflow-hidden group cursor-pointer border-2 border-gray-200">
                    <Image
                      src={banner.image.url}
                      alt={banner.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-center p-4 sm:p-6 max-w-3xl">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">{banner.title}</h3>
                        {banner.description && (
                          <p className="text-xs sm:text-sm md:text-base mb-3 sm:mb-4 line-clamp-2 opacity-90">{banner.description}</p>
                        )}
                        {banner.linkText && (
                          <span className="inline-block bg-white text-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm">
                            {banner.linkText}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Popup Banner */}
              {banner.type === "popup" && (
                <div className="relative bg-black/50 p-8 rounded-lg flex items-center justify-center">
                  <div className="bg-white rounded-xl max-w-md w-full relative shadow-2xl p-3">
                    <button className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 cursor-pointer z-10">
                      ×
                    </button>
                    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border-2 border-gray-200">
                      <Image
                        src={banner.image.url}
                        alt={banner.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6 text-center">
                      <h3 className="text-2xl font-bold mb-2">{banner.title}</h3>
                      {banner.description && (
                        <p className="text-gray-600 mb-4 line-clamp-3">{banner.description}</p>
                      )}
                      {banner.link && (
                        <button className="bg-black text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800 transition w-full cursor-pointer">
                          {banner.linkText || "Shop Now"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push("/dashboard/banners")} className="cursor-pointer">
          Back to List
        </Button>
        <Button onClick={() => router.push(`/dashboard/banners/edit/${bannerId}`)} className="cursor-pointer">
          Edit Banner
        </Button>
      </div>
    </div>
  )
}
