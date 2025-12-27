"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Shield,
    UserCheck,
    UserX,
    Loader2,
    CheckCircle,
    XCircle
} from "lucide-react"
import Image from "next/image"

interface Address {
    _id: string
    label: string
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
    country: string
    isDefault: boolean
}

interface User {
    _id: string
    name: string
    email: string
    phone?: string
    role: string
    isActive: boolean
    isEmailVerified: boolean
    googleId?: string
    profileImage?: {
        url: string
        publicId: string
    }
    addresses: Address[]
    createdAt: string
    updatedAt: string
}

interface UserResponse {
    success: boolean
    data: {
        user: User
    }
}

export default function UserDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { accessToken } = useAuthStore()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [togglingStatus, setTogglingStatus] = useState(false)

    const fetchUser = async () => {
        if (!accessToken) return

        setLoading(true)
        try {
            const response = await apiClient.request<UserResponse>(
                `/admin/users/${params.id}`,
                {
                    token: accessToken,
                },
            )

            setUser(response.data.user)
        } catch (error) {
            toast.error("Error", {
                description: error instanceof Error ? error.message : "Failed to fetch user details",
            })
            router.push("/dashboard/users")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUser()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id])

    const handleToggleStatus = async () => {
        if (!accessToken || !user) return

        setTogglingStatus(true)
        try {
            await apiClient.request(`/admin/users/${user._id}/toggle-status`, {
                method: "PUT",
                token: accessToken,
            })

            toast.success("Success", {
                description: `User ${user.isActive ? "blocked" : "unblocked"} successfully`,
            })

            setUser({ ...user, isActive: !user.isActive })
        } catch (error) {
            toast.error("Error", {
                description: error instanceof Error ? error.message : "Failed to update user status",
            })
        } finally {
            setTogglingStatus(false)
        }
    }

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A'
        try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) return 'Invalid Date'
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })
        } catch (error) {
            return 'Invalid Date'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Skeleton className="h-10 w-48 mb-8" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center">
                                        <Skeleton className="w-32 h-32 rounded-full mb-4" />
                                        <Skeleton className="h-6 w-40 mb-2" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-40" />
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/dashboard/users")}
                            className="cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Users
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">User Details</h1>
                            <p className="text-muted-foreground mt-1">View and manage user information</p>
                        </div>
                    </div>
                    <Button
                        variant={user.isActive ? "destructive" : "default"}
                        onClick={handleToggleStatus}
                        disabled={togglingStatus}
                        className="cursor-pointer"
                    >
                        {togglingStatus ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : user.isActive ? (
                            <>
                                <UserX className="w-4 h-4 mr-2" />
                                Block User
                            </>
                        ) : (
                            <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Unblock User
                            </>
                        )}
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center">
                                    <div className="relative w-32 h-32 rounded-full bg-primary flex items-center justify-center text-white text-4xl font-bold mb-4 overflow-hidden">
                                        {user.profileImage?.url ? (
                                            <Image
                                                src={user.profileImage.url}
                                                alt={user.name || 'User'}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <span>{user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}</span>
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-bold text-center mb-2">{user.name || user.email}</h2>
                                    <Badge
                                        variant={user.role === "admin" ? "default" : "secondary"}
                                        className="capitalize mb-4"
                                    >
                                        <Shield className="w-3 h-3 mr-1" />
                                        {user.role}
                                    </Badge>
                                    <Badge
                                        variant={user.isActive ? "default" : "destructive"}
                                        className="gap-1"
                                    >
                                        {user.isActive ? (
                                            <>
                                                <UserCheck className="h-3 w-3" />
                                                Active
                                            </>
                                        ) : (
                                            <>
                                                <UserX className="h-3 w-3" />
                                                Blocked
                                            </>
                                        )}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="text-lg">Account Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Email Verified</span>
                                    {user.isEmailVerified ? (
                                        <Badge variant="default" className="gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Verified
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="gap-1">
                                            <XCircle className="w-3 h-3" />
                                            Not Verified
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Login Method</span>
                                    <Badge variant="outline">
                                        {user.googleId ? "Google OAuth" : "Email/Password"}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Addresses</span>
                                    <Badge variant="outline">{user.addresses?.length || 0}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Details Cards */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Contact Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Information</CardTitle>
                                <CardDescription>User's contact details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="font-medium break-all">{user.email || 'N/A'}</p>
                                    </div>
                                </div>
                                {user.phone && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-5 h-5 text-muted-foreground" />
                                        <div className="flex-1">
                                            <p className="text-sm text-muted-foreground">Phone</p>
                                            <p className="font-medium">{user.phone}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Addresses */}
                        {user.addresses && user.addresses.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Saved Addresses</CardTitle>
                                    <CardDescription>User's delivery addresses</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {user.addresses.map((address) => (
                                        <div
                                            key={address._id}
                                            className="p-4 border rounded-lg space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-medium">{address.label}</span>
                                                </div>
                                                {address.isDefault && (
                                                    <Badge variant="default" className="text-xs">Default</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {address.line1}
                                                {address.line2 && `, ${address.line2}`}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {address.city}, {address.state} {address.zip}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{address.country}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Account Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Timeline</CardTitle>
                                <CardDescription>Important dates and events</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Joined</p>
                                        <p className="font-medium">{formatDate(user.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Last Updated</p>
                                        <p className="font-medium">{formatDate(user.updatedAt)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
