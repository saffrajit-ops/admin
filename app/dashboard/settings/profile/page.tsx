"use client"

import { useState, useRef } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Camera, Loader2 } from "lucide-react"

export default function SettingsPage() {
    const { user, updateProfile, uploadProfileImage, changePassword, isLoading } = useAuthStore()
    const [name, setName] = useState(user?.name || "")
    const [phone, setPhone] = useState(user?.phone || "")
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [profileImage, setProfileImage] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState(user?.profileImage?.url || "")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Error", {
                    description: "Image size should be less than 5MB",
                })
                return
            }
            setProfileImage(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            // Update profile (name and phone)
            await updateProfile({ name, phone })

            // Upload profile image if selected
            if (profileImage) {
                await uploadProfileImage(profileImage)
                setProfileImage(null)
            }

            // Change password if provided
            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    toast.error("Error", {
                        description: "New passwords do not match",
                    })
                    return
                }

                if (!currentPassword) {
                    toast.error("Error", {
                        description: "Current password is required to set a new password",
                    })
                    return
                }

                await changePassword(currentPassword, newPassword)
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
            }

            toast.success("Success", {
                description: "Profile updated successfully",
            })
        } catch (error) {
            toast.error("Error", {
                description: error instanceof Error ? error.message : "Failed to update profile",
            })
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                    <p className="text-muted-foreground mt-2">Manage your account settings and profile</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Image Section */}
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle>Profile Picture</CardTitle>
                            <CardDescription>Update your profile picture</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center gap-6">
                            <div className="relative">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={previewUrl} alt={user?.name} />
                                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                        {user?.name ? getInitials(user.name) : "AD"}
                                    </AvatarFallback>
                                </Avatar>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors cursor-pointer"
                                >
                                    <Camera className="h-4 w-4" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">
                                    Click the camera icon to upload a new profile picture. Recommended size: 400x400px. Max size: 5MB.
                                </p>
                                {profileImage && (
                                    <p className="text-sm text-primary mt-2">New image selected: {profileImage.name}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Personal Information */}
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your personal details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your full name"
                                    required
                                    disabled={isLoading}
                                    className="rounded-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={user?.email || ""}
                                    disabled
                                    className="rounded-lg bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Enter your phone number"
                                    disabled={isLoading}
                                    className="rounded-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Input
                                    type="text"
                                    value={user?.role || ""}
                                    disabled
                                    className="rounded-lg bg-muted"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Change Password */}
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>Update your password (optional)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    disabled={isLoading}
                                    className="rounded-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    disabled={isLoading}
                                    className="rounded-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    disabled={isLoading}
                                    className="rounded-lg"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="rounded-lg font-semibold min-w-[150px] cursor-pointer"
                            size="lg"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
