"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, Building2 } from "lucide-react"
import { toast } from "sonner"

interface CompanyInfo {
    phone: string
    email: string
    address: {
        street: string
        city: string
        state: string
        zipCode: string
        country: string
    }
    socialMedia: {
        facebook: string
        instagram: string
        twitter: string
        linkedin: string
        pinterest: string
        youtube: string
    }
    businessHours: {
        monday: string
        tuesday: string
        wednesday: string
        thursday: string
        friday: string
        saturday: string
        sunday: string
    }
    companyName: string
    tagline: string
    description: string
    foundedYear: number
    copyrightText: string
    newsletterTitle: string
    newsletterDescription: string
}

export default function CompanySettingsPage() {
    const { accessToken } = useAuthStore()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState<CompanyInfo | null>(null)

    useEffect(() => {
        if (accessToken) {
            fetchCompanyInfo()
        }
    }, [accessToken])

    const fetchCompanyInfo = async () => {
        try {
            setIsLoading(true)
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

            const res = await fetch(`${API_URL}/company-info/admin`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })

            if (res.ok) {
                const data = await res.json()
                setFormData(data.data)
            }
        } catch (error) {
            console.error("Failed to fetch company info:", error)
            toast.error("Error", {
                description: "Failed to load company information",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setIsSaving(true)
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

            const res = await fetch(`${API_URL}/company-info/admin`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(formData),
            })

            if (res.ok) {
                toast.success("Success", {
                    description: "Company information updated successfully",
                })
            } else {
                const error = await res.json()
                toast.error("Error", {
                    description: error.message || "Failed to update company information",
                })
            }
        } catch (error) {
            console.error("Failed to update company info:", error)
            toast.error("Error", {
                description: "Failed to update company information",
            })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading || !formData) {
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
        <div className="min-h-screen bg-background">
            <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight">Company Information</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Manage your company details, contact information, and social media links
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Company Name</Label>
                                <Input
                                    id="companyName"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="foundedYear">Founded Year</Label>
                                <Input
                                    id="foundedYear"
                                    type="number"
                                    value={formData.foundedYear}
                                    onChange={(e) => setFormData({ ...formData, foundedYear: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="tagline">Tagline</Label>
                                <Input
                                    id="tagline"
                                    value={formData.tagline}
                                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                                    placeholder="Luxury Skincare with 24K Gold"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Contact Information */}
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+1 7472837766"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="info@canagoldbeauty.com"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="street">Street Address</Label>
                                <Input
                                    id="street"
                                    value={formData.address.street}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        address: { ...formData.address, street: e.target.value }
                                    })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={formData.address.city}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        address: { ...formData.address, city: e.target.value }
                                    })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    value={formData.address.state}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        address: { ...formData.address, state: e.target.value }
                                    })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="zipCode">Zip Code</Label>
                                <Input
                                    id="zipCode"
                                    value={formData.address.zipCode}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        address: { ...formData.address, zipCode: e.target.value }
                                    })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    value={formData.address.country}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        address: { ...formData.address, country: e.target.value }
                                    })}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Social Media */}
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Social Media Links</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="facebook">Facebook</Label>
                                <Input
                                    id="facebook"
                                    value={formData.socialMedia.facebook}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        socialMedia: { ...formData.socialMedia, facebook: e.target.value }
                                    })}
                                    placeholder="https://facebook.com/..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="instagram">Instagram</Label>
                                <Input
                                    id="instagram"
                                    value={formData.socialMedia.instagram}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        socialMedia: { ...formData.socialMedia, instagram: e.target.value }
                                    })}
                                    placeholder="https://instagram.com/..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="twitter">Twitter</Label>
                                <Input
                                    id="twitter"
                                    value={formData.socialMedia.twitter}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        socialMedia: { ...formData.socialMedia, twitter: e.target.value }
                                    })}
                                    placeholder="https://twitter.com/..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="linkedin">LinkedIn</Label>
                                <Input
                                    id="linkedin"
                                    value={formData.socialMedia.linkedin}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        socialMedia: { ...formData.socialMedia, linkedin: e.target.value }
                                    })}
                                    placeholder="https://linkedin.com/..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pinterest">Pinterest</Label>
                                <Input
                                    id="pinterest"
                                    value={formData.socialMedia.pinterest}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        socialMedia: { ...formData.socialMedia, pinterest: e.target.value }
                                    })}
                                    placeholder="https://pinterest.com/..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="youtube">YouTube</Label>
                                <Input
                                    id="youtube"
                                    value={formData.socialMedia.youtube}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        socialMedia: { ...formData.socialMedia, youtube: e.target.value }
                                    })}
                                    placeholder="https://youtube.com/..."
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Footer & Newsletter */}
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Footer & Newsletter</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="copyrightText">Copyright Text</Label>
                                <Input
                                    id="copyrightText"
                                    value={formData.copyrightText}
                                    onChange={(e) => setFormData({ ...formData, copyrightText: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newsletterTitle">Newsletter Title</Label>
                                <Input
                                    id="newsletterTitle"
                                    value={formData.newsletterTitle}
                                    onChange={(e) => setFormData({ ...formData, newsletterTitle: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newsletterDescription">Newsletter Description</Label>
                                <Textarea
                                    id="newsletterDescription"
                                    value={formData.newsletterDescription}
                                    onChange={(e) => setFormData({ ...formData, newsletterDescription: e.target.value })}
                                    rows={2}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Save Button */}
                    <div className="flex justify-end gap-4">
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
        </div>
    )
}
