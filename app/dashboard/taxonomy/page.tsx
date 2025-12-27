"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FolderTree, Layers, AlertCircle, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/lib/auth-store"

interface TaxonomyStats {
    categories: number
    collections: number
    concerns: number
}

export default function TaxonomyPage() {
    const { accessToken } = useAuthStore()
    const [stats, setStats] = useState<TaxonomyStats>({
        categories: 0,
        collections: 0,
        concerns: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            setLoading(true)

            const [categoriesRes, collectionsRes, concernsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/type/category?includeInactive=true`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/type/collection?includeInactive=true`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/type/concern?includeInactive=true`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                })
            ])

            const [categoriesData, collectionsData, concernsData] = await Promise.all([
                categoriesRes.json(),
                collectionsRes.json(),
                concernsRes.json()
            ])

            setStats({
                categories: categoriesData.success ? categoriesData.data.length : 0,
                collections: collectionsData.success ? collectionsData.data.length : 0,
                concerns: concernsData.success ? concernsData.data.length : 0
            })
        } catch (error) {
            console.error("Error fetching taxonomy stats:", error)
            toast.error("Failed to fetch taxonomy statistics")
        } finally {
            setLoading(false)
        }
    }

    const taxonomyTypes = [
        {
            title: "Categories",
            description: "Organize products into categories and subcategories",
            icon: FolderTree,
            count: stats.categories,
            href: "/dashboard/taxonomy/categories",
            color: "bg-blue-500"
        },
        {
            title: "Collections",
            description: "Group products into curated collections",
            icon: Layers,
            count: stats.collections,
            href: "/dashboard/taxonomy/collections",
            color: "bg-purple-500"
        },
        {
            title: "Concerns",
            description: "Tag products by skin concerns they address",
            icon: AlertCircle,
            count: stats.concerns,
            href: "/dashboard/taxonomy/concerns",
            color: "bg-green-500"
        }
    ]

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Taxonomy Management</h1>
                <p className="text-muted-foreground mt-1">
                    Manage product categories, collections, and concerns
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {taxonomyTypes.map((type) => {
                        const Icon = type.icon
                        return (
                            <Link
                                key={type.href}
                                href={type.href}
                                className="group bg-card border rounded-lg p-6 hover:shadow-lg transition-all hover:border-primary"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`${type.color} p-3 rounded-lg text-white`}>
                                        <Icon size={24} />
                                    </div>
                                    <ArrowRight className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{type.title}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{type.description}</p>

                                <div className="flex items-center justify-between pt-4 border-t">
                                    <span className="text-sm text-muted-foreground">Total</span>
                                    <span className="text-2xl font-bold">{type.count}</span>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}

            <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">About Taxonomy</h2>
                <div className="space-y-4 text-sm text-muted-foreground">
                    <div>
                        <h3 className="font-medium text-foreground mb-2">Categories</h3>
                        <p>
                            Categories help organize your products hierarchically. You can create parent categories
                            (e.g., "Skincare") and subcategories (e.g., "Moisturizers", "Serums") to make it easier
                            for customers to browse your products.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-medium text-foreground mb-2">Collections</h3>
                        <p>
                            Collections are curated groups of products that share a common theme or purpose.
                            Examples include "Best Sellers", "New Arrivals", "Summer Collection", or "Gift Sets".
                            Collections help you create marketing campaigns and featured product groups.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-medium text-foreground mb-2">Concerns</h3>
                        <p>
                            Concerns represent specific skin issues or benefits that products address.
                            Examples include "Acne", "Anti-Aging", "Hydration", "Brightening", etc.
                            This helps customers find products that solve their specific skincare needs.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
