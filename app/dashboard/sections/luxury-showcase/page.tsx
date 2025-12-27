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
import { ArrowLeft, Save, Upload, Video as VideoIcon } from "lucide-react"
import { toast } from "sonner"

interface LuxuryShowcaseData {
    _id?: string
    title: string
    subtitle: string
    description: string
    buttonText: string
    buttonLink: string
    video?: {
        url: string
        publicId: string
    }
    isActive: boolean
}

export default function LuxuryShowcasePage() {
    const router = useRouter()
    const { accessToken } = useAuthStore()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const [data, setData] = useState<LuxuryShowcaseData | null>(null)
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [videoPreview, setVideoPreview] = useState<string>("")

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
                const responseData = await res.json()
                if (responseData.success && responseData.data) {
                    setData(responseData.data)
                    if (responseData.data.video?.url) {
                        setVideoPreview(responseData.data.video.url)
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch luxury showcase:", error)
            toast.error("Error", { description: "Failed to load luxury showcase" })
        } finally {
            setIsLoading(false)
        }
    }

    const handleTextChange = (field: keyof LuxuryShowcaseData, value: any) => {
        if (!data) return
        setData({ ...data, [field]: value })
    }

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                toast.error("Error", { description: "Video file must be less than 50MB" })
                return
            }
            setVideoFile(file)
            setVideoPreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!data) return

        try {
            setIsSaving(true)
            const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"
            const formData = new FormData()

            formData.append("title", data.title)
            formData.append("subtitle", data.subtitle)
            formData.append("description", data.description)
            formData.append("buttonText", data.buttonText)
            formData.append("buttonLink", data.buttonLink)
            formData.append("isActive", String(data.isActive))

            if (videoFile) {
                formData.append("video", videoFile)
            }

            const res = await fetch(`${API_URL}/luxury-showcase/admin`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: formData,
            })

            if (res.ok) {
                toast.success("Success", { description: "Luxury showcase updated successfully" })
            } else {
                const error = await res.json()
                toast.error("Error", { description: error.message || "Failed to update" })
            }
        } catch (error) {
            console.error("Failed to update:", error)
            toast.error("Error", { description: "Failed to update luxury showcase" })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="container max-w-4xl mx-auto px-4 py-8">
            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard/sections")}
                    className="mb-4 gap-2 cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Sections
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Edit Luxury Video Showcase</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <Card className="p-6 space-y-6">
                    <div className="space-y-4">
                        <Label>Video Preview</Label>
                        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border">
                            {videoPreview ? (
                                <video src={videoPreview} className="w-full h-full object-cover" controls playsInline />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <VideoIcon className="w-12 h-12 mb-2 opacity-50" />
                                    <span>No Video Selected</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <Button type="button" variant="outline" className="w-full gap-2" onClick={() => document.getElementById("video-upload")?.click()}>
                                <Upload className="w-4 h-4" /> {videoFile ? "Change Video" : "Upload Video"}
                            </Button>
                            <Input id="video-upload" type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
                        </div>
                        <p className="text-xs text-muted-foreground">Max file size: 50MB. Formats: MP4, WebM.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={data?.title || ""} onChange={(e) => handleTextChange("title", e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Subtitle</Label>
                            <Input value={data?.subtitle || ""} onChange={(e) => handleTextChange("subtitle", e.target.value)} required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={data?.description || ""} onChange={(e) => handleTextChange("description", e.target.value)} rows={3} required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Button Text</Label>
                            <Input value={data?.buttonText || ""} onChange={(e) => handleTextChange("buttonText", e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Button Link</Label>
                            <Input value={data?.buttonLink || ""} onChange={(e) => handleTextChange("buttonLink", e.target.value)} required />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Switch checked={data?.isActive || false} onCheckedChange={(checked) => handleTextChange("isActive", checked)} />
                        <Label>Active Section</Label>
                    </div>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.push("/dashboard/sections")}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
